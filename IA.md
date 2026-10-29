# Declaração de uso de Inteligência Artificial

Conforme a seção 6 do regulamento do AGROHACK 2026/2: ferramentas, finalidades, partes apoiadas e o que a equipe revisou e validou.

**Resumo honesto:** este projeto foi desenvolvido com **forte apoio de IA na escrita do código e da documentação**. Isso não muda quem decide. O problema, o público, os critérios de alerta aceitos, o visual e cada mudança que entrou no repositório passaram por decisão e revisão da equipe. O sistema entregue **não usa modelos de linguagem (LLM)** nem envia dados para fora. Todo alerta vem de uma regra que pode ser explicada ao usuário. A única parte que aprende com os dados é um **modelo estatístico de previsão de consumo**, que só é mostrado onde provou ser melhor que a média (ver o fim deste documento).

## Ferramentas

| Ferramenta | Finalidade | Partes apoiadas |
|---|---|---|
| Claude Code (Anthropic, modelo Claude Opus), no terminal | Planejamento, geração e revisão de código, documentação | Motor de análise (`src/lib/engine`), limiares iniciais (`config.ts`), gerador da base simulada e gabarito, loop de avaliação, telas, testes, README e `docs/` |
| Claude Code na nuvem (claude.ai/code) | Tarefas longas em paralelo, entregues como Pull Request | PR #1 (redesenho "Iluminura" do front-end) e PR #2 (demo de 170 L e motion do pitch) |
| Claude in Chrome | Conferir as telas no navegador | Revisão visual do app, do pitch e do deploy |
| Skill "Arena" do Claude Code (16 sub-agentes) | Crítica da ideia antes de construir | `docs/validacao-arena.md` |

## Como trabalhamos: plano antes do código

Não usamos a IA no improviso. Cada mudança seguiu o mesmo ciclo:

1. **A equipe define o pedido**, com o problema e o resultado esperado. Exemplos:
   - "o print do pitch deve se aprofundar dentro do quadro, sem tela cheia";
   - "a demo deve mostrar exatamente o alerta que o README promete".
2. **A IA escreve um plano** (arquivos afetados, abordagem e como verificar), e a equipe **aprova, ajusta ou recusa antes de qualquer código**.
3. **A implementação vem num Pull Request** com lint, testes, avaliação e build passando no CI (GitHub Actions) e com preview na Netlify.
4. **A equipe revisa o resultado no navegador** e só então faz o merge. Os commits seguem Conventional Commits, em português.

## Erros da IA que pegamos e corrigimos

Estes casos mostram por que a revisão humana é parte do método, e não um detalhe:

| O que a IA entregou | Como percebemos | O que foi feito |
|---|---|---|
| O README prometia que uma "retirada grande de glifosato" gerava "Vai faltar em breve", mas com 900 L o aviso era outro (Estoque crítico, Qualidade dos dados, Retirada fora do padrão) | Testando a demo no app antes do pitch | Varredura no motor de 5 em 5 L: a faixa de 120 a 225 L dá só o aviso prometido. Fixamos **170 L** e criamos `tests/demo.test.ts` para travar esse resultado |
| O deploy na Netlify publicava o site sem o adaptador do Next.js, e todas as páginas davam 404 | Abrindo o link público | `netlify.toml` com o build e o adaptador declarados |
| O projeto usava o Next.js 15.5.4, com a vulnerabilidade crítica CVE-2025-55182 | A Netlify bloqueou o deploy | Atualização para o Next.js 15.5.28 e o React 19.1.10, com todos os testes passando |
| O zoom do pitch em "câmera de tela cheia", que avançava sozinho | Ensaio visual: não ficaria bom no telão | Recusado. Refeito como zoom dentro do quadro do print, controlado pelo passador |
| O redesenho trocou os nomes do menu ("Registrar entrada ou saída", "Importar planilha"), mas o README e o roteiro do vídeo continuaram com os nomes antigos | Revisão do PR #1 | Documentação atualizada no mesmo PR |
| O motor tinha três defeitos (lote vencido no saldo, sobra superestimada com vários lotes e cabeçalhos do edital rejeitados). Eles foram apontados em 14/10 por uma revisão feita com IA (`docs/validacao-arena.md`), mas **não foram corrigidos antes da entrega** | Os pareceres da seleção de 28/10 cobraram os mesmos pontos | Corrigidos em 28/10, cada um com um teste de regressão que falha na versão antiga; a precisão estrita passou a ser publicada ao lado da precisão com aceitáveis |
| A primeira métrica de qualidade (100% de acerto) era medida só na base que nós mesmos geramos | Comparando com o projeto vencedor do hackathon anterior, que caiu na mesma armadilha | O README e o `TESTING.md` agora separam o que o número prova (cada regra faz o que diz) do que só a base oficial e os usuários podem provar |

