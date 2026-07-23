import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { TokenService } from "../../../shared/security/token-service.js";
import type { RefreshTokenRepository } from "../domain/refresh-token-repository.js";
import type { UserRepository } from "../domain/user-repository.js";

interface RefreshOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<RefreshOutput> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (!stored) {
      throw new AppError("Refresh token invalido ou expirado", 401);
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user || !user.active) {
      throw new AppError("Usuario nao encontrado ou inativo", 401);
    }

    // Rotacao: revoga o token usado e emite um novo par de tokens.
    await this.refreshTokenRepository.revoke(stored.id);

    const accessToken = this.tokenService.signAccessToken({ sub: user.id, role: user.role });
    const refresh = this.tokenService.generateRefreshToken();
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });

    return { accessToken, refreshToken: refresh.token };
  }
}
