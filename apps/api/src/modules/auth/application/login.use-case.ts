import type { LoginRequest } from "@epi-manager/contracts";
import { AppError } from "../../../shared/errors.js";
import type { PasswordHasher } from "../../../shared/security/password-hasher.js";
import type { AuditRecorder, ClientInfo, IssuedSession, UserRepository } from "../domain/ports.js";
import type { SessionIssuer } from "./session-issuer.js";

/** Falhas consecutivas que disparam o bloqueio temporario da conta. */
export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

const invalidCredentials = () =>
  new AppError("CREDENCIAIS_INVALIDAS", 401, "E-mail ou senha incorretos.");

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
    private readonly audit: AuditRecorder,
    private readonly dummyHash: () => Promise<string>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute({ email, password }: LoginRequest, client: ClientInfo): Promise<IssuedSession> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Mesmo custo de uma senha errada: nao revela se o e-mail existe.
      await this.passwordHasher.compare(password, await this.dummyHash());
      await this.audit({
        userId: null,
        action: "LOGIN_FALHA",
        entity: "User",
        after: { email },
        ...client,
      });
      throw invalidCredentials();
    }

    if (user.lockedUntil && user.lockedUntil > this.now()) {
      await this.audit({
        userId: user.id,
        action: "LOGIN_BLOQUEADO",
        entity: "User",
        entityId: user.id,
        ...client,
      });
      throw new AppError(
        "CONTA_BLOQUEADA",
        423,
        "Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em alguns minutos.",
        { lockedUntil: user.lockedUntil.toISOString() },
      );
    }

    const passwordMatches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!passwordMatches || !user.active) {
      const failures = await this.userRepository.incrementFailedLogins(user.id);
      if (failures >= MAX_FAILED_LOGINS) {
        await this.userRepository.lockUntil(
          user.id,
          new Date(this.now().getTime() + LOCK_DURATION_MS),
        );
      }
      await this.audit({
        userId: user.id,
        action: "LOGIN_FALHA",
        entity: "User",
        entityId: user.id,
        after: { failures, inactive: !user.active },
        ...client,
      });
      throw invalidCredentials();
    }

    await this.userRepository.markLoginSuccess(user.id);
    const session = await this.sessionIssuer.issue(user);
    await this.audit({
      userId: user.id,
      action: "LOGIN_SUCESSO",
      entity: "User",
      entityId: user.id,
      ...client,
    });
    return session;
  }
}
