# Padrão de Interface (UI)

Visual limpo, moderno e responsivo.

## Paleta oficial

| Uso                     | Cor        |
| ----------------------- | ---------- |
| Azul-marinho (primária) | `#102A43`  |
| Branco (base)           | `#FFFFFF`  |

Tons de apoio (derivados, definidos como CSS custom properties em
`assets/css/styles.css`): `--navy-700`, `--navy-500`, `--bg`, `--muted`,
`--border`, `--danger`.

## Princípios

- **Um único ponto de estilo**: todas as cores/raios/sombras vivem como
  variáveis em `:root`. Não repetir valores de cor pelo código.
- **Componentes reutilizáveis**: `.card`, `.field`, `.btn`, `.stat`,
  `.form-error` são reaproveitados entre telas.
- **Templates HTML**: as telas ficam em `<template>` no `index.html` e são
  clonadas pelo `app.js`, evitando duplicação de markup.
- **Responsivo**: layout fluido com breakpoint em 480px.
- **Acessibilidade**: `<label>` associado a cada campo, estados de foco
  visíveis, `aria-busy` no carregamento.

## Estrutura da interface

- `assets/index.html` — casca + templates das telas (setup, login, dashboard).
- `assets/css/styles.css` — estilos e paleta.
- `assets/js/api.js` — cliente HTTP centralizado.
- `assets/js/app.js` — controlador da SPA (decide qual tela exibir).
