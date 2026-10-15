# Declaração de uso de Inteligência Artificial

Conforme a seção 6 do regulamento do AGROHACK 2026/2.

| Ferramenta | Finalidade | Partes apoiadas | Revisão e validação pela equipe |
|---|---|---|---|
| Claude Code (Anthropic, modelo Claude Opus) | Planejamento, geração de código, documentação | Estrutura inicial do projeto, motor de análise (`src/lib/engine`), limiares iniciais (`config.ts`), gerador de dados simulados e gabarito (`data/ground_truth.json`), loop de avaliação e suas rodadas 1–4, telas, testes, README, documentos em `docs/` e validação crítica da ideia com a skill Arena (16 sub-agentes do Claude Code, `docs/validacao-arena.md`) | _(preencher: quem revisou cada parte, o que foi alterado, testes executados)_ |
| _(outras ferramentas, se usadas)_ | | | |

## Como garantimos a compreensão e a autoria

- Critérios e limiares foram propostos pelo Claude Code na geração inicial e estão documentados em `docs/criterios-alertas.md` e na tela *Como funciona*. A revisão de cada parte pela equipe fica registrada na tabela acima, com quem revisou e quando.
- Os resultados foram verificados com testes unitários (`npm test`) e com o loop de avaliação (`npm run eval`, `npm run eval:robustez`), comparando os alertas com um gabarito de anomalias plantadas.
- As rodadas 1–4 do loop de avaliação, e os ajustes de limiar descritos nelas, foram feitos na sessão de geração assistida. Ajustes feitos pela equipe depois disso entram em `docs/validacao.md` a partir da rodada 5, com o commit de cada um.
- A validação crítica da ideia (`docs/validacao-arena.md`) foi gerada por IA; as decisões sobre o que adotar dela são da equipe.
- _(preencher: alterações feitas manualmente pela equipe após a geração assistida)_

## O que a IA **não** faz dentro da solução

O sistema entregue **não chama nenhum modelo de IA**. Todos os alertas vêm de regras estatísticas explicáveis (médias, mediana/MAD, regressão por blocos, FEFO, curva ABC, similaridade de texto). Por isso, cada alerta pode ser justificado ao usuário.
