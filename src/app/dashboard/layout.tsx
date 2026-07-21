import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth/session";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        nomeAcademia={sessao.academia.nome_fantasia}
        nomeUsuario={sessao.usuario.nome}
        papel={sessao.usuario.papel}
      />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
