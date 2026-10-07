import { describe, expect, it } from "vitest";
import { canReceiveEpi, canTransition } from "./employee-status.js";

describe("canTransition", () => {
  it("permite bloquear, inativar e desligar um colaborador ativo", () => {
    expect(canTransition("ATIVO", "BLOQUEADO")).toBe(true);
    expect(canTransition("ATIVO", "INATIVO")).toBe(true);
    expect(canTransition("ATIVO", "DESLIGADO")).toBe(true);
  });

  it("desligado so volta por readmissao (ATIVO)", () => {
    expect(canTransition("DESLIGADO", "ATIVO")).toBe(true);
    expect(canTransition("DESLIGADO", "BLOQUEADO")).toBe(false);
    expect(canTransition("DESLIGADO", "INATIVO")).toBe(false);
  });

  it("recusa transicao para o mesmo status", () => {
    expect(canTransition("ATIVO", "ATIVO")).toBe(false);
  });
});

describe("canReceiveEpi", () => {
  it("somente ATIVO recebe EPI", () => {
    expect(canReceiveEpi("ATIVO")).toBe(true);
    expect(canReceiveEpi("BLOQUEADO")).toBe(false);
    expect(canReceiveEpi("INATIVO")).toBe(false);
    expect(canReceiveEpi("DESLIGADO")).toBe(false);
  });
});
