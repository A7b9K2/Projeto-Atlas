/**
 * Middleware de proteção de rotas + controle por papel.
 * 1) Rotas protegidas exigem sessão; sem sessão → /login.
 * 2) O papel deve ter a permissão exigida pela rota (mapa único em
 *    authorization.ts); sem permissão → /dashboard?erro=permissao.
 *
 * Modo mock (preview): papel resolvido do cookie (e-mail) via seed edge-safe.
 * Modo supabase: papel virá dos claims do JWT (mesmo mapa de rota/permissão).
 * A autorização REAL de dados continua sendo o RLS no banco — isto é UX/guard.
 */
import { NextResponse, type NextRequest } from "next/server";
import { permissaoDaRota } from "@/lib/auth/authorization";
import { temPermissao } from "@/lib/types/permissions";
import { papelPorEmailSeed } from "@/mocks/seed";

const COOKIE = "atlas_session";

const PREFIXOS_PROTEGIDOS = [
  "/dashboard",
  "/alunos",
  "/turmas",
  "/financeiro",
  "/pedagogico",
];

function ehProtegida(pathname: string): boolean {
  return PREFIXOS_PROTEGIDOS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (!ehProtegida(pathname)) return NextResponse.next();

  const email = req.cookies.get(COOKIE)?.value;
  if (!email) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("proximo", pathname);
    return NextResponse.redirect(url);
  }

  // Resolução de papel edge-safe (mock). Em supabase, ler claims do JWT aqui.
  const papel = papelPorEmailSeed(email);
  if (!papel) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("erro", "sessao");
    return NextResponse.redirect(url);
  }

  const permissao = permissaoDaRota(pathname);
  if (permissao && !temPermissao(papel, permissao)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("erro", "permissao");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/alunos/:path*",
    "/turmas/:path*",
    "/financeiro/:path*",
    "/pedagogico/:path*",
  ],
};
