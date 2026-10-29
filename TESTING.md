# Plano de teste — AgroSentinela

**Equipe 3 Hacketeers** · AGROHACK 2026/2 · IFRO Campus Ariquemes

Este documento é a evidência de qualidade pedida no regulamento (seção 7, item h, e critério "Validação, testes e utilidade prática"). Para cada parte da solução ele diz **como sabemos que a saída está certa (o oráculo)**, quais **casos do caminho feliz** e quais **casos de erro ou de fronteira** testamos, e onde está a evidência.

Tudo roda com um comando e também no CI (GitHub Actions), a cada push:

```bash
npm test               # 31 testes automatizados (Vitest)
npm run eval           # loop de avaliação contra o gabarito → docs/eval-report.md
npm run eval:robustez  # o mesmo loop em 10 bases simuladas diferentes
npm run eval:previsao  # backtest do modelo de previsão → docs/eval-previsao.md
```

## 1. O que é um oráculo, e por que temos quatro

Um **oráculo de teste** é o mecanismo que decide se o resultado de uma execução está correto (BSTQB, *Certified Tester Foundation Level* v4.0, 2023). Sem oráculo, há execução, mas não há teste. As partes do AgroSentinela têm naturezas diferentes, então cada uma tem um oráculo diferente:

| Parte | Tipo de oráculo | De onde vem o "certo" |
|---|---|---|
| Leitura e tratamento dos dados | **Especificado** | As regras do próprio regulamento (seção 4.4): unidades diferentes não se somam, ausência não vira zero, datas e números em vários formatos |
| Detectores de alerta | **Gabarito construído** | Anomalias plantadas de propósito na base simulada, listadas em `data/ground_truth.json` |
| Reanálise e interface | **Especificado** | O aviso esperado depois de uma ação definida (ex.: retirada de 170 L de glifosato) |
| Modelo de previsão | **Dados reais escondidos (backtest)** | O consumo que de fato aconteceu nas últimas 4 semanas, escondidas do modelo; a referência a vencer é a média simples de 30 dias |

Os casos de erro seguem a ideia de **partição do espaço de entradas e análise de valor limite** (BSTQB, 2023): o caminho feliz usa entradas válidas e esperadas, e os casos de erro usam entradas inválidas, ausentes ou de fronteira, onde os defeitos costumam aparecer.

## 2. Leitura e tratamento dos dados (`src/lib/engine/normalize.ts`, `src/lib/import.ts`)

**Oráculo:** cada linha da planilha vira uma movimentação com os mesmos valores, nas unidades corretas, e nenhum valor ausente é inventado.

| ID | Entrada | Resultado esperado | Evidência |
|---|---|---|---|
| LE-01 | Números "1.234,56", "R$ 12,50" e "1234.5" | 1234,56; 12,5 e 1234,5 | `tests/engine.test.ts` › "lê números no formato brasileiro e internacional" |
| LE-02 | Datas "05/03/2026", "2026-03-05" e o número de série do Excel 46086 | Todas viram 2026-03-05 | › "lê datas em vários formatos" |
| LE-03 | Cabeçalhos "Insumo", "Qtde", "Operação: Compra", "Vencimento" | Mapeados para produto, quantidade, tipo entrada e validade | › "mapeia cabeçalhos com nomes diferentes" |
| LE-03b | Cabeçalhos do edital: "Tipo de movimentação", "Preço de aquisição (R$)", "Destino da retirada", "Estoque mínimo" | Todos mapeados; "Entrada", "Saída" e "Saldo inicial" lidos pela palavra inteira | › "aceita os cabeçalhos com o vocabulário do edital" |
| LE-03c | A base simulada inteira com os cabeçalhos do edital (`public/data/exemplo-cabecalhos-edital.csv`) | 2.313 linhas lidas, nenhuma rejeitada, e os mesmos alertas, com o mesmo score | › "a mesma base com os cabeçalhos do edital é lida inteira e gera os mesmos alertas" |
| LE-04 | Base oficial importada na tela *Importar planilha* (CSV e XLSX) | Colunas reconhecidas e linhas rejeitadas, com o motivo, mostradas antes de usar a base | Tela *Importar planilha* (teste manual) |

| ID | Entrada de erro ou fronteira | Resultado esperado | Evidência |
|---|---|---|---|
| LE-E1 | Preço ou validade em branco | Fica `null` ("não informado"), **nunca zero** | › "campo vazio vira null, nunca zero" |
| LE-E2 | Mesmo produto em t e kg; em mL e L | Convertidos para a mesma unidade antes de somar | › "converte unidades da mesma família e recusa famílias diferentes" |
| LE-E3 | Mesmo produto em kg e L | **Não soma**; o caso é separado e vira alerta de qualidade dos dados | › "não soma unidades diferentes sem tratamento" |
| LE-E4 | Linha com quantidade "abc", produto vazio, tipo não reconhecido ou data inválida | Rejeitada com o número da linha e o motivo, sem derrubar as outras | › "mapeia cabeçalhos com nomes diferentes" (1 rejeitada) e tela *Importar planilha* › "Ver linhas rejeitadas" |
| LE-E4b | Tipo "Estorno" (desconhecido) | Rejeitado com o motivo, e não adivinhado pela letra inicial | › "aceita os cabeçalhos com o vocabulário do edital" |
| LE-E4c | Coluna "Preço total (R$)" | **Não** é usada como preço unitário | › "não usa coluna de preço total como preço unitário" |
| LE-E5 | Arquivo acima de 15 MB | Recusado com mensagem clara, sem travar a página | `src/lib/import.ts` (`TAMANHO_MAXIMO_MB`) |

