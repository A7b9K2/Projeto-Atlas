/**
 * Dados SEMENTE (seed) em memória para o preview rodar sem chaves externas.
 * Uma academia demo com os 5 papéis + alunos, turmas, aulas, matrículas,
 * pagamentos, avaliações e artefatos LGPD (consents + audit).
 */
import type {
  Academia,
  Aluno,
  Aula,
  AuditLog,
  Avaliacao,
  ChamadaAula,
  Consent,
  Contrato,
  Matricula,
  Pagamento,
  Papel,
  PapelPermissao,
  Presenca,
  Quadra,
  Responsavel,
  Turma,
  Usuario,
} from "@/lib/types";
import { PERMISSOES_PADRAO } from "@/lib/types/permissions";

const TENANT = "acad-demo-0001";
const AGORA = "2026-07-21T12:00:00.000Z";

/**
 * Mapa e-mail → papel para resolução edge-safe (usado pelo middleware no
 * modo mock). Pura, sem I/O. No modo Supabase o papel vem dos claims do JWT.
 */
export const EMAIL_PAPEL_SEED: Readonly<Record<string, Papel>> = {
  "proprietario@atlas.demo": "proprietario",
  "gestor@atlas.demo": "gestor",
  "professor@atlas.demo": "professor",
  "responsavel@atlas.demo": "responsavel",
  "aluno@atlas.demo": "aluno",
};

export function papelPorEmailSeed(email: string): Papel | null {
  return EMAIL_PAPEL_SEED[email.toLowerCase()] ?? null;
}

export interface SeedData {
  academias: Academia[];
  usuarios: Usuario[];
  papelPermissoes: PapelPermissao[];
  quadras: Quadra[];
  presencas: Presenca[];
  chamadas: ChamadaAula[];
  contratos: Contrato[];
  responsaveis: Responsavel[];
  alunos: Aluno[];
  turmas: Turma[];
  aulas: Aula[];
  matriculas: Matricula[];
  pagamentos: Pagamento[];
  avaliacoes: Avaliacao[];
  consents: Consent[];
  auditLogs: AuditLog[];
}

