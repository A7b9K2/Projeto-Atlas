export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-court-500 text-2xl">
          🏗️
        </div>
        <h1 className="mb-2 text-xl font-bold text-slate-900">
          Criar academia
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          O onboarding (função <code>criar_academia_com_proprietario</code>) será
          implementado na Fase 2. Ele cria academia + proprietário numa transação
          via função SECURITY DEFINER no Supabase.
        </p>
        <a
          href="/login"
          className="inline-block rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white hover:bg-atlas-700"
        >
          Voltar ao login
        </a>
      </div>
    </main>
  );
}
