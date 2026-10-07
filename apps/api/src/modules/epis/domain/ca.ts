import type { CaStatus } from "@epi-manager/contracts";

export interface CaLike {
  number: string;
  issuedAt: Date;
  expiresAt: Date;
  cancelledAt: Date | null;
}

/** Situacao derivada (nunca gravada): o CA "vence sozinho" quando passa a validade. */
export function caStatus(ca: CaLike, now: Date): CaStatus {
  if (ca.cancelledAt) return "CANCELADO";
  return ca.expiresAt >= now ? "VIGENTE" : "VENCIDO";
}

/** CA vigente mais recente (maior validade). `null` = EPI nao pode ser entregue (NR-6). */
export function currentCa<T extends CaLike>(cas: readonly T[], now: Date): T | null {
  return (
    cas
      .filter((ca) => caStatus(ca, now) === "VIGENTE" && ca.issuedAt <= now)
      .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime())[0] ?? null
  );
}
