'use strict';

/**
 * Academia Tennis Manager — Servidor HTTP.
 *
 * Sistema de gestao para UMA unica academia de tenis (sem multi-tenant).
 * Ponto de entrada que monta a aplicacao Express, aplica middlewares
 * transversais e registra as rotas de cada modulo.
 */

const path = require('node:path');
const express = require('express');

const config = require('./shared/config');
const { getDb } = require('./shared/db');
const { attachSession } = require('./shared/session');
const { errorHandler, sendJson } = require('./shared/http');

const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

// Garante o banco pronto (schema aplicado) antes de aceitar requisicoes.
getDb();

if (config.isDefaultSecret) {
  console.warn(
    '[aviso] SESSION_SECRET nao definido — usando segredo de desenvolvimento. ' +
      'Defina SESSION_SECRET antes de ir para producao.',
  );
}

const app = express();

app.disable('x-powered-by');
app.use(express.json());

// Enriquece a requisicao com req.user / req.session (recuperacao de sessao).
app.use(attachSession);

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api', (req, res) => {
  sendJson(res, 404, { erro: 'Recurso nao encontrado.' });
});

// ---------------------------------------------------------------------------
// Interface (arquivos estaticos + SPA)
// ---------------------------------------------------------------------------
const assetsDir = path.join(config.rootDir, 'assets');
app.use(express.static(assetsDir));

// Fallback SPA: qualquer rota nao-API devolve a interface unica.
app.get('*', (req, res) => {
  res.sendFile(path.join(assetsDir, 'index.html'));
});

// Tratamento central de erros (sempre por ultimo).
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(
    `Academia Tennis Manager rodando em http://localhost:${config.port}`,
  );
});

module.exports = { app, server };
