import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth/session";
import { AppNav } from "@/components/AppNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  return (
    <div className="min-h-screen lg:flex">
      <AppNav
        nomeAcademia={sessao.academia.nome_fantasia}
        nomeUsuario={sessao.usuario.nome}
        papel={sessao.usuario.papel}
      />
      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
