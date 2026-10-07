import { vi } from "vitest";
import type { PasswordHasher } from "../../../shared/security/password-hasher.js";
import type { TokenService } from "../../../shared/security/token-service.js";
import type { AuthUser, RefreshTokenRepository, UserRepository } from "../domain/ports.js";
import { SessionIssuer } from "./session-issuer.js";

export const activeUser: AuthUser = {
  id: "user-1",
  email: "marcio.almox@engenova.example.com",
  passwordHash: "hash-correto",
  role: "ALMOXARIFADO",
  active: true,
  tokenVersion: 3,
  lockedUntil: null,
};

export function buildAuthDeps(user: AuthUser | null = activeUser) {
  const userRepository = {
    findByEmail: vi.fn<UserRepository["findByEmail"]>().mockResolvedValue(user),
    findById: vi.fn<UserRepository["findById"]>().mockResolvedValue(user),
    incrementFailedLogins: vi.fn<UserRepository["incrementFailedLogins"]>().mockResolvedValue(1),
    lockUntil: vi.fn<UserRepository["lockUntil"]>().mockResolvedValue(undefined),
    markLoginSuccess: vi.fn<UserRepository["markLoginSuccess"]>().mockResolvedValue(undefined),
    updatePassword: vi.fn<UserRepository["updatePassword"]>(),
    getSessionUser: vi.fn<UserRepository["getSessionUser"]>().mockResolvedValue(
      user && {
        id: user.id,
        name: "Marcio",
        email: user.email,
        role: user.role,
        mustChangePassword: false,
        warehouses: [{ id: "wh-1", name: "Almoxarifado Central" }],
      },
    ),
  } satisfies UserRepository;

  const refreshTokenRepository = {
    create: vi.fn<RefreshTokenRepository["create"]>().mockResolvedValue(undefined),
    findByHash: vi.fn<RefreshTokenRepository["findByHash"]>().mockResolvedValue(null),
    revokeIfActive: vi.fn<RefreshTokenRepository["revokeIfActive"]>().mockResolvedValue(true),
    revokeAllForUser: vi
      .fn<RefreshTokenRepository["revokeAllForUser"]>()
      .mockResolvedValue(undefined),
  } satisfies RefreshTokenRepository;

  // Senha correta = "senha-correta"; qualquer outra falha.
  const passwordHasher = {
    hash: vi.fn<PasswordHasher["hash"]>().mockResolvedValue("novo-hash"),
    compare: vi.fn<PasswordHasher["compare"]>(async (plain) => plain === "senha-correta"),
  } satisfies PasswordHasher;

  const tokenService = {
    signAccessToken: vi.fn<TokenService["signAccessToken"]>().mockReturnValue("access-token"),
    verifyAccessToken: vi.fn<TokenService["verifyAccessToken"]>(),
    generateRefreshToken: vi.fn<TokenService["generateRefreshToken"]>().mockReturnValue({
      token: "refresh-token",
      tokenHash: "refresh-token-hash",
      expiresAt: new Date("2030-01-01"),
    }),
    hashRefreshToken: vi.fn<TokenService["hashRefreshToken"]>((token) => `hash(${token})`),
  } satisfies TokenService;

  const audit = vi.fn().mockResolvedValue(undefined);
  const sessionIssuer = new SessionIssuer(userRepository, refreshTokenRepository, tokenService);

  return {
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenService,
    audit,
    sessionIssuer,
  };
}

export const client = { ipAddress: "10.0.0.1", userAgent: "vitest" };
