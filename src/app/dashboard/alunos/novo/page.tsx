import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { FotoUpload } from "@/components/ui/FotoUpload";
import { criarAlunoAction } from "@/app/actions/alunos";

export default async function NovoAlunoPage({
  searchParams,
}: {
  searchParams: { erro?: string; ok?: string };
}) {
  const sessao = await exigirPermissao("alunos:gerir");
  const responsaveis = await getRepository().listarResponsaveis(sessao.academia.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/alunos" className="hover:text-slate-600">Alunos</Link>
        <span>/</span>
        <span className="text-slate-600">Novo</span>
      </div>
      <PageHeader titulo="Cadastrar aluno" subtitulo="Preencha os dados. Menores exigem consentimento parental (próximo passo)." />

      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}
      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}

      <form action={criarAlunoAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Foto</label>
          <FotoUpload />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="nome" className="mb-1 block text-sm font-medium text-slate-700">Nome completo</label>
            <input id="nome" name="nome" required placeholder="Ex.: Bruno Silva" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-atlas-500 focus:ring-2 focus:ring-atlas-100" />
          </div>
          <div>
            <label htmlFor="data_nascimento" className="mb-1 block text-sm font-medium text-slate-700">Data de nascimento</label>
            <input id="data_nascimento" name="data_nascimento" type="date" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-atlas-500 focus:ring-2 focus:ring-atlas-100" />
          </div>
          <div>
            <label htmlFor="responsavel_id" className="mb-1 block text-sm font-medium text-slate-700">Responsável</label>
            <select id="responsavel_id" name="responsavel_id" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Sem responsável (maior de idade)</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Não achou?{" "}
              <Link href="/dashboard/responsaveis?proximo=/dashboard/alunos/novo" className="text-atlas-600 hover:underline">
                Cadastrar responsável
              </Link>
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="observacoes" className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
          <textarea id="observacoes" name="observacoes" rows={3} placeholder="Notas pedagógicas ou administrativas" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-atlas-500 focus:ring-2 focus:ring-atlas-100" />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/alunos" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancelar</Link>
          <button type="submit" className="rounded-lg bg-atlas-600 px-5 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Cadastrar aluno</button>
        </div>
      </form>
    </div>
  );
}

export const dynamic = "force-dynamic";
