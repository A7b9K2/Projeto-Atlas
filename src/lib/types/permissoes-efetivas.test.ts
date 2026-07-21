import { describe, expect, it } from "vitest";
import { permissoesEfetivas } from "./permissions";

describe("permissões efetivas (padrão + overrides do tenant)", () => {
  it("sem overrides, herda o padrão do papel", () => {
    const efetivas = permissoesEfetivas("professor", []);
    expect(efetivas.has("pedagogico:gerir")).toBe(true);
    expect(efetivas.has("financeiro:ler")).toBe(false);
  });

  it("override concedida=true adiciona permissão ao papel", () => {
    const efetivas = permissoesEfetivas("professor", [
      { papel: "professor", permissao: "financeiro:ler", concedida: true },
    ]);
    expect(efetivas.has("financeiro:ler")).toBe(true);
  });

  it("override concedida=false revoga permissão do padrão", () => {
    const efetivas = permissoesEfetivas("gestor", [
      { papel: "gestor", permissao: "financeiro:gerir", concedida: false },
    ]);
    expect(efetivas.has("financeiro:gerir")).toBe(false);
  });

  it("ignora overrides de outro papel", () => {
    const efetivas = permissoesEfetivas("aluno", [
      { papel: "professor", permissao: "financeiro:ler", concedida: true },
    ]);
    expect(efetivas.has("financeiro:ler")).toBe(false);
  });
});
