/**
 * Contrato da camada de acesso a dados (DAL).
 * O restante do app depende SOMENTE desta interface — nunca de Supabase ou
 * do mock diretamente. Isso permite trocar mock ↔ Supabase por env
 * (SOLID: inversão de dependência).
 */
import type {
  Academia,
  Aluno,
  AuditLog,
  Consent,
  Matricula,
  Mensalidade,
  Responsavel,
  SessaoAtual,
  TenantId,
  Turma,
  Usuario,
} from "@/lib/domain/types";

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
  listarMatriculas(tenant_id: TenantId): Promise<Matricula[]>;
  listarMensalidades(tenant_id: TenantId): Promise<Mensalidade[]>;
  listarConsents(tenant_id: TenantId): Promise<Consent[]>;
  listarAuditLogs(tenant_id: TenantId): Promise<AuditLog[]>;
}
