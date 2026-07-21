import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { idade, statusConsentimento, bloqueadoPorLGPD } from "@/lib/alunos";
import { temPermissao } from "@/lib/types/permissions";
import { salvarObservacoesAction, arquivarAlunoAction } from "@/app/actions/alunos";

const ACAO_LABEL: Record<string, string> = {
  "aluno.criado": "Aluno cadastrado",
  "aluno.atualizado": "Dados atualizados",
  "aluno.arquivado": "Aluno arquivado",
  "aluno.reativado": "Aluno reativado",
  "consentimento.concedido": "Consentimento concedido",
  "consentimento.revogado": "Consentimento revogado",
};

export default async function AlunoPerfilPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("alunos:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "alunos:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;

  const aluno = await repo.obterAluno(tenant, params.id);
  if (!aluno) notFound();

  const [responsaveis, consents, matriculas, turmas, avaliacoes, pagamentos, audit] =
    await Promise.all([
      repo.listarResponsaveis(tenant),
      repo.listarConsentsDoAluno(tenant, aluno.id),
      repo.listarMatriculas(tenant),
      repo.listarTurmas(tenant),
      repo.listarAvaliacoes(tenant),
      repo.listarPagamentos(tenant),
      repo.listarAuditLogs(tenant),
    ]);

  const responsavel = responsaveis.find((r) => r.id === aluno.responsavel_id) ?? null;
  const turmasAluno = matriculas
    .filter((m) => m.aluno_id === aluno.id)
    .map((m) => turmas.find((t) => t.id === m.turma_id)?.nome)
    .filter(Boolean);
  const avaliacoesAluno = avaliacoes.filter((a) => a.aluno_id === aluno.id);
  const pagamentosAluno = pagamentos.filter((p) => p.aluno_id === aluno.id);
  const historico = audit.filter((l) => l.entidade_id === aluno.id).slice(0, 8);

  const lgpdOk = statusConsentimento(consents, "parental_menor");
  const bloqueado = bloqueadoPorLGPD(aluno.menor_de_idade, consents);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/alunos" className="hover:text-slate-600">Alunos</Link>
        <span>/</span>
        <span className="text-slate-600">{aluno.nome}</span>
      </div>

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      {bloqueado && (
        <Alert tipo="erro">
          Processamento de dados bloqueado: menor sem consentimento parental (LGPD).
          {podeGerir && (
            <>
              {" "}
              <Link href={`/dashboard/alunos/${aluno.id}/consentimento`} className="font-semibold underline">
                Registrar consentimento
              </Link>
            </>
          )}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <Avatar nome={aluno.nome} fotoUrl={aluno.foto_url} tamanho="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{aluno.nome}</h1>
            {aluno.ativo ? <Badge variante="info">Ativo</Badge> : <Badge variante="neutro">Arquivado</Badge>}
            {aluno.menor_de_idade && (
              lgpdOk === true ? <Badge variante="sucesso">LGPD ok</Badge> : <Badge variante="alerta">LGPD pendente</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {idade(aluno.data_nascimento)} anos · nasc. {aluno.data_nascimento}
            {responsavel && <> · Responsável: {responsavel.nome}</>}
          </p>
        </div>
        {podeGerir && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/alunos/${aluno.id}/editar`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Editar</Link>
            <Link href={`/dashboard/alunos/${aluno.id}/consentimento`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Consentimento</Link>
            <form action={arquivarAlunoAction}>
              <input type="hidden" name="aluno_id" value={aluno.id} />
              <input type="hidden" name="arquivar" value={(aluno.ativo).toString()} />
              <button type="submit" className={`rounded-lg px-3 py-2 text-sm ${aluno.ativo ? "border border-red-200 text-red-600 hover:bg-red-50" : "border border-court-500/30 text-court-600 hover:bg-court-500/5"}`}>
                {aluno.ativo ? "Arquivar" : "Reativar"}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Observações */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Observações</h2>
            {podeGerir ? (
              <form action={salvarObservacoesAction} className="space-y-3">
                <input type="hidden" name="aluno_id" value={aluno.id} />
                <textarea name="observacoes" rows={3} defaultValue={aluno.observacoes ?? ""} placeholder="Sem observações" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="text-right">
                  <button type="submit" className="rounded-lg bg-atlas-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-atlas-700">Salvar</button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-600">{aluno.observacoes ?? "Sem observações."}</p>
            )}
          </section>

          {/* Histórico */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Histórico do aluno</h2>
            {historico.length === 0 ? (
              <p className="text-sm text-slate-400">Sem eventos registrados.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {historico.map((l) => (
                  <li key={l.id} className="relative">
                    <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-atlas-500" />
                    <p className="text-sm font-medium text-slate-700">{ACAO_LABEL[l.acao] ?? l.acao}</p>
                    <p className="text-xs text-slate-400">{l.criado_em.slice(0, 19).replace("T", " ")}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Turmas</h2>
            {turmasAluno.length ? (
              <ul className="space-y-1 text-sm text-slate-600">
                {turmasAluno.map((n) => <li key={n}>📅 {n}</li>)}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Sem matrículas.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Resumo</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Avaliações</dt><dd className="font-medium text-slate-700">{avaliacoesAluno.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Pagamentos</dt><dd className="font-medium text-slate-700">{pagamentosAluno.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Consentimentos</dt><dd className="font-medium text-slate-700">{consents.length}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
