/**
 * Implementação MOCK do AtlasRepository — roda o preview sem chaves externas.
 * Simula o isolamento multi-tenant filtrando por tenant_id em toda leitura
 * (no Supabase real esse isolamento é imposto pelo RLS, não pelo app).
 */
import type {
  AtlasRepository,
  AlunoInput,
  AulaInput,
  AvaliacaoInput,
  ConsentimentoInput,
  ContratoInput,
  ConviteUsuario,
  PresencaInput,
  QuadraInput,
  ResponsavelInput,
  TurmaInput,
} from "./repository";
import { criarSeed, type SeedData } from "@/mocks/seed";
import type {
  Academia,
  Aluno,
  Aula,
  AuditLog,
  Avaliacao,
  ChamadaAula,
  Consent,
  Contrato,
  Id,
  Matricula,
  MetodoPagamento,
  Pagamento,
  Papel,
  PapelPermissao,
  Presenca,
  Quadra,
  Responsavel,
  SessaoAtual,
  TenantId,
  Turma,
  UserId,
  Usuario,
} from "@/lib/types";
import { logger } from "@/lib/logger";
import { detectarConflitos, vagasRestantes } from "@/lib/agenda";
import { getPaymentGateway } from "@/lib/integrations/payments";

function ehMenor(data_nascimento: string): boolean {
  const nasc = new Date(data_nascimento);
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 18);
  return nasc > limite;
}

/**
 * Relógio monotônico: garante timestamps estritamente crescentes mesmo em
 * escritas no mesmo milissegundo, tornando a ordenação por criado_em estável.
 */
let ultimoTs = 0;
function agoraMs(): number {
  ultimoTs = Math.max(Date.now(), ultimoTs + 1);
  return ultimoTs;
}
function agoraIso(): string {
  return new Date(agoraMs()).toISOString();
}

export class MockRepository implements AtlasRepository {
  readonly provider = "mock";
  private db: SeedData;

  constructor() {
    this.db = criarSeed();
  }

  private porTenant<T extends { tenant_id: TenantId }>(
    lista: T[],
    tenant_id: TenantId,
  ): T[] {
    return lista.filter((item) => item.tenant_id === tenant_id);
  }

