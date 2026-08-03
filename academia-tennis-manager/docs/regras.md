# Regras de Negócio

Sistema exclusivo para **uma única academia**. Sem SaaS, multiempresa ou
multi-tenant. Sempre assuma uma única academia utilizando o sistema.

## Módulo 01 — Autenticação

### Administrador inicial

- Na **primeira execução**, se não existir administrador cadastrado, a
  interface exibe automaticamente a tela de criação do primeiro admin.
- Campos: **Nome**, **E-mail**, **Senha**, **Confirmar senha**.
- Após o cadastro, o usuário entra **automaticamente** no Dashboard.
- **Nunca** é permitido criar um segundo administrador inicial: a rota
  `POST /api/auth/setup` retorna `409` se já existir um administrador.

### Validações do cadastro

- Nome com no mínimo 2 caracteres.
- E-mail em formato válido e único.
- Senha com no mínimo 6 caracteres.
- Senha e confirmação devem ser iguais.

### Login

- Campos: **E-mail**, **Senha**, **Lembrar acesso**.
- Credenciais inválidas retornam mensagem genérica (`E-mail ou senha
  inválidos`), sem revelar se o e-mail existe.
- "Lembrar acesso" aumenta a duração da sessão (padrão 30 dias) frente à
  sessão padrão (padrão 120 minutos).

### Sessão e segurança

- Senhas armazenadas com **scrypt** (salt aleatório por senha).
- Sessão persistida na tabela `sessoes`; o cliente recebe um cookie
  **httpOnly** assinado com HMAC.
- **Logout** remove a sessão do banco e limpa o cookie — invalidação total.
- Sessões expiradas são ignoradas e removidas de forma preguiçosa.
- Rotas protegidas exigem sessão válida (`requireAuth`).

### Recuperação de senha

- Estrutura preparada (`POST /api/auth/recuperar-senha`) com resposta neutra.
- O envio de e-mail **não** é implementado neste módulo.
