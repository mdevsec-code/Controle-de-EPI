import { describe, expect, it } from "vitest";
import { RefreshTokenUseCase, REUSE_GRACE_MS } from "./refresh-token.use-case.js";
import { activeUser, buildAuthDeps, client } from "./test-doubles.js";

const NOW = new Date("2026-10-06T12:00:00Z");

function build(deps: ReturnType<typeof buildAuthDeps>) {
  return new RefreshTokenUseCase(
    deps.userRepository,
    deps.refreshTokenRepository,
    deps.tokenService,
    deps.sessionIssuer,
    deps.audit,
    () => NOW,
  );
}

const validToken = {
  id: "rt-1",
  userId: "user-1",
  expiresAt: new Date("2026-10-10T00:00:00Z"),
  revokedAt: null,
};

describe("RefreshTokenUseCase", () => {
  it("rotaciona: revoga o token usado e emite um novo par", async () => {
    const deps = buildAuthDeps();
    deps.refreshTokenRepository.findByHash.mockResolvedValue(validToken);

    const session = await build(deps).execute("token-antigo", client);

    expect(deps.refreshTokenRepository.findByHash).toHaveBeenCalledWith("hash(token-antigo)");
    expect(deps.refreshTokenRepository.revokeIfActive).toHaveBeenCalledWith("rt-1");
    expect(session.refreshToken).toBe("refresh-token");
  });

  it("perdedor de uma corrida (token ja revogado por outra requisicao) recebe 401 sem novo token", async () => {
    const deps = buildAuthDeps();
    deps.refreshTokenRepository.findByHash.mockResolvedValue(validToken);
    deps.refreshTokenRepository.revokeIfActive.mockResolvedValue(false);

    await expect(build(deps).execute("token", client)).rejects.toMatchObject({
      code: "SESSAO_EXPIRADA",
    });
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it("reuso de token revogado ha mais tempo que a janela de tolerancia revoga todas as sessoes", async () => {
    const deps = buildAuthDeps();
    deps.refreshTokenRepository.findByHash.mockResolvedValue({
      ...validToken,
      revokedAt: new Date(NOW.getTime() - REUSE_GRACE_MS - 1),
    });

    await expect(build(deps).execute("token-roubado", client)).rejects.toMatchObject({
      code: "SESSAO_EXPIRADA",
    });
    expect(deps.refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
    expect(deps.audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "SESSAO_REUSO_DETECTADO" }),
    );
  });

  it("token revogado dentro da janela (duas abas) nao derruba as outras sessoes", async () => {
    const deps = buildAuthDeps();
    deps.refreshTokenRepository.findByHash.mockResolvedValue({
      ...validToken,
      revokedAt: new Date(NOW.getTime() - 1000),
    });

    await expect(build(deps).execute("token", client)).rejects.toMatchObject({
      code: "SESSAO_EXPIRADA",
    });
    expect(deps.refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  it("recusa token expirado ou desconhecido", async () => {
    const deps = buildAuthDeps();
    deps.refreshTokenRepository.findByHash.mockResolvedValueOnce({
      ...validToken,
      expiresAt: new Date(NOW.getTime() - 1),
    });
    await expect(build(deps).execute("expirado", client)).rejects.toMatchObject({
      code: "SESSAO_EXPIRADA",
    });

    deps.refreshTokenRepository.findByHash.mockResolvedValueOnce(null);
    await expect(build(deps).execute("desconhecido", client)).rejects.toMatchObject({
      code: "SESSAO_EXPIRADA",
    });
    expect(deps.refreshTokenRepository.revokeIfActive).not.toHaveBeenCalled();
  });

  it("usuario desativado nao renova a sessao", async () => {
    const deps = buildAuthDeps({ ...activeUser, active: false });
    deps.refreshTokenRepository.findByHash.mockResolvedValue(validToken);

    await expect(build(deps).execute("token", client)).rejects.toMatchObject({
      code: "SESSAO_EXPIRADA",
    });
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled();
  });
});
