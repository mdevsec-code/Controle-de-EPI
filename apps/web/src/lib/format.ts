const dateTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const date = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const weekday = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => date.format(new Date(iso));
export const formatTime = (iso: string) => time.format(new Date(iso));

/** "08:46" se for hoje, senao "05/10". */
export function formatShortWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  return d.toDateString() === now.toDateString() ? time.format(d) : weekday.format(d);
}

export const formatDeliveryNumber = (n: number) => `Nº ${String(n).padStart(6, "0")}`;

export const formatMoney = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export type Period = "hoje" | "ontem" | "semana" | "mes";

export const PERIOD_LABEL: Record<Period, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  semana: "Esta semana",
  mes: "Este mês",
};

/** Intervalo [from, to) no fuso local do dispositivo (filtros do historico, como no legado). */
export function periodRange(period: Period, now = new Date()): { from: Date; to: Date } {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(startOfDay);
  tomorrow.setDate(tomorrow.getDate() + 1);
  switch (period) {
    case "hoje":
      return { from: startOfDay, to: tomorrow };
    case "ontem": {
      const yesterday = new Date(startOfDay);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: startOfDay };
    }
    case "semana": {
      // Semana comeca na segunda-feira.
      const monday = new Date(startOfDay);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      return { from: monday, to: tomorrow };
    }
    case "mes":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: tomorrow };
  }
}
