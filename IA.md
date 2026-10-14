# Declaração de uso de Inteligência Artificial

Conforme a seção 6 do regulamento do AGROHACK 2026/2.

| Ferramenta | Finalidade | Partes apoiadas | Revisão e validação pela equipe |
|---|---|---|---|
| Claude Code (Anthropic, modelo Claude Opus) | Planejamento, geração de código, documentação | Estrutura inicial do projeto, motor de análise (`src/lib/engine`), gerador de dados simulados, loop de avaliação, telas, testes, README e documentos em `docs/` | _(preencher: quem revisou cada parte, o que foi alterado, testes executados)_ |
| _(outras ferramentas, se usadas)_ | | | |

## Como garantimos a compreensão e a autoria

- A equipe revisou o código dos detectores e consegue explicar cada critério e limiar. Eles estão documentados em `docs/criterios-alertas.md` e na tela *Como funciona*.
- Os resultados foram verificados com testes unitários (`npm test`) e com o loop de avaliação (`npm run eval`, `npm run eval:robustez`), comparando os alertas com um gabarito de anomalias plantadas.
- Os limiares foram ajustados pela equipe a partir dos relatórios do loop de avaliação. O histórico está em `docs/validacao.md`.
- _(preencher: alterações feitas manualmente pela equipe após a geração assistida)_

## O que a IA **não** faz dentro da solução

O sistema entregue **não chama nenhum modelo de IA**. Todos os alertas vêm de regras estatísticas explicáveis (médias, mediana/MAD, regressão por blocos, FEFO, curva ABC, similaridade de texto). Por isso, cada alerta pode ser justificado ao usuário.
