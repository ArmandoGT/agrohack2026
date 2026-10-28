# AGROHACK 2026/2 — Plano de Ação da Equipe 3 Hacketeers

> **Registro histórico:** plano escrito em 14/10/2026. Algumas decisões mudaram depois. O deploy final foi na **Netlify**, e não na Vercel. A estrutura de pastas final também é outra (`src/`). O estado final do projeto está no [README](../README.md).

## Contexto
- **Evento:** AGROHACK 2026/2, IFRO Campus Ariquemes. **Prêmio de R$ 2.000** para a equipe com a maior nota (de 100 pontos).
- **Desafio:** "Gestão inteligente de insumos em uma propriedade rural". O objetivo é transformar registros de estoque em **alertas priorizados e justificados** que apoiem decisões. O edital diz explicitamente que *não* quer apenas um CRUD de entradas e saídas.
- **Equipe:** já inscrita, com 3 integrantes de ADS no 6º período: Armando, Pedro e Leandro. A equipe decidiu seguir com 3, sem incluir alguém de Agronomia.
- **Datas:** hoje é 14/10. A apresentação é em **29/10/2026**, na SNCT. A base oficial de dados e o prazo de entrega do GitHub ainda não foram divulgados.
- **Stack escolhida:** Next.js + Supabase, com deploy na Vercel. O regulamento prefere um link online.
- **O usuário pediu:** plano estratégico, MVP, dados simulados, README e pitch, usando **Loop Engineering** e **Graph Engineering**.

## 1. Estratégia para ganhar (mapa da nota)
| Critério | Pts | Como a equipe ganha esses pontos |
|---|---|---|
| Problema, público e aderência | 20 | Persona "Seu João, gerente da fazenda". Cada uma das 7 perguntas do edital (item 4.3) vira uma tela ou alerta, e um slide mostra essa rastreabilidade. |
| Funcionamento e demo com os dados | 20 | Link online estável, base oficial carregada e demo ao vivo de 3 minutos com plano B gravado. |
| **Análises, alertas e apoio à decisão** | 20 | **Este é o 1º critério de desempate.** O motor de detectores vira um grafo, com score de prioridade, frase explicativa, "como calculamos" e nível de confiança em cada alerta. |
| Validação, testes e utilidade | 15 | Loop de avaliação automática (recall e precisão por detector), testes no CI, uma sessão de feedback com professor ou aluno de Agronomia, registrada no README. |
| Código, documentação e IA responsável | 15 | README no formato do Anexo II, `IA.md` declarando as ferramentas usadas e uma tag `v1.0-entrega`. |
| Clareza e respostas | 10 | Pitch de 5 minutos ensaiado 3 vezes e um banco de perguntas e respostas da banca. |

**Diferencial central:** cada alerta responde a três perguntas: **o quê** ("Estoque crítico"), **por quê** ("mantido o consumo médio de 14 dias, o saldo dura cerca de 8 dias") e **quão confiável** é ("baixa: só 3 retiradas no histórico"). A banca pediu exatamente isso, e a maioria das equipes vai entregar só um dashboard.

Armadilhas que a banca vai checar, citadas no item 4.4:
- não somar unidades diferentes;
- não tratar validade ou preço ausente como zero;
- comunicar a incerteza quando o histórico é curto.

