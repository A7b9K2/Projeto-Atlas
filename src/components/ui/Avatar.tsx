const CORES = [
  "bg-atlas-100 text-atlas-700",
  "bg-court-500/15 text-court-600",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const a = partes[0]?.[0] ?? "?";
  const b = partes.length > 1 ? partes[partes.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}

const TAMANHO = { sm: "h-8 w-8 text-xs", md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-lg" };

export function Avatar({
  nome,
  fotoUrl,
  tamanho = "md",
}: {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: keyof typeof TAMANHO;
}) {
  const cor = CORES[nome.length % CORES.length];
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={nome}
        className={`${TAMANHO[tamanho]} rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`flex ${TAMANHO[tamanho]} shrink-0 items-center justify-center rounded-full font-semibold ${cor}`}
    >
      {iniciais(nome)}
    </span>
  );
}
