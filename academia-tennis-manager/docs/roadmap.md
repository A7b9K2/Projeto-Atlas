# Roadmap

Desenvolvimento incremental, um módulo por vez. Cada módulo preserva a
arquitetura existente e reutiliza os componentes de `shared/`.

| #  | Módulo               | Status        |
| -- | -------------------- | ------------- |
| 01 | Autenticação         | ✅ Concluído  |
| 02 | Dashboard            | ✅ Concluído  |
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

## Módulo 02 — Dashboard (entregue)

- Primeira tela após o login, limpa e responsiva.
- Cards: total de alunos, professores cadastrados, turmas ativas, aulas
  realizadas hoje, recebimento do mês e alunos inadimplentes.
- Seções: próximas aulas, últimos alunos cadastrados e atalhos rápidos.
- Dados reais quando as tabelas já existirem; valores padrão caso contrário
  (leitura protegida por verificação de existência de tabela/coluna).
- Base `shared/` ampliada: `components/`, `hooks/`, `services/`, `utils/`,
  `constants/`.

## Próximo módulo

Módulo 03 — Alunos. Ao criar a tabela `alunos` (com `id`, `created_at`,
`updated_at`), o Dashboard passa a exibir os números reais automaticamente.
