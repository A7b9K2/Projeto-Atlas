/**
 * Dados SEMENTE (seed) em memória para o preview rodar sem chaves externas.
 * Uma academia demo com os 5 papéis + alunos, turmas, matrículas, finanças
 * e artefatos LGPD (consents + audit).
 */
import type {
  Academia,
  Aluno,
  AuditLog,
  Consent,
  Matricula,
  Mensalidade,
  Responsavel,
  Turma,
  Usuario,
} from "@/lib/domain/types";

const TENANT = "acad-demo-0001";
const AGORA = "2026-07-21T12:00:00.000Z";

export interface SeedData {
  academias: Academia[];
  usuarios: Usuario[];
  responsaveis: Responsavel[];
  alunos: Aluno[];
  turmas: Turma[];
  matriculas: Matricula[];
  mensalidades: Mensalidade[];
  consents: Consent[];
  auditLogs: AuditLog[];
}

export function criarSeed(): SeedData {
  const academias: Academia[] = [
    {
      id: TENANT,
      nome_fantasia: "Academia Saque de Ouro",
      criada_em: AGORA,
    },
  ];

  const usuarios: Usuario[] = [
    {
      id: "u-prop",
      tenant_id: TENANT,
      nome: "Paula Proprietária",
      email: "proprietario@atlas.demo",
      papel: "proprietario",
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "u-gestor",
      tenant_id: TENANT,
      nome: "Gustavo Gestor",
      email: "gestor@atlas.demo",
      papel: "gestor",
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "u-prof",
      tenant_id: TENANT,
      nome: "Pedro Professor",
      email: "professor@atlas.demo",
      papel: "professor",
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "u-resp",
      tenant_id: TENANT,
      nome: "Renata Responsável",
      email: "responsavel@atlas.demo",
      papel: "responsavel",
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "u-aluno",
      tenant_id: TENANT,
      nome: "Alan Aluno",
      email: "aluno@atlas.demo",
      papel: "aluno",
      ativo: true,
      criado_em: AGORA,
    },
  ];

  const responsaveis: Responsavel[] = [
    {
      id: "r-1",
      tenant_id: TENANT,
      nome: "Renata Responsável",
      email: "responsavel@atlas.demo",
      telefone: "(11) 99999-0001",
      criado_em: AGORA,
    },
  ];

  const alunos: Aluno[] = [
    {
      id: "a-1",
      tenant_id: TENANT,
      nome: "Bruno Silva (10 anos)",
      data_nascimento: "2016-03-14",
      menor_de_idade: true,
      responsavel_id: "r-1",
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "a-2",
      tenant_id: TENANT,
      nome: "Clara Souza (8 anos)",
      data_nascimento: "2018-09-02",
      menor_de_idade: true,
      responsavel_id: "r-1",
      ativo: true,
      criado_em: AGORA,
    },
  ];

  const turmas: Turma[] = [
    {
      id: "t-1",
      tenant_id: TENANT,
      nome: "Iniciante Infantil A",
      professor_id: "u-prof",
      dia_semana: 2,
      hora_inicio: "09:00",
      hora_fim: "10:00",
      capacidade: 8,
      criada_em: AGORA,
    },
    {
      id: "t-2",
      tenant_id: TENANT,
      nome: "Intermediário Infantil",
      professor_id: "u-prof",
      dia_semana: 4,
      hora_inicio: "10:00",
      hora_fim: "11:00",
      capacidade: 6,
      criada_em: AGORA,
    },
  ];

  const matriculas: Matricula[] = [
    {
      id: "m-1",
      tenant_id: TENANT,
      aluno_id: "a-1",
      turma_id: "t-1",
      ativa: true,
      criada_em: AGORA,
    },
    {
      id: "m-2",
      tenant_id: TENANT,
      aluno_id: "a-2",
      turma_id: "t-1",
      ativa: true,
      criada_em: AGORA,
    },
  ];

  const mensalidades: Mensalidade[] = [
    {
      id: "men-1",
      tenant_id: TENANT,
      aluno_id: "a-1",
      competencia: "2026-07",
      valor_centavos: 32000,
      vencimento: "2026-07-10",
      status: "paga",
      pago_em: "2026-07-08T14:00:00.000Z",
      criada_em: AGORA,
    },
    {
      id: "men-2",
      tenant_id: TENANT,
      aluno_id: "a-2",
      competencia: "2026-07",
      valor_centavos: 32000,
      vencimento: "2026-07-10",
      status: "pendente",
      pago_em: null,
      criada_em: AGORA,
    },
  ];

  const consents: Consent[] = [
    {
      id: "c-1",
      tenant_id: TENANT,
      aluno_id: "a-1",
      responsavel_id: "r-1",
      tipo: "parental_menor",
      concedido: true,
      concedido_em: AGORA,
      criado_em: AGORA,
    },
    {
      id: "c-2",
      tenant_id: TENANT,
      aluno_id: "a-2",
      responsavel_id: "r-1",
      tipo: "parental_menor",
      concedido: false,
      concedido_em: null,
      criado_em: AGORA,
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "log-1",
      tenant_id: TENANT,
      ator_id: "u-prop",
      acao: "academia.criada",
      entidade: "academia",
      entidade_id: TENANT,
      criado_em: AGORA,
    },
  ];

  return {
    academias,
    usuarios,
    responsaveis,
    alunos,
    turmas,
    matriculas,
    mensalidades,
    consents,
    auditLogs,
  };
}
