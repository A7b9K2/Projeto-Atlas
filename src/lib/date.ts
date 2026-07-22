/**
 * Data de referência do app (preview/seed).
 * Fonte única — evita a constante HOJE duplicada em várias telas.
 * DÍVIDA TÉCNICA CONSCIENTE: fixa para o preview mock; com Supabase real,
 * trocar por `new Date().toISOString().slice(0,10)`.
 */
export const HOJE = "2026-07-21";
