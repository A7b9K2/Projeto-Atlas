import Link from "next/link";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DIAS_SEMANA, DIAS_CURTO, gradeDoMes, ymd } from "@/lib/agenda";
import { HOJE } from "@/lib/date";
import type { Aula } from "@/lib/types";

function addDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { vista?: string; data?: string };
}) {
  const sessao = await exigirPermissao("agenda:ler");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [aulas, turmas, quadras, usuarios] = await Promise.all([
    repo.listarAulas(tenant),
    repo.listarTurmas(tenant),
    repo.listarQuadras(tenant),
    repo.listarUsuarios(tenant),
  ]);

  const vista = searchParams.vista ?? "semana";
  const dataRef = searchParams.data ?? HOJE;
  const refDate = new Date(`${dataRef}T00:00:00`);

  const nomeTurma = (id: string) => turmas.find((t) => t.id === id)?.nome ?? "Turma";
  const infoAula = (a: Aula) => {
    const t = turmas.find((x) => x.id === a.turma_id);
    const prof = usuarios.find((u) => u.id === t?.professor_id)?.nome;
    const quadra = quadras.find((q) => q.id === t?.quadra_id)?.nome;
    return { prof, quadra };
  };
  const porDia = (dow: number) =>
    aulas
      .filter((a) => a.dia_semana === dow)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  const linkVista = (v: string, d = dataRef) => `/dashboard/agenda?vista=${v}&data=${d}`;

  const Card = ({ a }: { a: Aula }) => {
    const { prof, quadra } = infoAula(a);
    return (
      <Link
        href={`/dashboard/turmas/${a.turma_id}`}
        className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-atlas-300 hover:shadow"
        data-aula-id={a.id}
        draggable
      >
        <p className="text-xs font-semibold text-atlas-700">{a.hora_inicio}–{a.hora_fim}</p>
        <p className="truncate text-sm font-medium text-slate-800">{nomeTurma(a.turma_id)}</p>
        <p className="truncate text-xs text-slate-400">{quadra ?? "sem quadra"}{prof ? ` · ${prof}` : ""}</p>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader titulo="Agenda" subtitulo={`${aulas.length} aula(s) recorrente(s)`} />
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm">
          {([["semana", "Semana"], ["mes", "Mês"], ["dia", "Dia"]] as const).map(([v, label]) => (
            <Link
              key={v}
              href={linkVista(v)}
              className={`rounded-md px-3 py-1.5 ${vista === v ? "bg-atlas-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {aulas.length === 0 ? (
        <EmptyState
          icone="📅"
          titulo="Agenda vazia"
          descricao="Crie turmas e agende aulas para vê-las aqui."
          acao={<Link href="/dashboard/turmas/nova" className="rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Criar turma</Link>}
        />
      ) : vista === "semana" ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
              <div key={dow} className="space-y-2">
                <p className="text-center text-xs font-semibold uppercase text-slate-400">{DIAS_CURTO[dow]}</p>
                {porDia(dow).map((a) => <Card key={a.id} a={a} />)}
                {porDia(dow).length === 0 && <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-300">livre</div>}
              </div>
            ))}
          </div>
        </div>
      ) : vista === "dia" ? (
        <div className="mx-auto max-w-xl space-y-3">
          <div className="flex items-center justify-between">
            <Link href={linkVista("dia", addDias(dataRef, -1))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">← Anterior</Link>
            <p className="text-sm font-semibold text-slate-700">{DIAS_SEMANA[refDate.getDay()]}, {dataRef}</p>
            <Link href={linkVista("dia", addDias(dataRef, 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Próximo →</Link>
          </div>
          {porDia(refDate.getDay()).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">Nenhuma aula neste dia.</p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-slate-100 pl-5">
              {porDia(refDate.getDay()).map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 border-white bg-atlas-500" />
                  <Card a={a} />
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : (
        // mês
        <div className="overflow-x-auto">
          <div className="min-w-[700px] rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase text-slate-400">
              {DIAS_CURTO.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {gradeDoMes(refDate.getFullYear(), refDate.getMonth()).flat().map((d) => {
                const doMes = d.getMonth() === refDate.getMonth();
                const nAulas = porDia(d.getDay()).length;
                return (
                  <Link
                    key={d.toISOString()}
                    href={linkVista("dia", ymd(d))}
                    className={`min-h-[64px] rounded-lg border p-1.5 text-left transition hover:border-atlas-300 ${doMes ? "border-slate-100 bg-white" : "border-transparent bg-slate-50/50 text-slate-300"}`}
                  >
                    <span className="text-xs font-medium">{d.getDate()}</span>
                    {doMes && nAulas > 0 && (
                      <span className="mt-1 flex flex-wrap gap-0.5">
                        {Array.from({ length: Math.min(nAulas, 4) }).map((_, i) => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full bg-atlas-500" />
                        ))}
                        <span className="ml-1 text-[10px] text-slate-400">{nAulas}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
