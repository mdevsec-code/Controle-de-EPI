import type { IsoDateString, Page } from "@epi-manager/contracts";

export function iso(date: Date): IsoDateString {
  return date.toISOString();
}

export function isoOrNull(date: Date | null | undefined): IsoDateString | null {
  return date ? date.toISOString() : null;
}

export function pageArgs({ page, pageSize }: { page: number; pageSize: number }) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function toPage<T>(
  items: T[],
  total: number,
  query: { page: number; pageSize: number },
): Page<T> {
  return { items, total, page: query.page, pageSize: query.pageSize };
}

/** Inicio do dia em UTC-3 (America/Sao_Paulo, sem horario de verao desde 2019). */
export function startOfBusinessDay(now = new Date()): Date {
  const offsetMs = 3 * 60 * 60 * 1000;
  const local = new Date(now.getTime() - offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + offsetMs);
}
