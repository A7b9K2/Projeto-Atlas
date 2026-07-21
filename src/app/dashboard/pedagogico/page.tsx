import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";

export default async function PedagogicoPage() {
  const sessao = await exigirPermissao("pedagogico:ler");
  const repo = getRepository();
  const [avaliacoes, alunos] = await Promise.all([
    repo.listarAvaliacoes(sessao.academia.id),
    repo.listarAlunos(sessao.academia.id),
  ]);
  const nome = (id: string) => alunos.find((a) => a.id === id)?.nome ?? id;

  return (
    <div>
      <PageHeader titulo="Pedagógico" subtitulo="Avaliações técnicas dos alunos" />
      <div className="grid gap-4 sm:grid-cols-2">
        {avaliacoes.map((av) => (
          <div key={av.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-800">{nome(av.aluno_id)}</h3>
            <p className="mb-3 text-xs text-slate-400">Avaliado em {av.avaliado_em}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Saque", av.saque],
                ["Forehand", av.forehand],
                ["Backhand", av.backhand],
              ].map(([label, nota]) => (
                <div key={label} className="rounded-lg bg-slate-50 p-2">
                  <p className="text-lg font-bold text-atlas-700">{nota}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            {av.observacoes && (
              <p className="mt-3 text-sm text-slate-600">{av.observacoes}</p>
            )}
          </div>
        ))}
        {avaliacoes.length === 0 && (
          <p className="text-sm text-slate-400">Nenhuma avaliação registrada.</p>
        )}
      </div>
    </div>
  );
}