## 3. Detectores de alerta (`src/lib/engine/detectors/`)

**Oráculo:** o gabarito `data/ground_truth.json`. O gerador (`npm run gerar-dados`) cria uma base simulada e **planta** situações conhecidas: estoque crítico, consumo crescente, retirada anômala, vencimento, excesso, variação de preço, dinheiro parado, cadastro duplicado e problemas de qualidade. O loop de avaliação compara os alertas do sistema com o gabarito e mede:

- **recall:** quantas situações plantadas o sistema encontrou;
- **precisão:** quantos alertas emitidos correspondem a algo plantado.

| ID | Caso | Resultado esperado | Evidência |
|---|---|---|---|
| DE-01 | Estoque abaixo do mínimo com consumo regular | Alerta com a duração estimada, no formato do exemplo do edital | `tests/engine.test.ts` › "estoque crítico com estimativa de duração" |
| DE-02 | Lote que vence antes de ser consumido no ritmo atual | Alerta de vencimento, considerando o consumo previsto até a validade (quem vence primeiro sai primeiro) | › "vencimento considera o consumo previsto até a validade (FEFO)" |
| DE-02b | Dois lotes com validade, consumo de 1 kg/dia | Sobra calculada lote a lote: 10 kg no primeiro e 80 kg no segundo, conferidos à mão | › "sobra no vencimento com vários lotes não é superestimada" |
| DE-02c | Lote vencido de 100 kg e lote válido; retiradas depois do vencimento | As retiradas saem do lote válido; saldo utilizável = físico − vencido; alerta de estoque crítico pelo utilizável | › "lote vencido fica fora do saldo utilizável e o FEFO não dá baixa nele" |
| DE-03 | Retirada muito acima do normal | Alerta de retirada fora do padrão | › "retirada muito acima do normal vira alerta, variação comum não" |
| DE-04 | "KCl" e "Cloreto de potássio (KCl)" | Sugeridos como o mesmo produto | › "reconhece sigla e variações de grafia" |
| DE-05 | Base simulada inteira | Recall ≥ meta e precisão ≥ meta (o relatório também publica a precisão estrita, que conta os alertas aceitáveis como erro) | › "encontra as anomalias plantadas" e `npm run eval` |

| ID | Caso de erro ou fronteira | Resultado esperado | Evidência |
|---|---|---|---|
| DE-E1 | Variação comum de consumo | **Não** vira alerta (evita alarme falso) | › "retirada muito acima do normal vira alerta, variação comum não" |
| DE-E2 | Produto com pouco histórico | O alerta sai com **confiança baixa** e diz por quê | › "estimativa com pouco histórico comunica baixa confiança" |
| DE-E3 | Nomes parecidos de coisas diferentes (NPK 04-14-08 × NPK 10-10-10; filtro de óleo × filtro de ar) | **Não** sugere unificar | › "não confunde fórmulas diferentes" |
| DE-E4 | Nomes parecidos em categorias ou unidades diferentes | Não agrupa | › "agrupa componentes conexos apenas na mesma categoria e unidade" |
| DE-E5 | 10 bases geradas com sementes diferentes | Os limiares continuam funcionando (não "decoramos" uma base só) | `npm run eval:robustez` |

**Resultado atual:**

| Avaliação | Recall | Precisão |
|---|---|---|
| Base principal | 100% | 100% |
| Média das 10 sementes | 100% | 98,9% |

Os falsos positivos de cada rodada estão em `docs/eval-report.md`, e o histórico de ajustes em `docs/validacao.md`.

> **Limitação, dita com clareza:** o gabarito foi construído pela própria equipe. Esse número prova que **cada regra faz o que promete**, mas não prova que as regras capturam o que importa numa fazenda real. Essa segunda prova vem da base oficial do desafio e da conversa com usuários (`docs/validacao.md`). Por isso a avaliação na base oficial é refeita assim que ela é divulgada.

## 4. Reanálise e pipeline (`src/lib/mudanca.ts`, `src/lib/engine/dag.ts`)

**Oráculo:** depois de uma ação conhecida, o conjunto de alertas novos, resolvidos e que mudaram de nível é exatamente o esperado.