export function criarSeed(): SeedData {
  const academias: Academia[] = [
    {
      id: TENANT,
      nome_fantasia: "Atlas Tennis Academy",
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
    {
      id: "u-prof2",
      tenant_id: TENANT,
      nome: "Priscila Professora",
      email: "priscila@atlas.demo",
      papel: "professor",
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "u-gestor2",
      tenant_id: TENANT,
      nome: "Gabriel Gestor",
      email: "gabriel@atlas.demo",
      papel: "gestor",
      ativo: false,
      criado_em: AGORA,
    },
  ];

  // Matriz de permissões do tenant (overrides). Inicia igual ao padrão.
  const papelPermissoes: PapelPermissao[] = (
    Object.keys(PERMISSOES_PADRAO) as Papel[]
  ).flatMap((papel) =>
    PERMISSOES_PADRAO[papel].map((permissao) => ({
      tenant_id: TENANT,
      papel,
      permissao,
      concedida: true,
    })),
  );

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
      nome: "Bruno Silva",
      data_nascimento: "2016-03-14",
      menor_de_idade: true,
      responsavel_id: "r-1",
      foto_url: null,
      observacoes: "Boa evolução no forehand; foco no saque neste trimestre.",
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "a-2",
      tenant_id: TENANT,
      nome: "Clara Souza",
      data_nascimento: "2018-09-02",
      menor_de_idade: true,
      responsavel_id: "r-1",
      foto_url: null,
      observacoes: null,
      ativo: true,
      criado_em: AGORA,
    },
    {
      id: "a-3",
      tenant_id: TENANT,
      nome: "Diego Farias",
      data_nascimento: "2005-06-20",
      menor_de_idade: false,
      responsavel_id: null,
      foto_url: null,
      observacoes: "Aluno adulto; turma avançada.",
      ativo: true,
      criado_em: AGORA,
    },
  ];

  const quadras: Quadra[] = [
    { id: "q-1", tenant_id: TENANT, nome: "Quadra 1 (saibro)", tipo: "saibro", ativa: true, criada_em: AGORA },
    { id: "q-2", tenant_id: TENANT, nome: "Quadra 2 (rápida)", tipo: "rapida", ativa: true, criada_em: AGORA },
    { id: "q-3", tenant_id: TENANT, nome: "Quadra Coberta", tipo: "indoor", ativa: true, criada_em: AGORA },
  ];

  const turmas: Turma[] = [
    {
      id: "t-1",
      tenant_id: TENANT,
      nome: "Iniciante Infantil A",
      professor_id: "u-prof",
      quadra_id: "q-1",
      capacidade: 8,
      criada_em: AGORA,
    },
    {
      id: "t-2",
      tenant_id: TENANT,
      nome: "Intermediário Infantil",
      professor_id: "u-prof",
      quadra_id: "q-2",
      capacidade: 6,
      criada_em: AGORA,
    },
  ];

  const aulas: Aula[] = [
    {
      id: "au-1",
      tenant_id: TENANT,
      turma_id: "t-1",
      dia_semana: 2,
      hora_inicio: "09:00",
      hora_fim: "10:00",
      criada_em: AGORA,
    },
    {
      id: "au-2",
      tenant_id: TENANT,
      turma_id: "t-1",
      dia_semana: 4,
      hora_inicio: "09:00",
      hora_fim: "10:00",
      criada_em: AGORA,
    },
    {
      id: "au-3",
      tenant_id: TENANT,
      turma_id: "t-2",
      dia_semana: 3,
      hora_inicio: "10:00",
      hora_fim: "11:00",
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

  const contratos: Contrato[] = [
    { id: "ct-1", tenant_id: TENANT, aluno_id: "a-1", descricao: "Mensal 2x/semana", valor_centavos: 32000, dia_vencimento: 10, inicio: "2026-01", fim: null, ativo: true, criado_em: AGORA },
    { id: "ct-2", tenant_id: TENANT, aluno_id: "a-2", descricao: "Mensal 2x/semana", valor_centavos: 32000, dia_vencimento: 10, inicio: "2026-03", fim: null, ativo: true, criado_em: AGORA },
    { id: "ct-3", tenant_id: TENANT, aluno_id: "a-3", descricao: "Mensal avançado", valor_centavos: 45000, dia_vencimento: 5, inicio: "2026-02", fim: null, ativo: true, criado_em: AGORA },
  ];

  const pagamentos: Pagamento[] = [
    { id: "pg-1", tenant_id: TENANT, aluno_id: "a-1", contrato_id: "ct-1", competencia: "2026-07", valor_centavos: 32000, vencimento: "2026-07-10", status: "pago", metodo: "pix", id_externo: "stub_pix_seed1", pago_em: "2026-07-08T14:00:00.000Z", criado_em: AGORA },
    { id: "pg-2", tenant_id: TENANT, aluno_id: "a-2", contrato_id: "ct-2", competencia: "2026-07", valor_centavos: 32000, vencimento: "2026-07-10", status: "pendente", metodo: null, id_externo: null, pago_em: null, criado_em: AGORA },
    { id: "pg-3", tenant_id: TENANT, aluno_id: "a-3", contrato_id: "ct-3", competencia: "2026-06", valor_centavos: 45000, vencimento: "2026-06-05", status: "vencido", metodo: null, id_externo: null, pago_em: null, criado_em: AGORA },
    { id: "pg-4", tenant_id: TENANT, aluno_id: "a-1", contrato_id: "ct-1", competencia: "2026-06", valor_centavos: 32000, vencimento: "2026-06-10", status: "pago", metodo: "cartao", id_externo: "stub_cartao_seed2", pago_em: "2026-06-09T10:00:00.000Z", criado_em: AGORA },
  ];

  const avaliacoes: Avaliacao[] = [
    {
      id: "av-1",
      tenant_id: TENANT,
      aluno_id: "a-1",
      professor_id: "u-prof",
      saque: 7,
      forehand: 8,
      backhand: 6,
      observacoes: "Boa evolução no forehand; ajustar empunhadura no saque.",
      avaliado_em: "2026-07-15",
      criado_em: AGORA,
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

  const presencas: Presenca[] = [
    { id: "pr-1", tenant_id: TENANT, aula_id: "au-1", data: "2026-07-14", aluno_id: "a-1", status: "presente", criado_em: AGORA },
    { id: "pr-2", tenant_id: TENANT, aula_id: "au-1", data: "2026-07-14", aluno_id: "a-2", status: "ausente", criado_em: AGORA },
  ];

  const chamadas: ChamadaAula[] = [
    { id: "ch-1", tenant_id: TENANT, aula_id: "au-1", data: "2026-07-14", observacoes: "Treino de saque.", iniciada_em: AGORA, criado_em: AGORA },
  ];

  return {
    academias,
    usuarios,
    papelPermissoes,
    quadras,
    presencas,
    chamadas,
    contratos,
    responsaveis,
    alunos,
    turmas,
    aulas,
    matriculas,
    pagamentos,
    avaliacoes,
    consents,
    auditLogs,
  };
}
