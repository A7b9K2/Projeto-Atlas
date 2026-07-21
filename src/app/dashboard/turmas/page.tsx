import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function TurmasPage() {
  const sessao = await exigirPermissao("agenda:ler");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [turmas, aulas, usuarios] = await Promise.all([
    repo.listarTurmas(tenant),
    repo.listarAulas(tenant),
    repo.listarUsuarios(tenant),
  ]);
  const prof = (id: string | null) =>
    usuarios.find((u) => u.id === id)?.nome ?? "—";

  return (
    <div>
      <PageHeader titulo="Turmas & Agenda" subtitulo={`${turmas.length} turma(s)`} />
      <div className="grid gap-4 sm:grid-cols-2">
        {turmas.map((t) => {
          const aulasTurma = aulas.filter((a) => a.turma_id === t.id);
          return (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-800">{t.nome}</h3>
              <p className="text-xs text-slate-400">
                Professor: {prof(t.professor_id)} · capacidade {t.capacidade}
              </p>
              <ul className="mt-3 space-y-1">
                {aulasTurma.map((a) => (
                  <li key={a.id} className="text-sm text-slate-600">
                    📅 {DIAS[a.dia_semana]} · {a.hora_inicio}–{a.hora_fim}
                  </li>
                ))}
                {aulasTurma.length === 0 && (
                  <li className="text-xs text-slate-400">Sem aulas agendadas</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
