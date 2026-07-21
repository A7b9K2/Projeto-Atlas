/**
 * Logger estruturado (JSON). Uma linha por evento — pronto para ingestão
 * por coletores (Datadog, Logflare, etc.) em dev/staging/prod.
 * O nível mínimo emitido é controlado por LOG_LEVEL (default: debug em dev,
 * info em produção).
 */
type Nivel = "debug" | "info" | "warn" | "error";

interface CampoLog {
  [chave: string]: unknown;
}

const ORDEM: Record<Nivel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function nivelMinimo(): Nivel {
  const cfg = process.env.LOG_LEVEL as Nivel | undefined;
  if (cfg && cfg in ORDEM) return cfg;
  return process.env.APP_ENV === "production" ? "info" : "debug";
}

function emitir(nivel: Nivel, mensagem: string, campos?: CampoLog): void {
  if (ORDEM[nivel] < ORDEM[nivelMinimo()]) return;
  const registro = {
    ts: new Date().toISOString(),
    nivel,
    env: process.env.APP_ENV ?? "development",
    msg: mensagem,
    ...campos,
  };
  const linha = JSON.stringify(registro);
  if (nivel === "error") console.error(linha);
  else if (nivel === "warn") console.warn(linha);
  else console.log(linha);
}

export const logger = {
  debug: (msg: string, campos?: CampoLog) => emitir("debug", msg, campos),
  info: (msg: string, campos?: CampoLog) => emitir("info", msg, campos),
  warn: (msg: string, campos?: CampoLog) => emitir("warn", msg, campos),
  error: (msg: string, campos?: CampoLog) => emitir("error", msg, campos),
};
