import { exigirPermissao } from "@/lib/auth/session";
import { getRepository } from "@/lib/dal";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { enviarComunicacaoAction } from "@/app/actions/comunicacao";

const CANAL_LABEL: Record<string, string> = {
  email: "E-mail",
  push: "Push",
  whatsapp: "WhatsApp",
};

export default async function ComunicacaoPage({
  searchParams,
}: {
  searchParams: { ok?: string; erro?: string };
}) {
  const sessao = await exigirPermissao("usuarios:gerir");
  const repo = getRepository();
  const tenant = sessao.academia.id;
  const [responsaveis, auditLogs] = await Promise.all([
    repo.listarResponsaveis(tenant),
    repo.listarAuditLogs(tenant),
  ]);
  const historico = auditLogs
    .filter((l) => l.acao === "comunicacao.enviada")
    .slice(0, 10);

  const provComunicacao = process.env.COMMUNICATION_PROVIDER ?? "stub";
  const provPagamento = process.env.PAYMENT_PROVIDER ?? "stub";
  const provIA = process.env.LLM_PROVIDER ?? "stub";
  const integracoes = [
    { nome: "Comunicação", provider: provComunicacao, icone: "📣", detalhe: "E-mail · Push · WhatsApp" },
    { nome: "Pagamentos", provider: provPagamento, icone: "💳", detalhe: "Pix · Boleto · Cartão" },
    { nome: "IA", provider: provIA, icone: "🤖", detalhe: "Anonimização · teto de custo · anti-injection" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titulo="Comunicação" subtitulo="Envie avisos às famílias e acompanhe as integrações" />

      {searchParams.ok && <Alert tipo="sucesso">{searchParams.ok}</Alert>}
      {searchParams.erro && <Alert tipo="erro">{searchParams.erro}</Alert>}

      {/* Status das integrações */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Integrações</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {integracoes.map((it) => (
            <div key={it.nome} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-semibold text-slate-800">
                  <span className="text-lg">{it.icone}</span>
                  {it.nome}
                </span>
                {it.provider === "stub" ? (
                  <Badge variante="alerta">stub</Badge>
                ) : (
                  <Badge variante="sucesso">{it.provider}</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">{it.detalhe}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Provedores abstraídos por interface — trocáveis por variável de ambiente
          sem reescrever o app. No preview rodam em modo stub.
        </p>
      </section>

      {/* Envio */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Nova comunicação</h2>
        <form action={enviarComunicacaoAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="canal" defaultValue="email" aria-label="Canal" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="email">E-mail</option>
              <option value="push">Push</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <input
              name="destinatario"
              required
              list="responsaveis-emails"
              aria-label="Destinatário"
              placeholder="Destinatário (e-mail/telefone)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <datalist id="responsaveis-emails">
              {responsaveis.map((r) => (
                <option key={r.id} value={r.email}>{r.nome}</option>
              ))}
            </datalist>
          </div>
          <input name="assunto" aria-label="Assunto" placeholder="Assunto (opcional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <textarea name="corpo" required rows={3} aria-label="Mensagem" placeholder="Escreva a mensagem…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="text-right">
            <button className="rounded-lg bg-atlas-600 px-5 py-2 text-sm font-semibold text-white hover:bg-atlas-700">Enviar</button>
          </div>
        </form>
      </section>

      {/* Histórico */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Enviadas recentemente</h2>
        {historico.length === 0 ? (
          <EmptyState icone="📭" titulo="Nenhuma comunicação enviada" descricao="As mensagens enviadas aparecerão aqui, com canal e destinatário." />
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {historico.map((l) => {
              const [canal, ...resto] = (l.entidade_id ?? "").split(":");
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge variante="info">{CANAL_LABEL[canal ?? ""] ?? canal}</Badge>
                    <span className="truncate text-slate-700">{resto.join(":")}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-slate-400">{l.criado_em.slice(0, 19).replace("T", " ")}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
