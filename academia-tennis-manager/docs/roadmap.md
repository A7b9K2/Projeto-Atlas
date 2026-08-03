# Roadmap

Desenvolvimento incremental, um módulo por vez. Cada módulo preserva a
arquitetura existente e reutiliza os componentes de `shared/`.

| #  | Módulo               | Status        |
| -- | -------------------- | ------------- |
| 01 | Autenticação         | ✅ Concluído  |
| 02 | Dashboard            | 🟡 Base criada (protegida) |
| 03 | Alunos               | ⬜ Pendente   |
| 04 | Professores          | ⬜ Pendente   |
| 05 | Planos               | ⬜ Pendente   |
| 06 | Financeiro           | ⬜ Pendente   |
| 07 | Check-in / Check-out | ⬜ Pendente   |
| 08 | Turmas               | ⬜ Pendente   |
| 09 | Agenda               | ⬜ Pendente   |
| 10 | Quadras              | ⬜ Pendente   |
| 11 | Relatórios           | ⬜ Pendente   |
| 12 | Configurações        | ⬜ Pendente   |

## Módulo 01 — Autenticação (entregue)

- Cadastro do primeiro administrador na primeira execução.
- Login com "Lembrar acesso".
- Logout com invalidação total da sessão.
- Sessão autenticada persistida no banco + cookie assinado.
- Proteção de rotas (API e interface).
- Recuperação de sessão ao recarregar a página.
- Estrutura preparada para "Esqueci minha senha" (sem envio de e-mail).

## Próximo módulo

O Módulo 02 (Dashboard) já possui uma rota protegida de exemplo em
`modules/dashboard/`, pronta para receber os indicadores reais quando os
módulos de alunos, financeiro e check-in forem implementados.
