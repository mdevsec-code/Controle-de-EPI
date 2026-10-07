import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });

/** Cliente dentro de `prisma.$transaction(async (tx) => ...)`. */
export type Tx = Prisma.TransactionClient;

export * from "@prisma/client";
