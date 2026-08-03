'use strict';

/**
 * Controlador da interface (SPA minima).
 *
 * Fluxo de recuperacao/protecao de sessao no cliente:
 *  1. Consulta GET /api/auth/session.
 *  2. Sem admin  -> tela de criacao do administrador.
 *  3. Com admin e sem sessao -> tela de login.
 *  4. Autenticado -> dashboard.
 *
 * A protecao real das rotas e feita no servidor; aqui apenas decidimos
 * qual tela renderizar.
 */
(() => {
  const app = document.getElementById('app');

  function render(templateId) {
    const tpl = document.getElementById(templateId);
    app.replaceChildren(tpl.content.cloneNode(true));
  }

  function showError(container, message) {
    const el = container.querySelector('[data-error]');
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function bindValues(values) {
    for (const [key, value] of Object.entries(values)) {
      app
        .querySelectorAll(`[data-bind="${key}"]`)
        .forEach((el) => {
          el.textContent = value === null || value === undefined ? '—' : value;
        });
    }
  }

  async function submit(form, btn, action) {
    btn.disabled = true;
    try {
      await action();
    } catch (err) {
      showError(form, err.message);
      btn.disabled = false;
    }
  }

  // --- Telas ---------------------------------------------------------------

  function renderSetup() {
    render('tpl-setup');
    const form = app.querySelector('[data-form="setup"]');
    const btn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const dados = Object.fromEntries(new FormData(form).entries());
      submit(form, btn, async () => {
        await window.API.setup(dados);
        renderDashboard(); // entra automaticamente no dashboard
      });
    });
  }

  function renderLogin() {
    render('tpl-login');
    const form = app.querySelector('[data-form="login"]');
    const btn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const dados = {
        email: fd.get('email'),
        senha: fd.get('senha'),
        lembrar: fd.get('lembrar') === 'on',
      };
      submit(form, btn, async () => {
        await window.API.login(dados);
        renderDashboard();
      });
    });

    form
      .querySelector('[data-action="recuperar"]')
      .addEventListener('click', async () => {
        const email = form.querySelector('[name="email"]').value.trim();
        if (!email) {
          showError(form, 'Informe seu e-mail para recuperar o acesso.');
          return;
        }
        try {
          const r = await window.API.recuperarSenha(email);
          showError(form, r.mensagem);
        } catch (err) {
          showError(form, err.message);
        }
      });
  }

  async function renderDashboard() {
    render('tpl-dashboard');

    app
      .querySelector('[data-action="logout"]')
      .addEventListener('click', async () => {
        try {
          await window.API.logout();
        } finally {
          boot();
        }
      });

    try {
      const dados = await window.API.dashboard();
      bindValues({
        nome: dados.bemVindo,
        alunosAtivos: dados.indicadores.alunosAtivos,
        recebimentosMes: dados.indicadores.recebimentosMes,
        checkinsHoje: dados.indicadores.checkinsHoje,
      });
    } catch (err) {
      // Sessao perdida entre navegacoes -> volta ao fluxo inicial.
      if (err.status === 401) boot();
    }
  }

  // --- Ponto de entrada ----------------------------------------------------

  async function boot() {
    try {
      const estado = await window.API.sessao();
      if (!estado.adminExiste) return renderSetup();
      if (estado.autenticado) return renderDashboard();
      return renderLogin();
    } catch (_) {
      render('tpl-login');
    }
  }

  boot();
})();