## 2. Graph Engineering
**(a) Pipeline de análise como DAG.** Cada etapa é uma função pura em `lib/engine/` e o orquestrador executa o grafo em ordem topológica:
```
ingestão → normalização (unidades, datas, nulos≠0) → resolução de entidades
        → saldo por produto/lote → série de consumo diária
        → [detectores em paralelo] → score de prioridade → explicação → UI / notificação
```
Detectores, um por nó:
| Detector | Regra explicável |
|---|---|
| Estoque crítico | saldo ≤ estoque mínimo |
| Ruptura prevista | cobertura = saldo ÷ consumo médio (janelas de 30/60/90 dias + EWMA). Alerta se a cobertura for menor que o lead time padrão (15 dias). |
| Consumo crescente | inclinação de regressão linear e comparação entre as janelas recente e anterior (+X%) |
| Retirada anômala | z-score robusto (mediana/MAD) da retirada em relação ao histórico do produto |
| Risco de vencimento (por lote, FEFO) | quantidade do lote − consumo previsto até a validade = quantidade que vai vencer, em R$ |
| Excesso de estoque | cobertura > 180 dias ou saldo > k × mínimo |
| Variação de preço | preço da compra vs. mediana das compras anteriores (±20%), por fornecedor |
| Alto valor parado | curva ABC por valor imobilizado + dias desde a última saída |
| Cadastro duplicado | ver item (b) |
| Qualidade dos dados | saldo negativo, unidade inconsistente, validade ou preço ausente |

Score de prioridade = severidade × urgência (dias até o problema) × impacto financeiro, normalizado em quatro níveis: **Crítico / Atenção / Monitorar / OK**.

**(b) Grafo de entidades para cadastros duplicados.** O edital cita "produtos cadastrados de formas diferentes".
- Nós são os nomes de produto, e uma aresta liga dois nomes com similaridade acima do limiar. A similaridade combina Jaro-Winkler/trigramas sobre o nome normalizado (sem acento, sem caixa, com aliases como "KCl" ↔ "cloreto de potássio") e exige mesma categoria e unidade compatível.
- Componentes conexos (union-find) formam grupos de duplicatas sugeridas. O usuário confirma a fusão, e as séries de consumo são recalculadas.

**(c) Grafo de relações para visualização (diferencial de demo).** Produto ↔ fornecedor ↔ destino da retirada (talhão, máquina) ↔ responsável. Ele mostra para onde vai o consumo e quem retira fora do padrão. É implementado com `react-force-graph` ou `@xyflow/react` e **só entra se sobrar tempo** (dia 9 ou depois).

**(d) Grafo de tarefas do projeto (DAG de execução)**, que orienta o cronograma da seção 4:
`gerador de dados → esquema do banco → importador → motor/detectores → loop de avaliação → UI → deploy → validação com usuário → README/IA.md → vídeo → pitch`

## 3. Loop Engineering
1. **Loop de avaliação dos detectores (o núcleo).**
   - O gerador de dados simulados planta anomalias conhecidas e grava um gabarito `ground_truth.json`.
   - `npm run eval` roda o motor e calcula precisão e recall por detector, gerando `eval-report.md`.
   - A equipe ajusta limiares e regras e roda de novo, até chegar a recall ≥ 90% sem falsos positivos absurdos.
   - O relatório vira evidência no critério de Validação.
2. **Loop de CI.** GitHub Actions roda testes unitários dos detectores e o eval a cada push. Quebrou, corrige antes de seguir.
3. **Loop de reanálise no produto** (exigido no item 6 do desafio). Um novo registro dispara a recomputação do DAG e os alertas atualizam na hora. É o momento "uau" da demo.
4. **Loop com o usuário.** Duas rodadas de feedback com professor ou aluno de Agronomia (dias 8 e 12). Cada feedback é registrado como "o que mudou" no README.
5. **Loop da base oficial.** Quando a base sair: importar, rodar o eval exploratório, revisar manualmente os 20 alertas do topo e ajustar. Opcionalmente, um `/loop` pode monitorar o site do AGROHACK para avisar quando a base ou o prazo forem divulgados.

