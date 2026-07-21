/**
 * Contrato da camada de acesso a dados (DAL).
 * O restante do app depende SOMENTE desta interface — nunca de Supabase ou
 * do mock diretamente. Isso permite trocar mock ↔ Supabase por env
 * (SOLID: inversão de dependência).
 */
import type {
  Academia,
  Aluno,
  Aula,
  AuditLog,
  Avaliacao,
  ChamadaAula,
  Consent,
  Id,
  Matricula,
  Pagamento,
  Papel,
  PapelPermissao,
  Presenca,
  Quadra,
  Responsavel,
  SessaoAtual,
  StatusPresenca,
  TenantId,
  TipoQuadra,
  Turma,
  UserId,
  Usuario,
} from "@/lib/types";

export interface QuadraInput {
  nome: string;
  tipo: TipoQuadra;
}
export interface TurmaInput {
  nome: string;
  professor_id: Id | null;
  quadra_id: Id | null;
  capacidade: number;
}
export interface AulaInput {
  turma_id: Id;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}
export interface PresencaInput {
  aula_id: Id;
  data: string;
  aluno_id: Id;
  status: StatusPresenca;
}

/** Dados para convidar um novo usuário. */
export interface ConviteUsuario {
  nome: string;
  email: string;
  papel: Papel;
}

export interface AlunoInput {
  nome: string;
  data_nascimento: string;
  responsavel_id: Id | null;
  foto_url?: string | null;
  observacoes?: string | null;
}

export interface ResponsavelInput {
  nome: string;
  email: string;
  telefone?: string | null;
}

export interface ConsentimentoInput {
  aluno_id: Id;
  responsavel_id: Id | null;
  tipo: import("@/lib/types").TipoConsentimento;
  concedido: boolean;
}

export interface AtlasRepository {
  readonly provider: string;

  /** Auth (no MVP mock, simula o JWT do Supabase com tenant_id + papel). */
  autenticar(email: string): Promise<SessaoAtual | null>;

  /** Onboarding — espelha a função SECURITY DEFINER do banco. */
  criarAcademiaComProprietario(input: {
    nome_fantasia: string;
    nome_usuario: string;
    email: string;
  }): Promise<SessaoAtual>;

  listarAcademias(): Promise<Academia[]>;

  // Todas as leituras abaixo já recebem tenant_id — no Supabase o RLS
  // reforça; no mock filtramos explicitamente para simular o isolamento.
  listarUsuarios(tenant_id: TenantId): Promise<Usuario[]>;
  listarAlunos(tenant_id: TenantId): Promise<Aluno[]>;
  listarResponsaveis(tenant_id: TenantId): Promise<Responsavel[]>;
  listarTurmas(tenant_id: TenantId): Promise<Turma[]>;
  listarAulas(tenant_id: TenantId): Promise<Aula[]>;
  listarMatriculas(tenant_id: TenantId): Promise<Matricula[]>;
  listarPagamentos(tenant_id: TenantId): Promise<Pagamento[]>;
  listarAvaliacoes(tenant_id: TenantId): Promise<Avaliacao[]>;
  listarConsents(tenant_id: TenantId): Promise<Consent[]>;
  listarAuditLogs(tenant_id: TenantId): Promise<AuditLog[]>;
  listarPapelPermissoes(tenant_id: TenantId): Promise<PapelPermissao[]>;

