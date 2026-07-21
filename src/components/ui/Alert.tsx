export function Alert({
  tipo,
  children,
}: {
  tipo: "sucesso" | "erro";
  children: React.ReactNode;
}) {
  const estilo =
    tipo === "sucesso"
      ? "border-court-500/30 bg-court-500/10 text-court-700"
      : "border-red-200 bg-red-50 text-red-700";
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${estilo}`}>
      <span>{tipo === "sucesso" ? "✅" : "⚠️"}</span>
      <span>{children}</span>
    </div>
  );
}
