import { describe, expect, it, vi } from "vitest";
import type { PasswordHasher } from "../../../shared/security/password-hasher.js";
import type { TokenService } from "../../../shared/security/token-service.js";
import type { RefreshTokenRepository } from "../domain/refresh-token-repository.js";
import type { AuthUser, UserRepository } from "../domain/user-repository.js";
import { LoginUseCase } from "./login.use-case.js";

const existingUser: AuthUser = {
  id: "user-1",
  email: "admin@example.com",
  passwordHash: "hashed-password",
  role: "ADMINISTRADOR",
  active: true,
};

function buildDeps() {
  const userRepository: UserRepository = {
    findByEmail: vi.fn().mockResolvedValue(existingUser),
    findById: vi.fn().mockResolvedValue(existingUser),
    touchLastLogin: vi.fn().mockResolvedValue(undefined),
  };

  const refreshTokenRepository: RefreshTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findValidByHash: vi.fn(),
    revoke: vi.fn(),
    revokeAllForUser: vi.fn(),
  };

  const passwordHasher: PasswordHasher = {
    hash: vi.fn(),
    compare: vi.fn().mockResolvedValue(true),
  };

  const tokenService: TokenService = {
    signAccessToken: vi.fn().mockReturnValue("access-token"),
    verifyAccessToken: vi.fn(),
    generateRefreshToken: vi.fn().mockReturnValue({
      token: "refresh-token",
      tokenHash: "refresh-token-hash",
      expiresAt: new Date("2030-01-01"),
    }),
    hashRefreshToken: vi.fn(),
  };

  return { userRepository, refreshTokenRepository, passwordHasher, tokenService };
}

describe("LoginUseCase", () => {
  it("retorna os tokens quando as credenciais sao validas", async () => {
    const { userRepository, refreshTokenRepository, passwordHasher, tokenService } = buildDeps();
    const useCase = new LoginUseCase(userRepository, refreshTokenRepository, passwordHasher, tokenService);

    const result = await useCase.execute({ email: "admin@example.com", password: "senha-correta" });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(refreshTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", tokenHash: "refresh-token-hash" }),
    );
    expect(userRepository.touchLastLogin).toHaveBeenCalledWith("user-1");
  });

  it("rejeita quando o usuario nao existe", async () => {
    const { refreshTokenRepository, passwordHasher, tokenService } = buildDeps();
    const userRepository: UserRepository = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      touchLastLogin: vi.fn(),
    };
    const useCase = new LoginUseCase(userRepository, refreshTokenRepository, passwordHasher, tokenService);

    await expect(
      useCase.execute({ email: "inexistente@example.com", password: "qualquer" }),
    ).rejects.toThrow("Credenciais invalidas");
  });

  it("rejeita quando o usuario esta inativo", async () => {
    const { refreshTokenRepository, passwordHasher, tokenService } = buildDeps();
    const userRepository: UserRepository = {
      findByEmail: vi.fn().mockResolvedValue({ ...existingUser, active: false }),
      findById: vi.fn(),
      touchLastLogin: vi.fn(),
    };
    const useCase = new LoginUseCase(userRepository, refreshTokenRepository, passwordHasher, tokenService);

    await expect(
      useCase.execute({ email: "admin@example.com", password: "qualquer" }),
    ).rejects.toThrow("Credenciais invalidas");
  });

  it("rejeita quando a senha esta incorreta", async () => {
    const { userRepository, refreshTokenRepository, tokenService } = buildDeps();
    const passwordHasher: PasswordHasher = { hash: vi.fn(), compare: vi.fn().mockResolvedValue(false) };
    const useCase = new LoginUseCase(userRepository, refreshTokenRepository, passwordHasher, tokenService);

    await expect(
      useCase.execute({ email: "admin@example.com", password: "senha-errada" }),
    ).rejects.toThrow("Credenciais invalidas");
  });
});
