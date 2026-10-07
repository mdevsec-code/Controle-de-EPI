import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

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

let dummyHash: Promise<string> | undefined;

/**
 * Hash bcrypt real (mesmo custo) de uma senha aleatoria descartada. Comparado quando o e-mail
 * nao existe, para que a resposta leve o mesmo tempo de uma senha errada (evita enumeracao).
 */
export function dummyPasswordHash(): Promise<string> {
  dummyHash ??= bcrypt.hash(randomBytes(32).toString("hex"), SALT_ROUNDS);
  return dummyHash;
}