| ID | Caso | Resultado esperado | Evidência |
|---|---|---|---|
| RE-01 | Retirada de 170 L de glifosato na data de referência | Aviso com **só** "Novo · Atenção · Herbicida glifosato · Vai faltar em breve" | `tests/demo.test.ts` |
| RE-02 | Mesma retirada com 130 L e 210 L | O mesmo aviso (a demonstração tem folga dos dois lados) | `tests/demo.test.ts` |
| RE-03 | Unificar "KCl" com "Cloreto de potássio (KCl)" | A análise é refeita e o alarme falso do KCl é resolvido | `tests/engine.test.ts` › "fusão confirmada pelo usuário une os produtos e refaz a análise" |
| RE-E1 | Pipeline com dependência circular entre etapas | Erro explícito, sem execução parcial | › "executa em ordem topológica e detecta ciclos" |

## 5. Modelo de previsão (`src/lib/engine/previsao.ts`)

**Oráculo:** o consumo real das semanas escondidas. O modelo é ajustado sem as últimas 4 semanas, em até 3 rodadas (cortes em −4, −8 e −12 semanas), e a previsão é comparada com o que aconteceu e com a média de 30 dias anterior ao corte. Isso se chama validação com origem móvel (*rolling origin*).

| ID | Caso | Resultado esperado | Evidência |
|---|---|---|---|
| PR-01 | Consumo diário somado em semanas | Semanas completas que terminam no último dia da série | `tests/previsao.test.ts` |
| PR-02 | Série com tendência linear | O modelo aprende a tendência e projeta acima do último valor | `tests/previsao.test.ts` |
| PR-03 | Consumo crescente por 200 dias | O modelo vence a média com folga de 5% e prevê que o saldo zera antes | `tests/previsao.test.ts` |
| PR-04 | Faixa de incerteza | Contém a previsão central e se alarga com o horizonte | `tests/previsao.test.ts` |
| PR-05 | Consumo estável com ruído | A decisão entre modelo e média é coerente com o teste | `tests/previsao.test.ts` |
| PR-06 | Alertas com e sem o modelo | Idênticos: o modelo não altera nenhum alerta | `tests/previsao.test.ts` |
| PR-07 | 10 bases simuladas, todos os produtos | Erro do modelo menor que o da média no total; cobertura da faixa medida | `npm run eval:previsao` → `docs/eval-previsao.md` |
| PR-E1 | Histórico de menos de 16 semanas | Sem previsão, com o motivo | `tests/previsao.test.ts` |
| PR-E2 | Produto sem consumo | Sem previsão | `tests/previsao.test.ts` |

**Resultado atual (10 bases simuladas):** o modelo erra 6,2% menos que a média (WAPE de 27,3% contra 29,1%), e a faixa de 80% contém o consumo real em 87,3% das rodadas. Testamos também abrir a faixa linearmente com o horizonte: a cobertura foi para 96%, larga demais para uma faixa de 80%, e voltamos para a abertura por √h. **Limitação:** a base é simulada, então o teste prova o método, não o acerto numa fazenda real. Em séries que aceleram (ex.: o diesel), a faixa fica estreita, e a ficha avisa quando o consumo real saiu dela na maioria dos testes.

## 6. Interface (teste manual guiado)

**Oráculo:** o que a tela mostra é exatamente o resultado da análise. Cor, texto e ícone do nível vêm do mesmo campo `nivel` de cada alerta.

| ID | Ação | Resultado esperado |
|---|---|---|
| UI-01 | Abrir https://agrohack-agrosentinela.netlify.app | Painel do dia com o resumo para o gestor e a contagem por nível; sem login |
| UI-02 | Tocar no card "Críticos" | A lista de alertas mostra só os críticos |
| UI-03 | Abrir um produto pela lista | Ficha com saldo, consumo, "Dura até", gráficos e lotes |
| UI-05 | Abrir a ficha do diesel | Cartão "Previsão do modelo" com a data em que o saldo zera, a faixa, a tendência e o resultado do teste; linha dourada e faixa sombreada no gráfico do saldo |
| UI-06 | Abrir a ficha do glifosato | O cartão diz que o modelo não foi claramente melhor que a média, com os dois erros |
| UI-04 | Abrir no celular (390 px) | Menu fixo no rodapé, tabela de produtos em cards, nada cortado |
| UI-E1 | Importar um arquivo com colunas faltando | As colunas "não encontrada" aparecem antes de usar a base |
| UI-E2 | Sistema com "reduzir movimento" ligado | As animações viram fade e nada deixa de funcionar |

## 7. O que funciona e o que ainda precisa melhorar

**Funciona e está testado:** a leitura e o tratamento dos dados, os 10 detectores, a prioridade, a reanálise ao registrar ou unificar, a importação de CSV e XLSX e o modelo de previsão com backtest.

**Precisa melhorar:**
- Medir recall e precisão na **base oficial**, com revisão manual dos alertas (`docs/validacao.md`, seção 3).
- Ter teste automatizado de interface. Hoje a interface é testada manualmente, pelos casos acima.
- Calibrar os limiares (prazo de compra, excesso, sazonalidade) com quem trabalha no campo.
- Validar o modelo de previsão na base oficial e tratar a sazonalidade de safra.

## Referências

- BSTQB. *Certified Tester Foundation Level Syllabus*, v4.0. Brazilian Software Testing Qualifications Board, 2023.
- Regulamento AGROHACK 2026/2, seções 4.4, 7 e 9.
