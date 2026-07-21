import { describe, expect, it } from "vitest";
import { detectarConflitos, vagasRestantes, horariossobrepoem } from "./agenda";
import type { Aula, Matricula, Turma } from "@/lib/types";

const T = "acad-demo-0001";
const turmas: Turma[] = [
  { id: "t1", tenant_id: T, nome: "A", professor_id: "prof1", quadra_id: "q1", capacidade: 2, criada_em: "" },
  { id: "t2", tenant_id: T, nome: "B", professor_id: "prof1", quadra_id: "q2", capacidade: 4, criada_em: "" },
  { id: "t3", tenant_id: T, nome: "C", professor_id: "prof2", quadra_id: "q1", capacidade: 4, criada_em: "" },
];
const aulas: Aula[] = [
  { id: "au1", tenant_id: T, turma_id: "t1", dia_semana: 2, hora_inicio: "09:00", hora_fim: "10:00", criada_em: "" },
];
const matriculas: Matricula[] = [
  { id: "m1", tenant_id: T, aluno_id: "al1", turma_id: "t1", ativa: true, criada_em: "" },
  { id: "m2", tenant_id: T, aluno_id: "al2", turma_id: "t1", ativa: true, criada_em: "" },
];

describe("detecção de conflitos de agenda", () => {
  it("sobreposição de horário é detectada", () => {
    expect(horariossobrepoem("09:00", "10:00", "09:30", "10:30")).toBe(true);
    expect(horariossobrepoem("09:00", "10:00", "10:00", "11:00")).toBe(false);
  });

  it("conflito de professor: mesma faixa, mesmo professor", () => {
    const c = detectarConflitos(
      { turma_id: "t2", dia_semana: 2, hora_inicio: "09:30", hora_fim: "10:30" },
      aulas, turmas, matriculas,
    );
    expect(c.some((x) => x.tipo === "professor")).toBe(true);
  });

  it("conflito de quadra: mesma quadra ocupada", () => {
    const c = detectarConflitos(
      { turma_id: "t3", dia_semana: 2, hora_inicio: "09:00", hora_fim: "10:00" },
      aulas, turmas, matriculas,
    );
    expect(c.some((x) => x.tipo === "quadra")).toBe(true);
  });

  it("conflito de aluno: aluno compartilhado entre turmas", () => {
    const extra: Matricula[] = [
      ...matriculas,
      { id: "m3", tenant_id: T, aluno_id: "al1", turma_id: "t2", ativa: true, criada_em: "" },
    ];
    const c = detectarConflitos(
      { turma_id: "t2", dia_semana: 2, hora_inicio: "09:15", hora_fim: "10:15" },
      aulas, turmas, extra,
    );
    expect(c.some((x) => x.tipo === "aluno")).toBe(true);
  });

  it("sem sobreposição de horário: sem conflito", () => {
    const c = detectarConflitos(
      { turma_id: "t2", dia_semana: 2, hora_inicio: "10:00", hora_fim: "11:00" },
      aulas, turmas, matriculas,
    );
    expect(c).toHaveLength(0);
  });

  it("hora início >= fim é inválido", () => {
    const c = detectarConflitos(
      { turma_id: "t2", dia_semana: 3, hora_inicio: "11:00", hora_fim: "10:00" },
      aulas, turmas, matriculas,
    );
    expect(c.some((x) => x.tipo === "horario")).toBe(true);
  });

  it("editar a própria aula não gera autoconflito", () => {
    const c = detectarConflitos(
      { id: "au1", turma_id: "t1", dia_semana: 2, hora_inicio: "09:00", hora_fim: "10:00" },
      aulas, turmas, matriculas,
    );
    expect(c).toHaveLength(0);
  });

  it("vagas restantes respeita capacidade", () => {
    expect(vagasRestantes(turmas[0]!, matriculas)).toBe(0); // cap 2, 2 ativas
    expect(vagasRestantes(turmas[1]!, matriculas)).toBe(4);
  });
});
