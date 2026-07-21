import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { FotoUpload } from "@/components/ui/FotoUpload";
import { atualizarAlunoAction } from "@/app/actions/alunos";

export default async function EditarAlunoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const sessao = await exigirPermissao("alunos:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [aluno, responsaveis] = await Promise.all([
    repo.obterAluno(tenant, params.id),
    repo.listarResponsaveis(tenant),
  ]);
  if (!aluno) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/alunos" className="hover:text-slate-600">Alunos</Link>
        <span>/</span>
        <Link href={`/dashboard/alunos/${aluno.id}`} className="hover:text-slate-600">{aluno.nome}</Link>
        <span>/</span>
        <span className="text-slate-600">Editar</span>
      </div>
      <PageHeader titulo="Editar aluno" />

      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      <form action={atualizarAlunoAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <input type="hidden" name="aluno_id" value={aluno.id} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Foto</label>
          <FotoUpload inicial={aluno.foto_url} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nome" className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
            <input id="nome" name="nome" required defaultValue={aluno.nome} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="data_nascimento" className="mb-1 block text-sm font-medium text-slate-700">Data de nascimento</label>
            <input id="data_nascimento" name="data_nascimento" type="date" required defaultValue={aluno.data_nascimento} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="responsavel_id" className="mb-1 block text-sm font-medium text-slate-700">Responsável</label>
            <select id="responsavel_id" name="responsavel_id" defaultValue={aluno.responsavel_id ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Sem responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="observacoes" className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
          <textarea id="observacoes" name="observacoes" rows={3} defaultValue={aluno.observacoes ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/alunos/${aluno.id}`} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</Link>
          <button type="submit" className="rounded-lg bg-atlas-600 px-5 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Salvar alterações</button>
        </div>
      </form>
    </div>
  );
}

export const dynamic = "force-dynamic";
