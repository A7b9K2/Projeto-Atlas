import { describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";
import { statusEfetivo, resumo, fluxoDeCaixa } from "@/lib/financeiro";

const T = "acad-demo-0001";
const ATOR = "u-prop";

describe("financeiro (mock)", () => {
  it("gerarMensalidades é idempotente por contrato/competência", async () => {
    const repo = new MockRepository();
    const n1 = await repo.gerarMensalidades(T, ATOR, "2026-08");
    expect(n1).toBeGreaterThan(0);
    const n2 = await repo.gerarMensalidades(T, ATOR, "2026-08");
    expect(n2).toBe(0); // nada duplicado
  });

  it("emitirCobrança usa o gateway e grava id_externo + método", async () => {
    const repo = new MockRepository();
    await repo.gerarMensalidades(T, ATOR, "2026-08");
    const pgs = await repo.listarPagamentos(T);
    const pendente = pgs.find((p) => p.competencia === "2026-08" && p.status === "pendente");
    expect(pendente).toBeTruthy();
    await repo.emitirCobranca(T, ATOR, pendente!.id, "pix");
    const atualizado = (await repo.listarPagamentos(T)).find((p) => p.id === pendente!.id);
    expect(atualizado?.metodo).toBe("pix");
    expect(atualizado?.id_externo).toMatch(/^stub_pix_/);
  });

  it("registrarPagamento confirma e reabre", async () => {
    const repo = new MockRepository();
    const pgs = await repo.listarPagamentos(T);
    const pend = pgs.find((p) => p.status === "pendente")!;
    await repo.registrarPagamento(T, ATOR, pend.id, true);
    expect((await repo.listarPagamentos(T)).find((p) => p.id === pend.id)?.status).toBe("pago");
    await repo.registrarPagamento(T, ATOR, pend.id, false);
    expect((await repo.listarPagamentos(T)).find((p) => p.id === pend.id)?.status).toBe("pendente");
  });

  it("statusEfetivo marca vencido quando pendente e vencimento no passado", () => {
    const base = {
      id: "x", tenant_id: T, aluno_id: "a", contrato_id: null,
      competencia: "2026-06", valor_centavos: 1000, metodo: null,
      id_externo: null, pago_em: null, criado_em: "",
    } as const;
    expect(statusEfetivo({ ...base, vencimento: "2026-06-05", status: "pendente" })).toBe("vencido");
    expect(statusEfetivo({ ...base, vencimento: "2999-01-01", status: "pendente" })).toBe("pendente");
  });

  it("resumo e fluxo de caixa agregam corretamente", async () => {
    const repo = new MockRepository();
    const pgs = await repo.listarPagamentos(T);
    const r = resumo(pgs);
    expect(r.inadimplencia).toBeGreaterThan(0); // seed tem 1 vencido (pg-3)
    const fluxo = fluxoDeCaixa(pgs);
    expect(fluxo.length).toBeGreaterThan(0);
    expect(fluxo.every((f) => f.recebido <= f.previsto)).toBe(true);
  });

  it("mutações financeiras não vazam entre tenants", async () => {
    const repo = new MockRepository();
    await expect(repo.registrarPagamento("tenant-x", ATOR, "pg-1", true)).rejects.toThrow();
  });
});
