'use strict';

/**
 * Cliente HTTP da interface.
 *
 * Centraliza as chamadas a API para evitar duplicacao. Envia/recebe JSON e
 * inclui os cookies de sessao (credentials: 'same-origin').
 */
window.API = (() => {
  async function request(method, url, body) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (body !== undefined) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const message =
        (data && data.erro) || 'Ocorreu um erro. Tente novamente.';
      const error = new Error(message);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  return {
    sessao: () => request('GET', '/api/auth/session'),
    setup: (dados) => request('POST', '/api/auth/setup', dados),
    login: (dados) => request('POST', '/api/auth/login', dados),
    logout: () => request('POST', '/api/auth/logout'),
    recuperarSenha: (email) =>
      request('POST', '/api/auth/recuperar-senha', { email }),
    dashboard: () => request('GET', '/api/dashboard'),
  };
})();
