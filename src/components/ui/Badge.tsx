type Variante = "neutro" | "sucesso" | "alerta" | "perigo" | "info";

const ESTILO: Record<Variante, string> = {
  neutro: "bg-slate-100 text-slate-600",
  sucesso: "bg-court-500/10 text-court-600",
  alerta: "bg-amber-100 text-amber-700",
  perigo: "bg-red-100 text-red-700",
  info: "bg-atlas-100 text-atlas-700",
};

export function Badge({
  children,
  variante = "neutro",
}: {
  children: React.ReactNode;
  variante?: Variante;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILO[variante]}`}
    >
      {children}
    </span>
  );
}
