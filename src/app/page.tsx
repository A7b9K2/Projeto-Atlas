import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth/session";

export default async function Home() {
  const sessao = await getSessao();
  redirect(sessao ? "/dashboard" : "/login");
}
