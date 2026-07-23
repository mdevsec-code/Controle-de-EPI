import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

export const bcryptPasswordHasher: PasswordHasher = {
  hash(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  },
  compare(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};
