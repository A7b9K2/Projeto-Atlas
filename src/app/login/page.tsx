import { loginAction } from "@/app/actions/auth";

const CONTAS_DEMO = [
  { email: "proprietario@atlas.demo", papel: "Proprietária" },
  { email: "gestor@atlas.demo", papel: "Gestor" },
  { email: "professor@atlas.demo", papel: "Professor" },
  { email: "responsavel@atlas.demo", papel: "Responsável" },
  { email: "aluno@atlas.demo", papel: "Aluno" },
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
          <h1 className="text-2xl font-bold text-slate-900">Atlas</h1>
          <p className="text-sm text-slate-500">
            Gestão de academias de tênis infantil
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {erro && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro === "credenciais"
                ? "E-mail não encontrado na base semente."
                : "Informe um e-mail."}
            </div>
          )}

          <form action={loginAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="proprietario@atlas.demo"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-atlas-500 focus:ring-2 focus:ring-atlas-100"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-atlas-700"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Contas semente (preview)
            </p>
            <ul className="space-y-1">
              {CONTAS_DEMO.map((c) => (
                <li
                  key={c.email}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-xs text-slate-600">
                    {c.email}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {c.papel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
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
