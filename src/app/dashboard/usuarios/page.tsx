import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";

export default async function UsuariosPage() {
  const sessao = await exigirPermissao("usuarios:gerir");
  const usuarios = await getRepository().listarUsuarios(sessao.academia.id);

  return (
    <div>
      <PageHeader titulo="Usuários" subtitulo={`${usuarios.length} usuário(s) na academia`} />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Ativo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{u.nome}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.email}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{u.papel}</td>
                <td className="px-4 py-3">{u.ativo ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
