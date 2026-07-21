import { logoutAction } from "@/app/actions/auth";
import type { Papel } from "@/lib/types";
import { temPermissao, type Permissao } from "@/lib/types/permissions";

interface ItemNav {
  href: string;
  label: string;
  icone: string;
  /** Permissão mínima para exibir (UX apenas — backend valida de verdade). */
  requer?: Permissao;
}

const NAV: ItemNav[] = [
  { href: "/dashboard", label: "Visão geral", icone: "🏠" },
  { href: "/dashboard/usuarios", label: "Usuários", icone: "👥", requer: "usuarios:gerir" },
  { href: "/dashboard/permissoes", label: "Permissões", icone: "🛡️", requer: "academia:gerir" },
  { href: "/dashboard/alunos", label: "Alunos", icone: "🎾", requer: "alunos:ler" },
  { href: "/dashboard/agenda", label: "Agenda", icone: "📅", requer: "agenda:ler" },
  { href: "/dashboard/financeiro", label: "Financeiro", icone: "💰", requer: "financeiro:ler" },
  { href: "/dashboard/pedagogico", label: "Pedagógico", icone: "📈", requer: "pedagogico:ler" },
  { href: "/dashboard/lgpd", label: "LGPD & Auditoria", icone: "🔒", requer: "academia:gerir" },
];

export function Sidebar({
  nomeAcademia,
  nomeUsuario,
  papel,
}: {
  nomeAcademia: string;
  nomeUsuario: string;
  papel: Papel;
}) {
  const itens = NAV.filter((i) => !i.requer || temPermissao(papel, i.requer));

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-atlas-600 text-lg">
          🎾
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {nomeAcademia}
          </p>
          <p className="text-xs text-slate-400">Atlas</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {itens.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <span>{item.icone}</span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-sm font-medium text-slate-700">{nomeUsuario}</p>
        <p className="mb-3 text-xs capitalize text-slate-400">{papel}</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-xs text-slate-500 hover:text-red-600"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
