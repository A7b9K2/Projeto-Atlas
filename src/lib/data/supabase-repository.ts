/**
 * Stub do AtlasRepository apontando para o Supabase real.
 * DÍVIDA TÉCNICA CONSCIENTE (planejada): no MVP este provider ainda não
 * está cabeado ao SDK do Supabase — ele existe para travar o contrato e
 * permitir a troca por env (DATA_PROVIDER=supabase). A implementação real
 * entra quando as migrations forem aplicadas a um projeto Supabase
 * (região South America / São Paulo) com as chaves em .env.
 *
 * O isolamento multi-tenant NÃO é feito aqui: é imposto pelo RLS no banco.
 */
import type { AtlasRepository } from "./repository";
import type {
  Academia,
  Aluno,
  AuditLog,
  Consent,
  Matricula,
  Mensalidade,
  Responsavel,
  SessaoAtual,
  Turma,
  Usuario,
} from "@/lib/domain/types";

const NAO_IMPLEMENTADO =
  "SupabaseRepository ainda não implementado no MVP. Use DATA_PROVIDER=mock para o preview.";

export class SupabaseRepository implements AtlasRepository {
  readonly provider = "supabase";

  autenticar(): Promise<SessaoAtual | null> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  criarAcademiaComProprietario(): Promise<SessaoAtual> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarAcademias(): Promise<Academia[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarUsuarios(): Promise<Usuario[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarAlunos(): Promise<Aluno[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarResponsaveis(): Promise<Responsavel[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarTurmas(): Promise<Turma[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarMatriculas(): Promise<Matricula[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarMensalidades(): Promise<Mensalidade[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarConsents(): Promise<Consent[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarAuditLogs(): Promise<AuditLog[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
}
