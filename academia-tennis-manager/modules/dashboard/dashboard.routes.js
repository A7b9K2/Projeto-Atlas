'use strict';

/**
 * Modulo 02 — Dashboard :: Rotas (todas protegidas).
 */

const express = require('express');

const controller = require('./dashboard.controller');
const { requireAuth } = require('../auth/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, controller.resumo);

module.exports = router;
