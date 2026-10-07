import { describe, expect, it, vi } from "vitest";
import { LOCK_DURATION_MS, LoginUseCase, MAX_FAILED_LOGINS } from "./login.use-case.js";
import { activeUser, buildAuthDeps, client } from "./test-doubles.js";

const NOW = new Date("2026-10-06T12:00:00Z");

function buildLogin(deps: ReturnType<typeof buildAuthDeps>) {
  const dummyHash = vi.fn().mockResolvedValue("hash-ficticio");
  const useCase = new LoginUseCase(
    deps.userRepository,
    deps.passwordHasher,
    deps.sessionIssuer,
    deps.audit,
    dummyHash,
    () => NOW,
  );
  return { useCase, dummyHash };
}

describe("LoginUseCase", () => {
  it("emite sessao com tokenVersion do usuario e zera as falhas", async () => {
    const deps = buildAuthDeps();
    const { useCase } = buildLogin(deps);

    const session = await useCase.execute(
      { email: activeUser.email, password: "senha-correta" },
      client,
    );

    expect(session.accessToken).toBe("access-token");
    expect(session.refreshToken).toBe("refresh-token");
    expect(session.user.warehouses).toHaveLength(1);
    expect(deps.tokenService.signAccessToken).toHaveBeenCalledWith({
      sub: "user-1",
      role: "ALMOXARIFADO",
      ver: 3,
    });
    expect(deps.userRepository.markLoginSuccess).toHaveBeenCalledWith("user-1");
    expect(deps.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "LOGIN_SUCESSO" }));
  });

  it("e-mail inexistente: compara com hash ficticio (mesmo custo) e devolve erro generico", async () => {
    const deps = buildAuthDeps(null);
    const { useCase, dummyHash } = buildLogin(deps);

    await expect(
      useCase.execute({ email: "x@y.com", password: "qualquer" }, client),
    ).rejects.toMatchObject({
      code: "CREDENCIAIS_INVALIDAS",
      status: 401,
    });
    expect(dummyHash).toHaveBeenCalled();
    expect(deps.passwordHasher.compare).toHaveBeenCalledWith("qualquer", "hash-ficticio");
  });

  it("senha errada: conta a falha e devolve a mesma mensagem generica", async () => {
    const deps = buildAuthDeps();
    const { useCase } = buildLogin(deps);

    await expect(
      useCase.execute({ email: activeUser.email, password: "errada" }, client),
    ).rejects.toMatchObject({ code: "CREDENCIAIS_INVALIDAS" });
    expect(deps.userRepository.incrementFailedLogins).toHaveBeenCalledWith("user-1");
    expect(deps.userRepository.lockUntil).not.toHaveBeenCalled();
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled();
  });

  it(`bloqueia a conta na ${MAX_FAILED_LOGINS}a falha consecutiva`, async () => {
    const deps = buildAuthDeps();
    deps.userRepository.incrementFailedLogins.mockResolvedValue(MAX_FAILED_LOGINS);
    const { useCase } = buildLogin(deps);

    await expect(
      useCase.execute({ email: activeUser.email, password: "errada" }, client),
    ).rejects.toThrow();
    expect(deps.userRepository.lockUntil).toHaveBeenCalledWith(
      "user-1",
      new Date(NOW.getTime() + LOCK_DURATION_MS),
    );
  });

  it("conta bloqueada recusa ate a senha correta, sem comparar senha", async () => {
    const deps = buildAuthDeps({ ...activeUser, lockedUntil: new Date(NOW.getTime() + 60_000) });
    const { useCase } = buildLogin(deps);

    await expect(
      useCase.execute({ email: activeUser.email, password: "senha-correta" }, client),
    ).rejects.toMatchObject({ code: "CONTA_BLOQUEADA", status: 423 });
    expect(deps.passwordHasher.compare).not.toHaveBeenCalled();
  });

  it("bloqueio expirado permite login", async () => {
    const deps = buildAuthDeps({ ...activeUser, lockedUntil: new Date(NOW.getTime() - 1) });
    const { useCase } = buildLogin(deps);

    await expect(
      useCase.execute({ email: activeUser.email, password: "senha-correta" }, client),
    ).resolves.toMatchObject({ accessToken: "access-token" });
  });

  it("usuario inativo recebe erro generico mesmo com a senha correta", async () => {
    const deps = buildAuthDeps({ ...activeUser, active: false });
    const { useCase } = buildLogin(deps);

    await expect(
      useCase.execute({ email: activeUser.email, password: "senha-correta" }, client),
    ).rejects.toMatchObject({ code: "CREDENCIAIS_INVALIDAS" });
    expect(deps.refreshTokenRepository.create).not.toHaveBeenCalled();
  });
});
