import { describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";
import { statusConsentimento, bloqueadoPorLGPD } from "@/lib/alunos";

const TENANT = "acad-demo-0001";
const PROP = "u-prop";

describe("alunos (mock): CRUD, soft delete, LGPD", () => {
  it("cria aluno, deriva menor_de_idade e audita", async () => {
    const repo = new MockRepository();
    const menor = await repo.criarAluno(TENANT, PROP, {
      nome: "Novo Menor",
      data_nascimento: "2018-01-01",
      responsavel_id: "r-1",
    });
    expect(menor.menor_de_idade).toBe(true);
    const adulto = await repo.criarAluno(TENANT, PROP, {
      nome: "Adulto",
      data_nascimento: "1990-01-01",
      responsavel_id: null,
    });
    expect(adulto.menor_de_idade).toBe(false);
    const audit = await repo.listarAuditLogs(TENANT);
    expect(audit.filter((l) => l.acao === "aluno.criado").length).toBeGreaterThanOrEqual(2);
  });

  it("soft delete: arquivar mantém a linha e alterna ativo", async () => {
    const repo = new MockRepository();
    await repo.arquivarAluno(TENANT, PROP, "a-1", true);
    const a = await repo.obterAluno(TENANT, "a-1");
    expect(a?.ativo).toBe(false);
    await repo.arquivarAluno(TENANT, PROP, "a-1", false);
    expect((await repo.obterAluno(TENANT, "a-1"))?.ativo).toBe(true);
  });

  it("atualiza responsável e observações", async () => {
    const repo = new MockRepository();
    await repo.atualizarAluno(TENANT, PROP, "a-1", { observacoes: "nota nova" });
    expect((await repo.obterAluno(TENANT, "a-1"))?.observacoes).toBe("nota nova");
  });

  it("consentimento é append-only (histórico) e status = mais recente", async () => {
    const repo = new MockRepository();
    await repo.registrarConsentimento(TENANT, PROP, {
      aluno_id: "a-2",
      responsavel_id: "r-1",
      tipo: "parental_menor",
      concedido: true,
    });
    await repo.registrarConsentimento(TENANT, PROP, {
      aluno_id: "a-2",
      responsavel_id: "r-1",
      tipo: "parental_menor",
      concedido: false,
    });
    const hist = await repo.listarConsentsDoAluno(TENANT, "a-2");
    expect(hist.length).toBeGreaterThanOrEqual(2);
    expect(statusConsentimento(hist, "parental_menor")).toBe(false);
  });

  it("menor sem consentimento é bloqueado por LGPD", async () => {
    const repo = new MockRepository();
    const consents = await repo.listarConsentsDoAluno(TENANT, "a-2"); // a-2 pendente no seed
    expect(bloqueadoPorLGPD(true, consents)).toBe(true);
  });

  it("mutações não vazam entre tenants", async () => {
    const repo = new MockRepository();
    await expect(
      repo.atualizarAluno("tenant-x", PROP, "a-1", { nome: "X" }),
    ).rejects.toThrow();
  });
});
