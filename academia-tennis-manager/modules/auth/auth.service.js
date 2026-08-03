'use strict';

/**
 * Modulo 01 — Autenticacao :: Regras de negocio.
 *
 * Orquestra validacao, hashing e persistencia. Nao conhece HTTP nem cookies
 * (isso e responsabilidade do controller/sessao).
 */

const { AppError } = require('../../shared/http');
const repo = require('./auth.repository');
const { hashSenha, verificarSenha } = require('./auth.password');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MINIMA = 6;

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validarCadastro({ nome, email, senha, confirmarSenha }) {
  const nomeLimpo = String(nome || '').trim();
  const emailLimpo = normalizarEmail(email);

  if (nomeLimpo.length < 2) {
    throw new AppError(400, 'Informe um nome valido.', 'NOME_INVALIDO');
  }
  if (!EMAIL_REGEX.test(emailLimpo)) {
    throw new AppError(400, 'Informe um e-mail valido.', 'EMAIL_INVALIDO');
  }
  if (String(senha || '').length < SENHA_MINIMA) {
    throw new AppError(
      400,
      `A senha deve ter no minimo ${SENHA_MINIMA} caracteres.`,
      'SENHA_CURTA',
    );
  }
  if (senha !== confirmarSenha) {
    throw new AppError(
      400,
      'As senhas nao conferem.',
      'SENHA_NAO_CONFERE',
    );
  }

  return { nome: nomeLimpo, email: emailLimpo, senha };
}

/**
 * Estado de autenticacao usado pela interface para decidir qual tela exibir.
 */
function obterEstado(user) {
  return {
    adminExiste: repo.existeAdmin(),
    autenticado: Boolean(user),
    usuario: user
      ? { id: user.id, nome: user.nome, email: user.email, papel: user.papel }
      : null,
  };
}

/**
 * Cria o PRIMEIRO administrador do sistema.
 * Regra critica: so e permitido quando ainda NAO existe administrador.
 */
function cadastrarPrimeiroAdmin(dados) {
  if (repo.existeAdmin()) {
    throw new AppError(
      409,
      'Ja existe um administrador cadastrado.',
      'ADMIN_JA_EXISTE',
    );
  }

  const { nome, email, senha } = validarCadastro(dados);

  if (repo.buscarPorEmailComSenha(email)) {
    throw new AppError(409, 'E-mail ja cadastrado.', 'EMAIL_EM_USO');
  }

  const usuario = repo.criarUsuario({
    nome,
    email,
    senhaHash: hashSenha(senha),
    papel: 'admin',
  });

  return usuario;
}

/**
 * Autentica um usuario a partir de e-mail e senha.
 * Mensagem generica para nao revelar se o e-mail existe.
 */
function autenticar({ email, senha }) {
  const emailLimpo = normalizarEmail(email);
  const usuario = repo.buscarPorEmailComSenha(emailLimpo);

  const CREDENCIAIS_INVALIDAS = new AppError(
    401,
    'E-mail ou senha invalidos.',
    'CREDENCIAIS_INVALIDAS',
  );

  if (!usuario || usuario.ativo !== 1) throw CREDENCIAIS_INVALIDAS;
  if (!verificarSenha(String(senha || ''), usuario.senha_hash)) {
    throw CREDENCIAIS_INVALIDAS;
  }

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
  };
}

module.exports = {
  obterEstado,
  cadastrarPrimeiroAdmin,
  autenticar,
};
