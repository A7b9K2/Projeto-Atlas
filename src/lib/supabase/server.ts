/**
 * Cliente Supabase server-side (SSR) com cookies — usado apenas quando
 * DATA_PROVIDER/AUTH_PROVIDER=supabase e as chaves estão presentes.
 * No preview (mock) este módulo NÃO é instanciado.
 *
 * O token do usuário viaja no cookie; o Supabase resolve auth.uid() e o RLS
 * (migrations 0002/0003) impõe o isolamento por tenant e por papel — o
 * frontend nunca decide isolamento.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lerSupabaseEnv } from "./env";

export function criarSupabaseServer() {
  const env = lerSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY, ou use DATA_PROVIDER=mock.",
    );
  }
  const store = cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          store.set(name, value, options);
        }
      },
    },
  });
}
