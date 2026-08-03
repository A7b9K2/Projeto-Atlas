# API

Base: `/api`. Corpo e respostas em **JSON**. A sessão é mantida por cookie
httpOnly assinado (`atm_session`) — envie as requisições com os cookies.

## Autenticação — `/api/auth`

### `GET /api/auth/session`

Retorna o estado de autenticação (usado pela interface para escolher a tela).

```json
{
  "adminExiste": true,
  "autenticado": false,
  "usuario": null
}
```

### `POST /api/auth/setup`

Cria o **primeiro** administrador e já autentica. Falha com `409` se já
existir um administrador.

Corpo: `{ "nome", "email", "senha", "confirmarSenha" }`
Respostas: `201` (criado) · `400` (validação) · `409` (admin já existe).

### `POST /api/auth/login`

Corpo: `{ "email", "senha", "lembrar": true|false }`
Respostas: `200` (autenticado, define cookie) · `401` (credenciais inválidas).

### `POST /api/auth/logout`

Requer sessão. Invalida a sessão e limpa o cookie. Resposta: `200`.

### `POST /api/auth/recuperar-senha`

Estrutura preparada (sem envio de e-mail). Corpo: `{ "email" }`.
Resposta neutra `200` independentemente do e-mail existir.

## Dashboard — `/api/dashboard`

### `GET /api/dashboard`

Requer sessão (`requireAuth`). Retorna um resumo inicial com placeholders
para os próximos módulos.

## Erros

Formato padrão: `{ "erro": "mensagem", "codigo": "CODIGO" }`.
Status usados: `400`, `401`, `403`, `404`, `409`, `500`.
