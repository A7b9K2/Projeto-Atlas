export function EmptyState({
  icone = "📭",
  titulo,
  descricao,
  acao,
}: {
  icone?: string;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
        {icone}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{titulo}</h3>
      {descricao && <p className="mt-1 max-w-sm text-sm text-slate-500">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
