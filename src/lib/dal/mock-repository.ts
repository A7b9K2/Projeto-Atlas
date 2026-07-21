/**
 * Implementação MOCK do AtlasRepository — roda o preview sem chaves externas.
 * Simula o isolamento multi-tenant filtrando por tenant_id em toda leitura
 * (no Supabase real esse isolamento é imposto pelo RLS, não pelo app).
 */
import type { AtlasRepository } from "./repository";
import { criarSeed, type SeedData } from "@/mocks/seed";
import type {
  Academia,
  Aluno,
  Aula,
  AuditLog,
  Avaliacao,
  Consent,
  Matricula,
  Pagamento,
  Responsavel,
  SessaoAtual,
  TenantId,
  Turma,
  Usuario,
} from "@/lib/types";
import { logger } from "@/lib/logger";

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
    return this.porTenant(this.db.avaliacoes, tenant_id);
  }

  async listarConsents(tenant_id: TenantId): Promise<Consent[]> {
    return this.porTenant(this.db.consents, tenant_id);
  }

  async listarAuditLogs(tenant_id: TenantId): Promise<AuditLog[]> {
    return this.porTenant(this.db.auditLogs, tenant_id);
  }
}