## O que a equipe decidiu

- **Problema, público e tese do produto:** o "agrônomo de bolso do estoque", que diz o que fazer hoje, por quê e quanto dá para confiar.
- **Quais critérios de alerta aceitar e com quais limites.** Por exemplo: unidades diferentes não se somam e preço ausente não vira zero. Os critérios estão em `docs/criterios-alertas.md` e na tela *Como funciona*.
- **Identidade visual "Iluminura"** e a regra de que a usabilidade para o leigo vem antes da estética.
- **O roteiro e o tom do pitch**, e o que mostrar em cada momento da demo.
- **Como entrar com um modelo de previsão sem virar caixa-preta.** Depois de analisar o projeto vencedor do hackathon anterior (um Random Forest treinado com rótulos da própria regra), decidimos: o modelo é testado contra a média simples em semanas escondidas, só aparece onde vence com folga de 5%, mostra a faixa de incerteza e o resultado do teste na ficha, e **não altera nenhum alerta**.
- **O que adotar da crítica da Arena** (`docs/validacao-arena.md`): a IA gerou as críticas e a equipe escolheu quais viraram mudança.

## Registro de revisão por integrante

| Integrante | O que revisou | Como verificou |
|---|---|---|
| Armando Giordani Trassi | Planos e PRs #1 a #3, demo de reanálise, deploy, pitch | Revisão dos planos antes do código, teste no navegador e no celular, ensaio do pitch |
| Pedro Felipe Vieira Gouveia | _(a registrar pelo integrante)_ | |
| Leandro Pires de Moraes Filho | _(a registrar pelo integrante)_ | |

## Cuidados

- Nenhuma credencial, chave privada (o comprovante de inscrição da equipe fica fora do repositório) ou dado pessoal real foi enviado às ferramentas de IA.
- A base usada no desenvolvimento é **simulada** e identificada como tal. A base oficial só é usada conforme as orientações da organização.

## O que roda dentro da solução

O sistema entregue **não chama nenhum modelo de linguagem (LLM)** nem serviço de IA externo. Os alertas vêm de regras estatísticas explicáveis:
- médias e mediana/MAD;
- regressão por blocos;
- consumo dos lotes em ordem de validade (quem vence primeiro sai primeiro);
- curva ABC;
- similaridade de texto.

Por isso, cada alerta pode ser justificado ao usuário, no próprio card ("Como calculamos?").

A única parte que **aprende com os dados** é o modelo de previsão de consumo (`src/lib/engine/previsao.ts`): suavização exponencial de Holt, com nível e tendência amortecida. Os parâmetros são escolhidos pelo menor erro no histórico de cada produto. Ele roda no navegador e é informativo:
- é testado contra a média simples escondendo as últimas 4 semanas (`npm run eval:previsao`, resultado em `docs/eval-previsao.md`);
- só aparece na ficha do produto em que venceu a média com folga de 5%, junto com a faixa de incerteza e o resultado do teste;
- não altera nenhum alerta (garantido por teste automatizado, PR-06 em `TESTING.md`).
