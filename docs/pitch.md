# Pitch de venda: 5 minutos (29/10/2026, SNCT)

> **Mindset:** a banca não está comprando um sistema pronto, está comprando **uma ideia que resolve uma dor real e que dá para executar**. Cada minuto do pitch serve para responder a uma pergunta dela: *isso importa? funciona? esses caras sabem o que estão fazendo? isso vai longe?*

## Os slides: `/pitch` (dentro do próprio app)

- **Abrir:** `npm run build && npm start` e acessar `http://localhost:3000/pitch`. Funciona sem internet, porque as fontes e as telas são servidas pelo próprio app.
- **Teclado:**
  - → , espaço ou o **passador** avançam. Nos slides com print (4 a 9), cada toque primeiro aproxima o próximo ponto do print e, depois do último, passa o slide, como as animações do PowerPoint;
  - ↓ e ↑ movem só o zoom (próximo ou anterior ponto);
  - ← volta um slide;
  - **F** liga a tela cheia;
  - **N** mostra as notas do apresentador, com fala e tempo de cada slide.
- **Conteúdo:**
  - 15 slides animados com a biblioteca Motion, com a mesma identidade "Iluminura" do app: pergaminho, folha de ouro, cinabre e ultramarino, com EB Garamond nos títulos e Source Sans 3 no texto. Os slides escuros imitam um painel de altar, em ultramarino com ouro, e todos os textos passam o contraste AA com folga para projetor;
  - o motion acompanha a fala: filetes de ouro que se desenham, capitulares que surgem e revelações em sequência. Nada fica em loop, e a troca de slide leva 0,6 s;
  - as telas são **capturas reais do sistema** (base simulada), em `public/pitch/`. Nos slides 4 a 9, a tela abre num arco ogival e o slide fica como está: só o **print se aprofunda dentro do próprio quadro**, um ponto por toque no passador (slide 5: o resumo para o gestor e depois os indicadores), com um filete de ouro em volta. Nada avança sozinho: o ritmo é o da fala. Losangos pequenos embaixo do arco mostram quantos pontos faltam;
  - se o computador estiver com **"reduzir movimento"** ligado, os slides só fazem fade: o destaque troca de ponto sem zoom.
- **Recapturar as telas** (por exemplo, com a base oficial): com o app rodando (`npm run build && npm start`), rode `npm run capturar-telas -- pitch`. O script regrava `public/pitch/*.png` nos mesmos estados e `src/app/pitch/focos.json`, com o tamanho de cada tela e os pontos do zoom. No Linux, indique o navegador com `EDGE_PATH=/caminho/do/chrome`.
- **Base oficial:** quando ela sair, refazer as capturas com ela e trocar os números dos slides 6 a 9.
- **Prévia:** [capa](img/pitch/slide-01-capa.jpg), [a dor](img/pitch/slide-02-dor.jpg), [momento 4 da demo](img/pitch/slide-09-momento4.jpg), [por que confiar](img/pitch/slide-11-confianca.jpg); transições: [abertura](img/pitch/transicao-abertura.gif) e [momento 3](img/pitch/transicao-momento3.gif).

## A frase que a banca tem de levar para casa

**"A AgroSentinela é o agrônomo de bolso do estoque: ela lê a planilha que a fazenda já tem e diz o que fazer hoje, por quê e quanto dá para confiar."**

Todos os três devem saber dizer essa frase de cor. Ela abre e fecha o pitch.

## Estrutura (5 min)

| Tempo | Bloco | Quem | Objetivo na cabeça da banca |
|---|---|---|---|
| 0:00–0:40 | 1. Dor | Armando | "Isso importa." |
| 0:40–1:10 | 2. Virada | Armando | "Que ideia diferente." |
| 1:10–3:00 | 3. Demo curta e segura | Leandro (teclado) + Armando (narra) | "Funciona de verdade." |
| 3:00–3:45 | 4. Por que confiar | Pedro | "Esses caras têm método." |
| 3:45–4:30 | 5. Visão | Armando | "Isso vai longe." |
| 4:30–5:00 | 6. Fechamento | Armando | "Esse é o projeto que ganha." |

---

### 1. Dor (0:00–0:40): contar uma história, não um problema

> "Imaginem o Seu João, gerente de uma fazenda aqui em Rondônia. Ele sabe quanto tem de cada insumo, porque está tudo anotado na planilha. O que a planilha **não** conta para ele é **o que vai dar problema**.
> O diesel que acaba no meio do plantio, com a máquina parada. O inoculante que vence no galpão porque ninguém viu a data. O mesmo adubo cadastrado com dois nomes, e a fazenda compra de novo o que já tinha.
> Nenhum desses problemas é falta de dado. **É falta de alguém olhando os dados por ele.**"

*Na tela: o Painel do dia, ainda sem explicar nada.*

