import { describe, expect, it } from "vitest";
import { ApiError } from "./api-client";
import { errorMessage, fieldErrors } from "./errors";

describe("errorMessage", () => {
  it("monta mensagem especifica de estoque insuficiente a partir dos detalhes", () => {
    const error = new ApiError("ESTOQUE_INSUFICIENTE", 409, "x", [
      { stockItemId: "s1", epiName: "Bota de Seguranca (42)", requested: 2, available: 1 },
    ]);
    expect(errorMessage(error)).toBe(
      "Estoque insuficiente — Bota de Seguranca (42): disponível 1, solicitado 2.",
    );
  });

  it("usa mensagem amigavel por codigo e nunca expoe erro tecnico", () => {
    expect(errorMessage(new ApiError("SEM_PERMISSAO", 403, "Forbidden"))).toBe(
      "Você não tem permissão para esta ação.",
    );
    expect(errorMessage(new Error("TypeError: cannot read properties of undefined"))).not.toContain(
      "TypeError",
    );
  });

  it("extrai erros de campo de VALIDACAO", () => {
    const error = new ApiError("VALIDACAO", 422, "x", {
      fields: { cpf: ["CPF invalido"], name: [] },
    });
    expect(fieldErrors(error)).toEqual({ cpf: "CPF invalido" });
  });
});