  async autenticar(email: string): Promise<SessaoAtual | null> {
    const usuario = this.db.usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.ativo,
    );
    if (!usuario) return null;
    const academia = this.db.academias.find((a) => a.id === usuario.tenant_id);
    if (!academia) return null;
    return { usuario, academia };
  }

  async criarAcademiaComProprietario(input: {
    nome_fantasia: string;
    nome_usuario: string;
    email: string;
  }): Promise<SessaoAtual> {
    const now = new Date().toISOString();
    const tenant_id = `acad-${Date.now()}`;
    const academia: Academia = {
      id: tenant_id,
      nome_fantasia: input.nome_fantasia,
      criada_em: now,
    };
    const usuario: Usuario = {
      id: `u-${Date.now()}`,
      tenant_id,
      nome: input.nome_usuario,
      email: input.email,
      papel: "proprietario",
      ativo: true,
      criado_em: now,
    };
    this.db.academias.push(academia);
    this.db.usuarios.push(usuario);
    this.db.auditLogs.push({
      id: `log-${Date.now()}`,
      tenant_id,
      ator_id: usuario.id,
      acao: "academia.criada",
      entidade: "academia",
      entidade_id: tenant_id,
      criado_em: now,
    });
    logger.info("onboarding.criarAcademiaComProprietario (mock)", {
      tenant_id,
      email: input.email,
    });
    return { usuario, academia };
  }

  async listarAcademias(): Promise<Academia[]> {
    return [...this.db.academias];
  }

  async listarUsuarios(tenant_id: TenantId): Promise<Usuario[]> {
    return this.porTenant(this.db.usuarios, tenant_id);
  }

  async listarAlunos(tenant_id: TenantId): Promise<Aluno[]> {
    return this.porTenant(this.db.alunos, tenant_id);
  }

  async listarResponsaveis(tenant_id: TenantId): Promise<Responsavel[]> {
    return this.porTenant(this.db.responsaveis, tenant_id);
  }

  async listarTurmas(tenant_id: TenantId): Promise<Turma[]> {
    return this.porTenant(this.db.turmas, tenant_id);
  }

  async listarAulas(tenant_id: TenantId): Promise<Aula[]> {
    return this.porTenant(this.db.aulas, tenant_id);
  }

  async listarMatriculas(tenant_id: TenantId): Promise<Matricula[]> {
    return this.porTenant(this.db.matriculas, tenant_id);
  }

  async listarPagamentos(tenant_id: TenantId): Promise<Pagamento[]> {
    return this.porTenant(this.db.pagamentos, tenant_id);
  }

  async listarAvaliacoes(tenant_id: TenantId): Promise<Avaliacao[]> {
    return this.porTenant(this.db.avaliacoes, tenant_id)
      .slice()
      .sort((a, b) => (a.avaliado_em < b.avaliado_em ? 1 : -1));
  }

  async listarAvaliacoesDoAluno(
    tenant_id: TenantId,
    aluno_id: Id,
  ): Promise<Avaliacao[]> {
    return this.porTenant(this.db.avaliacoes, tenant_id)
      .filter((a) => a.aluno_id === aluno_id)
      .sort((a, b) => (a.avaliado_em < b.avaliado_em ? 1 : -1));
  }

  async criarAvaliacao(
    tenant_id: TenantId,
    ator_id: UserId,
    input: AvaliacaoInput,
  ): Promise<Avaliacao> {
    const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));
    const avaliacao: Avaliacao = {
      id: `av-${agoraMs()}`,
      tenant_id,
      aluno_id: input.aluno_id,
      professor_id: ator_id,
      saque: clamp(input.saque),
      forehand: clamp(input.forehand),
      backhand: clamp(input.backhand),
      observacoes: input.observacoes ?? null,
      avaliado_em: input.avaliado_em ?? new Date().toISOString().slice(0, 10),
      criado_em: agoraIso(),
    };
    this.db.avaliacoes.push(avaliacao);
    this.auditar(tenant_id, ator_id, "avaliacao.criada", "avaliacao", avaliacao.id);
    return avaliacao;
  }

  async listarConsents(tenant_id: TenantId): Promise<Consent[]> {
    return this.porTenant(this.db.consents, tenant_id);
  }

  async listarAuditLogs(tenant_id: TenantId): Promise<AuditLog[]> {
    return this.porTenant(this.db.auditLogs, tenant_id)
      .slice()
      .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
  }

  async listarPapelPermissoes(tenant_id: TenantId): Promise<PapelPermissao[]> {
    return this.porTenant(this.db.papelPermissoes, tenant_id);
  }

  async registrarComunicacao(
    tenant_id: TenantId,
    ator_id: UserId,
    canal: string,
    destinatario: string,
  ): Promise<void> {
    this.auditar(
      tenant_id,
      ator_id,
      "comunicacao.enviada",
      "comunicacao",
      `${canal}:${destinatario}`,
    );
  }

  private auditar(
    tenant_id: TenantId,
    ator_id: UserId,
    acao: string,
    entidade: string,
    entidade_id: string | null,
  ): void {
    this.db.auditLogs.push({
      id: `log-${agoraMs()}-${Math.random().toString(36).slice(2, 7)}`,
      tenant_id,
      ator_id,
      acao,
      entidade,
      entidade_id,
      criado_em: agoraIso(),
    });
  }

  private acharUsuario(tenant_id: TenantId, usuario_id: UserId): Usuario {
    const u = this.db.usuarios.find(
      (x) => x.id === usuario_id && x.tenant_id === tenant_id,
    );
    if (!u) throw new Error("Usuário não encontrado no tenant.");
    return u;
  }

  async convidarUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    convite: ConviteUsuario,
  ): Promise<Usuario> {
    const email = convite.email.trim().toLowerCase();
    if (
      this.db.usuarios.some(
        (u) => u.tenant_id === tenant_id && u.email.toLowerCase() === email,
      )
    ) {
      throw new Error("Já existe um usuário com esse e-mail nesta academia.");
    }
    const usuario: Usuario = {
      id: `u-${Date.now()}`,
      tenant_id,
      nome: convite.nome.trim(),
      email: convite.email.trim(),
      papel: convite.papel,
      ativo: true,
      criado_em: new Date().toISOString(),
    };
    this.db.usuarios.push(usuario);
    this.auditar(tenant_id, ator_id, "usuario.convidado", "usuario", usuario.id);
    logger.info("usuarios.convidar (mock)", { tenant_id, papel: convite.papel });
    return usuario;
  }

  async alterarPapelUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    usuario_id: UserId,
    papel: Papel,
  ): Promise<void> {
    if (ator_id === usuario_id) {
      throw new Error("Você não pode alterar o próprio papel.");
    }
    const u = this.acharUsuario(tenant_id, usuario_id);
    if (u.papel === "proprietario" && papel !== "proprietario") {
      const outrosProps = this.db.usuarios.filter(
        (x) =>
          x.tenant_id === tenant_id &&
          x.papel === "proprietario" &&
          x.id !== usuario_id,
      );
      if (outrosProps.length === 0) {
        throw new Error("A academia deve ter ao menos um proprietário.");
      }
    }
    u.papel = papel;
    this.auditar(tenant_id, ator_id, "usuario.papel_alterado", "usuario", usuario_id);
  }

  async definirAtivoUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    usuario_id: UserId,
    ativo: boolean,
  ): Promise<void> {
    if (ator_id === usuario_id && !ativo) {
      throw new Error("Você não pode inativar a si mesmo.");
    }
    const u = this.acharUsuario(tenant_id, usuario_id);
    u.ativo = ativo;
    this.auditar(
      tenant_id,
      ator_id,
      ativo ? "usuario.ativado" : "usuario.inativado",
      "usuario",
      usuario_id,
    );
  }

  async removerUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    usuario_id: UserId,
  ): Promise<void> {
    if (ator_id === usuario_id) {
      throw new Error("Você não pode remover a si mesmo.");
    }
    const u = this.acharUsuario(tenant_id, usuario_id);
    if (u.papel === "proprietario") {
      const outrosProps = this.db.usuarios.filter(
        (x) =>
          x.tenant_id === tenant_id &&
          x.papel === "proprietario" &&
          x.id !== usuario_id,
      );
      if (outrosProps.length === 0) {
        throw new Error("Não é possível remover o único proprietário.");
      }
    }
    this.db.usuarios = this.db.usuarios.filter((x) => x.id !== usuario_id);
    this.auditar(tenant_id, ator_id, "usuario.removido", "usuario", usuario_id);
  }

  async definirPapelPermissao(
    tenant_id: TenantId,
    ator_id: UserId,
    papel: Papel,
    permissao: string,
    concedida: boolean,
  ): Promise<void> {
    const existente = this.db.papelPermissoes.find(
      (p) =>
        p.tenant_id === tenant_id &&
        p.papel === papel &&
        p.permissao === permissao,
    );
    if (existente) existente.concedida = concedida;
    else
      this.db.papelPermissoes.push({ tenant_id, papel, permissao, concedida });
    this.auditar(
      tenant_id,
      ator_id,
      "permissao.alterada",
      "papel_permissoes",
      `${papel}:${permissao}`,
    );
  }

  // ---------- Alunos ----------
  async obterAluno(tenant_id: TenantId, aluno_id: Id): Promise<Aluno | null> {
    return (
      this.db.alunos.find(
        (a) => a.id === aluno_id && a.tenant_id === tenant_id,
      ) ?? null
    );
  }

  async criarAluno(
    tenant_id: TenantId,
    ator_id: UserId,
    input: AlunoInput,
  ): Promise<Aluno> {
    const aluno: Aluno = {
      id: `a-${Date.now()}`,
      tenant_id,
      nome: input.nome.trim(),
      data_nascimento: input.data_nascimento,
      menor_de_idade: ehMenor(input.data_nascimento),
      responsavel_id: input.responsavel_id,
      foto_url: input.foto_url ?? null,
      observacoes: input.observacoes ?? null,
      ativo: true,
      criado_em: new Date().toISOString(),
    };
    this.db.alunos.push(aluno);
    this.auditar(tenant_id, ator_id, "aluno.criado", "aluno", aluno.id);
    logger.info("alunos.criar (mock)", { tenant_id, menor: aluno.menor_de_idade });
    return aluno;
  }

  async atualizarAluno(
    tenant_id: TenantId,
    ator_id: UserId,
    aluno_id: Id,
    patch: Partial<AlunoInput>,
  ): Promise<void> {
    const a = this.db.alunos.find(
      (x) => x.id === aluno_id && x.tenant_id === tenant_id,
    );
    if (!a) throw new Error("Aluno não encontrado no tenant.");
    if (patch.nome !== undefined) a.nome = patch.nome.trim();
    if (patch.data_nascimento !== undefined) {
      a.data_nascimento = patch.data_nascimento;
      a.menor_de_idade = ehMenor(patch.data_nascimento);
    }
    if (patch.responsavel_id !== undefined) a.responsavel_id = patch.responsavel_id;
    if (patch.foto_url !== undefined) a.foto_url = patch.foto_url;
    if (patch.observacoes !== undefined) a.observacoes = patch.observacoes;
    this.auditar(tenant_id, ator_id, "aluno.atualizado", "aluno", aluno_id);
  }

  async arquivarAluno(
    tenant_id: TenantId,
    ator_id: UserId,
    aluno_id: Id,
    arquivado: boolean,
  ): Promise<void> {
    const a = this.db.alunos.find(
      (x) => x.id === aluno_id && x.tenant_id === tenant_id,
    );
    if (!a) throw new Error("Aluno não encontrado no tenant.");
    a.ativo = !arquivado;
    this.auditar(
      tenant_id,
      ator_id,
      arquivado ? "aluno.arquivado" : "aluno.reativado",
      "aluno",
      aluno_id,
    );
  }

  // ---------- Responsáveis ----------
  async criarResponsavel(
    tenant_id: TenantId,
    ator_id: UserId,
    input: ResponsavelInput,
  ): Promise<Responsavel> {
    const resp: Responsavel = {
      id: `r-${Date.now()}`,
      tenant_id,
      nome: input.nome.trim(),
      email: input.email.trim(),
      telefone: input.telefone ?? null,
      criado_em: new Date().toISOString(),
    };
    this.db.responsaveis.push(resp);
    this.auditar(tenant_id, ator_id, "responsavel.criado", "responsavel", resp.id);
    return resp;
  }

  async atualizarResponsavel(
    tenant_id: TenantId,
    ator_id: UserId,
    responsavel_id: Id,
    patch: Partial<ResponsavelInput>,
  ): Promise<void> {
    const r = this.db.responsaveis.find(
      (x) => x.id === responsavel_id && x.tenant_id === tenant_id,
    );
    if (!r) throw new Error("Responsável não encontrado no tenant.");
    if (patch.nome !== undefined) r.nome = patch.nome.trim();
    if (patch.email !== undefined) r.email = patch.email.trim();
    if (patch.telefone !== undefined) r.telefone = patch.telefone;
    this.auditar(
      tenant_id,
      ator_id,
      "responsavel.atualizado",
      "responsavel",
      responsavel_id,
    );
  }

  // ---------- Consentimentos (append-only) ----------
  async registrarConsentimento(
    tenant_id: TenantId,
    ator_id: UserId,
    input: ConsentimentoInput,
  ): Promise<Consent> {
    const consent: Consent = {
      id: `c-${agoraMs()}`,
      tenant_id,
      aluno_id: input.aluno_id,
      responsavel_id: input.responsavel_id,
      tipo: input.tipo,
      concedido: input.concedido,
      concedido_em: input.concedido ? agoraIso() : null,
      criado_em: agoraIso(),
    };
    this.db.consents.push(consent);
    this.auditar(
      tenant_id,
      ator_id,
      input.concedido ? "consentimento.concedido" : "consentimento.revogado",
      "consent",
      input.aluno_id,
    );
    return consent;
  }

  async listarConsentsDoAluno(
    tenant_id: TenantId,
    aluno_id: Id,
  ): Promise<Consent[]> {
    return this.porTenant(this.db.consents, tenant_id)
      .filter((c) => c.aluno_id === aluno_id)
      .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
  }

  // ---------- Quadras ----------
  async listarQuadras(tenant_id: TenantId): Promise<Quadra[]> {
    return this.porTenant(this.db.quadras, tenant_id);
  }

  async criarQuadra(
    tenant_id: TenantId,
    ator_id: UserId,
    input: QuadraInput,
  ): Promise<Quadra> {
    const quadra: Quadra = {
      id: `q-${agoraMs()}`,
      tenant_id,
      nome: input.nome.trim(),
      tipo: input.tipo,
      ativa: true,
      criada_em: agoraIso(),
    };
    this.db.quadras.push(quadra);
    this.auditar(tenant_id, ator_id, "quadra.criada", "quadra", quadra.id);
    return quadra;
  }

  async atualizarQuadra(
    tenant_id: TenantId,
    ator_id: UserId,
    id: Id,
    patch: Partial<QuadraInput>,
  ): Promise<void> {
    const q = this.db.quadras.find((x) => x.id === id && x.tenant_id === tenant_id);
    if (!q) throw new Error("Quadra não encontrada no tenant.");
    if (patch.nome !== undefined) q.nome = patch.nome.trim();
    if (patch.tipo !== undefined) q.tipo = patch.tipo;
    this.auditar(tenant_id, ator_id, "quadra.atualizada", "quadra", id);
  }

  async arquivarQuadra(
    tenant_id: TenantId,
    ator_id: UserId,
    id: Id,
    arquivada: boolean,
  ): Promise<void> {
    const q = this.db.quadras.find((x) => x.id === id && x.tenant_id === tenant_id);
    if (!q) throw new Error("Quadra não encontrada no tenant.");
    q.ativa = !arquivada;
    this.auditar(
      tenant_id,
      ator_id,
      arquivada ? "quadra.arquivada" : "quadra.reativada",
      "quadra",
      id,
    );
  }

  // ---------- Turmas ----------
  async obterTurma(tenant_id: TenantId, id: Id): Promise<Turma | null> {
    return this.db.turmas.find((t) => t.id === id && t.tenant_id === tenant_id) ?? null;
  }

  async criarTurma(
    tenant_id: TenantId,
    ator_id: UserId,
    input: TurmaInput,
  ): Promise<Turma> {
    const turma: Turma = {
      id: `t-${agoraMs()}`,
      tenant_id,
      nome: input.nome.trim(),
      professor_id: input.professor_id,
      quadra_id: input.quadra_id,
      capacidade: input.capacidade,
      criada_em: agoraIso(),
    };
    this.db.turmas.push(turma);
    this.auditar(tenant_id, ator_id, "turma.criada", "turma", turma.id);
    return turma;
  }

  async atualizarTurma(
    tenant_id: TenantId,
    ator_id: UserId,
    id: Id,
    patch: Partial<TurmaInput>,
  ): Promise<void> {
    const t = this.db.turmas.find((x) => x.id === id && x.tenant_id === tenant_id);
    if (!t) throw new Error("Turma não encontrada no tenant.");
    if (patch.nome !== undefined) t.nome = patch.nome.trim();
    if (patch.professor_id !== undefined) t.professor_id = patch.professor_id;
    if (patch.quadra_id !== undefined) t.quadra_id = patch.quadra_id;
    if (patch.capacidade !== undefined) t.capacidade = patch.capacidade;
    this.auditar(tenant_id, ator_id, "turma.atualizada", "turma", id);
  }

  async removerTurma(tenant_id: TenantId, ator_id: UserId, id: Id): Promise<void> {
    const existe = this.db.turmas.some((x) => x.id === id && x.tenant_id === tenant_id);
    if (!existe) throw new Error("Turma não encontrada no tenant.");
    this.db.turmas = this.db.turmas.filter((x) => x.id !== id);
    this.db.aulas = this.db.aulas.filter((x) => x.turma_id !== id);
    this.db.matriculas = this.db.matriculas.filter((x) => x.turma_id !== id);
    this.auditar(tenant_id, ator_id, "turma.removida", "turma", id);
  }

  // ---------- Aulas (com detecção de conflito) ----------
  async obterAula(tenant_id: TenantId, id: Id): Promise<Aula | null> {
    return this.db.aulas.find((a) => a.id === id && a.tenant_id === tenant_id) ?? null;
  }

  private validarConflitos(
    tenant_id: TenantId,
    candidata: AulaInput & { id?: string },
  ): void {
    const aulas = this.porTenant(this.db.aulas, tenant_id);
    const turmas = this.porTenant(this.db.turmas, tenant_id);
    const matriculas = this.porTenant(this.db.matriculas, tenant_id);
    const conflitos = detectarConflitos(candidata, aulas, turmas, matriculas);
    if (conflitos.length > 0) {
      const tipos = Array.from(new Set(conflitos.map((c) => c.tipo)));
      throw new Error(`Conflito de agendamento (${tipos.join(", ")}): ${conflitos[0]!.detalhe}`);
    }
  }

  async criarAula(
    tenant_id: TenantId,
    ator_id: UserId,
    input: AulaInput,
  ): Promise<Aula> {
    this.validarConflitos(tenant_id, input);
    const aula: Aula = {
      id: `au-${agoraMs()}`,
      tenant_id,
      turma_id: input.turma_id,
      dia_semana: input.dia_semana,
      hora_inicio: input.hora_inicio,
      hora_fim: input.hora_fim,
      criada_em: agoraIso(),
    };
    this.db.aulas.push(aula);
    this.auditar(tenant_id, ator_id, "aula.criada", "aula", aula.id);
    return aula;
  }

  async atualizarAula(
    tenant_id: TenantId,
    ator_id: UserId,
    id: Id,
    patch: Partial<AulaInput>,
  ): Promise<void> {
    const a = this.db.aulas.find((x) => x.id === id && x.tenant_id === tenant_id);
    if (!a) throw new Error("Aula não encontrada no tenant.");
    const candidata: AulaInput & { id: string } = {
      id,
      turma_id: patch.turma_id ?? a.turma_id,
      dia_semana: patch.dia_semana ?? a.dia_semana,
      hora_inicio: patch.hora_inicio ?? a.hora_inicio,
      hora_fim: patch.hora_fim ?? a.hora_fim,
    };
    this.validarConflitos(tenant_id, candidata);
    a.turma_id = candidata.turma_id;
    a.dia_semana = candidata.dia_semana;
    a.hora_inicio = candidata.hora_inicio;
    a.hora_fim = candidata.hora_fim;
    this.auditar(tenant_id, ator_id, "aula.atualizada", "aula", id);
  }

  async removerAula(tenant_id: TenantId, ator_id: UserId, id: Id): Promise<void> {
    const existe = this.db.aulas.some((x) => x.id === id && x.tenant_id === tenant_id);
    if (!existe) throw new Error("Aula não encontrada no tenant.");
    this.db.aulas = this.db.aulas.filter((x) => x.id !== id);
    this.auditar(tenant_id, ator_id, "aula.removida", "aula", id);
  }

  // ---------- Matrículas (controle de vagas) ----------
  async matricular(
    tenant_id: TenantId,
    ator_id: UserId,
    aluno_id: Id,
    turma_id: Id,
  ): Promise<Matricula> {
    const turma = this.db.turmas.find((t) => t.id === turma_id && t.tenant_id === tenant_id);
    if (!turma) throw new Error("Turma não encontrada no tenant.");
    if (
      this.db.matriculas.some(
        (m) => m.turma_id === turma_id && m.aluno_id === aluno_id && m.ativa,
      )
    ) {
      throw new Error("Aluno já matriculado nesta turma.");
    }
    if (vagasRestantes(turma, this.porTenant(this.db.matriculas, tenant_id)) <= 0) {
      throw new Error("Turma sem vagas disponíveis.");
    }
    const matricula: Matricula = {
      id: `m-${agoraMs()}`,
      tenant_id,
      aluno_id,
      turma_id,
      ativa: true,
      criada_em: agoraIso(),
    };
    this.db.matriculas.push(matricula);
    this.auditar(tenant_id, ator_id, "matricula.criada", "matricula", matricula.id);
    return matricula;
  }

  async desmatricular(
    tenant_id: TenantId,
    ator_id: UserId,
    matricula_id: Id,
  ): Promise<void> {
    const m = this.db.matriculas.find(
      (x) => x.id === matricula_id && x.tenant_id === tenant_id,
    );
    if (!m) throw new Error("Matrícula não encontrada no tenant.");
    m.ativa = false;
    this.auditar(tenant_id, ator_id, "matricula.cancelada", "matricula", matricula_id);
  }

  // ---------- Presença / chamada ----------
  async obterChamada(
    tenant_id: TenantId,
    aula_id: Id,
    data: string,
  ): Promise<ChamadaAula | null> {
    return (
      this.db.chamadas.find(
        (c) => c.tenant_id === tenant_id && c.aula_id === aula_id && c.data === data,
      ) ?? null
    );
  }

  async iniciarChamada(
    tenant_id: TenantId,
    ator_id: UserId,
    aula_id: Id,
    data: string,
  ): Promise<ChamadaAula> {
    let chamada = await this.obterChamada(tenant_id, aula_id, data);
    if (!chamada) {
      chamada = {
        id: `ch-${agoraMs()}`,
        tenant_id,
        aula_id,
        data,
        observacoes: null,
        iniciada_em: agoraIso(),
        criado_em: agoraIso(),
      };
      this.db.chamadas.push(chamada);
      this.auditar(tenant_id, ator_id, "chamada.iniciada", "chamada", chamada.id);
    } else if (!chamada.iniciada_em) {
      chamada.iniciada_em = agoraIso();
    }
    return chamada;
  }

  async salvarObservacoesAula(
    tenant_id: TenantId,
    ator_id: UserId,
    aula_id: Id,
    data: string,
    observacoes: string | null,
  ): Promise<void> {
    const chamada = await this.iniciarChamada(tenant_id, ator_id, aula_id, data);
    chamada.observacoes = observacoes;
    this.auditar(tenant_id, ator_id, "chamada.observacoes", "chamada", chamada.id);
  }

  async registrarPresenca(
    tenant_id: TenantId,
    ator_id: UserId,
    input: PresencaInput,
  ): Promise<void> {
    await this.iniciarChamada(tenant_id, ator_id, input.aula_id, input.data);
    const existente = this.db.presencas.find(
      (p) =>
        p.tenant_id === tenant_id &&
        p.aula_id === input.aula_id &&
        p.data === input.data &&
        p.aluno_id === input.aluno_id,
    );
    if (existente) {
      existente.status = input.status;
    } else {
      this.db.presencas.push({
        id: `pr-${agoraMs()}`,
        tenant_id,
        aula_id: input.aula_id,
        data: input.data,
        aluno_id: input.aluno_id,
        status: input.status,
        criado_em: agoraIso(),
      });
    }
    this.auditar(tenant_id, ator_id, "presenca.registrada", "presenca", input.aluno_id);
  }

  async listarPresencas(
    tenant_id: TenantId,
    aula_id: Id,
    data: string,
  ): Promise<Presenca[]> {
    return this.db.presencas.filter(
      (p) => p.tenant_id === tenant_id && p.aula_id === aula_id && p.data === data,
    );
  }

  async listarPresencasDoAluno(
    tenant_id: TenantId,
    aluno_id: Id,
  ): Promise<Presenca[]> {
    return this.db.presencas
      .filter((p) => p.tenant_id === tenant_id && p.aluno_id === aluno_id)
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  }

  // ---------- Financeiro ----------
  async listarContratos(tenant_id: TenantId): Promise<Contrato[]> {
    return this.porTenant(this.db.contratos, tenant_id);
  }

  async criarContrato(
    tenant_id: TenantId,
    ator_id: UserId,
    input: ContratoInput,
  ): Promise<Contrato> {
    const contrato: Contrato = {
      id: `ct-${agoraMs()}`,
      tenant_id,
      aluno_id: input.aluno_id,
      descricao: input.descricao.trim(),
      valor_centavos: input.valor_centavos,
      dia_vencimento: input.dia_vencimento,
      inicio: input.inicio,
      fim: null,
      ativo: true,
      criado_em: agoraIso(),
    };
    this.db.contratos.push(contrato);
    this.auditar(tenant_id, ator_id, "contrato.criado", "contrato", contrato.id);
    return contrato;
  }

  async encerrarContrato(
    tenant_id: TenantId,
    ator_id: UserId,
    contrato_id: Id,
    fim: string,
  ): Promise<void> {
    const c = this.db.contratos.find((x) => x.id === contrato_id && x.tenant_id === tenant_id);
    if (!c) throw new Error("Contrato não encontrado no tenant.");
    c.ativo = false;
    c.fim = fim;
    this.auditar(tenant_id, ator_id, "contrato.encerrado", "contrato", contrato_id);
  }

  async listarPagamentosDoAluno(
    tenant_id: TenantId,
    aluno_id: Id,
  ): Promise<Pagamento[]> {
    return this.porTenant(this.db.pagamentos, tenant_id)
      .filter((p) => p.aluno_id === aluno_id)
      .sort((a, b) => (a.competencia < b.competencia ? 1 : -1));
  }

  async gerarMensalidades(
    tenant_id: TenantId,
    ator_id: UserId,
    competencia: string,
  ): Promise<number> {
    const contratos = this.porTenant(this.db.contratos, tenant_id).filter(
      (c) => c.ativo && c.inicio <= competencia && (!c.fim || c.fim >= competencia),
    );
    let gerados = 0;
    for (const c of contratos) {
      const existe = this.db.pagamentos.some(
        (p) =>
          p.tenant_id === tenant_id &&
          p.contrato_id === c.id &&
          p.competencia === competencia,
      );
      if (existe) continue; // idempotente
      const dia = String(c.dia_vencimento).padStart(2, "0");
      this.db.pagamentos.push({
        id: `pg-${agoraMs()}`,
        tenant_id,
        aluno_id: c.aluno_id,
        contrato_id: c.id,
        competencia,
        valor_centavos: c.valor_centavos,
        vencimento: `${competencia}-${dia}`,
        status: "pendente",
        metodo: null,
        id_externo: null,
        pago_em: null,
        criado_em: agoraIso(),
      });
      gerados++;
    }
    this.auditar(tenant_id, ator_id, "mensalidades.geradas", "pagamento", competencia);
    return gerados;
  }

  async emitirCobranca(
    tenant_id: TenantId,
    ator_id: UserId,
    pagamento_id: Id,
    metodo: MetodoPagamento,
  ): Promise<void> {
    const p = this.db.pagamentos.find((x) => x.id === pagamento_id && x.tenant_id === tenant_id);
    if (!p) throw new Error("Pagamento não encontrado no tenant.");
    const cobranca = await getPaymentGateway().criarCobranca({
      tenant_id,
      aluno_id: p.aluno_id,
      valor_centavos: p.valor_centavos,
      metodo,
      descricao: `Mensalidade ${p.competencia}`,
    });
    p.metodo = metodo;
    p.id_externo = cobranca.id_externo;
    this.auditar(tenant_id, ator_id, "cobranca.emitida", "pagamento", pagamento_id);
  }

  async registrarPagamento(
    tenant_id: TenantId,
    ator_id: UserId,
    pagamento_id: Id,
    pago: boolean,
  ): Promise<void> {
    const p = this.db.pagamentos.find((x) => x.id === pagamento_id && x.tenant_id === tenant_id);
    if (!p) throw new Error("Pagamento não encontrado no tenant.");
    p.status = pago ? "pago" : "pendente";
    p.pago_em = pago ? agoraIso() : null;
    this.auditar(
      tenant_id,
      ator_id,
      pago ? "pagamento.confirmado" : "pagamento.reaberto",
      "pagamento",
      pagamento_id,
    );
  }

  async cancelarPagamento(
    tenant_id: TenantId,
    ator_id: UserId,
    pagamento_id: Id,
  ): Promise<void> {
    const p = this.db.pagamentos.find((x) => x.id === pagamento_id && x.tenant_id === tenant_id);
    if (!p) throw new Error("Pagamento não encontrado no tenant.");
    p.status = "cancelado";
    this.auditar(tenant_id, ator_id, "pagamento.cancelado", "pagamento", pagamento_id);
  }
}
