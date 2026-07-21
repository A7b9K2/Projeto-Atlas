/**
 * Implementação MOCK do AtlasRepository — roda o preview sem chaves externas.
 * Simula o isolamento multi-tenant filtrando por tenant_id em toda leitura
 * (no Supabase real esse isolamento é imposto pelo RLS, não pelo app).
 */
import type { AtlasRepository, ConviteUsuario } from "./repository";
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
  Papel,
  PapelPermissao,
  Responsavel,
  SessaoAtual,
  TenantId,
  Turma,
  UserId,
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
    return this.porTenant(this.db.auditLogs, tenant_id)
      .slice()
      .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1));
  }

  async listarPapelPermissoes(tenant_id: TenantId): Promise<PapelPermissao[]> {
    return this.porTenant(this.db.papelPermissoes, tenant_id);
  }

  private auditar(
    tenant_id: TenantId,
    ator_id: UserId,
    acao: string,
    entidade: string,
    entidade_id: string | null,
  ): void {
    this.db.auditLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tenant_id,
      ator_id,
      acao,
      entidade,
      entidade_id,
      criado_em: new Date().toISOString(),
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
}
