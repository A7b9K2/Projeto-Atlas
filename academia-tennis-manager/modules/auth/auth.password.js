'use strict';

/**
 * Modulo 01 — Autenticacao :: Hash de senhas.
 *
 * Usa scrypt (nativo do Node) com salt aleatorio por senha.
 * Formato armazenado:  scrypt$N$r$p$<saltHex>$<hashHex>
 *
 * A verificacao usa comparacao em tempo constante (timingSafeEqual).
 */

const crypto = require('node:crypto');

const KEYLEN = 64;
const PARAMS = { N: 16384, r: 8, p: 1 };

function hashSenha(senha) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(senha, salt, KEYLEN, PARAMS);
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$');
}

function verificarSenha(senha, armazenado) {
  if (typeof armazenado !== 'string') return false;
  const parts = armazenado.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, N, r, p, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, 'hex');
  const esperado = Buffer.from(hashHex, 'hex');

  const derived = crypto.scryptSync(senha, salt, esperado.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });

  return crypto.timingSafeEqual(derived, esperado);
}

module.exports = { hashSenha, verificarSenha };
