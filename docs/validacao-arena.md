# Validação da ideia: Arena (16 agentes de IA)

> **O que é este documento.** A ideia AgroSentinela foi submetida à skill [Arena](https://github.com/Jakeschincariol/arena-skill), executada no Claude Code em 14/10/2026. Funciona assim:
> - 16 sub-agentes receberam a mesma tarefa: dar um veredito pela rubrica do edital, listar pontos fracos e perguntas da banca, e propor a versão mais forte da ideia e do pitch;
> - cada agente trabalhou com uma estratégia de raciocínio diferente;
> - os agentes se enfrentaram num mata-mata de 4 rodadas, com ataque, defesa e revisão, e um juiz independente avaliou cada confronto;
> - venceu a carta *Probabilístico + Rascunho/crítica/reescrita + Defensivo*, por 84 a 81,5 na final.
>
> **Notas:** as notas abaixo são **estimativas dos agentes**, não da banca. Este documento foi gerado por IA, conforme declarado no `IA.md`. As decisões sobre o que adotar são da equipe.

---

## Leitura da equipe: mindset de venda

**Premissa da equipe:** em hackathon, quem ganha é quem **vende melhor uma ideia nota 100 e executável**, e não quem entrega o sistema 100% pronto. O relatório completo abaixo foi escrito pensando em "consertar tudo". Esta é a leitura filtrada para o dia 29/10.

### 1. O que vender (a ideia nota 100)
- **"Não é cadastro de estoque: é um agrônomo de bolso que diz o que fazer hoje."** Cada alerta responde três coisas: **o quê**, **por quê** e **quanto dá para confiar**. É exatamente o que o edital pede e o que a maioria das equipes não vai entregar.
- **As 7 perguntas do edital** são respondidas em telas e alertas, com um mapa visível na tela *Como funciona*.
- **Graph Engineering:** o motor é um grafo de etapas e um segundo grafo une cadastros duplicados. Exemplo: "KCl" e "Cloreto de potássio" se unem, e o alarme falso some.
- **Loop Engineering:** usamos um gabarito com problemas plantados, medimos o resultado, ajustamos e medimos de novo. Isso mostra método, não chute.
- **Visão, que é o roadmap a vender:**
  - lista de compras pronta para enviar pelo WhatsApp;
  - lista de "usar primeiro" por lote;
  - calendário de safra, para distinguir estoque de safra de estoque encalhado;
  - app offline (PWA) para a fazenda sem internet;
  - várias fazendas e cooperativas;
  - feedback "este alerta foi útil?", que melhora as regras.

### 2. Proteger o palco (mínimo indispensável, cerca de 4 a 6 h)
O critério **Funcionamento e demo** vale 20 pontos, e o regulamento pede a demonstração com os dados do desafio. Não é preciso ter tudo pronto, mas **nada pode quebrar nem sair errado na frente da banca**:

| Item | Por quê | Esforço |
|---|---|---|
| `IA.md` verdadeiro (feito em 14/10) | Declaração falsa pode desclassificar (seção 10) | feito |
| Criar o arquivo `LICENSE` (MIT) | Está no checklist do Anexo I | 5 min |
| Importador aceitar os cabeçalhos do edital ("Tipo de movimentação", "Preço de aquisição (R$)") | Hoje rejeita 100% das linhas com esses nomes: sem isso, a demo com a base oficial quebra | 2 a 3 h |
| Testar a base oficial **antes** do palco, quando sair | Evita descobrir o problema ao vivo | 1 h |
| **Não citar no palco** o valor de sobra do card de vencimento, ou tirar esse card da demo | O cálculo com vários lotes está errado (pode sair 3 vezes maior) | 0 |
| Não abrir a demo pelo alerta do óleo (saldo negativo) | Ele manda comprar com base num saldo errado | 0 |
| Fazer o deploy na Vercel **sem** Supabase (modo local) | Ninguém apaga os dados da demo | 1 h |
| Vídeo de plano B | Internet e palco falham | 2 h |

### 3. Transformar fraqueza em roadmap ("próximos passos já mapeados")
Uma banca valoriza muito mais quem **conhece os próprios limites** do que quem finge perfeição. No pitch, estes itens viram prova de maturidade:
- **Sazonalidade:** "semente parada em outubro pode ser estoque para a safrinha, por isso o próximo passo é o calendário de safra";
- **Vários lotes e descarte de vencido:** "já identificamos e temos a correção desenhada, com o caso de teste calculado à mão";
- **Datas digitadas errado e tipos ambíguos** ("Saldo inicial"): "o sistema vai perguntar em vez de adivinhar";
- **Precisão:** "17 de 17 problemas encontrados; os alertas extras revisamos um a um".

### 4. Perguntas da banca que precisam estar na ponta da língua
São as perguntas 1, 2, 8, 9, 12 e 18 do relatório abaixo:
- gabarito circular;
- precisão;
- quem escreveu o código;
- o que a IA fez;
- a diferença para uma planilha;
- a validação com usuário.

**Regra de ouro:** primeiro admitir o limite, depois mostrar o que foi feito e o que vem a seguir. Nunca inventar validação nem dizer que a equipe fez o que a IA fez.

---

# Relatório vencedor da Arena (íntegra)

## AgroSentinela: validação da ideia para o AGROHACK 2026/2

**Para:** equipe 3 Hacketeers (Armando, Pedro, Leandro) · **Data:** 14/10/2026 · **Apresentação:** 29/10/2026 (faltam 15 dias)

---

## Resumo em 6 linhas

1. **A ideia é forte e está acima do que se espera de uma equipe de ADS.** O motor de análise já responde às 7 perguntas do desafio com alertas justificados, nível de confiança e prioridade. Isso conta no critério Análises, que é o 1º critério de desempate.
2. **Nota estimada se apresentassem hoje, do jeito que está: 67/100** (faixa provável de 58 a 75). O critério que mais puxa para baixo é Funcionamento (8/20): sem link, sem vídeo e sem demonstração com a base oficial.
3. **Nota estimada com as mudanças P0 e P1 abaixo: 87/100** (faixa provável de 80 a 91), ou seja, cerca de +20 pontos, dos quais +9 em Funcionamento.
4. **O maior risco não está na ideia, e sim na operação.** Testei o importador com os nomes de coluna que o próprio edital usa ("Tipo de movimentação", "Preço de aquisição (R$)"): **ele rejeita 100% das linhas**. Se a base oficial vier assim, a demo com os dados do desafio falha no palco.
5. **Outros problemas que a banca pode encontrar sozinha:**
   - o 1º alerta do painel é efeito de um erro de dados;
   - **o cálculo de "quanto sobra do lote" está errado quando há mais de um lote**: chega a superestimar a sobra em cerca de 3 vezes;
   - lotes já vencidos contam como estoque disponível, e **toda saída feita depois do vencimento é descontada do lote vencido** (o FEFO não exclui lotes vencidos), o que esconde estoque crítico e subestima o vencido. A correção precisa tratar à parte o **descarte** do vencido, senão quebra a própria ação que o sistema recomenda;
   - linhas com problema (quantidade vazia, data inválida, tipo estranho) são só rejeitadas na importação e **nunca viram alerta**, embora "problemas nos dados" seja uma das situações que o desafio manda detectar;
   - uma única data digitada errado muda a análise inteira sem aviso;
   - a "precisão de 100%" depende de alertas classificados depois como "aceitáveis";
   - o repositório não mostra a autoria dos três integrantes, e **o `IA.md` já afirma hoje duas coisas que o histórico não sustenta** ("a equipe revisou o código dos detectores e consegue explicar cada critério e limiar" e "os limiares foram ajustados pela equipe a partir dos relatórios do loop"). Uma declaração de IA falsa é o único ponto deste relatório que pode levar à **desclassificação** (regulamento, seções 6 e 10), e não só a perder pontos.
6. Todos esses problemas são corrigíveis com **cerca de 44 horas-pessoa de P0** (soma item a item na tabela de esforço da Parte 3), de 15 a 20/10, quando a equipe tem de 36 a 54 h. Cabe com cerca de 2,5 h por pessoa por dia; com só 2 h/dia, faltam até 3 h por pessoa, e por isso a Parte 3 diz o que cortar primeiro se atrasar. O restante do prazo (P1, cerca de 30,5 h, e ensaios, cerca de 9 h) fica para a base oficial, a validação com usuário, o vídeo e o ensaio.

---

## Premissas e como ler as notas

- **As notas são estimativas.** Ninguém conhece a banca nem as outras equipes. Por isso dou um valor por critério, uma faixa e o nível de confiança. Quando a confiança é baixa, a decisão recomendada é a que funciona na maioria dos cenários.
- **Base de cada nota:** só o que existe nos arquivos (README, `docs/`, `IA.md`, código do motor, telas, testes, `git log`) e o que observei rodando o motor **em uma cópia**, sem alterar o projeto. Não li nenhum comprovante de inscrição.
- **"Hoje"** significa apresentar no estado atual: sem deploy, sem vídeo, sem base oficial, sem validação com usuário, com `IA.md` incompleto e **sem nenhuma das correções propostas**. A coluna "Hoje" da tabela não supõe nada resolvido; o efeito das correções aparece só na coluna "Com P0+P1".
- **Cenário-base:** a base oficial sai até cerca de 22/10, em CSV ou XLSX. O prazo do repositório é **desconhecido**, então trato como se pudesse ser alguns dias **antes** de 29/10.
- **Esforço em horas-pessoa.** Considero que cada pessoa tem de 2 a 3 horas por dia, ou seja, de 90 a 130 h no total até 29/10.
- **Como a faixa do total foi feita:** o total é a soma exata das notas por critério. A faixa do total **não** é a soma dos extremos de cada critério (que daria de 54 a 78 hoje). É improvável que todos os critérios caiam no extremo ao mesmo tempo. A faixa cobre cerca de 80% dos cenários que considero plausíveis.
- **Todo trecho de código abaixo** que diz "testado" foi rodado por mim numa cópia do motor ou num script isolado, com os casos citados. Mesmo assim, a equipe deve rodar `npm test`, `npm run eval` e `npm run build` depois de cada mudança.

---

## Parte 1: Veredito pela rubrica oficial

### 1.1 Tabela de notas

| Critério (pontos) | Hoje | Faixa hoje | Com P0+P1 | Confiança |
|---|---|---|---|---|
| Problema, público e aderência (20) | **16** | 14–18 | **18** | média-alta |
| Funcionamento e demonstração com os dados (20) | **8** | 5–11 | **17** | **baixa** (depende da base oficial) |
| Análises, alertas, prioridades e apoio à decisão (20) | **16** | 14–18 | **18** | média |
| Validação, testes e utilidade prática (15) | **10** | 8–11 | **13** | média |
| Código, documentação, autoria e IA (15) | **10** | 8–12 | **13** | média |
| Clareza, acessibilidade, apresentação e respostas (10) | **7** | 5–8 | **8** | média |
| **Total (100)** | **67** (16+8+16+10+10+7) | 58–75 | **87** (18+17+18+13+13+8) | |

**Sobre a chance de ganhar (confiança baixa):** a maioria das equipes de hackathon acadêmico entrega um painel ou um cadastro com gráficos, e o edital diz explicitamente que não quer isso. Por isso, a AgroSentinela tende a ter **a melhor nota em Análises**, o 1º critério de desempate. Há, porém, dois cenários em que ela perde mesmo sendo a melhor ideia:
- a demo falha com a base oficial e o critério Funcionamento fica entre 5 e 8, como hoje;
- um avaliador confere à mão um número do card de vencimento, ele está errado, e isso derruba a credibilidade de todos os alertas.

As mudanças P0 eliminam os dois cenários.

### 1.2 Justificativa de cada nota

**Problema, público e aderência: 16/20**
- *A favor:*
  - persona clara ("Seu João"), com as decisões apoiadas listadas no README: comprar, usar primeiro, não recomprar, conferir retirada, corrigir cadastro;
  - as 7 perguntas do edital estão mapeadas na tela *Como funciona* (`src/app/como-funciona/page.tsx`, constante `PERGUNTAS`);
  - todas as situações da seção 5 do desafio têm um detector;
  - os dados simulados estão identificados (coluna `simulado=true` e faixa "DADOS SIMULADOS" em `Shell.tsx`).
- *Contra:*
  - a persona é inventada e ninguém de Agronomia validou o problema (`docs/validacao.md`, seção 4, está vazia);
  - o exemplo "R$ 57 mil de semente parada" é fácil de contestar: semente de milho guardada em outubro pode ser estoque para a safrinha;
  - a sazonalidade está declarada como limitação, mas não é tratada.

**Funcionamento e demonstração: 8/20 hoje (o critério de maior risco e o de maior ganho)**
- *A favor:*
  - 8 telas;
  - reanálise imediata, com aviso de alertas novos, resolvidos e que mudaram de nível (`store.tsx`, função `comparar`);
  - a unificação de cadastros refaz a análise;
  - importação de CSV e XLSX com relatório de linhas rejeitadas;
  - plano B offline.
- *Contra (verificado rodando o código):*
  1. **O importador não reconhece os cabeçalhos com o vocabulário do edital.** Com "Produto, Categoria, Unidade, Quantidade, Estoque mínimo, Tipo de movimentação, Data, Preço de aquisição (R$), …":
     - `tipo` e `preco` ficam sem mapeamento;
     - **100% das linhas são rejeitadas** com o motivo "tipo (entrada/saída) não reconhecido".

     A causa: `mapearColunas` e `chaveCabecalho` (`normalize.ts`) só aceitam o nome **exato** da lista de apelidos. "tipo_de_movimentacao" não está na lista, e o "(R$)" quebra a comparação. A tela promete funcionar "mesmo com variações", mas isso só vale para as variações previstas.
  2. **`parseTipo` adivinha pelo começo da palavra.** No código atual:
     - "Saldo inicial" → **saída**;
     - "Sobra" → saída;
     - "Estorno" → **entrada**;
     - "Inventário" → entrada.

     Uma linha de saldo inicial inverte o sinal do estoque sem nenhum aviso.
  3. `parseNumero("0.500")` devolve 500. Afeta só CSV com ponto decimal e três casas, mas o erro é silencioso.
  4. **Só a primeira aba do Excel é lida** (`import.ts`). Se o estoque mínimo vier numa aba "Produtos" separada, ele se perde sem aviso.
  5. **Não há deploy** ("preencher após o deploy na Vercel"), **não há vídeo** e **não há demonstração com a base oficial**. O regulamento diz que dados simulados "não substituirão a demonstração com os dados do desafio".
- **Por que 8, e não menos:** com a base simulada, o app funciona de ponta a ponta (as 8 telas, a reanálise e a unificação), e isso a banca vê. **Por que não mais:** o regulamento diz que dados simulados "não substituirão a demonstração com os dados do desafio", não há link nem vídeo, e o importador rejeitaria 100% das linhas de uma base com os nomes de coluna do edital. A faixa de 5 a 11 cobre de "a banca exige a base oficial e ela não entra" até "a banca aceita a simulada porque a oficial saiu tarde".
- **Cenários com as correções:** P0-1 feita e base oficial ensaiada antes (P1-1), mais link e vídeo: 17. P0-1 feita, mas base oficial carregada pela primeira vez no palco: de 10 a 13, porque o mapeamento manual exige confirmação ao vivo.

**Análises, alertas e apoio à decisão: 16/20 (ponto mais forte, mas com 2 erros de cálculo)**
- *A favor:*
  - 10 detectores com regras explicáveis (`docs/criterios-alertas.md`);
  - cada alerta tem mensagem, método, ação e confiança com motivo (`types.ts`, `priority.ts`);
  - o score combina nível, urgência, impacto em R$ e penalidade por incerteza;
  - a retirada fora do padrão usa estatística robusta (mediana e MAD) com linha de base local;
  - a mensagem segue o exemplo do edital ("o saldo atual poderá ser suficiente por aproximadamente 9 dias");
  - unidades incompatíveis não são somadas;
  - preço e validade ausentes viram `null`, nunca zero.
  - **A ideia** de calcular o vencimento por lote, cruzando com o consumo previsto (FEFO), é boa. **A implementação atual tem erros** (itens 1 e 2 abaixo).
- *Contra (verificado):*
  1. **A sobra por lote está superestimada quando há vários lotes.** Em `detectors/validade.ts`, a linha `consumidoAntes += l.quantidade;` desconta o lote anterior **inteiro**, inclusive a parte que vence sem ser usada.
     - Exemplo reproduzido numa cópia do motor: lote A com 66 L vence em 30 dias, lote B com 100 L vence em 120 dias, consumo de 0,9 L/dia.
     - O sistema diz que sobram **58 L** do lote B. O certo é **19 L**: em 120 dias consomem-se 108 L, sendo 27 L do lote A antes de ele vencer e 81 L do lote B.
     - O R$ do card sai cerca de 3 vezes maior. É exatamente o número que o pitch atual manda dizer no palco.
  2. **Lotes vencidos contam como estoque disponível.** Em `stock.ts`, `saldo` e `lotesAtivos` incluem lotes com validade anterior à data de referência, e `estoqueCritico`, `rupturaPrevista` e `coberturaDias` usam esse saldo.
     - Exemplo reproduzido: mínimo de 20 L, um lote vencido de 50 L e um válido de 10 L.
     - O sistema mostra "Produto vencido" e **"Estoque em excesso"**, mas **não** mostra "Estoque crítico", embora o estoque utilizável (10 L) esteja abaixo do mínimo.
     - Na base simulada isso não altera o eval, mas na base oficial pode alterar.
     - **A causa raiz é dupla.** Além de o saldo somar os vencidos, a função `fefo()` em `stock.ts` ordena os lotes só por validade e **não exclui os lotes já vencidos na data da saída**. Toda retirada feita depois do vencimento é descontada primeiro do lote vencido. Reproduzido numa cópia do motor: mínimo de 20 L; lote A com 50 L vence em 01/09/2026; lote B com 40 L vence em 2027; saída de 30 L em 01/10/2026. O motor deixa **A = 20 L e B = 40 L**. O real é A = 50 L (vencidos, parados) e B = 10 L, abaixo do mínimo. Resultado: nenhum "Estoque crítico", e o card "Produto vencido em estoque" mostra 20 L em vez de 50 L, com o R$ subestimado. Em base real, produto com lote vencido e consumo contínuo é o caso comum.
  3. **O alerta nº 1 do painel (score 100) é "Óleo de motor 15W40 · Estoque zerado".** Ele existe porque as saídas superam as entradas em 191 L, um problema de dados plantado de propósito. O sistema manda **comprar** com base num saldo que ele mesmo diz estar errado: o alerta nº 6 é "Registros inconsistentes" do mesmo produto.
  4. **Uma data digitada errada derruba tudo.** Acrescentei uma única saída com data 10/10/2062:
     - a data de referência pulou para 2062;
     - os alertas passaram de 6/13/4 para **25/56/13** (Crítico/Atenção/Monitorar);
     - nenhum aviso apareceu.

     A causa: a data de referência é a maior data dos registros (`index.ts`, nó "normalizacao").
  5. Os limiares de 15 dias (prazo de compra) e 180 dias (excesso) são padrões arbitrários. Estão documentados e são configuráveis, mas ninguém de Agronomia os validou.
  6. O efeito da safra (sementes, corretivos) não é modelado.
  7. **Linhas com problema não viram alerta.** Em `normalizarLinhas` (`normalize.ts`), uma linha com produto vazio, quantidade inválida, tipo não reconhecido ou data inválida é só empurrada para `rejeitadas` e sai da análise. O `detectors/qualidade.ts` só enxerga saldo negativo, unidades diferentes, preço e validade ausentes. Se a banca plantar linhas defeituosas na base oficial (é provável, porque "problemas nos dados" está na lista de situações do desafio), elas aparecem no relatório de importação, mas **não no Painel do dia**, e os alertas do produto afetado não avisam que parte do histórico ficou de fora.
- Por que 16 e não 17: os itens 1 e 2 são erros de cálculo **dentro** do ponto mais forte. Um avaliador de dados que refaça a conta de um card perde a confiança nos outros. A confiança caiu de alta para média porque não auditei os 10 detectores com casos de múltiplos lotes. Os erros 1 e 2 só apareceram com casos construídos para isso, e pode haver outros do mesmo tipo (ver P1-6).

**Validação, testes e utilidade prática: 10/15**
- *A favor:*
  - um loop de avaliação de verdade, com gabarito, 4 rodadas documentadas e mudanças de regra explicadas;
  - robustez medida em 10 sementes;
  - 16 testes unitários;
  - CI com lint, testes, eval, robustez e build;
  - uma limitação honesta escrita em `validacao.md`.
- *Contra:*
  1. **A precisão de 100% é generosa.** O `ground_truth.json` tem 17 anomalias plantadas e mais entradas "aceitáveis". Na base principal, o motor gera **23 alertas**, dos quais **17** estão no gabarito. Pela conta estrita, a precisão é de **17/23 ≈ 74%**.
     - Os 6 "extras" de hoje: `estoque_critico` do óleo, `ruptura_prevista` do KCl, `retirada_anomala` do óleo, `excesso_estoque` do fungicida, `risco_vencimento` da semente de milho e `cadastro_duplicado` da ureia.
     - Alguns são consequência dos problemas plantados (KCl duplicado, óleo com saldo negativo). Outros (fungicida e semente) **precisam de justificativa própria**.
     - Chamar isso de 100% sem explicar convida a pergunta "vocês ajustaram o gabarito ao resultado?".
  2. Os testes não pegaram os 3 erros de vencimento e saldo: não há caso com vários lotes, com lote vencido somado ao saldo nem com saída depois do vencimento.
  3. Os dados foram gerados pela própria equipe. O resultado mostra que o código faz o que a equipe pretendia, não que acerta em dados reais.
  4. A validação com usuário está zerada e a seção da base oficial está vazia.
  5. Faltam testes para os casos hostis: cabeçalhos do edital, data absurda, "saldo inicial", saldo negativo, vários lotes e lote vencido.

**Código, documentação, autoria e IA: 10/15**
- *A favor:*
  - o README segue o Anexo II item por item;
  - o motor é puro, organizado em DAG e sem dependências;
  - os critérios estão documentados;
  - só a chave pública (anon) fica no front;
  - o `IA.md` diz que a solução não chama IA em tempo de execução.
- *Contra:*
  1. **A autoria não aparece.** Os 14 commits são todos de "Armando Giordani", e 13 deles foram feitos entre 19:29:01 e 19:29:07 de 14/10. Junto com o `IA.md`, que declara que o Claude Code gerou motor, telas, testes e docs, isso sugere "código gerado em lote por uma pessoa". O regulamento pede "participação efetiva" e que a equipe "compreenda o código" (seções 2f e 6).
  2. O `IA.md` ainda tem `_(preencher: quem revisou cada parte…)_`, que é exatamente o que a seção 6 exige.
  2b. **O `IA.md` afirma o que o histórico desmente.** A linha 7 declara que o Claude Code gerou "motor de análise, gerador de dados simulados, loop de avaliação". Os limiares (`config.ts`), o gabarito (`data/ground_truth.json`) e as rodadas 1 a 4 do loop chegaram no mesmo lote de 13 commits, feitos entre 19:29:01 e 19:29:07 de 14/10. Mesmo assim, a linha 12 diz "A equipe revisou o código dos detectores e consegue explicar cada critério e limiar" e a linha 14 diz "Os limiares foram ajustados pela equipe a partir dos relatórios do loop". Hoje nenhuma das duas é verdade. Um avaliador de ADS só precisa perguntar "em que commit vocês ajustaram o limiar de 90 dias?". Isso derruba o critério Código/IA e a Clareza de uma vez, e o regulamento trata declaração falsa como fraude (seção 10).
  3. **Não há arquivo `LICENSE`.** O README diz MIT, mas o Anexo I pede licença.
  4. **O Supabase está com RLS totalmente aberto.** Com as políticas `delete using (true)` e `insert with check (true)` (`supabase/migrations/…_inicial.sql`), qualquer pessoa com o link publicado e a chave anon pode apagar todos os dados. O próprio comentário no SQL admite isso.
  5. A dependência `xlsx@0.18.5` (versão do npm) tem vulnerabilidades públicas conhecidas: poluição de protótipo e ReDoS ao ler arquivos maliciosos.
  6. Faltam a tag de entrega, o link do deploy e o link do vídeo.

**Clareza e respostas: 7/10**
- *A favor:* pitch cronometrado, papéis definidos, plano B e um banco de 12 perguntas.
- *Contra:*
  - ainda não houve ensaio;
  - a demo tem 6 passos em 2 min 30 s, o que é apertado;
  - os números do pitch (9 dias, 87%, R$ 57 mil, "6 críticos") são da base simulada e vão mudar;
  - algumas respostas prontas ficam fracas diante das críticas acima: "precisão de 100%" e "a demonstração principal usa a base oficial", que hoje não é verdade.

---

## Parte 2: Pontos fracos e perguntas difíceis da banca

### 2.1 Pontos fracos, ordenados por probabilidade × dano

| # | Fraqueza | Prob. de a banca notar ou de acontecer | Dano | Evidência |
|---|---|---|---|---|
| F1 | Base oficial com cabeçalhos fora da lista de apelidos: a importação rejeita tudo | média-alta (~50%) | **muito alto**: sem demo com os dados do desafio | teste com "Tipo de movimentação" e "Preço de aquisição (R$)" |
| F2 | 1º alerta do painel contraditório (comprar óleo cujo saldo está errado) | alta se a base tiver saldo negativo | alto | `estoqueCritico` não verifica `saldo < 0` |
| F13 | **Sobra do lote superestimada (~3×) com vários lotes; lote vencido conta como estoque; saída depois do vencimento sai do lote vencido** | média-alta (a base oficial deve ter vários lotes por produto e consumo contínuo) | alto: o número em R$ dito no palco pode estar errado e um estoque crítico some | `validade.ts` (`consumidoAntes += l.quantidade`), `stock.ts` (saldo inclui vencidos; `fefo()` não filtra `validade < m.data`; descarte conta como consumo) |
| F14 | Linhas com defeito da base oficial ficam só no relatório de importação e não viram alerta; o produto afetado não perde confiança | média-alta (a banca deve plantar defeitos) | alto: a situação "problemas nos dados" fica sem resposta no Painel | `normalize.ts` (`rejeitadas.push`), `qualidade.ts` |
| F3 | Uma data errada muda a análise toda sem aviso | média (bases reais costumam ter datas erradas) | alto | teste com 2062: 6/13/4 → 25/56/13 |
| F4 | "Saldo inicial", "Estorno" e "Sobra" classificados como entrada ou saída por adivinhação | baixa-média | alto e silencioso | `parseTipo` usa `^(e|…)` e `^(s|…)` |
| F5 | Precisão de 100% contestada (gabarito com "aceitáveis") | alta se houver professor de dados na banca | médio | `ground_truth.json` |
| F6 | Autoria e participação questionadas; `IA.md` com duas frases que o histórico desmente (linhas 12 e 14) | média-alta | **muito alto** se a banca pegar a frase falsa (desclassificação, seção 10); médio-alto se for só a autoria | `git log`, `IA.md` |
| F7 | Ninguém de Agronomia validou | quase certa como pergunta | médio | `validacao.md`, seção 4, vazia |
| F8 | Sazonalidade: "semente parada" | média, se houver agrônomo na banca | médio | `docs/pitch.md` |
| F9 | Dados do link público podem ser apagados por qualquer pessoa | baixa (exige má-fé) | **muito alto no dia** | RLS aberto |
| F10 | Sem LICENSE, `IA.md` incompleto, sem tag | certa (checklist do Anexo I) | baixo-médio | arquivos |
| F11 | Limiares (15, 180, 25%, 3,5) arbitrários | alta como pergunta | baixo, se a resposta for boa | `config.ts` |
| F12 | `xlsx` vulnerável | baixa | baixo | `package.json` |

### 2.2 Perguntas difíceis da banca e o que responder

As respostas supõem que as mudanças P0 foram feitas. Quando a resposta depende de uma mudança, ela aparece entre colchetes. **Os números entre colchetes devem ser copiados do `eval-report.md` regenerado depois das mudanças, nunca digitados de memória.** Regra geral: **admitir o limite primeiro e depois mostrar o que fizeram a respeito.** Bancas penalizam mais a evasiva do que o limite.

1. **"Vocês criaram a base e o gabarito. O recall de 100% não é circular?"**
   "Em parte, sim, e por isso não usamos esse número como prova de acerto. Ele prova que cada detector faz o que diz em 17 situações conhecidas. Para reduzir o viés, rodamos 10 bases geradas com sementes diferentes. Na base oficial, revisamos à mão os 20 primeiros alertas: [X] fazem sentido, [Y] são discutíveis e [Z] são falsos. Anotamos o porquê de cada um no `validacao.md`."

2. **"Precisão de 100% com mais alertas do que problemas plantados?"**
   "Na conta estrita, a precisão é de [valor do eval-report; depois da correção do óleo, 77%: 17 de 22 alertas]. Os outros [5] não estão no gabarito, e mostramos cada um com a justificativa [P0-6]. Alguns são consequência real dos problemas plantados: o 'KCl vai faltar' existe porque o KCl estava cadastrado duas vezes, e some quando unificamos. Outros, como o excesso de fungicida e o risco de vencimento da semente, são alertas que o sistema achou sozinho. Nós os avaliamos como [razoável ou discutível] e explicamos por quê."

3. **"O primeiro alerta manda comprar óleo, mas o saldo é negativo. Vocês confiariam?"**
   [Com P0-3a] "Não confiaríamos, e o sistema também não. Quando as saídas superam as entradas, ele não recomenda compra: mostra um alerta crítico de dados que manda conferir o estoque físico e lançar a entrada que falta." [Sem a correção, a resposta honesta seria "é um defeito que conhecemos", o que é bem pior.]

4. **"E se alguém digitar uma data errada, tipo 2062?"**
   [Com P0-4] "Um grupo pequeno de linhas isolado por mais de um ano do resto da base é separado e aparece num alerta de 'datas suspeitas'; uma pausa de entressafra de alguns meses não é tratada como erro. Se a data de referência ficar depois de hoje, o sistema não decide sozinho: mostra um aviso no topo e pergunta se usamos a última data até hoje ou mantemos. A análise depende só dos dados e dessa escolha, nunca do relógio. A data de referência fica sempre visível e pode ser corrigida à mão."

5. **"Como vocês tratam saldo inicial, devolução, transferência e estorno?"**
   [Com P0-2 e a regra do seletor da P0-1c] "Não adivinhamos. Reconhecemos entrada e saída, inclusive no plural e abreviado. Para qualquer outro valor, a importação **para antes de terminar**, seja uma linha ou mil, e pergunta uma vez por valor: 'Saldo inicial' conta como entrada, como saída ou deve ser ignorado? Adivinhar o sinal de uma movimentação estraga o saldo sem que ninguém perceba."

6. **"Por que 15 dias de prazo de compra e 180 dias para excesso?"**
   "São padrões configuráveis e estão escritos como padrão, não como dado da base. [Depois da validação:] O professor [nome], de Agronomia, achou 15 dias razoável para a região, mas disse que [ex.: semente e calcário são comprados por safra]. Por isso, [o que mudou]."

7. **"Semente parada antes do plantio é problema?"**
   "Nem sempre, e o sistema separa os dois casos [com P1-3]. Se a semente teve retiradas na safra anterior, o alerta de excesso ou de dinheiro parado sai como 'Monitorar', com o aviso 'pode ser estoque de safra: confira o calendário'. Se nunca saiu nada desde a compra, como os 60 sacos de milho parados há 150 dias da nossa base, é estoque encalhado e o alerta mantém o nível. Não mexemos no gabarito para isso. Não modelamos a safra completa, e isso está declarado nos limites."

8. **"Quem escreveu este código? Os commits são todos de uma pessoa, em segundos."**
   "A primeira versão inteira, com motor, telas, testes, gabarito, limiares e as 4 rodadas do loop, foi gerada pelo Claude Code numa sessão do Armando e enviada em 13 commits no mesmo minuto. Por isso eles têm a mesma hora, e é isso que o `IA.md` declara. O que é nosso vem depois: a partir de [data], cada um fez commits da própria parte com a própria conta. Pedro fez [importador e datas], Armando fez [saldo, lotes e métrica] e Leandro fez [deploy e telas de importação]. O `IA.md` lista quem revisou o quê e os erros da IA que achamos, como a sobra por lote e a adivinhação do tipo. Escolham qualquer detector e qualquer um de nós explica a regra e o limiar." (Só digam isso se os colchetes forem verdade no `git log` da tag de entrega. A equipe precisa estar pronta para a última frase: ver o treino na P0-9.)

9. **"O que a IA fez e o que vocês fizeram?"**
   "A IA gerou a primeira versão quase toda: código, documentação, a base simulada, o gabarito, os limiares iniciais e as primeiras rodadas do loop. Escolhemos o desafio e a ideia e conduzimos a sessão. Depois disso, o trabalho foi nosso: revisamos o motor, achamos erros que a IA deixou passar e os corrigimos com testes. Foram [o importador que rejeitava os cabeçalhos do edital, o saldo negativo que pedia compra, a sobra por lote, o lote vencido contado como estoque e as datas absurdas]. Também validamos com [nome], que nos fez mudar [Z]. Os limiares que alteramos estão em [commit/rodada 5]; os outros continuam os padrões da IA, e conseguimos explicar o porquê de cada um. O sistema entregue não chama IA: todo alerta vem de uma regra que sabemos explicar."
   - **Regra para esta resposta e para a 8:** cada colchete tem de apontar para um commit, um teste ou uma linha do `validacao.md` que a banca possa abrir. Se uma correção não foi feita, tirem-na da lista. Nunca digam que definiram limiares ou gabarito que vieram da IA. A banca pode abrir o `git log` no celular durante a resposta.

10. **"Por que não usaram machine learning para prever o consumo?"**
    "Com um ano de histórico e dezenas de produtos, um modelo complexo teria pouca base para aprender e explicaria mal cada alerta. O edital pede justificativa compreensível e diz que uma solução simples e bem fundamentada pode ser melhor. Usamos estatística robusta: mediana e MAD, janelas móveis, FEFO."

11. **"Por que 8 retiradas dão confiança 'alta'?"**
    "É um corte prático: com menos de 4 retiradas, uma única retirada muda a média em mais de 25%. Os cortes estão na tela e podem ser ajustados. O importante é que a baixa confiança aparece escrita no alerta e reduz a prioridade."

12. **"Qual a diferença para uma planilha com fórmulas?"**
    "A planilha mostra o saldo. A AgroSentinela diz o que fazer primeiro e por quê: cruza saldo, ritmo de consumo, lotes e validade, preço histórico e cadastros duplicados, e ordena tudo por urgência e valor. E ela lê a planilha que a fazenda já tem."

13. **"O Seu João tem internet na fazenda? Como ele usaria no dia a dia?"**
    "O motor roda no próprio navegador: depois que a página carrega, a análise não depende de servidor. De manhã, ele abre o Painel do dia, resolve os críticos e [P1-4] gera a lista de compras para mandar ao fornecedor. O modo totalmente offline (PWA) é um próximo passo declarado."

14. **"Qualquer um pode apagar os dados do link público?"**
    [Com P0-7] "No link público, os dados ficam no navegador de cada visitante, então ninguém apaga os dados de outra pessoa. O modo Supabase é opcional e, para uso real, precisaria de login e políticas por usuário. Isso está documentado."

15. **"E se a base oficial vier num formato diferente?"**
    [Com P0-1] "O importador reconhece variações de nome. Quando reconhece uma coluna só por aproximação, pede confirmação. Quando falta uma coluna obrigatória, ou quando mais da metade das linhas falha, bloqueia a importação e deixa escolher a coluna à mão. Um tipo de movimentação desconhecido, mesmo numa linha só, faz o sistema perguntar como tratá-lo antes de concluir. Linhas com defeito avulsas não bloqueiam: entram como alerta de qualidade. Ele nunca importa calado com campos faltando, e uma coluna de preço total nunca é usada como preço unitário."

16. **"O FEFO pode subestimar o risco de vencimento?"**
    "Pode. Se a fazenda não usar primeiro o que vence antes, o risco real é maior do que o mostrado. Está declarado nos limites. Quando a saída informa o lote, usamos o lote informado."

17. **"Por que os pesos do score são 70, 40 e 15?"**
    "O nível vem primeiro e o score só ordena dentro de cada nível. [Com P2-2] Testamos variar os pesos em ±50%, e os 10 primeiros alertas mudaram de posição em no máximo [N] lugares. A ordem não depende de um número mágico."

18. **"Vocês validaram com usuário real?"**
    [Com P0-5] "Com [nome, função] em [data]. Mostramos o painel, e o feedback foi [X]. Mudamos [Y]." Se não conseguirem ninguém, digam exatamente isso e mostrem o roteiro de perguntas pronto. **Nunca inventem uma validação.**

19. **"Refiz a conta deste card de vencimento e não bate. Como vocês calculam a sobra?"**
    [Com P0-3b] "Simulamos o consumo dia a dia na ordem de validade. Um lote só 'consome' a parte que dá para usar antes de vencer, e o que vence sem uso não é descontado do lote seguinte. Uma retirada de consumo feita depois do vencimento sai dos lotes ainda válidos; se só fechar usando lote vencido, o sistema avisa. Um descarte ou devolução faz o contrário: sai primeiro do vencido e não conta como consumo. Lote vencido não conta como estoque disponível. Essas eram falhas da primeira versão: a sobra saía até 3 vezes maior com vários lotes, e o estoque crítico sumia quando havia lote vencido. Achamos os erros com casos de teste pequenos, calculados à mão, que hoje estão na suíte." (Contar isso por iniciativa própria vale mais do que esconder.)

20. **"Plantamos linhas com erro na base. Onde elas aparecem?"**
    [Com P0-1f] "No Painel do dia, como alerta de qualidade, agrupado por motivo e por produto: por exemplo, '12 linhas de Glifosato sem quantidade'. Os alertas desse produto passam a avisar que parte do histórico ficou de fora e perdem confiança. A importação só é bloqueada quando falta uma coluna obrigatória ou quando mais da metade das linhas falha, porque aí o problema é o formato do arquivo, não os dados. A exceção é o tipo de movimentação desconhecido, como 'Saldo inicial': aí o sistema sempre pergunta, porque errar o sinal estraga o saldo."

21. **"O sistema manda descartar o lote vencido. Se eu registrar o descarte, o que acontece?"**
    [Com P0-3b, incluindo a mudança 4] "Uma saída com destino 'descarte', 'devolução' ou 'perda' sai primeiro do lote vencido. Ela não conta como consumo, não vira 'retirada fora do padrão' e não zera o tempo sem uso do 'dinheiro parado'. O card de vencido some e o estoque válido fica intacto. Se alguém informar um lote vencido numa saída para o talhão, o sistema avisa que foi uso de produto vencido." (Só mostrem ao vivo se o teste de ponta a ponta do descarte, na P0-3b, passar no motor inteiro.)

---

## Parte 3: A versão mais forte (mudanças priorizadas)

Ordem de prioridade: **primeiro o que evita perder muitos pontos (falha silenciosa, número errado ou falha no palco), depois o que soma pontos.** Para cada mudança: esforço, critério da rubrica, ganho esperado e como saber que ficou pronta.

### Tabela de esforço (horas-pessoa; a soma de cada linha é a soma das colunas)

Todos os esforços abaixo estão em **horas-pessoa totais**. Quando um item diz "os três", o número é a soma das três pessoas, e a divisão aparece nesta tabela.

| Item | Armando | Pedro | Leandro | Total |
|---|---|---|---|---|
| P0-1 importador: (a) cabeçalhos 2 h, (c) lógica do portão 2 h, fixtures e testes 2 h → Pedro; (b) mapeamento manual 4 h, (c) tela de rejeições agrupadas e seletor 2 h → Leandro | | 6 | 6 | **12** |
| P0-1 (f) linhas rejeitadas viram alerta de qualidade: detector 2 h → Pedro; guardar as rejeitadas no `store` 1 h → Leandro | | 2 | 1 | **3** |
| P0-2 `parseTipo` | | 1,5 | | **1,5** |
| P0-3 saldo, sobra, FEFO, descarte e baixa fora dos detectores de consumo | 6 | | | **6** |
| P0-4 data de referência (motor 3 h; aviso no topo 1 h) | | 3 | 1 | **4** |
| P0-5 validação com Agronomia (2 sessões) | 3 | | | **3** |
| P0-6 métrica honesta | 1,5 | | | **1,5** |
| P0-7 deploy seguro | | | 2 | **2** |
| P0-8 `IA.md` (incluindo corrigir as linhas 12 e 14), LICENSE, `xlsx` | 2,5 | 0,5 | 1,5 | **4,5** |
| P0-9 treino de explicação | 2 | 2 | 2 | **6** |
| P0-10 tag entregável | | | 0,5 | **0,5** |
| **Total P0 (15 a 20/10)** | **15** | **15** | **14** | **44** |
| P1-1 base oficial (4 a 6 h) | | 5 | | 5 |
| P1-2 teste da demo | | 3 | | 3 |
| P1-3 ajuste de safra (com a condição de "teve uso" e o teste de nível) | 2,5 | | | 2,5 |
| P1-4 listas de compras e "usar primeiro" | | | 4 | 4 |
| P1-5 vídeo | | | 4 | 4 |
| P1-6 testes hostis e auditoria | | 4 | | 4 |
| P1-7 acessibilidade | | | 2 | 2 |
| P1-8 várias abas e unidade no cabeçalho (só se a base oficial pedir) | 3 | | | 3 |
| P1-9 pitch, README e checklist com os números finais | 3 | | | 3 |
| **Total P1 (21 a 27/10)** | **8,5** | **12** | **10** | **30,5** |
| Ensaios em 28/10 (3 ensaios + perguntas) | 3 | 3 | 3 | 9 |
| **Total geral** | **26,5** | **30** | **27** | **83,5** |

**Leitura da tabela:** com 2 a 3 h por pessoa por dia, cada um tem de 12 a 18 h entre 15 e 20/10. O P0 pede de 14 a 15 h por pessoa, ou seja, **cabe com 2,5 h/dia; com só 2 h/dia, Armando e Pedro ficam 3 h acima**, e aí vale a ordem de corte abaixo. O total geral (83,5 h) fica abaixo da capacidade (90 a 130 h), e a folga de 6,5 a 46,5 h absorve as estimativas que estourarem. Confiança nas estimativas: média. Itens de tela (P0-1 b e c) costumam estourar em 50%.

**Se o P0 atrasar, cortar nesta ordem** (do que menos perde nota para o que mais perde): P0-10 vira parte do P1; P0-1 (b) fica só com o `<select>` sem destaque de aproximação; P0-6 fica só com a frase honesta no README. P0-1 (f) fica só com o alerta agrupado, sem rebaixar a confiança por produto. **Nunca cortar** P0-1 (a, c), P0-2, P0-3 e P0-4, que evitam número errado ou demo quebrada, nem a correção das linhas 12 e 14 do `IA.md`, que evita a desclassificação.

### P0: fazer até 20/10 (44 h-pessoa; sem isto, a nota pode cair 10 pontos ou mais)

**P0-1. Importador à prova de base desconhecida.** Esforço de 15 h: 12 h para os itens (a) a (c) (6 h Pedro, 6 h Leandro) e 3 h para o item (f) (2 h Pedro, 1 h Leandro); divisão na tabela. Critério: Funcionamento (+3 a +6 pontos no cenário em que o formato oficial difere) e, pelo item (f), Análises (a situação "problemas nos dados" passa a ter alerta).

- **(a) Cabeçalhos normalizados, com a 2ª passada protegida.** Em `src/lib/engine/normalize.ts`:

```ts
function chaveCabecalho(s: string): string {
  return semAcento(String(s)).toLowerCase()
    .replace(/\([^)]*\)/g, " ")               // "Preço de aquisição (R$)" -> sem "(R$)"
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_(de|da|do|das|dos)(?=_)/g, "")  // "tipo_de_movimentacao" -> "tipo_movimentacao"
    .replace(/^_+|_+$/g, "");
}

// Novo campo: preço total da linha. Nunca é confundido com o preço unitário.
// ALIASES.precoTotal = ["preco_total", "valor_total", "custo_total", "total"];
const PROIBIDO_APROX = /(^|_)(total|subtotal|soma|acumulado|saldo)(_|$)/;

export function mapearColunas(cabecalhos: string[]) {
  const mapa: Partial<Record<keyof typeof ALIASES, string>> = {};
  const aproximados = new Set<keyof typeof ALIASES>();
  const usados = new Set<string>();
  const campos = Object.keys(ALIASES) as (keyof typeof ALIASES)[];
  const passada = (casa: (k: string, a: string, c: keyof typeof ALIASES) => boolean, aprox: boolean) => {
    for (const campo of campos) {
      if (mapa[campo]) continue;
      const h = cabecalhos.find((c) => !usados.has(c) && ALIASES[campo].some((a) => casa(chaveCabecalho(c), a, campo)));
      if (h) { mapa[campo] = h; usados.add(h); if (aprox) aproximados.add(campo); }
    }
  };
  passada((k, a) => k === a, false);                                   // 1ª: nome exato
  passada((k, a, c) => a.length >= 3 && k.startsWith(a + "_")          // 2ª: "preco_unitario_pago"
    && (c === "precoTotal" || !PROIBIDO_APROX.test(k)), true);         // nunca "preco_total" como preço unitário
  return { mapa, aproximados };
}
```

  Testado com 4 conjuntos de cabeçalhos:
  - os nomes exatos do edital: todos os 13 campos mapeados, sem aproximação;
  - "Preço total (R$)" sozinho: vai para `precoTotal`, **não** para `preco`;
  - "Preço unitário pago (R$)" junto com "Preço total (R$)": cada um vai para o campo certo, e o unitário fica marcado como aproximado;
  - uma coluna "Saldo": não é mapeada.

  Em `normalizarLinhas`: se `preco` não existir e `precoTotal` existir, calcular `preco = precoTotal / quantidade` e marcar a origem como "derivado do total" no relatório de importação.
- **(b) Mapeamento manual na tela Importar.** Ao lado de cada campo de `CAMPOS`, um `<select>` com os cabeçalhos do arquivo, já preenchido com o mapeamento automático. Os campos em `aproximados` aparecem em amarelo com "mapeado por aproximação: confirme". `normalizarLinhas(linhas, mapaManual?)` passa a aceitar o mapa escolhido. **Esta é a rede de segurança real**, porque nenhuma lista de apelidos cobre tudo.
- **(c) Portão de importação que falha alto, com saída, mas sem esconder os problemas de dados.** O portão distingue **erro de formato** (o arquivo foi lido errado) de **problema nos dados** (o arquivo foi lido certo, mas algumas linhas têm defeito, que é uma das situações que o desafio manda detectar).
  - **Bloqueia** com um quadro vermelho "Importação bloqueada: [motivo]" só nos casos de erro de formato:
    - falta um campo obrigatório (produto, quantidade, tipo, data);
    - há um campo aproximado ainda não confirmado;
    - **mais de 50%** das linhas foram rejeitadas, o que quase sempre indica coluna mapeada errado ou formato de data/tipo não previsto.
  - **Pergunta antes de concluir, seja qual for a porcentagem:** se houver **qualquer valor de tipo não reconhecido** (ex.: "Saldo inicial", "Estorno", "Ajuste"), a importação não termina sem passar pelo seletor de tipo. Basta uma linha. O motivo: um tipo desconhecido não é "linha com defeito", é um **sinal** que falta decidir. Uma linha de "Saldo inicial" por produto dá de 2% a 5% da base, abaixo de qualquer limiar de porcentagem. Se ela caísse no caminho que não bloqueia, todos os produtos perderiam o saldo de abertura. Muitos ficariam com saldo negativo, a P0-3a suprimiria o "Estoque crítico" de todos eles e o Painel viraria uma lista de alertas de qualidade. O seletor mostra, para cada valor distinto, quantas linhas ele tem e 3 exemplos, com as opções "tratar como: entrada / saída / ignorar". **Não há opção pré-marcada.** "Ignorar" mantém as linhas como alerta de qualidade (item f). A decisão vai para o relatório de importação e fica salva para a reimportação.
  - **Não bloqueia** quando de 0 a 50% das linhas são rejeitadas por outros motivos (quantidade vazia, data inválida, produto vazio), depois que o seletor de tipo foi respondido. A importação segue, aparece um aviso amarelo "N linhas (X%) ficaram fora da análise; elas aparecem como alerta de qualidade no Painel" e as linhas viram alertas (item f). Acima de 5%, o aviso fica em destaque, porque pode ser formato e não dado.

  Para desbloquear (casos de erro de formato):
  - as rejeições aparecem **agrupadas por motivo e valor** (ex.: "312 linhas com data '2026.10.03'");
  - o mesmo seletor de tipo, se ainda houver valor de tipo pendente;
  - ou o usuário marca "importar mesmo assim (entendo que N linhas ficam de fora)". Mesmo assim, as linhas de fora viram alerta (item f).

  Também avisar quando `preco`, `validade` ou `estoqueMinimo` não forem encontrados: "sem esta coluna, o detector X não roda".
- **(d) e (e)** (várias abas do Excel e unidade no cabeçalho) saíram do P0 para caber no prazo: viraram a **P1-8**. No P0 fica só o aviso: se o arquivo tiver mais de uma aba, mostrar "este arquivo tem N abas; só a primeira foi lida" (15 minutos, dentro da parte do Leandro). Falha alta em vez de perda silenciosa.
- **(f) Linhas rejeitadas viram alerta de qualidade, em vez de sumirem.** Esforço de 3 h (2 h Pedro, 1 h Leandro).
  - O `store` guarda as `rejeitadas` da última importação junto com as movimentações (Leandro) e passa para o motor: `analisar(movs, { ...cfg, rejeitadas })`. Cada rejeitada precisa levar o `produto` bruto, quando houver, além de `linha` e `motivo`.
  - Em `detectors/qualidade.ts`, um detector novo `linhasRejeitadas` (Pedro): agrupa por motivo e produto e gera um alerta `qualidade_dados` por grupo, por exemplo "12 linhas de Glifosato sem quantidade válida (linhas 140, 152, …)". Nível **Atenção**; vira **Crítico** quando o produto do grupo tem algum alerta de estoque, porque aí o número desse alerta pode estar errado. Linhas sem produto formam um só alerta "N linhas sem produto".
  - Nos alertas de um produto com linhas rejeitadas, a confiança cai um nível e o motivo diz "N linhas deste produto ficaram fora da análise".
  - A ação do alerta: "Corrija a linha na planilha e reimporte, ou registre a movimentação certa".
  - A base simulada não tem linhas rejeitadas, então o eval não muda. Para medir, criar uma variante com 6% de linhas defeituosas (ver fixture 5).
- **Pronto quando:** os testes passam com 7 arquivos em `tests/fixtures/`:
  1. nomes exatos do edital ("Tipo de movimentação", "Preço de aquisição (R$)", "Destino da retirada");
  2. abreviações ("Qtd.", "Dt", "Mov.");
  3. tipos no plural e abreviados ("Entradas", "Saídas", "Ent.", "Uso no talhão 3");
  4. só "Preço total (R$)", que tem de gerar o preço unitário derivado, e não o total como preço;
  5. 6% de linhas defeituosas (quantidade vazia, data "31/02/2026", tipo "???"): **importa**, mostra o aviso amarelo e gera os alertas de qualidade agrupados, com a confiança do produto rebaixada;
  6. 60% de linhas inválidas (ex.: datas em formato não previsto): **bloqueia**, com o motivo;
  7. **uma linha "Saldo inicial" por produto (cerca de 3% da base)**: a importação **não termina** sem o seletor. Escolhido "entrada", nenhum produto fica com saldo negativo por causa disso, e o "Estoque crítico" esperado aparece. Sem este teste, o portão de porcentagem deixa passar o caso mais comum de base real.

**P0-2. `parseTipo` sem adivinhação, mas tolerante a plural, abreviação e hífen.** Esforço de 1,5 h (Pedro). Critério: Funcionamento e Análises (evita erro silencioso).

Cuidado: `normalizarNome` preserva "-" e "/". Por isso a função quebra o texto também nesses caracteres, senão "Entrada-NF" e "Saída/uso" seriam rejeitados (o código atual aceita os dois). E ela olha **todas** as palavras: se aparecerem uma palavra de entrada e uma de saída, devolve `null`, senão "E/S" viraria entrada.

Cuidado 2: as letras soltas "e" e "s" (e "in"/"out") só valem quando são **o valor inteiro**. No meio de uma frase, "e" é conectivo ("Retirada p/ consumo e aplicação") e "s" é abreviação de "sem" ("Entrada s/ NF"). Se contassem como palavra de entrada ou saída, essas duas frases comuns seriam rejeitadas.

```ts
const CURTO_ENT = new Set(["e", "in"]);   // só valem sozinhos: "E", "IN"
const CURTO_SAI = new Set(["s", "out"]);  // só valem sozinhos: "S", "S.", "OUT"
const ENTRADA = new Set(["ent", "entr", "entrada", "entradas", "compra", "compras",
  "recebimento", "recebimentos"]);
const SAIDA = new Set(["sai", "saida", "saidas", "retirada", "retiradas", "consumo", "consumos",
  "baixa", "baixas", "uso", "usos", "requisicao", "requisicoes"]);

export function parseTipo(v: unknown): TipoMov | null {
  const tokens = normalizarNome(String(v ?? ""))
    .split(/[\s\-/]+/)                          // "Entrada-NF", "Saída/uso", "Saída - consumo"
    .map((t) => t.replace(/[.,:;]+$/, ""))      // "Ent." -> "ent"
    .filter(Boolean);
  if (tokens.length === 1) {                    // valor de uma palavra só
    const t = tokens[0];
    if (ENTRADA.has(t) || CURTO_ENT.has(t)) return "entrada";
    if (SAIDA.has(t) || CURTO_SAI.has(t)) return "saida";
    return null;
  }
  const temEnt = tokens.some((t) => ENTRADA.has(t)); // "e" e "s" soltos são ignorados aqui
  const temSai = tokens.some((t) => SAIDA.has(t));
  const p = tokens[0];
  if (ENTRADA.has(p) && !temSai) return "entrada";
  if (SAIDA.has(p) && !temEnt) return "saida";
  return null; // "saldo inicial", "estorno", "E/S", "Entrada/Saída": decisão do usuário (P0-1c)
}
```

- **Testado (script isolado com uma cópia fiel do `normalizarNome` do projeto) com 41 valores, 41 corretos:**
  - **entrada:** "Entrada", "E", "Ent.", "Compra", "Compras", "Entradas", "Entrada de NF", "ENTRADA", "Entrada-NF", **"Entrada s/ NF", "Entrada c/ NF"**, "IN";
  - **saída:** "Saída", "S", "S.", "Saídas", "Retiradas", "Retirada p/ talhão", "Uso no talhão 3", "Saída - consumo", "Saída-consumo", "Saída/uso", **"Retirada p/ consumo e aplicação", "Saída s/ requisição", "Saída e retorno ao talhão 2"**, "OUT";
  - **`null` (vai para a decisão do usuário):** "Saldo inicial", "Estorno", "Sobra", "Inventário", "Ajuste", "Devolução", "Transferência", "E/S", "E S", "Entrada/Saída", "Entrada e saída", "Saída (estorno de entrada)", "Compra e consumo", vazio e `null`.
  - Os valores em negrito são os que uma versão anterior desta regra (com "e" e "s" valendo em qualquer posição) rejeitava por engano.
- Motivo da rejeição: `tipo "${valor}" não reconhecido (aceitos: entrada/saída)`.
- Se a base oficial usar "Saldo inicial", tratar como **entrada por decisão explícita** (seletor da P0-1c, registrada no README), e não por acidente.
- **Rede de segurança contra o portão travar o palco:** o seletor da P0-1c decide **por valor distinto**, não por linha. Se a base inteira usar uma forma não prevista, são 2 cliques ("X = entrada", "Y = saída"), e a decisão fica salva para a reimportação. E o ensaio com a base oficial (P1-1) acontece dias antes do palco.
- **Pronto quando:** um teste cobre os 41 valores acima. A base simulada só usa "entrada" e "saida", então o eval não deve mudar. Rodem mesmo assim para confirmar.

**P0-3. Saldo, sobra e descarte confiáveis.** Esforço de 6 h (Armando; inclui a regra de baixa, o botão de descarte e 1 h para a mudança 4 e o teste de ponta a ponta). Critério: Análises (+1 a +2) e Clareza (evita as perguntas 3 e 19).

- **(a) Saldo negativo não gera ordem de compra.** Em `detectors/estoque.ts`, no início de `estoqueCritico`:
  ```ts
  if (p.saldo < -1e-6) return []; // saldo negativo = registro faltando; o alerta crítico de qualidade assume o caso
  ```
  Em `detectors/qualidade.ts`, completar o texto do saldo negativo: "Confira o estoque físico antes de comprar; as estimativas deste produto não são confiáveis até a correção."
- **(b) Sobra por lote e lote vencido.** São três mudanças, e as três são necessárias. Sem a primeira, a segunda mede a coisa errada.
  - **1. Uma saída de consumo não pode sair de lote já vencido (causa raiz), mas um descarte tem de sair primeiro dele.** O próprio card "Produto vencido em estoque" manda "separar o lote, verificar descarte/devolução e corrigir o saldo". O usuário faz isso registrando uma saída com destino "descarte", e no formulário o lote é opcional. Se toda saída passasse a sair primeiro do lote válido, esse descarte consumiria o estoque bom, manteria o vencido e dispararia um alarme falso. Por isso a regra depende do destino. Em `stock.ts`, no laço da saída (`for (const l of alvo ? [alvo, ...fefo()...] : fefo())`):
    ```ts
    // config.ts (configurável): destinos que são baixa, não consumo
    // DESTINO_BAIXA = /descart|devolu|perda|vencid|inutiliz/
    // declarar junto dos outros contadores: let saidaDeVencido = 0, usoDeVencido = 0, baixas = 0;
    const valido = (l: LoteSaldo) => !l.validade || l.validade >= m.data;
    const destino = normalizarNome(m.destino ?? "");
    const baixa = cfg.destinoBaixa.test(destino)                 // destino "Descarte", "Devolução ao fornecedor"...
      || (!!alvo && !valido(alvo) && !destino);                  // lote vencido informado e sem destino: é baixa
    const ordem = fefo();
    const validos = ordem.filter((x) => x !== alvo && valido(x));
    const vencidos = ordem.filter((x) => x !== alvo && !valido(x));
    const fila = [
      ...(alvo ? [alvo] : []),                                    // lote informado tem prioridade
      ...(baixa ? [...vencidos, ...validos] : [...validos, ...vencidos]),
    ];
    for (const l of fila) {
      if (resta <= 1e-9) break;
      const usa = Math.min(l.quantidade, resta);
      if (!valido(l) && !baixa) {
        if (l === alvo) usoDeVencido += usa;      // informaram um lote vencido indo para o talhão
        else saidaDeVencido += usa;               // consumo que só fecha usando lote vencido
      }
      l.quantidade -= usa;
      resta -= usa;
    }
    if (baixa) baixas += qtd;                     // e NÃO somar em consumoDiario/saidasPorDia
    // devolver saidaDeVencido, usoDeVencido e baixas no ProdutoAnalise
    ```
    - `montarProduto` hoje recebe só `(key, movs, dataRef)`; passa a receber também a regex `destinoBaixa` da configuração. `normalizarNome` já é importado em `stock.ts`.
    - **Baixa não é consumo.** Hoje, toda saída entra em `consumoDiario` e `saidasPorDia`. Um descarte de 50 L inflaria o ritmo de consumo e encurtaria a cobertura. Com a mudança, a saída de baixa reduz o saldo, mas fica fora da taxa de consumo. **Isso não basta:** outros três lugares leem as saídas por fora dessas séries (ver a mudança 4).
    - Em `detectors/qualidade.ts`:
      - se `saidaDeVencido > 0`: Atenção, "N L retirados para consumo só fecham usando lote vencido: houve uso de produto vencido ou falta registrar uma entrada";
      - se `usoDeVencido > 0`: Atenção, "N L do lote X, vencido em DD/MM, foram registrados com destino [talhão]: se foi descarte, corrija o destino; se foi aplicado, foi uso de produto vencido". Aqui o alerta é verdadeiro, porque o próprio registro diz que o vencido foi para o campo.
    - Em `detectors/validade.ts`, a ação do card "Produto vencido em estoque" passa a dizer: "Separe o lote e registre a saída com destino **Descarte** ou **Devolução** (informe o lote X)". No formulário Registrar (`src/app/movimentacoes/page.tsx`), um botão "Descarte de vencido" preenche o destino. Assim, a ação recomendada e a regra do motor usam a mesma palavra.
    - **Limite declarado:** uma devolução de produto **válido** sem lote informado sai primeiro do vencido. Mitigação: o formulário pede o lote quando o destino é de baixa.
  - **2.** Em `detectors/validade.ts`, trocar `consumidoAntes += l.quantidade;` por:
    ```ts
    consumidoAntes += usado; // só o que foi de fato consumido antes de o lote vencer
    ```
  - **3.** Em `stock.ts`, `montarProduto` passa a calcular o **saldo utilizável**:
    ```ts
    const vencido = lotesAtivos.filter((l) => l.validade && l.validade < dataRef).reduce((t, l) => t + l.quantidade, 0);
    const saldoUtil = saldo - vencido;
    // retornar saldoUtil no ProdutoAnalise e usar Math.max(0, saldoUtil) em coberturaDias
    ```
    `estoqueCritico`, `rupturaPrevista` e `excessoEstoque` passam a comparar `p.saldoUtil` com o mínimo. `saldo` continua existindo para o alerta de qualidade e para o alerta "Produto vencido em estoque".
  - **4. A baixa tem de sair de todo lugar que lê "saída como consumo", e não só das séries diárias.** O código atual tem três leitores que não passam por `consumoDiario`:
    - `avaliarSaidas` (`detectors/consumo.ts`, linha 24) filtra `p.movimentacoes` por `m.tipo === "saida"` direto. Dele dependem `retiradaAnomala` e `consumoCrescente`. Um descarte de 50 L num produto com retiradas de 3 a 5 L passa no z robusto, no múltiplo da mediana e em 1,5 vez a maior anterior, e vira "Retirada fora do padrão" com a ação "confira com o responsável". O sistema estaria acusando quem seguiu a recomendação dele mesmo;
    - `montarProduto` (`stock.ts`, linhas 78 e 79) faz `totalSaidas++` e `ultimaSaida = m.data` em toda saída;
    - `altoValorParado` (`detectors/financeiro.ts`, linha 45) usa `p.ultimaSaida` como referência. Um descarte zeraria `diasSemSaida` e apagaria o "Dinheiro parado" de um item da curva A ou B parado há 150 dias.

    A correção é marcar a baixa **uma vez**, num só lugar, e fazer os três leitores usarem a marca:
    ```ts
    // normalize.ts ou stock.ts: uma função só, usada pelo laço de lotes e pelos detectores
    export const ehBaixa = (m: Movimentacao, cfg: Config) =>
      m.tipo === "saida" && cfg.destinoBaixa.test(normalizarNome(m.destino ?? ""));
    // (o caso "lote vencido informado e sem destino" depende do estado dos lotes; o laço da
    //  mudança 1 grava m.baixa = true nesse caso, e ehBaixa passa a checar também m.baixa)

    // stock.ts, montarProduto, no ramo da saída:
    if (!baixa) { totalSaidas++; ultimaSaida = m.data; /* + consumoDiario, saidasPorDia */ }
    else { totalBaixas++; ultimaBaixa = m.data; }

    // detectors/consumo.ts, avaliarSaidas:
    .filter((m) => m.tipo === "saida" && !ehBaixa(m, cfg) && fatorConversao(m.unidade, p.unidade) !== null)
    ```
    - `altoValorParado` não muda: com `ultimaSaida` só de consumo, o descarte não reinicia a contagem. A mensagem pode citar à parte "houve baixa de N em DD/MM".
    - Para não esquecer um quarto leitor, rodem `grep -rn "tipo ===\|ultimaSaida\|totalSaidas" src` e decidam caso a caso. Conferi no código de hoje. O único filtro explícito por saída está em `consumo.ts:25`. O `stock.ts:67` trata como saída tudo o que não é entrada. `ultimaSaida` é lida em `financeiro.ts:45` e `:57` e na ficha do produto (`src/app/produtos/[key]/page.tsx:71`, "Última retirada"). Na ficha, mostrar só o consumo é o comportamento certo.
  - **Verificado numa cópia do motor:**
    - dois lotes (66 L vence em 30 dias, 100 L vence em 120 dias, 0,9 L/dia): a sobra do lote B passa de 58 L para **19 L**, o valor correto;
    - mínimo de 20 L com 50 L vencidos e 10 L válidos: passa a gerar "Estoque crítico";
    - **saída depois do vencimento** (lote A 50 L vence 01/09/2026, lote B 40 L vence em 2027, saída de 30 L em 01/10/2026): antes da mudança 1, A = 20 e B = 40; depois, **A = 50 e B = 10**, `saidaDeVencido = 0`, e com o saldo utilizável (60 − 50 = 10 < 20) sai "Estoque crítico". O card de vencido passa a mostrar 50 L;
    - mesma base com saída de 60 L: B zera, A fica com 30 L e `saidaDeVencido = 20`, o que dispara o alerta de qualidade;
    - saída de 30 L **antes** do vencimento (01/08/2026): continua saindo do lote A (A = 20, B = 40), como deve;
    - na base simulada, com as mudanças 1 e 2, o eval continua com **recall de 100%** e 23 alertas (rodado numa cópia do projeto; com a P0-3a, cai para 22).
  - **Verificado num script isolado que reproduz o laço acima** (lote A 50 L vence 01/09/2026, lote B 40 L vence em 2027, mínimo 20 L):

    | Saída em out/2026 | Lotes depois | Alerta de vencido usado | Conta como consumo? |
    |---|---|---|---|
    | 30 L, destino "Talhão 3", sem lote | A = 50, B = 10 | nenhum | sim |
    | 60 L, destino "Talhão 3", sem lote | A = 30, B = 0 | `saidaDeVencido` = 20 | sim |
    | **50 L, destino "Descarte", sem lote** (o caso que quebraria sem a regra de baixa) | **A = 0, B = 40** | nenhum | **não** |
    | 50 L, lote A, destino "descarte" | A = 0, B = 40 | nenhum | não |
    | 50 L, lote A, sem destino | A = 0, B = 40 | nenhum | não |
    | 20 L, lote A, destino "Talhão 1" | A = 30, B = 40 | `usoDeVencido` = 20 (verdadeiro) | sim |
    | 60 L, destino "Descarte", sem lote | A = 0, B = 30 | nenhum | não |

    **O que esta tabela prova e o que não prova.** O script isolado só reproduz o laço de lotes: confere quanto sai de cada lote e se a saída entra na taxa de consumo. Ele mostra que, no descarte de 50 L, o card "Produto vencido" some e o saldo utilizável fica em 40 L. **Ele não roda os detectores.** Sem a mudança 4, o mesmo descarte ainda vira "Retirada fora do padrão" e pode apagar um "Dinheiro parado". Uma versão anterior desta proposta dizia que "nenhum alarme falso aparece", e isso estava errado. Só o teste de ponta a ponta abaixo, rodando `analisar` no motor inteiro, prova o fluxo. A base simulada não tem nenhum destino que case com `DESTINO_BAIXA` (0 linhas, conferido no `data/simulado.csv`), então esta parte não muda o eval.
- **Pronto quando:**
  - existe o teste "saldo negativo gera só o alerta de qualidade, sem recomendação de compra";
  - existe o teste "dois lotes: sobra do segundo = 19 L";
  - existe o teste "lote vencido não conta para o estoque mínimo";
  - existe o teste "**saída depois do vencimento sai do lote válido**" com os números acima (A = 50, B = 10, Estoque crítico). Sem ele, o teste anterior passa e o erro continua: ele não tem saída depois do vencimento;
  - existe o teste "saída que só fecha com lote vencido gera alerta de qualidade";
  - existe o teste "**descarte do vencido sem lote zera o vencido, preserva o válido, não gera alerta e não entra no consumo**" (linha em negrito da tabela). Sem ele, a correção pode quebrar o fluxo de reanálise que vai ao palco;
  - existe o teste de **ponta a ponta no `analisar`** com o contraexemplo da mudança 4: produto com 10 retiradas de 3 a 5 L para o talhão e um descarte de 50 L do lote vencido. Depois do descarte, **não** pode haver `retirada_anomala` nem `consumo_crescente`. Uma variante do mesmo produto, da curva A, sem retirada de consumo há 150 dias, tem de **continuar** com "Dinheiro parado" depois do descarte;
  - existe o teste "lote vencido informado com destino de talhão gera `usoDeVencido`";
  - o eval foi regenerado. Na cópia, ele deu 22 alertas, dos quais 17 estão no gabarito.

**P0-4. Data de referência protegida contra datas absurdas, sem depender do relógio.** Esforço de 4 h (3 h Pedro no motor, 1 h Leandro no aviso). Critério: Análises e Funcionamento.

Princípio: **o motor só exclui o que é inequivocamente erro, e o resultado depende só dos dados e de escolhas registradas, nunca de `new Date()`.** O que é ambíguo (datas depois de hoje) vira pergunta ao usuário, não exclusão automática. Assim, a mesma base dá os mesmos números no vídeo de 26/10 e no palco de 29/10, e uma pausa de entressafra não é tratada como erro.

- Em `index.ts`, no nó "normalizacao". Acrescentar `datasSuspeitas: Movimentacao[]` e `origemCorte: "isolada" | "escolhida"` ao `Estado`.

```ts
const LACUNA_ERRO_DIAS = 365; // em config.ts: lacuna que nenhuma entressafra explica

executar: (s) => {
  const datas = s.entrada.map((m) => m.data).sort();
  const n = datas.length;
  if (!n) { s.dataRef = s.cfg.dataReferencia ?? "1970-01-01"; s.datasSuspeitas = []; return "0 movimentações"; }
  let limite = datas[n - 1];
  // Só a cauda (até 5% das linhas, no mínimo 1) isolada do resto por mais de 1 ano é tratada como erro.
  // SEM break: percorre a cauda inteira e fica com a lacuna MAIS ANTIGA. Com erros diferentes
  // entre si (2045 e 2062, ou 2062, 2602 e 3026), parar na primeira lacuna a partir do fim
  // deixaria 2045 como data de referência.
  for (let i = n - 1; i > 0 && n - i <= Math.max(1, n * 0.05); i--) {
    if (diasEntre(datas[i - 1], datas[i]) > LACUNA_ERRO_DIAS) limite = datas[i - 1];
  }
  const validas = datas.filter((d) => d <= limite);
  s.dataRef = s.cfg.dataReferencia ?? validas[validas.length - 1];
  // Calculado contra a dataRef FINAL (inclusive a escolhida pelo usuário), e não contra `limite`:
  // é exatamente o complemento do filtro `m.data <= dataRef` de montarProduto. Toda linha que
  // a análise descarta aparece no alerta; nenhuma some calada.
  s.datasSuspeitas = s.entrada.filter((m) => m.data > s.dataRef);
  s.origemCorte = s.cfg.dataReferencia ? "escolhida" : "isolada";
  return `${n} movimentações; data de referência ${s.dataRef}` +
    (s.datasSuspeitas.length ? `; ${s.datasSuspeitas.length} depois da data de referência, fora da análise` : "");
},
```

- **Na tela (não no motor):** se `dataRef` for posterior a hoje, mostrar no topo um aviso amarelo fixo: "A data de referência (DD/MM/AAAA) é posterior a hoje. N linhas têm data futura. [Usar a última data até hoje] [Manter: a base é simulada/projetada]". A escolha grava `cfg.dataReferencia` e aparece no relatório de importação. O relógio só decide **se o aviso aparece**, nunca o número.
- **Para a demo e o vídeo:** fixar `cfg.dataReferencia` da base oficial no arquivo de configuração da demo, para que o vídeo e o palco mostrem exatamente os mesmos números.
- Expor `datasSuspeitas` na `Analise` e criar um alerta de qualidade (nível Atenção) que lista as linhas, com o título conforme a origem: "Datas isoladas fora do período da base" (corte automático) ou "N linhas depois da data de referência escolhida (DD/MM/AAAA)" (escolha do usuário ou da config da demo). **Sem esse alerta, a correção vira uma falha silenciosa nova**, porque `montarProduto` já descarta `data > dataRef` sem avisar. Como o filtro do alerta é o complemento exato do filtro de `montarProduto`, as duas listas não podem divergir.
- O guarda para base vazia evita lançar erro com data inválida.
- **Testado num script isolado** (com o `diasEntre` real do projeto):

  | Caso | Data de referência | Excluídas | Aviso "posterior a hoje" |
  |---|---|---|---|
  | base limpa (2.313 linhas, out/2025 a out/2026) | última data real | 0 | não |
  | 1 linha de 2062 em 2.313 | última data real | 1 | não |
  | 4 linhas de 2062 em 300 | última data real | 4 | não |
  | **2 erros diferentes, 2045 e 2062, em 300** | **última data real** (com o `break` da versão anterior, ficava em 2045) | 2 | não |
  | **3 erros diferentes, 2062, 2602 e 3026, em 300** | **última data real** | 3 | não |
  | 1 linha de 2062 em 20 | última data real | 1 | não |
  | **entressafra: registros até junho, pausa de julho a setembro, outubro com 3% das linhas** | **outubro (correta)** | **0** | não |
  | base fictícia toda em 2028 | dez/2028 | 0 | sim (o usuário escolhe "Manter") |
  | base fictícia em 2028 + 4 linhas de 2062 | dez/2028 | 4 | sim |
  | **base jan. a dez./2026 aberta em 26/10 e em 29/10** | **30/12/2026 nas duas datas (mesmos números)** | 0 | sim, nas duas |
  | 1 linha com 2027 em vez de 2026 | mar/2027 (errada) | 0 | **sim**: o aviso pede a decisão |
  | mesma base, depois de o usuário clicar "Usar a última data até hoje" | 10/10/2026 (escolhida) | **1, listada no alerta** "1 linha depois da data de referência escolhida" | não |

  A última linha decorre direto do código (o filtro do alerta é `m.data > s.dataRef`); uma versão anterior desta proposta calculava as suspeitas contra `limite` e, nesse caso, deixava a linha de 2027 sumir sem alerta.

- **Limites conhecidos, para documentar:**
  - um erro de digitação que caia dentro do período, ou a menos de 1 ano do fim da base (ex.: 2027 em vez de 2026), não é excluído automaticamente. Se cair depois de hoje, o aviso no topo pega; se cair antes de hoje, a defesa é a data de referência visível e editável;
  - um grupo de erros com mais de 5% das linhas também não é excluído. Numa base pequena (menos de 40 linhas), a cauda é de 1 linha só, então um segundo erro não é excluído. Nos dois casos, se a data cair depois de hoje, o aviso no topo pega.
- **Pronto quando:** existem os testes "4 de 300 linhas em 2062", "**2045 e 2062 na mesma base: a data de referência fica na última data real**", "entressafra de 3 meses não exclui nada", "**com `dataReferencia` escolhida, toda linha posterior aparece no alerta**" (invariante: `datasSuspeitas.length` = número de linhas descartadas por `montarProduto`) e "o motor dá o mesmo resultado com qualquer data do relógio" (rodar `analisar` duas vezes, simulando hoje = 26/10 e hoje = 29/10, e comparar os alertas).

**P0-5. Uma sessão de validação com Agronomia até 20/10 e outra até 25/10.** Esforço de 3 h (Armando). Critério: Validação (+2) e Aderência (+1 a +2).
- Procurar um professor ou aluno de Agronomia do próprio campus. A coordenação de ADS organiza o evento com Agronomia, então peçam indicação.
- Sessão de 20 minutos com o notebook. Usar as 5 perguntas que já estão em `validacao.md`, mais duas:
  - "Que alerta daqui você ignoraria?"
  - "Este número de sobra do lote faz sentido?"
- Registrar na tabela da seção 4: data, nome e função (com permissão), o que foi mostrado, o feedback **literal** e o que mudou.
- **Pelo menos uma mudança feita por causa do feedback** tem de aparecer no código ou num limiar.
- Se ninguém estiver disponível, registrar a tentativa e a data. Nunca preencher com feedback inventado: seria fraude pela seção 10 do regulamento.

**P0-6. Métrica honesta no eval.** Esforço de 1,5 h. Critério: Validação (+1) e Clareza.
- Em `scripts/eval-lib.ts`, calcular também a `precisaoEstrita`: dos alertas gerados, quantos estão no `gabarito` (ignorando `aceitaveis`). Publicar as duas medidas no `eval-report.md`, com a lista dos alertas fora do gabarito e **uma frase de justificativa por item**.
- Os números mudam a cada correção: hoje são 17/23 (74%); depois da P0-3, 17/22 (77%), conforme rodei numa cópia; e depois da P1-3 podem mudar de novo. Por isso, **README, pitch e respostas citam o número do `eval-report.md` da tag de entrega**, copiado no dia 27/10. Nada de número fixo escrito antes.
- Frase sugerida para o README: "recall de 100%; precisão de [X]% na conta estrita e de [Y]% contando alertas extras que revisamos e justificamos um a um".

**P0-7. Link online seguro.** Esforço de 2 h (Leandro). Critério: Funcionamento (+2) e Código (+1).
- Deploy na Vercel **sem** as variáveis do Supabase. O app já cai para o modo local (`usaSupabase` falso), e cada avaliador fica com a sua cópia no navegador. Ninguém apaga a demo de ninguém.
- Se quiserem mostrar o Supabase, usar outro projeto e remover as políticas `update` e `delete` da tabela `movimentacoes`.
- Testar em aba anônima e no celular. Pôr o link no README.

**P0-8. `IA.md` verdadeiro, autoria visível.** Esforço de 4,5 h-pessoa no total (Armando 2,5 h: `IA.md`, inclusive a correção das linhas 12 e 14, e LICENSE; Pedro 0,5 h e Leandro 0,5 h: revisar a parte deles no `IA.md`; Leandro mais 1 h: `xlsx`). Critério: Código, documentação e IA (+2). **É o primeiro commit a fazer (15/10), antes de qualquer código**, porque é o único item cujo erro pode desclassificar.
- **Corrigir hoje as duas frases que o histórico não sustenta.** Elas não podem ficar no repositório nem um dia a mais, porque a versão entregue pode ser qualquer commit.
  - Linha 12, hoje "A equipe revisou o código dos detectores e consegue explicar cada critério e limiar". Trocar por: "Critérios e limiares foram propostos pelo Claude Code na geração inicial. A revisão pela equipe está registrada na tabela acima, com quem revisou cada parte e em que data." Só voltem a escrever "consegue explicar cada critério" depois do treino da P0-9 e com os nomes de quem revisou cada detector.
  - Linha 14, hoje "Os limiares foram ajustados pela equipe a partir dos relatórios do loop". Trocar por: "As rodadas 1 a 4 do loop e os ajustes de limiar descritos nelas foram feitos na sessão de geração assistida. Os ajustes feitos pela equipe depois dela estão em `docs/validacao.md` a partir da rodada 5, com o commit de cada um."
  - Linha 7: manter. Ela já é verdadeira, e acrescentar "gabarito (`data/ground_truth.json`) e limiares iniciais (`config.ts`)" na coluna "Partes apoiadas".
  - **Regra geral:** toda frase do `IA.md`, do README e das respostas 8 e 9 sobre o que a equipe fez tem de apontar para um commit, um teste ou uma linha do `validacao.md`. Se não houver evidência, a frase sai.
- Daqui em diante, **cada integrante faz commits da própria parte, com a própria conta**. Ninguém faz commit pelo outro. Commits pequenos e descritivos, com as correções P0 divididas:
  - Pedro: P0-1 (a, lógica do portão c, fixtures), P0-2, P0-4 (motor);
  - Armando: P0-3, P0-6, docs;
  - Leandro: P0-7, P0-1 (b, tela do portão c), aviso de data da P0-4.
- Preencher a tabela do `IA.md`: quem revisou cada pasta, o que foi alterado à mão e quais testes foram rodados. Listar também **os erros da IA encontrados**, que são ótimos exemplos de compreensão do código: sobra por lote, lote vencido no saldo, descarte contado como consumo, `parseTipo`, data de referência, importador, linhas rejeitadas sem alerta.
- Criar o arquivo `LICENSE` (MIT, com os três nomes e o ano 2026).
- Atualizar o `xlsx` para a versão distribuída pela CDN do SheetJS (`npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`) e conferir com `npm audit`. Se der problema no build, manter a versão atual e declarar o risco no README: a leitura acontece no navegador do próprio usuário.

**P0-9. Treino "qualquer um explica qualquer detector".** Esforço de 6 h-pessoa no total (2 h cada). Critério: Clareza (+1) e Código/autoria.
- Cada integrante explica, sem olhar, 3 ou 4 detectores (regra, limiar, por que esse limiar e o limite da regra) e as perguntas 1 a 9 e 19 desta seção. Façam um sorteio entre vocês.
- A banca pode perguntar a quem estiver mais calado. Pelo regulamento, a compreensão do código vale para a equipe toda.

**P0-10. Repositório sempre entregável.** Esforço de 0,5 h (Leandro). Critério: Código.
- A partir de 20/10, criar a tag `v0.9-entregavel` e manter a `main` sempre apresentável (CI verde). Se o prazo do repositório sair curto, já existe uma versão para entregar. A `v1.0-entrega` vem depois.

### P1: fazer de 21/10 a 27/10 (30,5 h-pessoa; soma pontos)

**P1-1. Loop da base oficial** (no dia em que ela sair). Esforço de 4 a 6 h (Pedro; 5 h na tabela). Critério: Funcionamento (+3) e Validação (+1).
- Importar e anotar no `validacao.md`, seção 3:
  - linhas válidas e rejeitadas, por motivo;
  - colunas reconhecidas e quais foram por aproximação;
  - decisões de tipo tomadas (ex.: "Saldo inicial = entrada");
  - datas suspeitas.
- Revisar à mão os 20 primeiros alertas e classificar cada um como faz sentido, discutível ou falso. **Refazer à mão a conta de pelo menos 2 cards de vencimento e 2 de estoque.**
- Ajustar só o que tiver justificativa e registrar o ajuste como "rodada 5" do loop.
- **Não ajustar limiares para "bater" o que vocês acham que a banca plantou:** isso é sobreajuste e fica visível.
- Refazer os números do pitch e do vídeo com a base oficial.

**P1-2. Teste de ponta a ponta do roteiro da demo.** Esforço de 3 h (Pedro). Critério: Funcionamento.
- Um teste no Vitest que roda exatamente a sequência da demo sobre a base que será apresentada e confere os textos esperados. Exemplos:
  - unificar o KCl resolve o alerta;
  - registrar uma retirada grande gera um alerta "Novo".
- Se a base oficial mudar a história, o teste avisa antes do palco, e não durante.

**P1-3. Ajuste de safra simples, que separa o sazonal do encalhado.** Esforço de 2,5 h (Armando). Critério: Aderência (+1) e Análises.
- A categoria sozinha não basta. Estoque de safra é o que **já foi usado numa safra anterior** e está esperando a próxima. Estoque encalhado é o que **nunca saiu**. O caso plantado da base simulada é do segundo tipo: "60 sacos de milho híbrido sem uso há 150 dias" (`ground_truth.json`, detector `alto_valor_parado`). O `data/simulado.csv` tem uma única entrada desse produto (13/05/2026, R$ 958,24/sc) e nenhuma saída. Rebaixar esse alerta só por ser "Sementes" esconderia o caso que o alerta existe para mostrar.
- Regra: rebaixar excesso e dinheiro parado para "Monitorar" **só quando as duas condições valerem**:
  1. a categoria casa com `cfg.categoriasSafra` (padrão `/semente|corretiv|calcari|gesso/`, em `config.ts`; pedir a lista à pessoa de Agronomia na P0-5);
  2. o produto teve **pelo menos uma retirada de consumo** (sem contar as baixas da P0-3b) nos 365 dias anteriores à data de referência.
  ```ts
  const sazonal = cfg.categoriasSafra.test(normalizarNome(p.categoria ?? ""))
    && p.totalSaidas > 0 && p.ultimaSaida !== null && diasEntre(p.ultimaSaida, dataRef) <= 365;
  // sazonal → nível "monitorar" + "Pode ser estoque de safra: este item foi usado em DD/MM/AAAA; confira o calendário de plantio antes de agir."
  // não sazonal → nível inalterado; se for semente/corretivo sem nenhuma retirada, acrescentar "nunca houve retirada desde a compra".
  ```
- **O gabarito não muda.** Com a condição, o milho plantado (0 saídas) mantém o nível, e o eval não deve mudar. Se mudar, o erro está na regra, não no gabarito. Mexer no gabarito para acomodar a regra seria exatamente o "vocês ajustaram o gabarito ao resultado?" das perguntas 1 e 2.
- **O eval não pega a perda de nível:** `scripts/eval-lib.ts` confere se o alerta existe para o produto, não o nível. Por isso, criar um teste unitário que exija nível. "Milho sem nenhuma saída, 150 dias, curva A: `alto_valor_parado` com nível **diferente** de 'monitorar'". E um par: "a mesma semente com retiradas há 200 dias: `monitorar` com o aviso de safra".

**P1-4. "Lista de compras" e "o que usar primeiro".** Esforço de 4 h (Leandro). Critério: Análises e apoio à decisão (+1; reforça o 1º critério de desempate).
- Um botão no Painel que junta os alertas de estoque crítico e de "vai faltar" numa lista: produto, quantidade sugerida, valor estimado, fornecedor mais recente, confiança.
- Saída em CSV e em texto pronto para copiar no WhatsApp.
- Uma segunda lista, "Usar primeiro", com os lotes em risco de vencimento (depois da P0-3b).
- Transforma o alerta em ação concreta, que é o que a seção 8 do regulamento pede ("como o responsável utilizaria").

**P1-5. Vídeo.** Esforço de 4 h (Leandro). Critério: Funcionamento e Clareza.
- Gravar até 26/10 com a base oficial, seguindo `docs/roteiro-video.md` com os números novos e incluindo 10 segundos da tela de importação, com o relatório de rejeições e o mapeamento confirmado.
- Publicar como "não listado" e pôr o link no README.

**P1-6. Testes dos casos hostis e auditoria de cálculo.** Esforço de 4 h (Pedro). Critério: Validação (+1).
- Acrescentar ao `tests/engine.test.ts`:
  - cabeçalhos do edital;
  - "Preço total (R$)";
  - tipos no plural;
  - "0.500" (decidir se o comportamento é aceito e documentar);
  - data absurda (1 linha e 4 de 300) e entressafra de 3 meses;
  - "Entrada-NF", "Saída/uso" e "E/S";
  - saída depois do vencimento; descarte e devolução do vencido, com e sem lote;
  - linhas defeituosas que viram alerta (6%) e base que bloqueia (60%);
  - "Entrada s/ NF" e "Retirada p/ consumo e aplicação";
  - data de referência escolhida que exclui uma linha (tem de aparecer no alerta);
  - saldo negativo sem compra;
  - "saldo inicial" rejeitado;
  - planilha com 2 abas;
  - arquivo vazio, que deve dar mensagem clara e não tela em branco.
- **Auditoria de cálculo:** para cada detector que gera número (dias, sobra, R$, % de variação), um teste com um caso pequeno calculado à mão. Os 3 erros da P0-3 mostram que esse tipo de erro existe e que a suíte atual não o pega.
- Atualizar a contagem de testes no README.

**P1-8. Várias abas do Excel e unidade no cabeçalho** (só se a base oficial vier assim; senão, as 3 h viram folga). Esforço de 3 h (Armando). Critério: Funcionamento.
- Listar as abas e deixar escolher. Se existir uma aba de produtos com estoque mínimo, avisar. A junção automática é a P2-3.
- Se não houver coluna de unidade e o cabeçalho de quantidade trouxer a unidade entre parênteses (ex.: "Quantidade (kg)"), usar essa unidade e avisar.

**P1-9. Pitch, README e checklist com os números finais.** Esforço de 3 h (Armando). Critério: Clareza e Código.
- Em 27/10, copiar os números do `eval-report.md` da tag de entrega e da base oficial para o pitch, o README e o vídeo, e conferir o checklist do Anexo I.

**P1-7. Acessibilidade básica.** Esforço de 2 h (Leandro). Critério: Clareza e acessibilidade.
- Rodar o Lighthouse e corrigir contraste e rótulos.
- Garantir que o nível do alerta apareça em **texto**, e não só pela cor (para daltônicos).
- Testar a fonte grande no celular.

### P2: só se sobrar tempo (não comprometer as P0 e P1 por estas)

- **P2-1. Botão "Este alerta foi útil / Falso alarme"** em cada card, guardado localmente e somado no `validacao.md`. Esforço de 3 h. Critério: Validação.
- **P2-2. Teste de sensibilidade do score:** variar os pesos em ±50% e medir quanto o top 10 muda. Esforço de 2 h. Critério: Análises e Validação (responde à pergunta 17).
- **P2-3. Junção automática** da aba de produtos (estoque mínimo) com a de movimentações. Esforço de 3 h. Vira P1 se a base oficial vier assim.

### O que **não** fazer até 29/10

- **Não trocar a stack** e não adicionar IA dentro do produto (um "resumo por IA", por exemplo). É risco novo, não soma pontos (o regulamento diz que a ausência de IA não reduz a nota) e abre uma nova linha de perguntas.
- **Não fazer o grafo visual de relações** (`react-force-graph`). É vistoso, mas não responde a nenhuma das 7 perguntas.
- **Não inflar números e não escrever números de memória.** Todo número de material sai do `eval-report.md` ou da tela, no estado da tag de entrega.

### Cronograma sugerido

| Data | Armando | Pedro | Leandro |
|---|---|---|---|
| 15–16/10 | **Primeiro commit: corrigir as linhas 12 e 14 do `IA.md` (0,5 h)**; marcar a sessão de Agronomia; **P0-3 (a, b, com a regra de descarte e a mudança 4)** (6 h) | P0-1 (a, lógica do portão) (4 h); P0-2 (1,5 h) | P0-7 deploy (2 h); P0-1 (b) tela (4 h) |
| 17–18/10 | P0-6 (1,5 h, com o eval já corrigido); `IA.md` e LICENSE (2 h) | P0-4 motor (3 h); fixtures da P0-1 (2 h); detector de linhas rejeitadas, P0-1 (f) (2 h); `IA.md` (0,5 h) | Tela do portão e seletor de tipo da P0-1 (c) (2 h); rejeitadas no `store`, P0-1 (f) (1 h); aviso de data da P0-4 (1 h); `xlsx` e `IA.md` (1,5 h) |
| 19–20/10 | **P0-5 sessão 1**; P0-9 treino (2 h) | P0-9 treino (2 h); `npm test`, eval e build | P0-9 treino (2 h); tag `v0.9-entregavel` (0,5 h) |
| 21–24/10 | P1-3 (2,5 h, com o feedback); P1-8 se a base pedir (3 h) | **P1-1 base oficial** (5 h, no dia da divulgação) | P1-4 lista de compras (4 h) |
| 25–26/10 | **P0-5 sessão 2** | P1-2 teste da demo (3 h); P1-6 (4 h) | **P1-5 vídeo** (4 h); P1-7 (2 h) |
| 27/10 | **P1-9**: números do eval-report final no pitch e no README; checklist do Anexo I (3 h) | CI verde; tag `v1.0-entrega` | Plano B: build local testado offline |
| 28/10 | **3 ensaios cronometrados** + rodada de perguntas difíceis, um faz a banca (3 h cada) | | |
| 29/10 | Apresentação | | |

**Se a base oficial atrasar** (sair em 27/10 ou depois): com a P0-1 pronta, a importação leva menos de 1 hora. Se der tempo de revisar os 20 primeiros alertas e fazer um ensaio com ela, usem a Versão A do pitch. Senão, usem a Versão B, que já está pronta (ver "Qual versão usar"). O vídeo fica com a base simulada, com o aviso visível. Na apresentação, digam a data em que a base saiu e mostrem que a análise rodou nela.

**Se a base oficial não sair:** usem a **Versão B do pitch** (abaixo), que já vem com os números da base simulada e diz que ela é simulada na primeira frase da demo. A banca terá a mesma restrição com todas as equipes.

---

## O pitch reforçado (5 minutos)

**Mudanças em relação ao `docs/pitch.md` atual:**
- trocar o exemplo da semente parada (fácil de contestar) por vencimento e duplicidade, **sem perder a pergunta 6 do edital** ("quais produtos representam maior valor armazenado?"): ela ganha um passo de 15 segundos na tela Financeiro, com o top 3 da curva ABC e a ressalva de safra;
- usar os números da base oficial (o que aparece como [X] abaixo), **conferidos à mão** em pelo menos um card;
- mostrar a importação com o relatório de rejeições, que prova o tratamento de dados;
- dizer a métrica honesta;
- colocar o limite **antes** de a banca perguntar.

| Tempo | Quem | Fala | Tela |
|---|---|---|---|
| 0:00–0:25 | Armando | "Uma fazenda registra centenas de entradas e saídas. Saber o saldo não basta: o que para a operação é o diesel que acaba no plantio, o inoculante que vence no galpão, o cadastro duplicado que esconde o estoque real. A AgroSentinela lê esses registros e diz **o que fazer hoje, por quê e quanto dá para confiar**." | Painel do dia |
| 0:25–0:50 | Leandro + Armando | "Esta é a base oficial do desafio: [N] registros importados e [R] com problema. Os com problema não somem: viram alerta de qualidade no Painel, agrupados por motivo, e os alertas do produto afetado avisam que confiam menos. Nada vazio vira zero, nenhuma unidade diferente é somada e nenhuma coluna duvidosa entra sem confirmação." | Importar → relatório → alerta de qualidade |
| 0:50–1:30 | Leandro + Armando | Ler o 1º crítico **real** da base oficial. Abrir *Como calculamos?*: janela usada, número de retiradas, confiança. "É a frase que o edital pediu: 'mantendo o consumo médio recente, o saldo dura cerca de [X] dias'. Quando o histórico é curto, o sistema escreve isso no alerta." | Card → método |
| 1:30–1:50 | Leandro + Armando | Ficha do produto: projeção cruzando o mínimo e consumo semanal. "A média do ano enganaria: o consumo subiu [X]% em 4 meses." | Ficha |
| 1:50–2:15 | Leandro + Armando | Vencimento por lote **(só depois da P0-3b e dos testes "dois lotes" e "saída depois do vencimento" passarem)**: "[Q] vence em [D] dias. No ritmo atual, usamos [U] antes disso e sobram [S], ou seja, R$ [V]. Lote vencido não conta como estoque. Ação: usar este lote primeiro." | Card de vencimento |
| 2:15–2:30 | Leandro + Armando | "E onde está o dinheiro: [3 produtos] concentram [P]% do valor armazenado, R$ [V]. [Com P1-3:] Se for semente ou corretivo já usado na safra passada, o sistema avisa que pode ser estoque de safra antes de chamar de dinheiro parado. Se nunca saiu nada, é encalhado e continua em destaque." (Números da tela, base oficial.) | Financeiro → curva ABC |
| 2:30–2:55 | Leandro + Armando | Duplicidade → Unificar → aviso "Resolvido". "O alarme sumiu porque o problema era o cadastro, não o estoque." | Cadastros |
| 2:55–3:20 | Leandro + Armando | Registrar uma retirada grande → aviso "Novo". "Cada registro refaz a análise inteira." Depois, a **Lista de compras** (com a P1-4): "É isso que o Seu João manda para o fornecedor." | Registrar → Painel |
| 3:20–4:10 | Pedro | "Como sabemos que funciona: um gabarito com 17 problemas plantados encontrou os 17. Na conta estrita, [X]% dos alertas estão no gabarito; os outros revisamos um a um, e a lista está no relatório. Na base oficial, revisamos os 20 primeiros alertas: [Y] corretos, e refizemos à mão a conta de [N] cards. Validamos com [nome], de Agronomia, que nos fez mudar [Z]. Limites: não modelamos a safra completa, o prazo de compra de 15 dias é um padrão configurável e, sem o lote na saída, supomos que se usa primeiro o que vence antes." | Como funciona + eval-report |
| 4:10–4:40 | Armando | "Não é um cadastro de estoque: é a lista do que fazer hoje, com justificativa, a partir da planilha que a fazenda já tem. O código é aberto, os testes rodam a cada commit e declaramos o uso de IA no desenvolvimento, inclusive os erros dela que encontramos e corrigimos. O sistema em si não usa IA: cada alerta é uma regra que sabemos explicar." | Painel |
| 4:40–5:00 | Armando | "Próximos passos: calendário de safra e aviso no celular. Obrigado." | Link + QR Code do repositório |

A tabela acima é a **Versão A**, para quando a base oficial saiu e foi ensaiada.

### Qual versão usar (decidir em 27/10, não no palco)

| Situação em 27/10 | Pitch |
|---|---|
| Base oficial importada, 20 alertas revisados e pelo menos 1 ensaio feito com ela | **Versão A** |
| Base oficial saiu em 27 ou 28/10, sem tempo de revisar | **Versão B**, com uma frase a mais aos 0:25: "A base oficial saiu em [data]; ela já roda no sistema, e mostramos no fim, se der tempo." |
| Base oficial não saiu | **Versão B** |

Nunca abram com "esta é a base oficial" se os números da tela não forem dela.

### Versão B: base simulada (pronta para usar hoje)

Os números abaixo são os do `docs/pitch.md` atual, gerados sobre `data/simulado.csv`. **Três deles podem mudar com as correções P0** e têm de ser conferidos na tela em 27/10:
- o card do inoculante, que depende da sobra por lote da P0-3b;
- a contagem de críticos, que muda porque a P0-3a tira o óleo do topo;
- a precisão estrita, que na minha cópia foi de 77% (17 de 22) depois da P0-3a.

Se a tela mostrar outro valor, falem o da tela. Os outros números (diesel, KCl, glifosato, curva ABC) não dependem dessas correções, mas também precisam ser conferidos.

| Tempo | Quem | Fala | Tela |
|---|---|---|---|
| 0:00–0:25 | Armando | Igual à Versão A. | Painel do dia |
| 0:25–0:50 | Leandro + Armando | "**Para a demonstração, usamos uma base simulada**, identificada como simulada na tela, com um ano de registros e 17 problemas escondidos de propósito. [Se a oficial saiu tarde: 'A base oficial saiu em [data] e já roda no sistema.'] Nada vazio vira zero, nenhuma unidade diferente é somada, e uma linha com defeito vira alerta de qualidade, não some." | Faixa "DADOS SIMULADOS" → Importar |
| 0:50–1:30 | Leandro + Armando | Card do diesel. "Mantendo o consumo médio recente, o saldo dura cerca de **9 dias**." Abrir *Como calculamos?*: janela, número de retiradas, confiança alta. | Card → método |
| 1:30–1:50 | Leandro + Armando | Ficha do diesel: "O consumo subiu **87%** em 4 meses. A média do ano enganaria." | Ficha |
| 1:50–2:15 | Leandro + Armando | Card do inoculante **(só se a P0-3b passou nos testes; senão, pular)**: "**28 L** vencem em **20 dias**, e no ritmo atual usamos **11 L** antes disso. Sobram cerca de **R$ 933** que viram lixo, a não ser que este lote seja usado primeiro." | Card de vencimento |
| 2:15–2:30 | Leandro + Armando | "E onde está o dinheiro: **11 itens** concentram 80% do valor armazenado." Apontar o top 3 da curva ABC na tela. | Financeiro → curva ABC |
| 2:30–2:55 | Leandro + Armando | "KCl" e "Cloreto de potássio" → Unificar → aviso **"Resolvido: KCl · Vai faltar em breve"**. "Era um alarme falso causado por cadastro duplicado." | Cadastros |
| 2:55–3:20 | Leandro + Armando | Registrar **300 L de glifosato no Talhão 2** → aviso com o alerta "Novo". "Cada registro refaz a análise." Depois, a Lista de compras (com a P1-4). | Registrar → Painel |
| 3:20–4:10 | Pedro | "Como sabemos que funciona: o gabarito tem 17 problemas plantados, e o sistema encontrou os 17. Mas fomos nós que criamos a base e o gabarito, então isso prova que cada regra faz o que diz, não que acerta em dados reais. Na conta estrita, **[X]%** dos alertas estão no gabarito [do eval-report da tag]; os outros revisamos um a um. Rodamos 10 bases com sementes diferentes. Validamos com [nome], que nos fez mudar [Z]. Limites: não modelamos a safra completa, o prazo de compra de 15 dias é um padrão configurável e, sem o lote na saída, supomos que se usa primeiro o que vence antes." | Como funciona + eval-report |
| 4:10–5:00 | Armando | Igual à Versão A. | Painel → QR Code |

- Na Versão B, a admissão "fomos nós que criamos o gabarito" vem **antes** da pergunta 1 da banca. Isso tira a força dela.
- Não digam "6 críticos" nem nenhuma contagem que não esteja na tela naquele momento.
- O vídeo da P1-5 pode ser gravado com a Versão B já em 26/10. Se a base oficial sair depois, regravem só o trecho de 0:25 a 1:30.

**Para o dia (fail-safe):**
- Notebook com `npm run build && npm start` testado **sem internet** em 27/10, com a base oficial já carregada no navegador.
- Vídeo baixado localmente, não só no YouTube.
- 30 minutos antes: abrir o app, conferir a data de referência no topo e o aviso de datas suspeitas, carregar a base e fechar os avisos.
- Se algo travar no palco, não tentar consertar: "Vamos para o vídeo, que mostra exatamente este passo". Quem está no teclado troca em até 10 segundos.
- Se a organização der menos de 5 minutos, cortar nesta ordem: ficha do produto, registro ao vivo, vencimento. **Não cortar** o primeiro alerta com o método, os 15 segundos da curva ABC (única resposta visível à pergunta 6) nem os limites.
- **Mapa das 7 perguntas no pitch** (para conferir no ensaio): 1 e 7 → primeiro crítico e Painel do dia; 2 → card de vencimento; 3 e 5 → card com método e ficha (consumo e "dura cerca de X dias"); 4 → retirada grande registrada ao vivo; 6 → curva ABC no Financeiro.
- Cronometrar cada ensaio. Se passar de 4:50 duas vezes seguidas, cortar um passo da demo em vez de falar mais rápido.
- **Se a P0-3b não ficar pronta**, tirar o card de vencimento do pitch e do vídeo. É melhor ter um passo a menos do que dizer um R$ errado.

---

## Checklist final (Anexo I do regulamento + riscos deste relatório)

- [ ] Importação testada com os cabeçalhos do edital, tipos no plural, "Preço total" e a base oficial (P0-1, P0-2, P1-1)
- [ ] Nenhuma recomendação de compra baseada em saldo negativo (P0-3a)
- [ ] Sobra por lote correta com vários lotes; saída de consumo depois do vencimento sai do lote válido; descarte sai do vencido e não conta como consumo, não gera "Retirada fora do padrão" e não reinicia o "Dinheiro parado" (teste de ponta a ponta no `analisar`); lote vencido fora do saldo utilizável (P0-3b)
- [ ] Linhas com defeito da base oficial aparecem como alerta de qualidade no Painel; o portão só bloqueia erro de formato; qualquer tipo não reconhecido, mesmo em 1 linha, passa pelo seletor (fixture 7, "Saldo inicial") (P0-1 c, f)
- [ ] Data de referência correta, visível e fixada na config da demo; toda linha posterior à data de referência listada no alerta; entressafra não excluída; mesmo resultado em qualquer dia (P0-4)
- [ ] Validação com Agronomia registrada, com o feedback literal e o que mudou (P0-5)
- [ ] Precisão estrita e precisão com aceitáveis publicadas, com os números copiados do eval-report final (P0-6)
- [ ] Link online em modo local, testado em aba anônima e no celular (P0-7)
- [ ] **Linhas 12 e 14 do `IA.md` corrigidas no primeiro commit**; toda frase sobre o que a equipe fez aponta para commit, teste ou `validacao.md`; respostas 8 e 9 conferidas contra o `git log` da tag (P0-8)
- [ ] Ajuste de safra rebaixa só o que teve uso; o milho sem saída mantém o nível; gabarito intacto; teste de nível passando (P1-3)
- [ ] Commits dos três integrantes, `IA.md` sem "preencher" e com os erros da IA encontrados, `LICENSE` presente (P0-8)
- [ ] Cada integrante explica qualquer detector e a conta da sobra (P0-9)
- [ ] Vídeo com link no README (P1-5)
- [ ] Tag `v1.0-entrega` e commit citados no README; CI verde
- [ ] Plano B offline testado sem internet
- [ ] Versão do pitch (A, base oficial, ou B, simulada) decidida em 27/10 pela tabela "Qual versão usar"; números conferidos à mão na tela; ensaiado 3 vezes
