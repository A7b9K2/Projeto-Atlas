'use strict';

/**
 * Modulo 01 — Autenticacao :: Definicao de rotas.
 */

const express = require('express');

const controller = require('./auth.controller');
const { requireAuth } = require('./auth.middleware');

const router = express.Router();

router.get('/session', controller.obterSessao);
router.post('/setup', controller.cadastrarAdmin);
router.post('/login', controller.login);
router.post('/logout', requireAuth, controller.logout);
router.post('/recuperar-senha', controller.recuperarSenha);

module.exports = router;
