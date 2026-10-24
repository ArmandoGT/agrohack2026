# Backtest do modelo de previsão de consumo

Gerado por `npm run eval:previsao`. Para cada produto, escondemos as últimas 4 semanas (em até 3 rodadas: cortes em −4, −8 e −12 semanas), ajustamos o modelo só com o que vem antes e comparamos a previsão com o consumo real dessas semanas. A referência é a regra que o app já usa: a média dos últimos 30 dias antes do corte.

**WAPE** = erro absoluto somado ÷ consumo real somado (quanto menor, melhor).

| Semente | Produtos testados | WAPE do modelo | WAPE da média | Modelo erra menos em |
|---|---|---|---|---|
| 1 | 40 | 25,1% | 26,4% | 30/40 |
| 2 | 40 | 21,7% | 25,2% | 26/40 |
| 3 | 40 | 30,1% | 30,4% | 25/40 |
| 4 | 40 | 30,6% | 31,5% | 23/40 |
| 5 | 40 | 25,0% | 27,1% | 29/40 |
| 6 | 40 | 28,8% | 30,6% | 33/40 |
| 7 | 40 | 32,8% | 34,5% | 33/40 |
| 8 | 40 | 25,6% | 27,7% | 29/40 |
| 9 | 40 | 29,0% | 32,1% | 27/40 |
| 10 | 40 | 24,4% | 25,9% | 24/40 |

## Resultado nas 10 bases

- **WAPE do modelo: 27,3%**; da média de 30 dias: 29,1%. O modelo erra **6,2% menos** no total.
- Nos produtos em que o app mostra o modelo (os que venceram a média com folga de 5% no próprio teste), o erro cai 15,3%. Esse número é otimista, porque é medido no mesmo teste usado para escolher esses produtos; o número justo é o do total acima.
- **Faixa de 80%:** o consumo real das semanas escondidas caiu dentro da faixa em 87,3% das 1200 rodadas.
- Decisão por produto: modelo mostrado em 120, média mantida em 280, histórico curto (sem previsão) em 30.

## O que este número prova, e o que não prova

A base é **simulada e gerada por nós**. O backtest mostra que o método funciona e que o app escolhe com honestidade entre o modelo e a média. Ele não prova que o modelo acerta numa fazenda real. Por isso o mesmo script roda na base oficial assim que ela for divulgada, e nenhum alerta depende do modelo: os detectores continuam usando a média, que é fácil de explicar.
