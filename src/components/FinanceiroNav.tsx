import Link from "next/link";

const ITENS = [
  ["/dashboard/financeiro", "Visão geral"],
  ["/dashboard/financeiro/mensalidades", "Mensalidades"],
  ["/dashboard/financeiro/contratos", "Contratos"],
  ["/dashboard/financeiro/relatorios", "Relatórios"],
] as const;

export function FinanceiroNav({ ativo }: { ativo: string }) {
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 text-sm">
      {ITENS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`rounded-lg px-3 py-1.5 ${ativo === href ? "bg-atlas-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
