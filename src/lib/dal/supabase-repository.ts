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
import { criarSupabaseServer } from "@/lib/supabase/server";
import type {
  Academia,
  Aluno,
  Aula,
  AuditLog,
  Avaliacao,
  Consent,
  Matricula,
  Pagamento,
  PapelPermissao,
  Responsavel,
  SessaoAtual,
  Turma,
  Usuario,
} from "@/lib/types";

const NAO_IMPLEMENTADO =
  "SupabaseRepository ainda não implementado no MVP. Use DATA_PROVIDER=mock para o preview.";

export class SupabaseRepository implements AtlasRepository {
  readonly provider = "supabase";

  autenticar(): Promise<SessaoAtual | null> {
    throw new Error(NAO_IMPLEMENTADO);
  }

  /**
   * Onboarding real: chama a função SECURITY DEFINER via RPC (transação única
   * no banco). O usuário já deve estar autenticado (signup no Supabase Auth).
   * Após criar, o app orienta novo login para atualizar o JWT.
   * DÍVIDA TÉCNICA CONSCIENTE: leitura de volta da sessão completa depende do
   * projeto provisionado; aqui garantimos a criação atômica via RPC.
   */
  async criarAcademiaComProprietario(input: {
    nome_fantasia: string;
    nome_usuario: string;
    email: string;
  }): Promise<SessaoAtual> {
    const supabase = criarSupabaseServer();
    const { data: tenantId, error } = await supabase.rpc(
      "criar_academia_com_proprietario",
      {
        nome_fantasia: input.nome_fantasia,
        nome_usuario: input.nome_usuario,
        email: input.email,
      },
    );
    if (error) throw new Error(`Onboarding falhou: ${error.message}`);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Sessão ausente após onboarding.");

    const academia: Academia = {
      id: String(tenantId),
      nome_fantasia: input.nome_fantasia,
      criada_em: new Date().toISOString(),
    };
    const usuario: Usuario = {
      id: user.id,
      tenant_id: String(tenantId),
      nome: input.nome_usuario,
      email: input.email,
      papel: "proprietario",
      ativo: true,
      criado_em: new Date().toISOString(),
    };
    return { usuario, academia };
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
  listarAulas(): Promise<Aula[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarMatriculas(): Promise<Matricula[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarPagamentos(): Promise<Pagamento[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarAvaliacoes(): Promise<Avaliacao[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarConsents(): Promise<Consent[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarAuditLogs(): Promise<AuditLog[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarPapelPermissoes(): Promise<PapelPermissao[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }

  // Gestão de usuários: no Supabase, convite usa Auth Admin API + insert em
  // public.usuarios; mutações passam pelo RLS (proprietario/gestor). Preparado.
  convidarUsuario(): Promise<Usuario> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  alterarPapelUsuario(): Promise<void> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  definirAtivoUsuario(): Promise<void> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  removerUsuario(): Promise<void> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  definirPapelPermissao(): Promise<void> {
    throw new Error(NAO_IMPLEMENTADO);
  }

  // Alunos / responsáveis / consentimentos: mutações passam pelo RLS
  // (tenant + papel) no banco real. Preparado, ativado por env.
  obterAluno(): Promise<Aluno | null> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  criarAluno(): Promise<Aluno> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  atualizarAluno(): Promise<void> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  arquivarAluno(): Promise<void> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  criarResponsavel(): Promise<Responsavel> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  atualizarResponsavel(): Promise<void> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  registrarConsentimento(): Promise<Consent> {
    throw new Error(NAO_IMPLEMENTADO);
  }
  listarConsentsDoAluno(): Promise<Consent[]> {
    throw new Error(NAO_IMPLEMENTADO);
  }
}
