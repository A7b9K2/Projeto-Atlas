import { describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";

describe("MockRepository — isolamento multi-tenant simulado", () => {
  it("autentica conta semente e resolve tenant + papel", async () => {
    const repo = new MockRepository();
    const sessao = await repo.autenticar("proprietario@atlas.demo");
    expect(sessao).not.toBeNull();
    expect(sessao?.usuario.papel).toBe("proprietario");
    expect(sessao?.academia.id).toBe(sessao?.usuario.tenant_id);
    expect(sessao?.academia.nome_fantasia).toBe("Atlas Tennis Academy");
  });

  it("rejeita e-mail inexistente", async () => {
    const repo = new MockRepository();
    expect(await repo.autenticar("ninguem@x.com")).toBeNull();
  });

  it("leituras retornam apenas o tenant solicitado", async () => {
    const repo = new MockRepository();
    const alunosDemo = await repo.listarAlunos("acad-demo-0001");
    const alunosOutro = await repo.listarAlunos("tenant-inexistente");
    expect(alunosDemo.length).toBeGreaterThan(0);
    expect(alunosOutro).toHaveLength(0);
  });

  it("onboarding cria academia + proprietário isolados", async () => {
    const repo = new MockRepository();
    const sessao = await repo.criarAcademiaComProprietario({
      nome_fantasia: "Nova Quadra",
      nome_usuario: "Dono Novo",
      email: "dono@nova.demo",
    });
    expect(sessao.usuario.papel).toBe("proprietario");
    // A nova academia não enxerga alunos da demo.
    const alunos = await repo.listarAlunos(sessao.academia.id);
    expect(alunos).toHaveLength(0);
  });
});
