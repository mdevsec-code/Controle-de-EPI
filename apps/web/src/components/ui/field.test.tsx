import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field, Input, PasswordInput } from "./field";

describe("Field", () => {
  it("associa rotulo, dica e erro ao controle", () => {
    render(
      <Field label="CPF" hint="Somente números" error="CPF inválido">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("CPF");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Somente números CPF inválido");
  });

  it("PasswordInput mantem o rotulo no proprio input (regressao) e alterna a visibilidade", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Senha">
        <PasswordInput />
      </Field>,
    );
    const input = screen.getByLabelText("Senha");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(input).toHaveAttribute("type", "text");
  });
});
