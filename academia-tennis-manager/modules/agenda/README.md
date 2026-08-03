# Módulo 09. Agenda

Módulo reservado no escopo oficial. **Ainda não implementado.**

Ao desenvolver este módulo, seguir o padrão do Módulo 01 (`modules/auth`):

- `*.repository.js` — persistência (acesso ao banco).
- `*.service.js` — regras de negócio e validação.
- `*.controller.js` — interface HTTP.
- `*.routes.js` — definição de rotas (protegidas com `requireAuth`).

Reutilizar os componentes de `shared/` e não modificar módulos não
relacionados.
