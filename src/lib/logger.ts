/**
 * Logger estruturado (JSON). Uma linha por evento — pronto para ingestão
 * por coletores (Datadog, Logflare, etc.) em staging/prod.
 */
type Nivel = "debug" | "info" | "warn" | "error";

interface CampoLog {
  [chave: string]: unknown;
}

function emitir(nivel: Nivel, mensagem: string, campos?: CampoLog): void {
  const registro = {
    ts: new Date().toISOString(),
    nivel,
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
