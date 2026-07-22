"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import type { Papel } from "@/lib/types";
import { temPermissao, type Permissao } from "@/lib/types/permissions";

interface ItemNav {
  href: string;
  label: string;
  icone: string;
  /** Permissão mínima para exibir (UX apenas — backend valida de verdade). */
  requer?: Permissao;
}

const NAV: ItemNav[] = [
  { href: "/dashboard", label: "Visão geral", icone: "🏠" },
  { href: "/dashboard/usuarios", label: "Usuários", icone: "👥", requer: "usuarios:gerir" },
  { href: "/dashboard/permissoes", label: "Permissões", icone: "🛡️", requer: "academia:gerir" },
  { href: "/dashboard/alunos", label: "Alunos", icone: "🎾", requer: "alunos:ler" },
  { href: "/dashboard/responsaveis", label: "Responsáveis", icone: "👪", requer: "alunos:gerir" },
  { href: "/dashboard/professor", label: "Meu dia", icone: "🎯", requer: "pedagogico:gerir" },
  { href: "/dashboard/agenda", label: "Agenda", icone: "📅", requer: "agenda:ler" },
  { href: "/dashboard/turmas", label: "Turmas", icone: "🏸", requer: "agenda:ler" },
  { href: "/dashboard/quadras", label: "Quadras", icone: "🟩", requer: "agenda:gerir" },
  { href: "/dashboard/financeiro", label: "Financeiro", icone: "💰", requer: "financeiro:ler" },
  { href: "/dashboard/pedagogico", label: "Pedagógico", icone: "📈", requer: "pedagogico:ler" },
  { href: "/dashboard/comunicacao", label: "Comunicação", icone: "📣", requer: "usuarios:gerir" },
  { href: "/dashboard/lgpd", label: "LGPD & Auditoria", icone: "🔒", requer: "academia:gerir" },
];

function ativo(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Conteúdo compartilhado entre a sidebar fixa (desktop) e o drawer (mobile). */
function PainelNav({
  itens,
  nomeAcademia,
  nomeUsuario,
  papel,
  pathname,
  onNavegar,
}: {
  itens: ItemNav[];
  nomeAcademia: string;
  nomeUsuario: string;
  papel: Papel;
  pathname: string;
  onNavegar?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-atlas-600 text-lg">
          🎾
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{nomeAcademia}</p>
          <p className="text-xs text-slate-400">Atlas</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {itens.map((item) => {
          const atual = ativo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavegar}
              aria-current={atual ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                atual
                  ? "bg-atlas-50 font-medium text-atlas-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{item.icone}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-sm font-medium text-slate-700">{nomeUsuario}</p>
        <p className="mb-3 text-xs capitalize text-slate-400">{papel}</p>
        <form action={logoutAction}>
          <button type="submit" className="text-xs text-slate-500 hover:text-red-600">
            Sair
          </button>
        </form>
      </div>
    </>
  );
}

export function AppNav({
  nomeAcademia,
  nomeUsuario,
  papel,
}: {
  nomeAcademia: string;
  nomeUsuario: string;
  papel: Papel;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const itens = NAV.filter((i) => !i.requer || temPermissao(papel, i.requer));

  // Fecha o drawer ao navegar (preserva o estado da navegação).
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Fecha no Escape e trava o scroll do body enquanto o drawer está aberto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const painel = (
    <PainelNav
      itens={itens}
      nomeAcademia={nomeAcademia}
      nomeUsuario={nomeUsuario}
      papel={papel}
      pathname={pathname}
      onNavegar={() => setAberto(false)}
    />
  );

  return (
    <>
      {/* Sidebar fixa — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {painel}
      </aside>

      {/* Top bar — mobile/tablet */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu de navegação"
          aria-expanded={aberto}
          aria-controls="drawer-navegacao"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-atlas-600 text-base">🎾</span>
        <span className="truncate text-sm font-bold text-slate-900">{nomeAcademia}</span>
      </header>

      {/* Drawer + overlay — mobile/tablet */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${aberto ? "" : "pointer-events-none"}`}
        aria-hidden={!aberto}
      >
        {/* Overlay: fecha ao tocar fora */}
        <div
          onClick={() => setAberto(false)}
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${
            aberto ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Painel deslizante */}
        <aside
          id="drawer-navegacao"
          role="dialog"
          aria-modal="true"
          aria-label="Navegação"
          className={`absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out ${
            aberto ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            onClick={() => setAberto(false)}
            aria-label="Fechar menu"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
          {painel}
        </aside>
      </div>
    </>
  );
}