### 2. Virada (0:40–1:10): a ideia em uma frase

> "A AgroSentinela é esse alguém. Ela lê os mesmos registros de entrada e saída que a fazenda já tem e entrega **uma lista do que fazer hoje**, em ordem de prioridade.
> E todo alerta responde três perguntas: **o quê**, **por quê** e **quanto dá para confiar**. Não é mais um cadastro de estoque com gráfico bonito. É apoio à decisão, que é exatamente o que o desafio pediu."

*Na tela: abrir um card e mostrar as três partes (mensagem, "Como calculamos?", confiança).*

### 3. Demo curta e segura (1:10–3:00): 4 momentos "uau"

Mostrem só passos que já foram ensaiados e que **não podem dar errado**. Cada passo tem uma frase de efeito.

| # | Tela | O que fazer | Frase de efeito |
|---|---|---|---|
| 1 | Painel → card do **diesel** | Abrir *Como calculamos?* | "Mantendo o consumo dos últimos 30 dias, o diesel dura **cerca de 9 dias**. Com o prazo de compra de 15, **ele já está atrasado**. E o sistema mostra a conta e a confiança." |
| 2 | Ficha do diesel | Mostrar o gráfico com a projeção | "O consumo subiu **87% em 4 meses**. Quem olhasse a média do ano acharia que está tudo bem." Se houver tempo, mostrar o cartão *Previsão do modelo*: "o modelo vê a tendência e confirma **18/10**; ele só aparece porque errou menos que a média no teste (14% contra 18%)". |
| 3 | Cadastros | Unificar **"KCl"** com **"Cloreto de potássio"** | "Era o mesmo adubo com dois nomes. Um clique, e o alarme falso de 'vai faltar' **some sozinho**." |
| 4 | Registrar | Retirada de **170 L de glifosato** no Talhão 2, na data sugerida | "Alguém tirou 170 litros de uma vez. Na hora o sistema refaz tudo e avisa: **vai faltar em breve**. É o tipo de coisa que hoje só se descobre no fim do mês." |
| (opcional, 15 s) | Financeiro | Curva ABC | "E **11 itens concentram 80%** do dinheiro parado no galpão. É ali que o Seu João tem de olhar primeiro." |

**Regras de segurança da demo:**
- **Não** abrir pelo alerta do óleo de motor (o saldo dele está negativo de propósito, por um problema de dados).
- **Não** citar o valor em R$ da sobra do card de vencimento enquanto o cálculo com vários lotes não for corrigido.
- **Não** dizer contagens ("6 críticos"); elas mudam com a base.
- Se a base oficial já tiver saído e sido **ensaiada**, trocar os números pelos dela. Se não, dizer na primeira frase: *"Para a demonstração, usamos uma base simulada, identificada na tela."*
- Se algo travar: "Vamos para o vídeo, que mostra exatamente este passo." Troca em até 10 segundos.

### 4. Por que confiar (3:00–3:45): método, sem esconder nada

> "Como a gente sabe que isso funciona? Montamos uma base com **17 problemas escondidos de propósito** e um gabarito. O sistema encontrou **os 17**. Repetimos com 10 bases diferentes para não 'decorar' uma só.
> Agora, honestidade: fomos nós que criamos essa base, então isso prova que cada regra faz o que diz, não que acerta tudo no mundo real. Por isso [validamos com X, de Agronomia, que nos fez mudar Y] e [rodamos a base oficial do desafio].
> E cada alerta é uma regra que sabemos explicar: média de consumo, mediana para achar retirada estranha, prazo de validade por lote. Usamos IA para **construir** o sistema, e isso está declarado. O sistema em si não depende de IA para decidir."

*Na tela: Como funciona → grafo do pipeline (os detectores rodando em paralelo).*

> Só digam a frase entre colchetes se ela for verdade no dia. Senão, cortem.

### 5. Visão (3:45–4:30): vender o roadmap como próximo passo óbvio

> "Isso aqui é a primeira versão. O caminho já está mapeado:
> - **Lista de compras pronta**, que o Seu João manda pelo WhatsApp para o fornecedor;
> - **'Use primeiro'**: quais lotes usar antes para nada vencer no galpão;
> - **Calendário de safra**: semente parada em outubro pode ser estoque para a safrinha, e o sistema vai saber a diferença;
> - **Funciona offline**, porque fazenda nem sempre tem internet;
> - E depois, **cooperativas**: uma cooperativa com 50 fazendas vê, num painel só, onde está faltando e onde está sobrando."

*Na tela: um slide simples com os 5 próximos passos (ou o Painel do dia).*

### 6. Fechamento (4:30–5:00)

> "Toda fazenda já tem os dados. O que falta é alguém olhando por ela todo dia.
> **A AgroSentinela é o agrônomo de bolso do estoque: lê a planilha que a fazenda já tem e diz o que fazer hoje, por quê e quanto dá para confiar.**
> Somos a equipe 3 Hacketeers. O código, a documentação e os testes estão no repositório. Obrigado!"

