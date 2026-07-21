export function PageHeader({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
      {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
    </header>
  );
}
