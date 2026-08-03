# shared/

Componentes transversais reutilizados por todos os módulos. Evitam
duplicação de código e concentram decisões de infraestrutura.

- `config.js` — configuração central (lê variáveis de ambiente).
- `db.js` — conexão única com o SQLite e aplicação do schema.
- `session.js` — criação/validação/destruição de sessões e middleware
  `attachSession`.
- `http.js` — `AppError`, respostas JSON padronizadas, `asyncHandler` e o
  tratamento central de erros.

Regra: nenhuma regra de negócio de um módulo específico vive aqui.