## 4. Cronograma (14/10 → 29/10)
| Dia | Data | Entrega |
|---|---|---|
| D0 | 14/10 | Repositório GitHub, Next.js + Supabase + Vercel, esquema do banco, gerador de dados simulados com gabarito |
| D1–2 | 15–16 | Importador CSV/XLSX com mapeamento flexível de colunas (o formato da base oficial ainda é desconhecido), normalização, saldo por lote |
| D3–5 | 17–19 | Motor DAG + 10 detectores + score + explicações; loop de eval verde |
| D6–8 | 20–22 | UI: Painel do dia (alertas priorizados), ficha do produto (gráfico de consumo, cobertura, lotes), valor imobilizado (ABC), duplicatas, registrar movimentação; 1º feedback |
| D9–10 | 23–24 | Integração da base oficial (se publicada), grafo de relações (opcional), resumo semanal em linguagem natural via IA (opcional e declarado) |
| D11–12 | 25–26 | Testes, polimento, acessibilidade, 2º feedback, README (Anexo II), `IA.md` |
| D13 | 27 | Vídeo demonstrativo (2–3 min), deck de slides, tag `v1.0-entrega` |
| D14 | 28 | Ensaio geral ×3, banco de perguntas e respostas, plano B offline (vídeo + build local) |
| D15 | 29/10 | Apresentação na SNCT |

Proposta de divisão de papéis, para a equipe ajustar:
- **Armando:** produto, pitch e validação.
- **Pedro:** motor de análise e eval.
- **Leandro:** front-end, deploy e vídeo.

## 5. Arquitetura e arquivos (em E:\Agrohack\)
- `app/` (App Router): `/` (painel do dia), `/produtos/[id]`, `/movimentacoes`, `/importar`, `/financeiro`, `/duplicatas`, `/sobre` (critérios e limites)
- `lib/engine/`: `dag.ts`, `normalize.ts`, `entities.ts` (grafo e union-find), `series.ts`, `detectors/*.ts`, `priority.ts`, `explain.ts`
- `scripts/generate-data.ts` (dados simulados, prefixados como SIMULADO) e `scripts/eval.ts`
- `supabase/migrations/`: tabelas `produtos`, `movimentacoes`, `alertas_snapshot`, `feedback`
- Supabase com RLS e apenas a chave pública no front, para não expor nenhuma credencial (exigência do item 6)
- Recharts para os gráficos; Vitest para os testes
- Documentação: `README.md` (Anexo II), `IA.md`, `docs/criterios-alertas.md`, `docs/validacao.md`, `docs/pitch.md`, `docs/roteiro-video.md`

## 6. Pitch (5 minutos) e roteiro do vídeo
1. **Dor (30 s):** "O Seu João sabe quanto tem, mas não sabe o que vai dar problema."
2. **Solução (30 s):** alerta = o quê + por quê + confiança.
3. **Demo ao vivo (2 min 30 s):**
   - painel com 3 críticos;
   - abrir o diesel e mostrar que dura cerca de 8 dias;
   - lote de inoculante que vence com R$ X;
   - duplicata "Ureia 45%" / "UREIA";
   - registrar uma retirada atípica ao vivo, e o alerta aparece (reanálise).
4. **Critérios e limites (45 s):** os números do eval e o que a solução não faz.
5. **Validação e próximos passos (45 s).**

## 7. Riscos
| Risco | Mitigação |
|---|---|
| A base oficial sair tarde ou em formato diferente | Importador com mapeamento flexível de colunas + dados simulados prontos |
| Falha de internet na SNCT | Vídeo gravado e build local |
| Escopo grande demais | O grafo visual e o resumo por IA só entram depois que o núcleo estiver estável |
| Prazo de entrega do repositório desconhecido | Manter a `main` sempre apresentável a partir do D8 |

## Verificação
- `npm run eval` gera precisão e recall ≥ 90% por detector sobre os dados simulados.
- `npm test` (Vitest) passa e o CI fica verde.
- Teste de ponta a ponta: importar o CSV, conferir os alertas no painel, registrar uma retirada e ver a reanálise mudar o alerta.
- Deploy na Vercel acessível em aba anônima.
- Checklist do Anexo I 100% marcado antes da tag `v1.0-entrega`.
