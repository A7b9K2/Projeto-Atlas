import { describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";
import { mediaAvaliacao, evolucao, nivelPorMedia } from "@/lib/pedagogico";

const T = "acad-demo-0001";
const ATOR = "u-prof";

describe("pedagógico (mock + helpers)", () => {
  it("criarAvaliacao registra e faz clamp de notas 0–10", async () => {
    const repo = new MockRepository();
    const av = await repo.criarAvaliacao(T, ATOR, {
      aluno_id: "a-1",
      saque: 12,
      forehand: -3,
      backhand: 8,
      observacoes: "teste",
    });
    expect(av.saque).toBe(10);
    expect(av.forehand).toBe(0);
    expect(av.backhand).toBe(8);
    expect(av.professor_id).toBe(ATOR);
  });

  it("listarAvaliacoesDoAluno isola por aluno e ordena por data desc", async () => {
    const repo = new MockRepository();
    await repo.criarAvaliacao(T, ATOR, { aluno_id: "a-2", saque: 5, forehand: 5, backhand: 5, avaliado_em: "2026-01-01" });
    await repo.criarAvaliacao(T, ATOR, { aluno_id: "a-2", saque: 8, forehand: 8, backhand: 8, avaliado_em: "2026-06-01" });
    const lista = await repo.listarAvaliacoesDoAluno(T, "a-2");
    expect(lista.length).toBe(2);
    expect(lista[0]?.avaliado_em).toBe("2026-06-01");
    expect(lista.every((a) => a.aluno_id === "a-2")).toBe(true);
  });

  it("média, nível e evolução calculam corretamente", () => {
    const base = { id: "x", tenant_id: T, aluno_id: "a", professor_id: "p", observacoes: null, criado_em: "" };
    const a1 = { ...base, saque: 4, forehand: 4, backhand: 4, avaliado_em: "2026-01-01" };
    const a2 = { ...base, saque: 8, forehand: 8, backhand: 8, avaliado_em: "2026-06-01" };
    expect(mediaAvaliacao(a1)).toBe(4);
    expect(nivelPorMedia(8)).toBe("sucesso");
    expect(evolucao([a1, a2])).toBe(4);
    expect(evolucao([a1])).toBeNull();
  });

  it("mutação de avaliação não vaza entre tenants", async () => {
    const repo = new MockRepository();
    const outra = await repo.listarAvaliacoesDoAluno("tenant-x", "a-1");
    expect(outra).toHaveLength(0);
  });
});
