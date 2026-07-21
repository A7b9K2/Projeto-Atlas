import { describe, expect, it } from "vitest";
import { permissaoDaRota, podeAcessarRota } from "./authorization";

describe("autorização por rota (espelha as regras do RLS)", () => {
  it("professor NÃO acessa financeiro", () => {
    expect(podeAcessarRota("professor", "/dashboard/financeiro")).toBe(false);
  });

  it("aluno NÃO acessa financeiro", () => {
    expect(podeAcessarRota("aluno", "/dashboard/financeiro")).toBe(false);
  });

  it("proprietário e gestor acessam financeiro", () => {
    expect(podeAcessarRota("proprietario", "/dashboard/financeiro")).toBe(true);
    expect(podeAcessarRota("gestor", "/dashboard/financeiro")).toBe(true);
  });

  it("responsável acessa financeiro (linha filtrada pelo RLS)", () => {
    expect(podeAcessarRota("responsavel", "/dashboard/financeiro")).toBe(true);
  });

  it("só proprietário/gestor gerem usuários", () => {
    expect(podeAcessarRota("gestor", "/dashboard/usuarios")).toBe(true);
    expect(podeAcessarRota("professor", "/dashboard/usuarios")).toBe(false);
    expect(podeAcessarRota("responsavel", "/dashboard/usuarios")).toBe(false);
  });

  it("professor acessa pedagógico", () => {
    expect(podeAcessarRota("professor", "/dashboard/pedagogico")).toBe(true);
  });

  it("resolve permissão pelo prefixo mais longo", () => {
    expect(permissaoDaRota("/dashboard/financeiro/123")).toBe("financeiro:ler");
    expect(permissaoDaRota("/dashboard")).toBeNull();
  });
});
