import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { criarResponsavelAction } from "@/app/actions/responsaveis";

export default async function ResponsaveisPage({
  searchParams,
}: {
  searchParams: { ok?: string; erro?: string; proximo?: string };
}) {
  const sessao = await exigirPermissao("alunos:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [responsaveis, alunos] = await Promise.all([
    repo.listarResponsaveis(tenant),
    repo.listarAlunos(tenant),
  ]);
  const contarVinculos = (rid: string) =>
    alunos.filter((a) => a.responsavel_id === rid).length;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Responsáveis" subtitulo={`${responsaveis.length} responsável(is) cadastrado(s)`} />

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Cadastrar responsável</h2>
        <form action={criarResponsavelAction} className="grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="proximo" value={searchParams.proximo ?? "/dashboard/responsaveis"} />
          <input name="nome" required placeholder="Nome" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="E-mail" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="telefone" placeholder="Telefone" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Cadastrar</button>
        </form>
      </section>

      {responsaveis.length === 0 ? (
        <EmptyState icone="👪" titulo="Nenhum responsável" descricao="Cadastre um responsável para vincular a alunos menores." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {responsaveis.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <Avatar nome={r.nome} />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{r.nome}</p>
                <p className="truncate text-xs text-slate-500">{r.email}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {r.telefone ?? "sem telefone"} · {contarVinculos(r.id)} aluno(s)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
