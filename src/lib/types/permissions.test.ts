import { describe, expect, it } from "vitest";
import { temPermissao, PERMISSOES_PADRAO } from "./permissions";
import { PAPEIS } from ".";

describe("permissões padrão (espelho da matriz do banco)", () => {
  it("proprietário tem acesso total", () => {
    expect(temPermissao("proprietario", "academia:gerir")).toBe(true);
    expect(temPermissao("proprietario", "financeiro:gerir")).toBe(true);
  });

  it("professor NÃO gere financeiro nem usuários", () => {
    expect(temPermissao("professor", "financeiro:gerir")).toBe(false);
    expect(temPermissao("professor", "usuarios:gerir")).toBe(false);
  });

  it("responsável só lê (nunca gere alunos)", () => {
    expect(temPermissao("responsavel", "alunos:ler")).toBe(true);
    expect(temPermissao("responsavel", "alunos:gerir")).toBe(false);
  });

  it("aluno não acessa financeiro", () => {
    expect(temPermissao("aluno", "financeiro:ler")).toBe(false);
  });

  it("todos os papéis têm matriz definida", () => {
    for (const papel of PAPEIS) {
      expect(PERMISSOES_PADRAO[papel]).toBeDefined();
    }
  });
});
