import type { SessionUser } from "@epi-manager/contracts";
import { prisma } from "@epi-manager/database";
import type { AuthUser, UserRepository } from "../domain/ports.js";

const authUserSelect = {
  id: true,
  email: true,
  passwordHash: true,
  role: true,
  active: true,
  tokenVersion: true,
  lockedUntil: true,
} as const;

export class PrismaUserRepository implements UserRepository {
  findByEmail(email: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: authUserSelect,
    });
  }

  findById(id: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({ where: { id }, select: authUserSelect });
  }

  async incrementFailedLogins(userId: string): Promise<number> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 } },
      select: { failedLoginCount: true },
    });
    return user.failedLoginCount;
  }

  async lockUntil(userId: string, until: Date): Promise<void> {
    // Zera o contador: apos o bloqueio expirar, o usuario tem novas tentativas.
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: until, failedLoginCount: 0 },
    });
  }

  async markLoginSuccess(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }

  updatePassword(userId: string, passwordHash: string): Promise<AuthUser> {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false, tokenVersion: { increment: 1 } },
      select: authUserSelect,
    });
  }

  async getSessionUser(userId: string): Promise<SessionUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        warehouses: { select: { warehouse: { select: { id: true, name: true } } } },
      },
    });
    if (!user) return null;

    // ADMIN opera em qualquer almoxarifado.
    const warehouses =
      user.role === "ADMIN"
        ? await prisma.warehouse.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          })
        : user.warehouses
            .map((link) => link.warehouse)
            .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      warehouses,
    };
  }
}
