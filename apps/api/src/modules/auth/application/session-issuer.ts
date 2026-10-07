import { AppError } from "../../../shared/errors.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  type TokenService,
} from "../../../shared/security/token-service.js";
import type {
  AuthUser,
  IssuedSession,
  RefreshTokenRepository,
  UserRepository,
} from "../domain/ports.js";

/** Emite par access + refresh para um usuario ja autenticado. */
export class SessionIssuer {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async issue(user: AuthUser): Promise<IssuedSession> {
    const sessionUser = await this.userRepository.getSessionUser(user.id);
    if (!sessionUser) {
      throw new AppError("SESSAO_EXPIRADA", 401, "Usuario nao encontrado");
    }

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      role: user.role,
      ver: user.tokenVersion,
    });
    const refresh = this.tokenService.generateRefreshToken();
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: refresh.token,
      user: sessionUser,
    };
  }
}
