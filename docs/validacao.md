# Validação

## 1. Loop de avaliação automática (Loop Engineering)

```
gerar base simulada com anomalias plantadas + gabarito  →  rodar o motor  →  medir recall/precisão por detector
        ↑                                                                                   │
        └──────────────── ajustar regra/limiar (ou corrigir o gerador) ←───────────────────┘
```

- `npm run eval`: base principal (semente fixa). Gera `docs/eval-report.md` e falha se o recall ficar abaixo de 90% ou a precisão abaixo de 85%.
- `npm run eval:robustez`: repete o eval em **10 bases geradas com sementes diferentes**, para não ajustar os limiares a uma única base (overfitting).
- No CI (`.github/workflows/ci.yml`), ambos rodam a cada push.

Anomalias plantadas: 17. Cobrem todas as situações da seção 5 do desafio: estoque crítico, consumo crescente, excesso, vencimento (incluindo um lote já vencido), retirada fora do padrão, cadastros diferentes, variação de preço, alto valor parado e problemas de dados.

### Histórico das rodadas

| Rodada | Recall | Precisão | O que aprendemos / mudamos |
|---|---|---|---|
| 1 | 88% | 83% | (a) Os lotes plantados de inoculante e Trichoderma eram consumidos pelo FEFO antes de vencer. Era um erro do **gerador**, que foi corrigido para lotes que de fato sobram. (b) O diesel, com consumo crescente, era marcado como "retirada fora do padrão" porque a linha de base era o histórico todo. **A linha de base passou a ser local (90 dias anteriores).** (c) O milho parado com validade próxima e a ruptura do "KCl" (efeito da duplicidade) são alertas legítimos e foram registrados como aceitáveis no gabarito. |
| 2 | 100% | 100% | Bom demais em uma só base, então criamos o teste de robustez. |
| 3 (10 sementes) | 94% | 80–100% | (a) Uma retirada atípica inflava o último mês e gerava "consumo em alta" falso: **as retiradas atípicas passaram a ser excluídas da curva**, e passamos a exigir crescimento sustentado (3º bloco ≥ 1,2× o 1º). (b) Peças de baixo giro (1–3 un.) geravam alarmes: **passamos a exigir ≥ 1,5× a maior retirada anterior e 12+ retiradas** para tendência. (c) O saldo negativo plantado era fraco demais em algumas sementes, e o gerador foi corrigido. |
| 4 (10 sementes) | **100%** | **98,9%** (pior 94%) | Restam 2 casos raros em 10 bases (adjuvante "monitorar", filtro 3× o normal). Consideramos aceitáveis e documentamos. |

> **Limitação honesta:** a base simulada foi criada pela própria equipe. O resultado mostra que os detectores fazem o que prometem, mas **não substitui** a validação com a base oficial e com usuários reais (seções 2 e 3).

## 2. Testes unitários

`npm test` roda 16 testes:
- leitura de números e datas;
- nulo ≠ zero;
- mapeamento de colunas;
- conversão de unidades;
- grafo de duplicados (siglas, fórmulas NPK, categorias);
- ordem topológica e detecção de ciclo no DAG;
- estimativa de duração (exemplo do edital);
- unidades incompatíveis;
- FEFO;
- confiança baixa;
- retirada atípica;
- fusão e reanálise;
- meta do eval.

## 3. Validação com a base oficial

_(preencher quando a base oficial for divulgada)_

- Linhas importadas e rejeitadas (com motivo):
- Colunas reconhecidas automaticamente e ajustes necessários:
- Revisão manual dos 20 primeiros alertas: quantos fazem sentido, quantos são falsos e por quê:
- Ajustes feitos:

## 4. Validação com usuários (campo)

**Objetivo:** ouvir 2 ou 3 pessoas reais antes do pitch (29/10) e trazer **uma frase de campo que mude algo no produto**. O projeto vencedor do hackathon anterior do IFRO ganhou assim: o achado "o fator nº 1 não é a chuva, é a drenagem" veio de uma entrevista e virou a tese do pitch.

**Com quem falar (10 minutos cada):**
- o professor de Agronomia que propôs o desafio (Anexo III do regulamento);
- um gerente de fazenda ou almoxarife da região;
- um balconista ou gerente de revenda agropecuária ou de cooperativa em Ariquemes.

### Roteiro de 10 minutos

**1. Antes de mostrar o app (3 min), para descobrir a dor real**
1. Como vocês sabem hoje que um insumo está acabando? (Planilha, caderno, olho no galpão?)
2. Nos últimos 12 meses, o que mais deu prejuízo no estoque: **falta** na hora de usar, produto **vencido** ou compra **em excesso**? Conte um caso.
3. Quem decide a compra, e com quantos dias de antecedência precisa decidir?

**2. Mostrando o Painel do dia (5 min), para validar o produto**
4. Olhando a tela, o que você faria primeiro? A ordem dos alertas faz sentido?
5. A frase do alerta é clara para quem não é da TI? Algum termo confuso?
6. O prazo de compra de 15 dias faz sentido para os insumos daqui? E 180 dias para "excesso"?
7. Quais produtos têm sazonalidade forte (sementes, calcário) e não deveriam virar "excesso" fora da safra?

**3. Fechamento (2 min), para buscar o achado central**
8. Que situação real de estoque você já viu e que o sistema não pega?
9. Se tivesse isso no celular amanhã, usaria? O que faltaria para usar?

**Registre:** a frase literal mais forte (entre aspas), uma foto ou print da conversa (com permissão) e o nome do cargo ou da instituição. O nome da pessoa só entra com consentimento.

### Registro

| Data | Quem (cargo/instituição) | O que mostramos | Frase literal mais forte | O que mudou no produto |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

### Achado central (para abrir o pitch)

> _(a frase que só quem ouviu o campo saberia, e o que mudamos por causa dela)_
