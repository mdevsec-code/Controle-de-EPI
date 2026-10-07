import type { ChangePasswordRequest } from "@epi-manager/contracts";
import { AppError } from "../../../shared/errors.js";
import type { PasswordHasher } from "../../../shared/security/password-hasher.js";
import type {
  AuditRecorder,
  ClientInfo,
  IssuedSession,
  RefreshTokenRepository,
  UserRepository,
} from "../domain/ports.js";
import type { SessionIssuer } from "./session-issuer.js";

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionIssuer: SessionIssuer,
    private readonly audit: AuditRecorder,
  ) {}

  /** Troca a senha, encerra todas as outras sessoes e devolve uma sessao nova para este dispositivo. */
  async execute(
    userId: string,
    input: ChangePasswordRequest,
    client: ClientInfo,
  ): Promise<IssuedSession> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.active)
      throw new AppError("SESSAO_EXPIRADA", 401, "Sessao expirada. Entre novamente.");

    if (!(await this.passwordHasher.compare(input.currentPassword, user.passwordHash))) {
      throw new AppError("SENHA_ATUAL_INCORRETA", 422, "A senha atual esta incorreta.");
    }
    if (input.currentPassword === input.newPassword) {
      throw new AppError("VALIDACAO", 422, "A nova senha deve ser diferente da atual.", {
        fields: { newPassword: ["A nova senha deve ser diferente da atual."] },
      });
    }

    const updated = await this.userRepository.updatePassword(
      userId,
      await this.passwordHasher.hash(input.newPassword),
    );
    await this.refreshTokenRepository.revokeAllForUser(userId);
    await this.audit({
      userId,
      action: "SENHA_ALTERADA",
      entity: "User",
      entityId: userId,
      ...client,
    });
    return this.sessionIssuer.issue(updated);
  }
}
