export function StatCard({
  titulo,
  valor,
  detalhe,
  icone,
}: {
  titulo: string;
  valor: string | number;
  detalhe?: string;
  icone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-500">{titulo}</span>
        <span className="text-lg">{icone}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-slate-400">{detalhe}</p>}
    </div>
  );
}
