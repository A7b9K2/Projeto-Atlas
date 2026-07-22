import { describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";

const T = "acad-demo-0001";
const ATOR = "u-prop";

describe("comunicação (mock)", () => {
  it("registrarComunicacao adiciona entrada de auditoria", async () => {
    const repo = new MockRepository();
    await repo.registrarComunicacao(T, ATOR, "email", "resp@x.com");
    const audit = await repo.listarAuditLogs(T);
    const ev = audit.find((l) => l.acao === "comunicacao.enviada");
    expect(ev).toBeTruthy();
    expect(ev?.entidade_id).toBe("email:resp@x.com");
  });

  it("auditoria de comunicação isola por tenant", async () => {
    const repo = new MockRepository();
    await repo.registrarComunicacao(T, ATOR, "push", "device-1");
    const outra = await repo.listarAuditLogs("tenant-x");
    expect(outra.some((l) => l.acao === "comunicacao.enviada")).toBe(false);
  });
});
