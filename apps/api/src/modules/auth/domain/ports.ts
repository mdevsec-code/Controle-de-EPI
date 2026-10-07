import type { SessionUser, UserRole } from "@epi-manager/contracts";
import type { AuditEntry } from "../../../shared/audit.js";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  tokenVersion: number;
  lockedUntil: Date | null;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  /** Incremento atomico; devolve o total de falhas consecutivas. */
  incrementFailedLogins(userId: string): Promise<number>;
  lockUntil(userId: string, until: Date): Promise<void>;
  markLoginSuccess(userId: string): Promise<void>;
  /** Troca a senha, limpa mustChangePassword e incrementa tokenVersion (revoga access tokens). */
  updatePassword(userId: string, passwordHash: string): Promise<AuthUser>;
  getSessionUser(userId: string): Promise<SessionUser | null>;
}

export interface StoredRefreshToken {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface RefreshTokenRepository {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  /** Busca pelo hash, inclusive revogados/expirados (necessario para detectar reuso). */
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  /** Revoga so se ainda estiver ativo; `false` indica que outra requisicao ja o usou. */
  revokeIfActive(id: string): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<void>;
}

export type AuditRecorder = (entry: AuditEntry) => Promise<void>;

export interface ClientInfo {
  ipAddress: string | null;
  userAgent: string | null;
}

/** Resultado interno: o refresh token vai para o cookie, nunca para o corpo da resposta. */
export interface IssuedSession {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: SessionUser;
}
