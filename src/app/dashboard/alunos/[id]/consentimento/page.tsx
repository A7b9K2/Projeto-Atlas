import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { statusConsentimento } from "@/lib/alunos";
import type { TipoConsentimento } from "@/lib/types";
import { registrarConsentimentoAction } from "@/app/actions/consentimento";

const TIPOS: { tipo: TipoConsentimento; label: string; descricao: string; obrigatorioMenor?: boolean }[] = [
  { tipo: "parental_menor", label: "Consentimento parental", descricao: "Autorização do responsável para tratar dados do menor.", obrigatorioMenor: true },
  { tipo: "comunicacao", label: "Comunicações", descricao: "Envio de avisos por e-mail, push e WhatsApp." },
  { tipo: "uso_imagem", label: "Uso de imagem", descricao: "Uso de fotos/vídeos em materiais da academia." },
  { tipo: "processamento_ia", label: "Processamento por IA", descricao: "Uso de dados anonimizados por recursos de IA." },
];

const TIPO_LABEL: Record<string, string> = Object.fromEntries(
  TIPOS.map((t) => [t.tipo, t.label]),
);

export default async function ConsentimentoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("alunos:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const aluno = await repo.obterAluno(tenant, params.id);
  if (!aluno) notFound();
  const [consents, responsaveis] = await Promise.all([
    repo.listarConsentsDoAluno(tenant, aluno.id),
    repo.listarResponsaveis(tenant),
  ]);
  const responsavel = responsaveis.find((r) => r.id === aluno.responsavel_id) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Link href="/dashboard/alunos" className="hover:text-slate-600">Alunos</Link>
        <span>/</span>
        <Link href={`/dashboard/alunos/${aluno.id}`} className="hover:text-slate-600">{aluno.nome}</Link>
        <span>/</span>
        <span className="text-slate-600">Consentimento</span>
      </div>
      <PageHeader titulo="Consentimento LGPD" subtitulo={`${aluno.nome}${responsavel ? ` · responsável ${responsavel.nome}` : ""}`} />

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      {aluno.menor_de_idade && statusConsentimento(consents, "parental_menor") !== true && (
        <Alert tipo="erro">Menor de idade sem consentimento parental — dados bloqueados até o aceite.</Alert>
      )}

      {/* Controle de aceite por tipo */}
      <div className="grid gap-4 sm:grid-cols-2">
        {TIPOS.map(({ tipo, label, descricao, obrigatorioMenor }) => {
          const status = statusConsentimento(consents, tipo);
          return (
            <div key={tipo} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
                  {status === true ? <Badge variante="sucesso">Concedido</Badge> : status === false ? <Badge variante="perigo">Revogado</Badge> : <Badge variante="alerta">Pendente</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{descricao}</p>
                {obrigatorioMenor && aluno.menor_de_idade && (
                  <p className="mt-1 text-xs font-medium text-amber-600">Obrigatório para menores</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <form action={registrarConsentimentoAction}>
                  <input type="hidden" name="aluno_id" value={aluno.id} />
                  <input type="hidden" name="responsavel_id" value={aluno.responsavel_id ?? ""} />
                  <input type="hidden" name="tipo" value={tipo} />
                  <input type="hidden" name="concedido" value="true" />
                  <button type="submit" disabled={status === true} className="rounded-lg bg-court-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-court-500 disabled:opacity-40">Conceder</button>
                </form>
                <form action={registrarConsentimentoAction}>
                  <input type="hidden" name="aluno_id" value={aluno.id} />
                  <input type="hidden" name="responsavel_id" value={aluno.responsavel_id ?? ""} />
                  <input type="hidden" name="tipo" value={tipo} />
                  <input type="hidden" name="concedido" value="false" />
                  <button type="submit" disabled={status === false || status === null} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40">Revogar</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico de consentimentos */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Histórico de consentimentos</h2>
        {consents.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum registro ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {consents.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{TIPO_LABEL[c.tipo] ?? c.tipo}</span>
                <span className="flex items-center gap-3">
                  {c.concedido ? <Badge variante="sucesso">Concedido</Badge> : <Badge variante="perigo">Revogado</Badge>}
                  <span className="font-mono text-xs text-slate-400">{c.criado_em.slice(0, 19).replace("T", " ")}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
