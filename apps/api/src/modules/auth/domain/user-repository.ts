import type { UserRole } from "@epi-manager/types";

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  touchLastLogin(userId: string): Promise<void>;
}
