# CLAUDE.md

## Projeto

Sistema de gestão para uma academia de tênis.

Projeto totalmente independente.

Nunca utilizar arquivos de outros projetos.

Nunca modificar arquivos externos.

Toda implementação deve permanecer dentro da pasta "academia-tennis-manager".

Sistema exclusivo para apenas uma academia.

Não implementar arquitetura SaaS.

Não implementar multiempresa.

Não implementar multi-tenant.

Sempre assumir que existe apenas uma academia utilizando o sistema.

Objetivos:

- Simplicidade
- Organização
- Performance
- Facilidade de manutenção
- Código limpo

---

## Desenvolvimento

Sempre desenvolver por módulos.

Nunca modificar módulos não relacionados.

Sempre reutilizar componentes internos.

Evitar duplicação de código.

Evitar dependências desnecessárias.

Nunca remover funcionalidades existentes.

Sempre preservar a arquitetura.

Sempre responder utilizando PATCH quando possível.

Nunca recriar arquivos já existentes.

Antes de criar um novo arquivo verificar se ele já existe.

Sempre documentar alterações relevantes.

---

## Escopo Oficial

01. Autenticação

02. Dashboard

03. Alunos

04. Professores

05. Planos

06. Financeiro

07. Check-in / Check-out

08. Turmas

09. Agenda

10. Quadras

11. Relatórios

12. Configurações

Não criar novos módulos sem solicitação.

---

## Leitura de Contexto

Antes de qualquer tarefa:

1. Ler apenas o CLAUDE.md.

2. Ler somente os arquivos envolvidos na alteração.

3. Não abrir outros módulos sem necessidade.

4. Alterar apenas os arquivos necessários.

5. Nunca sair da pasta "academia-tennis-manager".

---

## Persistência

Nunca alterar tabelas existentes sem necessidade.

Sempre criar migrations incrementais.

Nunca apagar dados automaticamente.

Sempre preservar compatibilidade com versões anteriores.

---

## Banco de Dados

Toda tabela deverá possuir obrigatoriamente:

- id
- created_at
- updated_at

Sempre utilizar chaves estrangeiras quando houver relacionamento.

Nunca duplicar informações.

Sempre normalizar o banco quando possível.

Evitar colunas desnecessárias.

---

## Interface

Sempre manter o preview funcionando durante todo o desenvolvimento.

Nunca entregar telas quebradas.

Sempre manter layout responsivo.

Sempre utilizar componentes reutilizáveis.

Seguir a identidade visual oficial:

Azul-marinho #102A43

Branco #FFFFFF

Interface simples, moderna e rápida.

---

## Código

Sempre preferir funções pequenas.

Evitar arquivos muito grandes.

Caso um arquivo ultrapasse aproximadamente 300 linhas, considerar dividi-lo.

Nunca misturar regra de negócio com interface.

Priorizar reutilização de componentes.

Evitar código duplicado.

Manter arquitetura limpa.

---

## Desenvolvimento

Ao finalizar qualquer módulo:

- validar funcionamento

- verificar erros

- corrigir problemas encontrados

- atualizar documentação somente quando necessário

- preservar compatibilidade com módulos anteriores

- nunca quebrar funcionalidades já existentes

---

## Preview

Durante todo o desenvolvimento manter o servidor de desenvolvimento em execução.

Após qualquer alteração validar automaticamente o preview.

Caso alguma alteração impeça o preview de funcionar, corrigir antes de finalizar.

Nunca considerar um módulo concluído se o preview estiver quebrado.
