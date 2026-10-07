import { AppError } from "../../../shared/errors.js";
import type { TokenService } from "../../../shared/security/token-service.js";
import type {
  AuditRecorder,
  ClientInfo,
  IssuedSession,
  RefreshTokenRepository,
  UserRepository,
} from "../domain/ports.js";
import type { SessionIssuer } from "./session-issuer.js";

/**
 * Janela em que um token recem-rotacionado ainda pode reaparecer de forma legitima
 * (ex.: duas abas renovando ao mesmo tempo). Fora dela, reapresentar um token ja usado
 * indica roubo: todas as sessoes do usuario sao revogadas.
 */
export const REUSE_GRACE_MS = 30_000;

const sessionExpired = () =>
  new AppError("SESSAO_EXPIRADA", 401, "Sessao expirada. Entre novamente.");

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly sessionIssuer: SessionIssuer,
    private readonly audit: AuditRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(refreshToken: string, client: ClientInfo): Promise<IssuedSession> {
    const stored = await this.refreshTokenRepository.findByHash(
      this.tokenService.hashRefreshToken(refreshToken),
    );
    if (!stored) throw sessionExpired();

    if (stored.revokedAt) {
      if (this.now().getTime() - stored.revokedAt.getTime() > REUSE_GRACE_MS) {
        await this.refreshTokenRepository.revokeAllForUser(stored.userId);
        await this.audit({
          userId: stored.userId,
          action: "SESSAO_REUSO_DETECTADO",
          entity: "RefreshToken",
          entityId: stored.id,
          ...client,
        });
      }
      throw sessionExpired();
    }

    if (stored.expiresAt <= this.now()) throw sessionExpired();

    // Rotacao atomica: so uma requisicao concorrente consegue revogar e seguir.
    if (!(await this.refreshTokenRepository.revokeIfActive(stored.id))) throw sessionExpired();

    const user = await this.userRepository.findById(stored.userId);
    if (!user || !user.active) throw sessionExpired();

    return this.sessionIssuer.issue(user);
  }
}
