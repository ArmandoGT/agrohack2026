# AgroSentinela: gestão inteligente de insumos rurais

> **AGROHACK 2026/2 · IFRO Campus Ariquemes** · Desafio oficial: *Gestão inteligente de insumos em uma propriedade rural*
>
> A AgroSentinela transforma os registros de entradas e saídas do estoque em **alertas priorizados e justificados**. Cada alerta diz **o quê** está acontecendo, **por quê**, **o que fazer** e **quanto dá para confiar** na estimativa.

**Link da solução:** _(preencher após o deploy na Vercel)_ · **Vídeo demonstrativo:** _(preencher)_ · **Versão avaliada:** tag `v1.0-entrega`

---

## 1. Equipe: 3 Hacketeers

| Integrante | Curso | Função |
|---|---|---|
| Armando Giordani Trassi (**responsável**) | ADS, 6º período | Produto, validação com usuários e pitch |
| Pedro Felipe Vieira Gouveia | ADS, 6º período | Motor de análise e loop de avaliação |
| Leandro Pires de Moraes Filho | ADS, 6º período | Interface, deploy e vídeo |

> As funções são uma proposta. Ajuste conforme a divisão real de tarefas.

## 2. Problema e público

**Público:** o responsável pelo almoxarifado ou pela gestão de uma propriedade rural (nossa persona é o "Seu João", gerente da fazenda). Ele registra compras e retiradas, mas não tem tempo de cruzar centenas de lançamentos.

**Problema:** saber o saldo não basta. Faltas inesperadas param a operação (diesel no plantio, por exemplo), produtos vencem parados, compras em excesso imobilizam dinheiro e erros de cadastro escondem tudo isso.

**Decisões que a solução apoia:**
- o que comprar agora;
- o que usar primeiro;
- o que não comprar de novo;
- qual retirada conferir;
- qual cadastro corrigir.

## 3. Solução

| Tela | Para quê |
|---|---|
| **Painel do dia** | Alertas ordenados por prioridade (Crítico, Atenção, Monitorar), resumo para o gestor, filtros |
| **Produtos** | Saldo, mínimo, consumo/dia, cobertura em dias, valor e curva ABC de cada item |
| **Ficha do produto** | Gráfico do saldo com **projeção**, consumo semanal, lotes por validade (FEFO), histórico |
| **Registrar entrada ou saída** | Nova entrada ou saída, com **reanálise imediata** e aviso do que mudou (alertas novos, resolvidos ou que mudaram de nível) |
| **Financeiro** | Curva ABC (Pareto), valor por categoria, dinheiro parado, excesso, variação de preço |
| **Cadastros duplicados** | Grupos de nomes parecidos (grafo de similaridade); unificar com um clique e a análise é refeita |
| **Importar planilha** | CSV ou Excel com **mapeamento automático de colunas** e relatório de linhas rejeitadas |
| **Como funciona** | As 7 perguntas do edital, o pipeline (DAG) com tempos reais, critérios e limites |

### Os 10 detectores

1. Estoque crítico
2. Vai faltar em breve
3. Consumo em alta
4. Retirada fora do padrão
5. Risco de vencimento (por lote, com consumo previsto)
6. Excesso de estoque
7. Variação de preço
8. Dinheiro parado (curva ABC)
9. Cadastro duplicado
10. Qualidade dos dados

Os critérios completos estão em [`docs/criterios-alertas.md`](docs/criterios-alertas.md).

Exemplo real de saída:

> **Estoque crítico:** saldo de 1.960 L está abaixo do mínimo de 3.675 L. Mantendo o consumo médio dos últimos 30 dias (220 L/dia), o saldo atual poderá ser suficiente por aproximadamente 9 dias.
> **O que fazer:** comprar cerca de 8.311 L. *Confiança alta: 15 retiradas na janela e 376 dias de histórico.*

## 4. Como testar

Requisitos: Node.js 20+.

```bash
npm install
npm run dev          # http://localhost:3000 (abre com a base SIMULADA)
npm test             # 16 testes unitários (Vitest)
npm run eval         # loop de avaliação → docs/eval-report.md
npm run eval:robustez # avaliação em 10 bases simuladas diferentes
npm run gerar-dados  # recria data/simulado.csv e o gabarito
npm run build && npm start
```

**Base oficial:** quando for divulgada, use *Importar planilha* e envie o arquivo (CSV ou XLSX). As colunas são reconhecidas pelo nome.

**Persistência:**
- Por padrão, os dados ficam no navegador.
- Para usar o banco, crie um projeto Supabase e rode `supabase/migrations/20261014000000_inicial.sql`.
- Depois, preencha `.env.local` a partir de `.env.example`, **somente com a chave pública (anon)**.

