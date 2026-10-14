# Critérios dos alertas

Todos os limiares estão em `src/lib/engine/config.ts` e foram calibrados pelo loop de avaliação (`docs/validacao.md`).

## Conceitos base

- **Data de referência ("hoje"):** a data mais recente dos registros. Pode ser alterada na tela *Como funciona*.
- **Saldo:** soma das entradas menos as saídas, na unidade mais usada do produto. Unidades da mesma família são convertidas (t↔kg↔g, L↔mL). Movimentações em unidade incompatível (kg × L) **ficam fora** das contas e geram alerta de qualidade.
- **Lotes (FEFO):** cada entrada cria ou soma um lote. A saída sem lote informado consome primeiro o lote que vence antes.
- **Consumo médio diário:** soma das saídas dividida pelo número de dias da janela mais recente com pelo menos 3 retiradas. A ordem de tentativa é 30 dias, depois 90 dias, depois todo o histórico. A janela usada aparece em cada alerta.
- **Cobertura:** saldo ÷ consumo médio diário, em dias.
- **Confiança:**

  | Nível | Condição |
  |---|---|
  | Alta | 8 ou mais retiradas na janela e 90 ou mais dias de histórico |
  | Média | 4 ou mais retiradas |
  | Baixa | menos que isso. A mensagem avisa que a estimativa é incerta. |

## Detectores

| Detector | Regra | Nível |
|---|---|---|
| **Estoque crítico** | saldo ≤ estoque mínimo informado | Crítico se zerado ou com cobertura ≤ 30 dias; senão Atenção |
| **Vai faltar em breve** | saldo > mínimo e (saldo − mínimo) ÷ consumo ≤ **15 dias** (prazo típico de compra) | Crítico se ≤ 7 dias; senão Atenção |
| **Consumo em alta** | retiradas dos últimos 120 dias (sem as atípicas) em 4 blocos de 30 dias. Cada bloco ≥ 90% do anterior, o 3º ≥ 1,2× o 1º e o último ≥ **1,5×** o primeiro. Exige 12 ou mais retiradas | Atenção se +50% ou mais; senão Monitorar |
| **Retirada fora do padrão** | comparada às retiradas dos 90 dias anteriores (ou todo o histórico). Precisa atender às três condições: z-score robusto (mediana/MAD) ≥ **3,5**; ≥ **3×** a mediana; ≥ 1,5× a maior retirada anterior | Atenção nos últimos 60 dias; Monitorar até 180 dias |
| **Risco de vencimento** | lotes que vencem em até **180 dias**: sobra = quantidade − consumo previsto até a validade, descontando primeiro os lotes que vencem antes. Lote vencido com saldo é sempre Crítico | Crítico se ≤ 30 dias; Atenção se ≤ 90; senão Monitorar |
| **Excesso de estoque** | cobertura > **180 dias**. Mostra o valor acima de 3 meses de uso | Atenção se > 365 dias ou curva A; senão Monitorar |
| **Variação de preço** | preço unitário vs. mediana das compras dos 12 meses anteriores (pelo menos 2). Diferença ≥ **25%**, em compras dos últimos 180 dias | Alta = Atenção; queda = Monitorar (oportunidade) |
| **Dinheiro parado** | curva A/B (A = 80% do valor) sem retirada há ≥ **90 dias**, ou com menos de 10% do saldo usado em 90 dias (e 45 dias ou mais sem saída) | Atenção (A) / Monitorar (B) |
| **Cadastro duplicado** | grafo de nomes (ver abaixo) com similaridade ≥ **0,88**, mesma categoria e família de unidade. Grafias que diferem só em acento ou maiúsculas são unificadas automaticamente e informadas | Atenção / Monitorar |
| **Qualidade dos dados** | saldo negativo, unidade incompatível, entrada sem preço, lote perecível sem validade | o nível do problema mais grave |

### Grafo de nomes (cadastros duplicados)

1. **Normalização:** remove acentos, maiúsculas, pontuação e palavras vazias ("de", "agrícola"…); singulariza.
2. **Siglas:** `KCl → cloreto potássio`, `MAP → fosfato monoamônico`, `S-10 → s10`.
3. **Similaridade:**
   - 1,0 se as formas canônicas forem iguais;
   - 0,92 se um nome contém o outro com no máximo um termo a mais (ex.: "Óleo hidráulico" × "Oleo Hidraulico 68");
   - nos demais casos, Jaro-Winkler sobre a parte textual.
4. **Fórmulas diferentes nunca se unem:** se os números diferem (NPK 04-14-08 × NPK 10-10-10), a similaridade é 0.
5. **Agrupamento:** os pares acima do limiar viram arestas. Os componentes conexos (union-find) são os grupos sugeridos, e o usuário confirma a fusão.

## Prioridade (0–100)

`score = base do nível + urgência + impacto − penalidade`

| Parcela | Valores |
|---|---|
| Base do nível | Crítico 70; Atenção 40; Monitorar 15 |
| Urgência (dias até o problema) | já ocorreu +22; ≤ 7 dias +18; ≤ 15 +12; ≤ 30 +6 |
| Impacto financeiro | até +10, em escala logarítmica do valor em R$ |
| Penalidade | confiança baixa −8; média −3 |

A lista é ordenada por nível e, dentro do nível, por score.

## Limites

- **Sazonalidade:** as projeções supõem que o consumo recente continua. Não modelam a sazonalidade de safra (ex.: sementes no plantio). Por isso, alertas de produtos sazonais devem ser lidos junto com o calendário agrícola.
- **Histórico curto:** com poucas retiradas, a estimativa é marcada como de baixa confiança.
- **Lote nas saídas:** quando a saída não informa o lote, assumimos FEFO. Se a fazenda usar outra ordem, o risco de vencimento pode ser subestimado.
- **Campos ausentes:** preço ausente fica fora do valor (marcado como estimado) e validade ausente impede a análise de vencimento. Nenhum dos dois vira zero.
- **Estoque mínimo e prazo:** o mínimo vem dos registros. O prazo de compra (15 dias) é um padrão configurável, não um dado da base.
