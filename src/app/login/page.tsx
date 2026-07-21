import { loginAction } from "@/app/actions/auth";

const CONTAS_DEMO = [
  { email: "proprietario@atlas.demo", nome: "Paula Proprietária", papel: "Proprietária", icone: "👑" },
  { email: "gestor@atlas.demo", nome: "Gustavo Gestor", papel: "Gestor", icone: "🗂️" },
  { email: "professor@atlas.demo", nome: "Pedro Professor", papel: "Professor", icone: "🎾" },
  { email: "responsavel@atlas.demo", nome: "Renata Responsável", papel: "Responsável", icone: "👪" },
  { email: "aluno@atlas.demo", nome: "Alan Aluno", papel: "Aluno", icone: "🧒" },
];

export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const erro = searchParams.erro;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-atlas-600 text-2xl">
            🎾
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Atlas Tennis Academy</h1>
          <p className="text-sm text-slate-500">
            Entrar como usuário de demonstração
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {erro && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro === "credenciais"
                ? "E-mail não encontrado na base semente."
                : "Selecione um usuário."}
            </div>
          )}

          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Selecione o papel (preview — sem senha)
          </p>
          <ul className="space-y-2">
            {CONTAS_DEMO.map((c) => (
              <li key={c.email}>
                <form action={loginAction}>
                  <input type="hidden" name="email" value={c.email} />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-atlas-500 hover:bg-atlas-50"
                  >
                    <span className="text-xl">{c.icone}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-800">
                        {c.nome}
                      </span>
                      <span className="block font-mono text-xs text-slate-400">
                        {c.email}
                      </span>
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {c.papel}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Ainda não tem academia?{" "}
          <a href="/onboarding" className="text-atlas-600 hover:underline">
            Criar academia
          </a>
        </p>
      </div>
    </main>
  );
}
