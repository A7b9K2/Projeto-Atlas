# Academia Tennis Manager

Sistema de gestão para **uma única academia de tênis**. Projeto independente,
sem SaaS / multiempresa / multi-tenant.

## Requisitos

- Node.js **>= 22.5** (usa `node:sqlite` nativo).

## Como executar

```bash
cd academia-tennis-manager
npm install
cp .env.example .env   # ajuste SESSION_SECRET
npm start
```

Acesse **http://localhost:3000**.

Na primeira execução, como não há administrador cadastrado, a tela de
**criação do primeiro administrador** é exibida automaticamente. Após o
cadastro, você entra direto no Dashboard.

Scripts:

- `npm start` — inicia o servidor.
- `npm run dev` — inicia com recarregamento automático (`node --watch`).
- `npm run migrate` — apenas cria/atualiza o banco.

## Arquitetura

Desenvolvimento **modular**, com separação entre interface, regras de
negócio e persistência.

```
academia-tennis-manager/
├── server.js            # ponto de entrada (Express)
├── shared/              # infraestrutura reutilizável (config, db, sessão, http)
├── modules/             # um diretório por módulo do escopo oficial
│   ├── auth/            # Módulo 01 — Autenticação (implementado)
│   │   ├── auth.repository.js   # persistência
│   │   ├── auth.service.js      # regras de negócio
│   │   ├── auth.controller.js   # interface HTTP
│   │   ├── auth.routes.js       # rotas
│   │   ├── auth.middleware.js   # proteção de rotas
│   │   └── auth.password.js     # hash de senha (scrypt)
│   └── dashboard/       # Módulo 02 — base protegida
├── database/            # schema.sql + migração (banco SQLite local)
├── assets/              # interface (HTML/CSS/JS)
└── docs/                # roadmap, regras, banco, api, padrão de UI
```

Consulte `docs/` para regras de negócio, esquema do banco, contrato da API e
o padrão de interface. As diretrizes permanentes do projeto estão em
`CLAUDE.md`.

## Segurança (Módulo 01)

- Senhas com **scrypt** (salt por senha).
- Sessões persistidas + cookie **httpOnly** assinado (HMAC).
- Rotas protegidas por middleware de autenticação.
- Logout invalida completamente a sessão.
