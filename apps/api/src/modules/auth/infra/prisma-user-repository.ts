import { prisma } from "@epi-manager/database";
import type { AuthUser, UserRepository } from "../domain/user-repository.js";

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? this.toAuthUser(user) : null;
  }

  async findById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toAuthUser(user) : null;
  }

  async touchLastLogin(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    passwordHash: string;
    role: AuthUser["role"];
    active: boolean;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      active: user.active,
    };
  }
}
