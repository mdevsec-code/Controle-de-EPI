import { prisma } from "@epi-manager/database";
import type { RefreshTokenRepository, StoredRefreshToken } from "../domain/ports.js";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await prisma.refreshToken.create({ data });
  }

  findByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });
  }

  async revokeIfActive(id: string): Promise<boolean> {
    // UPDATE ... WHERE revoked_at IS NULL: atomico no banco, decide o "vencedor" em corridas.
    const { count } = await prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count === 1;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
