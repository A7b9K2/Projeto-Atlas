import { describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";

const TENANT = "acad-demo-0001";
const PROP = "u-prop";

describe("gestão de usuários (mock, com auditoria)", () => {
  it("convida usuário e registra auditoria", async () => {
    const repo = new MockRepository();
    const antes = (await repo.listarUsuarios(TENANT)).length;
    const novo = await repo.convidarUsuario(TENANT, PROP, {
      nome: "Novo Prof",
      email: "novo@atlas.demo",
      papel: "professor",
    });
    expect(novo.papel).toBe("professor");
    expect((await repo.listarUsuarios(TENANT)).length).toBe(antes + 1);
    const audit = await repo.listarAuditLogs(TENANT);
    expect(audit.some((l) => l.acao === "usuario.convidado")).toBe(true);
  });

  it("rejeita e-mail duplicado no tenant", async () => {
    const repo = new MockRepository();
    await expect(
      repo.convidarUsuario(TENANT, PROP, {
        nome: "Dup",
        email: "professor@atlas.demo",
        papel: "professor",
      }),
    ).rejects.toThrow();
  });

  it("altera papel, mas impede alterar o próprio", async () => {
    const repo = new MockRepository();
    await repo.alterarPapelUsuario(TENANT, PROP, "u-prof", "gestor");
    const u = (await repo.listarUsuarios(TENANT)).find((x) => x.id === "u-prof");
    expect(u?.papel).toBe("gestor");
    await expect(
      repo.alterarPapelUsuario(TENANT, PROP, PROP, "gestor"),
    ).rejects.toThrow();
  });

  it("ativa/inativa usuário e impede inativar a si mesmo", async () => {
    const repo = new MockRepository();
    await repo.definirAtivoUsuario(TENANT, PROP, "u-prof", false);
    const u = (await repo.listarUsuarios(TENANT)).find((x) => x.id === "u-prof");
    expect(u?.ativo).toBe(false);
    await expect(
      repo.definirAtivoUsuario(TENANT, PROP, PROP, false),
    ).rejects.toThrow();
  });

  it("remove usuário, mas protege o único proprietário e o próprio", async () => {
    const repo = new MockRepository();
    await repo.removerUsuario(TENANT, PROP, "u-aluno");
    expect(
      (await repo.listarUsuarios(TENANT)).some((x) => x.id === "u-aluno"),
    ).toBe(false);
    // proprietário não pode remover a si mesmo
    await expect(repo.removerUsuario(TENANT, PROP, PROP)).rejects.toThrow();
  });

  it("não vaza mutações entre tenants", async () => {
    const repo = new MockRepository();
    await expect(
      repo.alterarPapelUsuario("tenant-x", PROP, "u-prof", "gestor"),
    ).rejects.toThrow();
  });
});
