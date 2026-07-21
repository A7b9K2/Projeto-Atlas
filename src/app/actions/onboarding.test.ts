import { describe, expect, it } from "vitest";
import { MockRepository } from "@/lib/dal/mock-repository";

/**
 * Valida o resultado da transação de onboarding no provider mock
 * (espelha o que a função SECURITY DEFINER faz no banco).
 */
describe("onboarding — criar academia + proprietário (transação)", () => {
  it("cria academia, proprietário e registra auditoria juntos", async () => {
    const repo = new MockRepository();
    const antes = (await repo.listarAcademias()).length;

    const sessao = await repo.criarAcademiaComProprietario({
      nome_fantasia: "Academia Teste",
      nome_usuario: "Dono Teste",
      email: "dono@teste.com",
    });

    // Academia criada
    const depois = await repo.listarAcademias();
    expect(depois.length).toBe(antes + 1);
    expect(sessao.academia.nome_fantasia).toBe("Academia Teste");

    // Proprietário criado e vinculado ao tenant
    const usuarios = await repo.listarUsuarios(sessao.academia.id);
    expect(usuarios).toHaveLength(1);
    expect(usuarios[0]?.papel).toBe("proprietario");
    expect(usuarios[0]?.tenant_id).toBe(sessao.academia.id);

    // Auditoria registrada no mesmo fluxo
    const audit = await repo.listarAuditLogs(sessao.academia.id);
    expect(audit.some((l) => l.acao === "academia.criada")).toBe(true);
  });

  it("o novo proprietário consegue autenticar e fica isolado", async () => {
    const repo = new MockRepository();
    await repo.criarAcademiaComProprietario({
      nome_fantasia: "Quadra Nova",
      nome_usuario: "Ana",
      email: "ana@quadra.com",
    });

    const sessao = await repo.autenticar("ana@quadra.com");
    expect(sessao).not.toBeNull();
    expect(sessao?.usuario.papel).toBe("proprietario");

    // Tenant novo não enxerga dados da academia demo.
    const alunos = await repo.listarAlunos(sessao!.academia.id);
    expect(alunos).toHaveLength(0);
  });
});
