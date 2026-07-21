/**
 * Tipos de domínio centrais do Atlas.
 * Fonte única de verdade para as entidades do núcleo.
 * Toda entidade multi-tenant carrega `tenant_id` (isolamento vive no banco via RLS).
 */

/** Identificador único de academia (tenant). */
export type TenantId = string;
export type UserId = string;
export type Id = string;

/** Timestamp ISO-8601 (UTC). */
export type IsoDate = string;

/** Papéis do sistema (spec §3). Hierarquia de privilégio decrescente. */
export type Papel =
  | "proprietario"
  | "gestor"
  | "professor"
  | "responsavel"
  | "aluno";

export const PAPEIS: readonly Papel[] = [
  "proprietario",
  "gestor",
  "professor",
  "responsavel",
  "aluno",
] as const;

export interface Academia {
  id: TenantId;
  nome_fantasia: string;
  criada_em: IsoDate;
}

export interface Usuario {
  id: UserId;
  tenant_id: TenantId;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  criado_em: IsoDate;
}

/** Aluno — pode ser menor de idade (dispara requisitos LGPD). */
export interface Aluno {
  id: Id;
  tenant_id: TenantId;
  nome: string;
  data_nascimento: IsoDate;
  /** Derivado de data_nascimento; menores exigem consentimento parental. */
  menor_de_idade: boolean;
  responsavel_id: Id | null;
  ativo: boolean;
  criado_em: IsoDate;
}

export interface Responsavel {
  id: Id;
  tenant_id: TenantId;
  nome: string;
  email: string;
  telefone: string | null;
  criado_em: IsoDate;
}

/** Turma — agrupamento pedagógico recorrente (nível/faixa). */
export interface Turma {
  id: Id;
  tenant_id: TenantId;
  nome: string;
  professor_id: UserId | null;
  capacidade: number;
  criada_em: IsoDate;
}

/** Aula — ocorrência agendada de uma turma na semana. */
export interface Aula {
  id: Id;
  tenant_id: TenantId;
  turma_id: Id;
  /** 0 = domingo … 6 = sábado. */
  dia_semana: number;
  hora_inicio: string; // "HH:MM"
  hora_fim: string; // "HH:MM"
  criada_em: IsoDate;
}

export interface Matricula {
  id: Id;
  tenant_id: TenantId;
  aluno_id: Id;
  turma_id: Id;
  ativa: boolean;
  criada_em: IsoDate;
}

export type StatusPagamento = "pendente" | "pago" | "vencido" | "cancelado";

/** Pagamento / mensalidade de um aluno. */
export interface Pagamento {
  id: Id;
  tenant_id: TenantId;
  aluno_id: Id;
  competencia: string; // "YYYY-MM"
  valor_centavos: number;
  vencimento: IsoDate;
  status: StatusPagamento;
  pago_em: IsoDate | null;
  criado_em: IsoDate;
}

/** Avaliação pedagógica simples de um aluno (módulo pedagógico). */
export interface Avaliacao {
  id: Id;
  tenant_id: TenantId;
  aluno_id: Id;
  professor_id: UserId;
  /** Nota 0–10 por competência técnica avaliada. */
  saque: number;
  forehand: number;
  backhand: number;
  observacoes: string | null;
  avaliado_em: IsoDate;
  criado_em: IsoDate;
}

/** Consentimento LGPD (parental para menores). */
export type TipoConsentimento =
  | "parental_menor"
  | "comunicacao"
  | "uso_imagem"
  | "processamento_ia";

export interface Consent {
  id: Id;
  tenant_id: TenantId;
  aluno_id: Id | null;
  responsavel_id: Id | null;
  tipo: TipoConsentimento;
  concedido: boolean;
  concedido_em: IsoDate | null;
  criado_em: IsoDate;
}

/** Trilha de auditoria LGPD — imutável. */
export interface AuditLog {
  id: Id;
  tenant_id: TenantId;
  ator_id: UserId | null;
  acao: string;
  entidade: string;
  entidade_id: Id | null;
  criado_em: IsoDate;
}

/** Sessão autenticada — espelha o que estaria no JWT do Supabase. */
export interface SessaoAtual {
  usuario: Usuario;
  academia: Academia;
}
