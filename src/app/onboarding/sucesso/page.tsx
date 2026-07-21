import { loginAction } from "@/app/actions/auth";

export default function OnboardingSucessoPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-court-500/15 text-2xl">
            ✅
          </div>
          <h1 className="mb-2 text-xl font-bold text-slate-900">
            Academia criada!
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            Sua academia e o usuário proprietário foram criados numa única
            transação, com as permissões padrão aplicadas. Faça login novamente
            para atualizar seu acesso (JWT com o novo tenant).
          </p>

          <form action={loginAction}>
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              className="w-full rounded-lg bg-atlas-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-atlas-700"
            >
              Entrar agora{email ? ` como ${email}` : ""}
            </button>
          </form>

          <a
            href="/login"
            className="mt-3 inline-block text-xs text-slate-400 hover:text-slate-600"
          >
            Ir para o login
          </a>
        </div>
      </div>
    </main>
  );
}
