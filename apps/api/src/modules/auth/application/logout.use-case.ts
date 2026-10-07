import type { TokenService } from "../../../shared/security/token-service.js";
import type { AuditRecorder, ClientInfo, RefreshTokenRepository } from "../domain/ports.js";

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly audit: AuditRecorder,
  ) {}

  async execute(refreshToken: string, client: ClientInfo): Promise<void> {
    const stored = await this.refreshTokenRepository.findByHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );
    if (!stored || stored.revokedAt) return;
    await this.refreshTokenRepository.revokeIfActive(stored.id);
    await this.audit({
      userId: stored.userId,
      action: "LOGOUT",
      entity: "User",
      entityId: stored.userId,
      ...client,
    });
  }
}
