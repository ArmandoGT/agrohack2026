# Pitch: 5 minutos (29/10/2026, SNCT)

**Quem fala:**

| Parte | Quem |
|---|---|
| Abertura e problema | Armando |
| Demo | Leandro (no teclado) com Armando narrando |
| Critérios e validação | Pedro |
| Fechamento | Armando |

Ensaiar 3 vezes com cronômetro, no dia 28/10.

| Tempo | Bloco | Fala (resumo) | Na tela |
|---|---|---|---|
| 0:00–0:30 | **Dor** | "O Seu João sabe quanto tem de cada insumo. O que ele não sabe é **o que vai dar problema**. Diesel acabando no meio do plantio, inoculante vencendo no galpão, R$ 57 mil de semente parados." | Painel do dia |
| 0:30–1:00 | **Solução** | "A AgroSentinela lê os mesmos registros de entrada e saída e responde às 7 perguntas do desafio. Cada alerta diz o quê, por quê, o que fazer e quanto dá para confiar." | Um card aberto em "Como calculamos?" |
| 1:00–3:30 | **Demo ao vivo** | Ver o roteiro abaixo | App |
| 3:30–4:15 | **Critérios e validação** | "Criamos uma base simulada com 17 problemas escondidos e um gabarito. A cada mudança, medimos quantos o sistema encontra: 100% de recall. Em 10 bases diferentes, a precisão média foi de 98,9%. Os erros que o loop pegou mudaram o código." Depois, mostrar os limites. | Como funciona → DAG + `docs/eval-report.md` |
| 4:15–5:00 | **Fechamento** | "Não é mais um cadastro de estoque: é uma lista do que fazer hoje, com justificativa. Funciona com a planilha que a fazenda já tem." Validação com Agronomia e próximos passos (notificação por WhatsApp, sazonalidade por safra). | Painel |

## Roteiro da demo (2 min 30 s)

1. **Painel do dia:** "6 críticos." Ler o do diesel: "dura ~9 dias". Clicar em *Como calculamos?* e mostrar o critério e a confiança alta.
2. **Ficha do diesel:** gráfico do saldo com a projeção tracejada cruzando o mínimo, e consumo semanal subindo. "O consumo subiu 87% em 4 meses. Uma média anual enganaria."
3. **Vencimento:** card do inoculante. "28 L vencem em 20 dias e o ritmo só usa 11. Sobram R$ 933 que viram lixo, a não ser que ele use este lote primeiro."
4. **Cadastros duplicados:** "KCl" e "Cloreto de potássio". Clicar em *Unificar*. O aviso mostra **Resolvido: KCl · Vai faltar em breve**. "Era um alarme falso causado por cadastro errado."
5. **Registrar:** retirada de **300 L de glifosato no Talhão 2**. Salvar. O aviso mostra o alerta **Novo**. "A cada registro, tudo é reanalisado."
6. **Financeiro:** curva ABC. "11 itens concentram 80% do dinheiro."

> **Plano B:** se a internet ou o deploy falharem, use `npm run build && npm start` no notebook (funciona offline com a base simulada) ou o vídeo gravado.
>
> Antes de subir ao palco: abrir o app, clicar em *Importar dados → Recarregar base simulada* (ou carregar a base oficial) e fechar os avisos.

## Banco de perguntas da banca

| Pergunta provável | Resposta curta |
|---|---|
| Como vocês estimam quantos dias o estoque dura? | Saldo ÷ consumo médio da janela mais recente com pelo menos 3 retiradas (30, 90 dias ou histórico). A janela e a confiança aparecem no alerta. |
| E se o histórico for curto? | A estimativa sai com "confiança baixa" e perde prioridade. Não escondemos a incerteza. |
| Como tratam unidades diferentes? | Convertemos dentro da mesma família (t→kg, mL→L). kg com L não é somado: vira alerta de qualidade dos dados. |
| E preço ou validade vazios? | Ficam como "não informado", nunca zero. O valor do estoque é marcado como estimado. |
| Por que não usaram IA ou machine learning para prever? | Uma solução simples e explicável atende ao foco do desafio, e cada alerta precisa de justificativa. Usamos estatística robusta (mediana/MAD, blocos mensais, FEFO). Usamos IA no desenvolvimento, conforme declarado em IA.md. |
| Como sabem que os alertas estão certos? | Loop de avaliação com gabarito: 100% de recall. Em 10 bases simuladas, 98,9% de precisão. Mais testes unitários no CI, revisão manual na base oficial e feedback de Agronomia. |
| A base simulada não é viciada? | É, por isso: (1) testamos 10 variações; (2) documentamos isso como limitação; (3) a demonstração principal usa a base oficial. |
| Como detectam produto cadastrado duas vezes? | Grafo de similaridade de nomes: siglas expandidas, acentos removidos, Jaro-Winkler, e fórmulas diferentes de NPK nunca se unem. O usuário confirma a fusão. |
| Como priorizam? | Score de 0 a 100: nível + urgência em dias + impacto em R$ − penalidade por baixa confiança. |
| E a sazonalidade da safra? | É uma limitação declarada. O próximo passo é ter janelas de consumo por safra e um calendário agrícola. |
| Como a fazenda usaria isso no dia a dia? | Abre o Painel do dia de manhã, resolve os críticos, e registra as saídas pelo celular (a interface é responsiva) ou importa a planilha semanal. |
| Os dados ficam onde? | No navegador ou no Supabase (Postgres) com RLS. Só a chave pública fica no front e nenhuma credencial vai para o repositório. |
