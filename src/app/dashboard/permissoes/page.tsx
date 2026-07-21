import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { PAPEIS, type Papel } from "@/lib/types";
import { TODAS_PERMISSOES, permissoesEfetivas } from "@/lib/types/permissions";
import { alterarPermissaoAction } from "@/app/actions/permissoes";

export default async function PermissoesPage() {
  const sessao = await exigirPermissao("academia:gerir");
  const overrides = await getRepository().listarPapelPermissoes(
    sessao.academia.id,
  );

  const efetivasPorPapel = new Map<Papel, Set<string>>(
    PAPEIS.map((p) => [p, permissoesEfetivas(p, overrides)]),
  );

  return (
    <div>
      <PageHeader
        titulo="Permissões"
        subtitulo="Matriz papel × permissão (overrides por academia). A validação real é o RLS."
      />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Permissão</th>
              {PAPEIS.map((p) => (
                <th key={p} className="px-3 py-3 text-center capitalize">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TODAS_PERMISSOES.map((permissao) => (
              <tr key={permissao}>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{permissao}</td>
                {PAPEIS.map((papel) => {
                  const concedida = efetivasPorPapel.get(papel)!.has(permissao);
                  return (
                    <td key={papel} className="px-3 py-2 text-center">
                      <form action={alterarPermissaoAction}>
                        <input type="hidden" name="papel" value={papel} />
                        <input type="hidden" name="permissao" value={permissao} />
                        <input type="hidden" name="concedida" value={(!concedida).toString()} />
                        <button
                          type="submit"
                          title={concedida ? "Revogar" : "Conceder"}
                          className={`h-6 w-6 rounded ${
                            concedida
                              ? "bg-court-500/20 text-court-600"
                              : "bg-slate-100 text-slate-300"
                          }`}
                        >
                          {concedida ? "✓" : "·"}
                        </button>
                      </form>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Clique numa célula para conceder/revogar. Alterações são auditadas.
        DÍVIDA TÉCNICA CONSCIENTE: no MVP, os overrides ajustam a matriz efetiva
        exibida/usada na UI; o RLS impõe as regras por papel no banco.
      </p>
    </div>
  );
}

export const dynamic = "force-dynamic";
