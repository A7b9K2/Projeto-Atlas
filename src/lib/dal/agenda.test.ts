import { describe, expect, it } from "vitest";
import { MockRepository } from "./mock-repository";

const T = "acad-demo-0001";
const ATOR = "u-prop";

describe("agenda (mock): backend valida conflito e vagas", () => {
  it("criarAula rejeita conflito de quadra/professor", async () => {
    const repo = new MockRepository();
    // au-1 (seed): turma t-1 (prof u-prof, quadra q-1), Terça 09:00-10:00.
    // Nova turma na mesma quadra e faixa deve conflitar.
    const turma = await repo.criarTurma(T, ATOR, {
      nome: "Conflitante",
      professor_id: "u-prof",
      quadra_id: "q-1",
      capacidade: 4,
    });
    await expect(
      repo.criarAula(T, ATOR, {
        turma_id: turma.id,
        dia_semana: 2,
        hora_inicio: "09:30",
        hora_fim: "10:30",
      }),
    ).rejects.toThrow(/[Cc]onflito/);
  });

  it("criarAula aceita horário livre", async () => {
    const repo = new MockRepository();
    const turma = await repo.criarTurma(T, ATOR, {
      nome: "Livre",
      professor_id: "u-prof2",
      quadra_id: "q-3",
      capacidade: 4,
    });
    const aula = await repo.criarAula(T, ATOR, {
      turma_id: turma.id,
      dia_semana: 5,
      hora_inicio: "14:00",
      hora_fim: "15:00",
    });
    expect(aula.id).toBeTruthy();
  });

  it("matrícula respeita capacidade (controle de vagas)", async () => {
    const repo = new MockRepository();
    const turma = await repo.criarTurma(T, ATOR, {
      nome: "Cheia",
      professor_id: null,
      quadra_id: null,
      capacidade: 1,
    });
    await repo.matricular(T, ATOR, "a-1", turma.id);
    await expect(repo.matricular(T, ATOR, "a-2", turma.id)).rejects.toThrow(/vaga/i);
  });

  it("presença é upsert por (aula,data,aluno) e vira histórico", async () => {
    const repo = new MockRepository();
    await repo.registrarPresenca(T, ATOR, { aula_id: "au-1", data: "2026-07-21", aluno_id: "a-1", status: "ausente" });
    await repo.registrarPresenca(T, ATOR, { aula_id: "au-1", data: "2026-07-21", aluno_id: "a-1", status: "presente" });
    const lista = await repo.listarPresencas(T, "au-1", "2026-07-21");
    expect(lista).toHaveLength(1);
    expect(lista[0]?.status).toBe("presente");
    const hist = await repo.listarPresencasDoAluno(T, "a-1");
    expect(hist.length).toBeGreaterThan(0);
  });
});
