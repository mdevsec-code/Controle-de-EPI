import { AppError } from "../../../shared/middlewares/error-handler.js";
import type { PasswordHasher } from "../../../shared/security/password-hasher.js";
import type { TokenService } from "../../../shared/security/token-service.js";
import type { RefreshTokenRepository } from "../domain/refresh-token-repository.js";
import type { UserRepository } from "../domain/user-repository.js";

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute({ email, password }: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.active) {
      throw new AppError("Credenciais invalidas", 401);
    }

    const passwordMatches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("Credenciais invalidas", 401);
    }

    const accessToken = this.tokenService.signAccessToken({ sub: user.id, role: user.role });
    const refresh = this.tokenService.generateRefreshToken();

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });
    await this.userRepository.touchLastLogin(user.id);

    return {
      accessToken,
      refreshToken: refresh.token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