*Na tela: QR Code do repositório e do link online.*

---

## Técnicas de venda para o palco

- **Comecem pela história, não pela tecnologia.** Ninguém se importa com DAG antes de se importar com o Seu João.
- **Um número por momento.** "9 dias", "87%", "170 litros", "17 de 17". Números concretos grudam; listas não.
- **Mostrem, não descrevam.** Toda frase da demo acontece na tela ao mesmo tempo.
- **Admitam o limite antes da banca perguntar.** Isso tira a arma da mão dela e passa confiança.
- **Fraqueza vira roadmap.** "Ainda não faz X" vira "o próximo passo é X, e já sabemos como".
- **Energia e contato visual.** Quem narra olha para a banca, não para a tela. Quem está no teclado não fala.
- **Terminem no tempo.** Se dois ensaios passarem de 4:50, cortem um passo da demo; não falem mais rápido.

## Banco de perguntas da banca

| Pergunta provável | Resposta curta (admitir → mostrar → próximo passo) |
|---|---|
| Vocês criaram a base e o gabarito. Isso não é circular? | "Em parte, sim, e por isso não usamos esse número como prova de acerto. Ele prova que cada regra faz o que promete. Para o mundo real, [rodamos a base oficial e revisamos à mão os primeiros alertas]." |
| Como calculam quantos dias o estoque dura? | "Saldo dividido pelo consumo médio da janela mais recente com pelo menos 3 retiradas: 30 dias, 90 dias ou o histórico. A janela e a confiança aparecem no próprio alerta." |
| E se o histórico for curto? | "O alerta sai com 'confiança baixa' escrito e perde prioridade. A gente não esconde a incerteza." |
| Qual a diferença para uma planilha com fórmulas? | "A planilha mostra o saldo. A AgroSentinela cruza saldo, ritmo de consumo, validade, preço e cadastro duplicado, e diz **o que fazer primeiro e por quê**. E ela lê a planilha que a fazenda já tem." |
| Quem escreveu o código? O que a IA fez? | "Usamos o Claude Code para gerar a primeira versão, e isso está declarado no `IA.md`. O nosso trabalho foi a ideia, a direção, a revisão e [as correções e a validação feitas depois]. Escolham qualquer detector, e qualquer um de nós explica a regra." *(Treinar: cada um sabe explicar todos os detectores.)* |
| Vocês usam IA / machine learning? | "Usamos um modelo de previsão que aprende o ritmo de cada insumo, a suavização de Holt. Mas não confiamos nele de graça: escondemos as últimas 4 semanas e comparamos com o que aconteceu. No total, ele erra 6% menos que a média, e só aparece no produto em que venceu. Os alertas continuam em regras que dá para explicar ao Seu João, porque o edital pede justificativa clara. Um modelo mais complexo, com um ano de dados, teria pouco para aprender." |
| O ganho de 6% não é pequeno? | "É, e por isso dizemos isso em vez de esconder. O ganho aparece onde o consumo muda de ritmo, como no diesel. Onde o consumo é estável, a média já é boa, e o app diz isso." |
| Semente parada antes do plantio é problema? | "Nem sempre, e esse é exatamente o próximo passo: o calendário de safra, para separar estoque de safra de estoque encalhado." |
| Como tratam unidades diferentes e campos vazios? | "Convertemos dentro da mesma família (t para kg, mL para L). kg com L nunca é somado: vira alerta de qualidade. Preço ou validade vazios ficam 'não informados', nunca zero." |
| Vocês validaram com usuário real? | "[Com X, em Y, que nos fez mudar Z.]" Se não: "Ainda não; o roteiro de perguntas está pronto em `docs/validacao.md`." **Nunca inventem.** |
| O Seu João tem internet na fazenda? | "A análise roda no próprio navegador depois que a página carrega. A versão totalmente offline é um próximo passo declarado." |
| Como isso vira negócio? | "Começa grátis para o produtor, como porta de entrada. O valor está nas cooperativas e revendas de insumo: elas ganham visão de onde vai faltar e quando oferecer reposição." |

## Plano B e checklist do dia

- [ ] Ensaiar 3 vezes com cronômetro no dia 28/10; uma pessoa faz o papel da banca.
- [ ] Notebook com `npm run build && npm start` testado **sem internet**.
- [ ] Vídeo da demo baixado no notebook (não só no YouTube).
- [ ] 30 minutos antes: abrir o app, carregar a base (oficial ou simulada) e fechar os avisos.
- [ ] Conferir na tela os números que serão falados (diesel, 87%, curva ABC).
- [ ] Slide da visão e QR Code prontos.
- [ ] Cada integrante sabe dizer a frase-tese de cor.
