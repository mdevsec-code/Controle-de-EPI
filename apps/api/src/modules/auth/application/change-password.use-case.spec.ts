import { describe, expect, it } from "vitest";
import { ChangePasswordUseCase } from "./change-password.use-case.js";
import { activeUser, buildAuthDeps, client } from "./test-doubles.js";

function build(deps: ReturnType<typeof buildAuthDeps>) {
  return new ChangePasswordUseCase(
    deps.userRepository,
    deps.refreshTokenRepository,
    deps.passwordHasher,
    deps.sessionIssuer,
    deps.audit,
  );
}

describe("ChangePasswordUseCase", () => {
  it("troca a senha, revoga as outras sessoes e emite sessao com o novo tokenVersion", async () => {
    const deps = buildAuthDeps();
    deps.userRepository.updatePassword.mockResolvedValue({ ...activeUser, tokenVersion: 4 });

    await build(deps).execute(
      "user-1",
      { currentPassword: "senha-correta", newPassword: "NovaSenha@2026" },
      client,
    );

    expect(deps.userRepository.updatePassword).toHaveBeenCalledWith("user-1", "novo-hash");
    expect(deps.refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
    expect(deps.tokenService.signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ ver: 4 }),
    );
  });

  it("recusa quando a senha atual esta errada", async () => {
    const deps = buildAuthDeps();
    await expect(
      build(deps).execute(
        "user-1",
        { currentPassword: "errada", newPassword: "NovaSenha@2026" },
        client,
      ),
    ).rejects.toMatchObject({ code: "SENHA_ATUAL_INCORRETA" });
    expect(deps.userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("recusa nova senha igual a atual", async () => {
    const deps = buildAuthDeps();
    await expect(
      build(deps).execute(
        "user-1",
        { currentPassword: "senha-correta", newPassword: "senha-correta" },
        client,
      ),
    ).rejects.toMatchObject({ code: "VALIDACAO" });
  });
});