  // ---- Mutações de gestão de usuários (registram auditoria) ----
  // `ator_id` é quem executa a ação (para a trilha de auditoria).
  convidarUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    convite: ConviteUsuario,
  ): Promise<Usuario>;
  alterarPapelUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    usuario_id: UserId,
    papel: Papel,
  ): Promise<void>;
  definirAtivoUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    usuario_id: UserId,
    ativo: boolean,
  ): Promise<void>;
  removerUsuario(
    tenant_id: TenantId,
    ator_id: UserId,
    usuario_id: UserId,
  ): Promise<void>;
  definirPapelPermissao(
    tenant_id: TenantId,
    ator_id: UserId,
    papel: Papel,
    permissao: string,
    concedida: boolean,
  ): Promise<void>;

  // ---- Alunos ----
  obterAluno(tenant_id: TenantId, aluno_id: Id): Promise<Aluno | null>;
  criarAluno(
    tenant_id: TenantId,
    ator_id: UserId,
    input: AlunoInput,
  ): Promise<Aluno>;
  atualizarAluno(
    tenant_id: TenantId,
    ator_id: UserId,
    aluno_id: Id,
    patch: Partial<AlunoInput>,
  ): Promise<void>;
  /** Soft delete: alterna aluno.ativo. */
  arquivarAluno(
    tenant_id: TenantId,
    ator_id: UserId,
    aluno_id: Id,
    arquivado: boolean,
  ): Promise<void>;

  // ---- Responsáveis ----
  criarResponsavel(
    tenant_id: TenantId,
    ator_id: UserId,
    input: ResponsavelInput,
  ): Promise<Responsavel>;
  atualizarResponsavel(
    tenant_id: TenantId,
    ator_id: UserId,
    responsavel_id: Id,
    patch: Partial<ResponsavelInput>,
  ): Promise<void>;

  // ---- Consentimentos (LGPD) — append-only (histórico) ----
  registrarConsentimento(
    tenant_id: TenantId,
    ator_id: UserId,
    input: ConsentimentoInput,
  ): Promise<Consent>;
  listarConsentsDoAluno(tenant_id: TenantId, aluno_id: Id): Promise<Consent[]>;

  // ---- Quadras ----
  listarQuadras(tenant_id: TenantId): Promise<Quadra[]>;
  criarQuadra(tenant_id: TenantId, ator_id: UserId, input: QuadraInput): Promise<Quadra>;
  atualizarQuadra(tenant_id: TenantId, ator_id: UserId, id: Id, patch: Partial<QuadraInput>): Promise<void>;
  arquivarQuadra(tenant_id: TenantId, ator_id: UserId, id: Id, arquivada: boolean): Promise<void>;

  // ---- Turmas ----
  obterTurma(tenant_id: TenantId, id: Id): Promise<Turma | null>;
  criarTurma(tenant_id: TenantId, ator_id: UserId, input: TurmaInput): Promise<Turma>;
  atualizarTurma(tenant_id: TenantId, ator_id: UserId, id: Id, patch: Partial<TurmaInput>): Promise<void>;
  removerTurma(tenant_id: TenantId, ator_id: UserId, id: Id): Promise<void>;

  // ---- Aulas (agendamento com detecção de conflito no backend) ----
  obterAula(tenant_id: TenantId, id: Id): Promise<Aula | null>;
  criarAula(tenant_id: TenantId, ator_id: UserId, input: AulaInput): Promise<Aula>;
  atualizarAula(tenant_id: TenantId, ator_id: UserId, id: Id, patch: Partial<AulaInput>): Promise<void>;
  removerAula(tenant_id: TenantId, ator_id: UserId, id: Id): Promise<void>;

  // ---- Matrículas (controle de vagas) ----
  matricular(tenant_id: TenantId, ator_id: UserId, aluno_id: Id, turma_id: Id): Promise<Matricula>;
  desmatricular(tenant_id: TenantId, ator_id: UserId, matricula_id: Id): Promise<void>;

  // ---- Presença / chamada ----
  obterChamada(tenant_id: TenantId, aula_id: Id, data: string): Promise<ChamadaAula | null>;
  iniciarChamada(tenant_id: TenantId, ator_id: UserId, aula_id: Id, data: string): Promise<ChamadaAula>;
  salvarObservacoesAula(tenant_id: TenantId, ator_id: UserId, aula_id: Id, data: string, observacoes: string | null): Promise<void>;
  registrarPresenca(tenant_id: TenantId, ator_id: UserId, input: PresencaInput): Promise<void>;
  listarPresencas(tenant_id: TenantId, aula_id: Id, data: string): Promise<Presenca[]>;
  listarPresencasDoAluno(tenant_id: TenantId, aluno_id: Id): Promise<Presenca[]>;
}
