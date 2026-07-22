import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { idade, statusConsentimento } from "@/lib/alunos";
import { temPermissao } from "@/lib/types/permissions";

const POR_PAGINA = 8;

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    status?: string;
    faixa?: string;
    lgpd?: string;
    ordenar?: string;
    pagina?: string;
    ok?: string;
  };
}) {
  const sessao = await exigirPermissao("alunos:ler");
  const podeGerir = temPermissao(sessao.usuario.papel, "alunos:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [todos, responsaveis, consents] = await Promise.all([
    repo.listarAlunos(tenant),
    repo.listarResponsaveis(tenant),
    repo.listarConsents(tenant),
  ]);
  const nomeResp = (id: string | null) =>
    responsaveis.find((r) => r.id === id)?.nome ?? null;

  const q = (searchParams.q ?? "").toLowerCase();
  const fStatus = searchParams.status ?? "ativos";
  const fFaixa = searchParams.faixa ?? "";
  const fLgpd = searchParams.lgpd ?? "";
  const ordenar = searchParams.ordenar ?? "nome";

  let lista = todos.filter((a) => {
    if (q && !a.nome.toLowerCase().includes(q)) return false;
    if (fStatus === "ativos" && !a.ativo) return false;
    if (fStatus === "arquivados" && a.ativo) return false;
    if (fFaixa === "menor" && !a.menor_de_idade) return false;
    if (fFaixa === "maior" && a.menor_de_idade) return false;
    if (fLgpd === "pendente") {
      const ok = statusConsentimento(
        consents.filter((c) => c.aluno_id === a.id),
        "parental_menor",
      );
      if (!(a.menor_de_idade && ok !== true)) return false;
    }
    return true;
  });

  lista = lista.sort((a, b) => {
    if (ordenar === "recente") return a.criado_em < b.criado_em ? 1 : -1;
    if (ordenar === "idade") return idade(a.data_nascimento) - idade(b.data_nascimento);
    return a.nome.localeCompare(b.nome);
  });

  const total = lista.length;
  const pagina = Math.max(1, parseInt(searchParams.pagina ?? "1", 10) || 1);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const pageItens = lista.slice(inicio, inicio + POR_PAGINA);

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams({
      q: searchParams.q ?? "",
      status: fStatus,
      faixa: fFaixa,
      lgpd: fLgpd,
      ordenar,
      ...extra,
    });
    return `?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader titulo="Alunos" subtitulo={`${todos.filter((a) => a.ativo).length} ativo(s) · ${sessao.academia.nome_fantasia}`} />
        {podeGerir && (
          <Link href="/dashboard/alunos/novo" className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">
            + Novo aluno
          </Link>
        )}
      </div>

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}

      {/* Filtros */}
      <form method="get" className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" aria-label="Buscar aluno por nome" defaultValue={searchParams.q ?? ""} placeholder="Buscar por nome" className="rounded-lg border border-slate-300 px-3 py-2 text-sm lg:col-span-2" />
        <select name="status" aria-label="Filtrar por status" defaultValue={fStatus} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="ativos">Ativos</option>
          <option value="arquivados">Arquivados</option>
          <option value="todos">Todos</option>
        </select>
        <select name="faixa" aria-label="Filtrar por faixa etaria" defaultValue={fFaixa} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todas as idades</option>
          <option value="menor">Menores</option>
          <option value="maior">Maiores</option>
        </select>
        <select name="ordenar" aria-label="Ordenar" defaultValue={ordenar} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="nome">Ordenar: nome</option>
          <option value="recente">Mais recentes</option>
          <option value="idade">Idade</option>
        </select>
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-xs text-slate-500">
            <input type="checkbox" name="lgpd" value="pendente" defaultChecked={fLgpd === "pendente"} />
            LGPD pendente
          </label>
        </div>
        <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 lg:col-span-6">
          Aplicar filtros
        </button>
      </form>

      {pageItens.length === 0 ? (
        <EmptyState
          icone="🎾"
          titulo="Nenhum aluno encontrado"
          descricao="Ajuste os filtros ou cadastre o primeiro aluno da sua academia."
          acao={
            podeGerir ? (
              <Link href="/dashboard/alunos/novo" className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">
                Cadastrar aluno
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Aluno</th>
                <th className="px-4 py-3">Idade</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">LGPD</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItens.map((a) => {
                const lgpd = statusConsentimento(
                  consents.filter((c) => c.aluno_id === a.id),
                  "parental_menor",
                );
                return (
                  <tr key={a.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/alunos/${a.id}`} className="flex items-center gap-3">
                        <Avatar nome={a.nome} fotoUrl={a.foto_url} tamanho="sm" />
                        <span className="font-medium text-slate-800">{a.nome}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{idade(a.data_nascimento)} anos</td>
                    <td className="px-4 py-3 text-slate-600">{nomeResp(a.responsavel_id) ?? "—"}</td>
                    <td className="px-4 py-3">
                      {!a.menor_de_idade ? (
                        <Badge variante="neutro">N/A</Badge>
                      ) : lgpd === true ? (
                        <Badge variante="sucesso">Consentido</Badge>
                      ) : (
                        <Badge variante="alerta">Pendente</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {a.ativo ? <Badge variante="info">Ativo</Badge> : <Badge variante="neutro">Arquivado</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {paginas > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{total} aluno(s) · página {pagina}/{paginas}</span>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Link href={qs({ pagina: String(pagina - 1) })} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Anterior</Link>
            )}
            {pagina < paginas && (
              <Link href={qs({ pagina: String(pagina + 1) })} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">Próxima</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
