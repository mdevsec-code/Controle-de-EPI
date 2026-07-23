import { prisma } from "@epi-manager/database";
import type { RefreshTokenRepository, StoredRefreshToken } from "../domain/refresh-token-repository.js";

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await prisma.refreshToken.create({ data });
  }

  async findValidByHash(tokenHash: string): Promise<StoredRefreshToken | null> {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async revoke(id: string): Promise<void> {
    await prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
