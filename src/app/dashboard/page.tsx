import { exigirSessao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { StatCard } from "@/components/StatCard";
import { brl as formatarBRL } from "@/lib/financeiro";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const sessao = await exigirSessao();
  const tenant = sessao.academia.id;
  const repo = getRepository();

  const [alunos, turmas, pagamentos, consents, usuarios] = await Promise.all([
    repo.listarAlunos(tenant),
    repo.listarTurmas(tenant),
    repo.listarPagamentos(tenant),
    repo.listarConsents(tenant),
    repo.listarUsuarios(tenant),
  ]);

  const recebido = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + p.valor_centavos, 0);
  const pendente = pagamentos
    .filter((p) => p.status === "pendente" || p.status === "vencido")
    .reduce((s, p) => s + p.valor_centavos, 0);
  const consentimentosPendentes = consents.filter(
    (c) => c.tipo === "parental_menor" && !c.concedido,
  ).length;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Visão geral</h1>
        <p className="text-sm text-slate-500">
          {sessao.academia.nome_fantasia} · {sessao.usuario.papel} · dados semente
          (provider: {repo.provider})
        </p>
      </header>

      {searchParams.erro === "permissao" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          🔒 Seu papel ({sessao.usuario.papel}) não tem permissão para acessar
          aquela área. Acesso bloqueado pelo middleware e pelo RLS.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Alunos ativos" valor={alunos.length} icone="🎾" />
        <StatCard titulo="Turmas" valor={turmas.length} icone="📅" />
        <StatCard
          titulo="Recebido no mês"
          valor={formatarBRL(recebido)}
          detalhe={`${formatarBRL(pendente)} pendente`}
          icone="💰"
        />
        <StatCard titulo="Equipe & usuários" valor={usuarios.length} icone="👥" />
      </div>

      {consentimentosPendentes > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <span className="text-xl">🔒</span>
          <div>
            <p className="font-semibold text-amber-900">
              {consentimentosPendentes} consentimento(s) parental(is) pendente(s)
            </p>
            <p className="text-sm text-amber-700">
              LGPD: menores sem consentimento parental têm processamento de dados
              bloqueado. Regularize em LGPD &amp; Auditoria.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Fase 1 concluída ✅
        </h2>
        <p className="text-sm text-slate-500">
          Auth abstraído (mock ↔ Supabase por env), sessão com contexto de
          tenant/papel/permissões, middleware protegendo rotas com controle por
          papel, e RLS role-aware versionado (migrations 0003 + testes SQL). O
          preview segue no mock, sem chaves. Navegue pelo menu conforme seu papel.
        </p>
      </div>
    </div>
  );
}
