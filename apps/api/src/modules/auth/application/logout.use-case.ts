import type { TokenService } from "../../../shared/security/token-service.js";
import type { RefreshTokenRepository } from "../domain/refresh-token-repository.js";

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (stored) {
      await this.refreshTokenRepository.revoke(stored.id);
    }
  }
}