## 5. Dados e critérios

- **Campos usados:** produto, categoria, unidade, quantidade, estoque mínimo, tipo, data, preço de aquisição, lote, validade, fornecedor, destino da retirada e responsável. São os mesmos da seção 3 do desafio.
- **Tratamentos:**
  - números em formato brasileiro, datas em vários formatos e serial do Excel;
  - grafias unificadas (acento e maiúsculas);
  - conversão de unidades da mesma família (t→kg, mL→L);
  - **unidades incompatíveis não são somadas**;
  - **preço ou validade ausentes não viram zero**.
- **Data de referência:** é a data mais recente dos registros, e pode ser alterada em *Como funciona*.
- **Critérios, limiares e limites das estimativas:** ver [`docs/criterios-alertas.md`](docs/criterios-alertas.md).
- **Base simulada:** `data/simulado.csv` é **SIMULADA** (coluna `simulado=true`, aviso fixo no topo do app). Ela só existe para desenvolver e testar até a base oficial ser divulgada. O gabarito das anomalias plantadas está em `data/ground_truth.json`.

## 6. Demonstração

- **Vídeo:** _(link)_. O roteiro está em [`docs/roteiro-video.md`](docs/roteiro-video.md).
- **Atualização e reanálise:** registre, por exemplo, uma retirada grande de glifosato em *Registrar entrada ou saída*. Ao salvar, o aviso no canto mostra "Novo · Atenção · Herbicida glifosato · Vai faltar em breve".
- **Unificação:** em *Cadastros duplicados*, unifique "KCl" com "Cloreto de potássio (KCl)". O alerta falso de ruptura do "KCl" é resolvido na hora.

## 7. Validação

- **Loop de avaliação automática:** anomalias plantadas, comparadas com o gabarito, ajuste e nova rodada. Resultado atual: recall de 100% e precisão de 100% na base principal. Em 10 bases com sementes diferentes, a média foi **recall de 100% e precisão de 98,9%**. Detalhes em [`docs/eval-report.md`](docs/eval-report.md) e [`docs/validacao.md`](docs/validacao.md), incluindo o histórico das rodadas e o que mudou em cada uma.
- **Testes unitários:** 16 testes cobrindo leitura, unidades, nulos, grafo de duplicados, DAG, detectores e a meta do eval. Rodam no CI (GitHub Actions) a cada push.
- **Validação com usuários:** feedback com professor ou aluno de Agronomia, registrado em [`docs/validacao.md`](docs/validacao.md).
- **Limitações conhecidas:** ver a seção "Limites" em [`docs/criterios-alertas.md`](docs/criterios-alertas.md).

## 8. Tecnologias e IA

- **Stack:** Next.js 15 (React 19, TypeScript), Tailwind CSS 4, Recharts, PapaParse, SheetJS (xlsx), Supabase (opcional), Vitest e GitHub Actions.
- **Motor de análise:** TypeScript puro, sem dependências, em `src/lib/engine/`. É organizado como um **grafo acíclico de etapas (DAG)**, e cada detector é um nó.
- **Uso de IA:** declarado em [`IA.md`](IA.md), com ferramentas, finalidades, partes apoiadas e revisões feitas pela equipe.

## 9. Autoria e licença

- Código desenvolvido pela equipe 3 Hacketeers para o AGROHACK 2026/2, com apoio de IA declarado em `IA.md`.
- Bibliotecas de terceiros sob suas próprias licenças (MIT/Apache).
- Licença do código: MIT. A finalidade é acadêmica e demonstrativa, conforme o item 11 do regulamento.
- Nenhum dado pessoal real nem credencial no repositório. Os nomes na base simulada são fictícios.

## 10. Versão de entrega

Tag `v1.0-entrega`, commit `_(preencher)_`, criada em `_(data)_`.

---

### Estrutura do código

```
src/lib/engine/        motor de análise (DAG)
  normalize.ts         ingestão, mapeamento de colunas, números, datas, unidades
  entities.ts          grafo de similaridade de nomes + union-find
  stock.ts             saldo por lote (FEFO), série de consumo, taxa, curva ABC
  detectors/           10 detectores (estoque, consumo, validade, financeiro, qualidade)
  priority.ts          score de prioridade e confiança
  dag.ts               ordem topológica e execução do pipeline
  index.ts             analisar(): monta e executa o DAG
src/lib/store.tsx      estado, persistência e diff de alertas (loop de reanálise)
src/app/               telas (Next.js App Router)
scripts/               gerador de dados simulados e loop de avaliação
tests/                 testes unitários
docs/                  critérios, validação, eval, pitch, roteiro do vídeo
```
