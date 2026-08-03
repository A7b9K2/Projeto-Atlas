# Banco de Dados

- Motor: **SQLite** (módulo nativo `node:sqlite`).
- Arquivo padrão: `database/academia.db` (gerado em tempo de execução, fora
  do controle de versão).
- Esquema versionado em `database/schema.sql`, aplicado de forma idempotente
  na inicialização (`shared/db.js`) ou via `npm run migrate`.

## Módulo 01 — Autenticação

### Tabela `usuarios`

| Coluna         | Tipo    | Observações                              |
| -------------- | ------- | ---------------------------------------- |
| id             | INTEGER | PK, autoincremento                       |
| nome           | TEXT    | Não nulo                                 |
| email          | TEXT    | Não nulo, **único**                      |
| senha_hash     | TEXT    | Hash scrypt (`scrypt$N$r$p$salt$hash`)   |
| papel          | TEXT    | Padrão `admin`                           |
| ativo          | INTEGER | 1 = ativo, 0 = inativo                   |
| criado_em      | TEXT    | `datetime('now')`                        |
| atualizado_em  | TEXT    | `datetime('now')`                        |

### Tabela `sessoes`

| Coluna      | Tipo    | Observações                               |
| ----------- | ------- | ----------------------------------------- |
| token       | TEXT    | PK (chave da sessão, entregue via cookie) |
| usuario_id  | INTEGER | FK → `usuarios(id)` `ON DELETE CASCADE`    |
| user_agent  | TEXT    | User-Agent no momento do login            |
| criado_em   | TEXT    | `datetime('now')`                         |
| expira_em   | TEXT    | ISO 8601; sessão inválida após esta data  |

Índices: `idx_usuarios_email`, `idx_sessoes_usuario`, `idx_sessoes_expira`.
