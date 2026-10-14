# Relatório do loop de avaliação (dados SIMULADOS)

Gerado em 2026-10-14 19:34 · data de referência 2026-10-10 · 2313 movimentações · 43 produtos · 0 linhas rejeitadas

**Recall geral: 100%** (meta 90%) · **Precisão geral: 100%** (meta 85%)

| Detector | Plantadas | Encontradas | Recall | Precisão | Falsos positivos | Não encontradas |
|---|---|---|---|---|---|---|
| consumo_crescente | 1 | 1 | 100% | 100% | — | — |
| estoque_critico | 2 | 2 | 100% | 100% | — | — |
| ruptura_prevista | 1 | 1 | 100% | 100% | — | — |
| retirada_anomala | 1 | 1 | 100% | 100% | — | — |
| risco_vencimento | 3 | 3 | 100% | 100% | — | — |
| excesso_estoque | 1 | 1 | 100% | 100% | — | — |
| cadastro_duplicado | 3 | 3 | 100% | 100% | — | — |
| variacao_preco | 1 | 1 | 100% | 100% | — | — |
| alto_valor_parado | 1 | 1 | 100% | 100% | — | — |
| qualidade_dados | 3 | 3 | 100% | 100% | — | — |

Alertas gerados: 23 (6 críticos, 13 de atenção, 4 para monitorar).

## Etapas do DAG

| Nó | Depende de | Tempo | Saída |
|---|---|---|---|
| Normalização | — | 0.0 ms | 2313 movimentações; data de referência 2026-10-10 |
| Resolução de entidades | normalizacao | 3.8 ms | 43 produtos distintos |
| Saldo por lote (FEFO) e série de consumo | entidades | 19.6 ms | 74 lotes ativos; valor em estoque R$ 513865.39 |
| Grafo de nomes parecidos | saldos | 11.0 ms | 2 grupo(s) de possível duplicidade |
| Estoque crítico | saldos | 0.9 ms | 3 alerta(s) |
| Ruptura prevista | saldos | 1.2 ms | 2 alerta(s) |
| Consumo crescente | saldos | 118.5 ms | 1 alerta(s) |
| Retirada fora do padrão | saldos | 115.3 ms | 2 alerta(s) |
| Risco de vencimento | saldos | 1.0 ms | 4 alerta(s) |
| Excesso de estoque | saldos | 0.4 ms | 2 alerta(s) |
| Variação de preço | saldos | 2.2 ms | 1 alerta(s) |
| Alto valor parado | saldos | 0.4 ms | 1 alerta(s) |
| Qualidade dos dados | saldos | 0.6 ms | 3 alerta(s) |
| Score de prioridade | grafo_duplicados, estoque_critico, ruptura_prevista, consumo_crescente, retirada_anomala, risco_vencimento, excesso_estoque, variacao_preco, alto_valor_parado, qualidade_dados | 0.1 ms | 23 alertas ordenados |
