# Segurança e uso responsável dos dados

O **AgroSentinela** é um painel web (Next.js) que analisa registros de estoque. Por padrão, os dados ficam **só no navegador** de quem usa. O banco (Supabase) é opcional e usa apenas a chave pública (`anon`). Não há login. A solução não chama nenhum modelo de IA em tempo de execução (ver `IA.md`).

## Verificação executada (24/10/2026)

| Item | Como verificamos | Resultado |
|---|---|---|
| Segredos no repositório | `git grep` por padrões de chave (`sk-…`, JWT `eyJ…`, `AKIA…`, `-----BEGIN`) e conferência do `.gitignore` | Nenhum segredo versionado. `.env*` ignorado; só o `.env.example`, sem valores, está no repositório |
| Dependências | `npm audit --omit=dev` | Next.js atualizado para 15.5.28 (correção da CVE-2025-55182, crítica). Restam: `xlsx` (alta, ver abaixo), `postcss` e `sharp` (altas, vêm dentro do Next.js e não são usados com entrada do usuário) |
| Transporte | Deploy na Netlify | HTTPS por padrão, com HSTS |
| Cabeçalhos HTTP | `netlify.toml` › `[[headers]]` | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (câmera, microfone, localização e pagamento desligados) e `Strict-Transport-Security` |
| Entrada do usuário | Leitura de CSV e XLSX em `src/lib/import.ts` | Arquivo limitado a 15 MB; só os campos conhecidos são lidos; linhas inválidas são rejeitadas com o motivo; nada é executado a partir do conteúdo |

## Riscos (OWASP Top 10, 2021) e a postura adotada

| Risco | Situação no AgroSentinela |
|---|---|
| A01 Controle de acesso | Sem recurso restrito no MVP: cada pessoa vê só os dados do próprio navegador |
| A02 Falhas de criptografia | Tráfego só em HTTPS; nenhum dado sensível é armazenado |
| A03 Injeção | Sem SQL montado a partir de texto; o React escapa todo o texto exibido; a planilha é lida como dado, nunca como código |
| A04 Design inseguro | Minimização de dados: a base tem produto, quantidade, datas e preço; o campo "responsável" é texto livre e a base simulada usa nomes fictícios |
| A05 Configuração | Cabeçalhos de segurança configurados; nenhuma chave privada no cliente |
| A06 Componentes vulneráveis | Auditados acima; o Next.js foi atualizado assim que a Netlify sinalizou a CVE |
| A07 Autenticação | Não se aplica ao MVP (sem login). Em produção, com várias fazendas, entra a autenticação do Supabase com regras por linha (RLS) |
| A08 Integridade | `package-lock.json` versionado; o build roda no CI (GitHub Actions) e na Netlify a partir do mesmo lockfile |
| A09 Logs e monitoramento | Fora do escopo do MVP |
| A10 SSRF | O servidor não busca URLs informadas pelo usuário |

## Limitações conhecidas

- **`xlsx` (SheetJS) do npm** tem dois avisos de segurança sem correção no registro npm: *prototype pollution* e *ReDoS* ao ler planilhas maliciosas. A correção oficial está na versão 0.20.3, distribuída pelo próprio SheetJS em `cdn.sheetjs.com`. A troca está pendente. Até lá, o risco fica limitado assim:
  - a leitura acontece no navegador de quem abriu o próprio arquivo;
  - o arquivo tem limite de 15 MB;
  - só a primeira aba é lida, e só nos campos conhecidos.
- **Sem política de conteúdo (CSP):** o Next.js injeta scripts inline. Configurar uma CSP com *nonce* fica como evolução.
- **Dados no navegador:** limpar os dados do site apaga a base carregada (é possível exportar o CSV na tela *Importar planilha*).

## Dados do desafio

A base oficial é usada só para a demonstração e a avaliação, conforme as orientações da organização (regulamento, seção 6). Não publicamos dados pessoais de terceiros. A base simulada (`data/simulado.csv`) é identificada como **SIMULADA** no arquivo e no aviso fixo do app.
