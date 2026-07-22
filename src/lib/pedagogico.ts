import type { Avaliacao } from "@/lib/types";

/** Média geral (saque/forehand/backhand) de uma avaliação, 0–10. */
export function mediaAvaliacao(av: Avaliacao): number {
  return Math.round(((av.saque + av.forehand + av.backhand) / 3) * 10) / 10;
}

/** Variante de Badge conforme a nota média. */
export function nivelPorMedia(
  media: number,
): "sucesso" | "info" | "alerta" | "perigo" {
  if (media >= 8) return "sucesso";
  if (media >= 6) return "info";
  if (media >= 4) return "alerta";
  return "perigo";
}

/** Evolução entre a avaliação mais antiga e a mais recente (delta da média). */
export function evolucao(avaliacoes: readonly Avaliacao[]): number | null {
  if (avaliacoes.length < 2) return null;
  const ordenadas = [...avaliacoes].sort((a, b) =>
    a.avaliado_em < b.avaliado_em ? -1 : 1,
  );
  const primeira = ordenadas[0]!;
  const ultima = ordenadas[ordenadas.length - 1]!;
  return Math.round((mediaAvaliacao(ultima) - mediaAvaliacao(primeira)) * 10) / 10;
}
