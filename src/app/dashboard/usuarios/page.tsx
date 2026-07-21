import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { PAPEIS } from "@/lib/types";
import {
  convidarUsuarioAction,
  alterarPapelAction,
  definirAtivoAction,
  removerUsuarioAction,
} from "@/app/actions/usuarios";

const ACOES_LABEL: Record<string, string> = {
  "usuario.convidado": "convidou",
  "usuario.papel_alterado": "alterou o papel de",
  "usuario.ativado": "ativou",
  "usuario.inativado": "inativou",
  "usuario.removido": "removeu",
};

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: { q?: string; papel?: string; status?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("usuarios:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [todos, auditLogs] = await Promise.all([
    repo.listarUsuarios(tenant),
    repo.listarAuditLogs(tenant),
  ]);

  const q = (searchParams.q ?? "").toLowerCase();
  const fPapel = searchParams.papel ?? "";
  const fStatus = searchParams.status ?? "";

  const usuarios = todos.filter((u) => {
    if (q && !`${u.nome} ${u.email}`.toLowerCase().includes(q)) return false;
    if (fPapel && u.papel !== fPapel) return false;
    if (fStatus === "ativo" && !u.ativo) return false;
    if (fStatus === "inativo" && u.ativo) return false;
    return true;
  });

  const atividade = auditLogs
    .filter((l) => l.entidade === "usuario")
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        titulo="Usuários"
        subtitulo={`${todos.length} usuário(s) · gerir equipe e papéis`}
      />

      {searchParams.erro && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.erro}
        </div>
      )}

      {/* Convite */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Convidar usuário</h2>
        <form action={convidarUsuarioAction} className="grid gap-3 sm:grid-cols-4">
          <input name="nome" required placeholder="Nome" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input name="email" type="email" required placeholder="E-mail" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="papel" defaultValue="professor" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {PAPEIS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">
            Convidar
          </button>
        </form>
      </section>

      {/* Busca e filtros */}
      <form method="get" className="flex flex-wrap gap-2">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Buscar nome/e-mail" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select name="papel" defaultValue={fPapel} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos os papéis</option>
          {PAPEIS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select name="status" defaultValue={fStatus} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
        <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          Filtrar
        </button>
      </form>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => {
              const ehEu = u.id === sessao.usuario.id;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.nome}
                    {ehEu && <span className="ml-2 text-xs text-slate-400">(você)</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <form action={alterarPapelAction} className="flex items-center gap-1">
                      <input type="hidden" name="usuario_id" value={u.id} />
                      <select name="papel" defaultValue={u.papel} disabled={ehEu} className="rounded border border-slate-200 px-2 py-1 text-xs capitalize disabled:opacity-50">
                        {PAPEIS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      {!ehEu && (
                        <button type="submit" className="text-xs text-atlas-600 hover:underline">salvar</button>
                      )}
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    {u.ativo ? (
                      <span className="rounded bg-court-500/10 px-2 py-0.5 text-xs text-court-600">Ativo</span>
                    ) : (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Inativo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      {!ehEu && (
                        <form action={definirAtivoAction}>
                          <input type="hidden" name="usuario_id" value={u.id} />
                          <input type="hidden" name="ativo" value={(!u.ativo).toString()} />
                          <button type="submit" className="text-xs text-slate-500 hover:text-slate-800">
                            {u.ativo ? "Inativar" : "Ativar"}
                          </button>
                        </form>
                      )}
                      {!ehEu && (
                        <form action={removerUsuarioAction}>
                          <input type="hidden" name="usuario_id" value={u.id} />
                          <button type="submit" className="text-xs text-red-500 hover:text-red-700">Remover</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  Nenhum usuário para os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Auditoria */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Atividade recente</h2>
        <ul className="space-y-2">
          {atividade.map((l) => (
            <li key={l.id} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
              <span className="font-mono text-xs text-slate-400">{l.criado_em.slice(0, 19).replace("T", " ")}</span>{" "}
              {ACOES_LABEL[l.acao] ?? l.acao} um usuário
            </li>
          ))}
          {atividade.length === 0 && (
            <li className="text-xs text-slate-400">Sem atividade registrada.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

// Evita SSG (usa sessão/cookies).
export const dynamic = "force-dynamic";
