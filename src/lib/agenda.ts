import type { Aula, Matricula, Turma } from "@/lib/types";

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
export const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Dois intervalos [inicioA,fimA) e [inicioB,fimB) se sobrepõem? */
export function horariossobrepoem(
  iniA: string,
  fimA: string,
  iniB: string,
  fimB: string,
): boolean {
  return minutos(iniA) < minutos(fimB) && minutos(iniB) < minutos(fimA);
}

export type TipoConflito = "horario" | "professor" | "quadra" | "aluno";

export interface Conflito {
  tipo: TipoConflito;
  aula_id: string;
  detalhe: string;
}

export interface AulaCandidata {
  id?: string; // ao editar, ignora a própria aula
  turma_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

/**
 * Detecção de conflitos no agendamento de uma aula (validação de backend).
 * Compara a candidata com as aulas existentes no mesmo dia da semana e
 * horário sobreposto, sinalizando conflito de professor, quadra e aluno
 * (alunos compartilhados via matrículas das turmas envolvidas).
 */
export function detectarConflitos(
  candidata: AulaCandidata,
  aulas: readonly Aula[],
  turmas: readonly Turma[],
  matriculas: readonly Matricula[],
): Conflito[] {
  const conflitos: Conflito[] = [];
  if (minutos(candidata.hora_inicio) >= minutos(candidata.hora_fim)) {
    conflitos.push({
      tipo: "horario",
      aula_id: "",
      detalhe: "Hora de início deve ser antes da hora de fim.",
    });
    return conflitos;
  }

  const turmaCand = turmas.find((t) => t.id === candidata.turma_id);
  const alunosCand = new Set(
    matriculas
      .filter((m) => m.ativa && m.turma_id === candidata.turma_id)
      .map((m) => m.aluno_id),
  );

  for (const aula of aulas) {
    if (candidata.id && aula.id === candidata.id) continue;
    if (aula.dia_semana !== candidata.dia_semana) continue;
    if (
      !horariossobrepoem(
        candidata.hora_inicio,
        candidata.hora_fim,
        aula.hora_inicio,
        aula.hora_fim,
      )
    )
      continue;

    const turmaOutra = turmas.find((t) => t.id === aula.turma_id);

    if (
      turmaCand?.professor_id &&
      turmaOutra?.professor_id === turmaCand.professor_id
    ) {
      conflitos.push({
        tipo: "professor",
        aula_id: aula.id,
        detalhe: "Professor já tem aula neste horário.",
      });
    }
    if (turmaCand?.quadra_id && turmaOutra?.quadra_id === turmaCand.quadra_id) {
      conflitos.push({
        tipo: "quadra",
        aula_id: aula.id,
        detalhe: "Quadra ocupada neste horário.",
      });
    }
    const alunosOutra = matriculas
      .filter((m) => m.ativa && m.turma_id === aula.turma_id)
      .map((m) => m.aluno_id);
    if (alunosOutra.some((a) => alunosCand.has(a))) {
      conflitos.push({
        tipo: "aluno",
        aula_id: aula.id,
        detalhe: "Aluno matriculado já tem aula neste horário.",
      });
    }
  }
  return conflitos;
}

/** Vagas restantes de uma turma. */
export function vagasRestantes(
  turma: Turma,
  matriculas: readonly Matricula[],
): number {
  const ocupadas = matriculas.filter(
    (m) => m.ativa && m.turma_id === turma.id,
  ).length;
  return turma.capacidade - ocupadas;
}

/** Nome ISO curto do dia (0=Dom). */
export function diaDaData(data: string): number {
  return new Date(`${data}T00:00:00`).getDay();
}

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Matriz do mês: semanas × 7 dias (Date), começando no domingo. */
export function gradeDoMes(ano: number, mes: number): Date[][] {
  const primeiro = new Date(ano, mes, 1);
  const inicio = new Date(primeiro);
  inicio.setDate(1 - primeiro.getDay());
  const semanas: Date[][] = [];
  const cursor = new Date(inicio);
  for (let s = 0; s < 6; s++) {
    const semana: Date[] = [];
    for (let d = 0; d < 7; d++) {
      semana.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(semana);
    if (cursor.getMonth() !== mes && cursor.getDay() === 0) break;
  }
  return semanas;
}
