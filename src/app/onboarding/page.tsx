import { criarAcademiaAction } from "@/app/actions/onboarding";

export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const erro = searchParams.erro;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-court-500 text-2xl">
            🎾
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Criar sua academia</h1>
          <p className="text-sm text-slate-500">
            Configure a academia e o proprietário em um passo
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {erro && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro === "campos"
                ? "Preencha todos os campos."
                : "Não foi possível criar a academia. Tente novamente."}
            </div>
          )}

          <form action={criarAcademiaAction} className="space-y-4">
            <div>
              <label htmlFor="nome_fantasia" className="mb-1 block text-sm font-medium text-slate-700">
                Nome da academia
              </label>
              <input
                id="nome_fantasia"
                name="nome_fantasia"
                required
                placeholder="Atlas Tennis Academy"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-atlas-500 focus:ring-2 focus:ring-atlas-100"
              />
            </div>
            <div>
              <label htmlFor="nome_usuario" className="mb-1 block text-sm font-medium text-slate-700">
                Seu nome (proprietário)
              </label>
              <input
                id="nome_usuario"
                name="nome_usuario"
                required
                placeholder="Maria Silva"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-atlas-500 focus:ring-2 focus:ring-atlas-100"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="maria@academia.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-atlas-500 focus:ring-2 focus:ring-atlas-100"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-court-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-court-500"
            >
              Criar Academia
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Uma única transação cria academia + proprietário + permissões padrão.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Já tem conta?{" "}
          <a href="/login" className="text-atlas-600 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
