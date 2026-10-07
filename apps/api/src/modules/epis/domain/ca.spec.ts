import { describe, expect, it } from "vitest";
import { caStatus, currentCa } from "./ca.js";

const NOW = new Date("2026-10-06T12:00:00Z");
const ca = (
  number: string,
  expiresAt: string,
  cancelledAt: string | null = null,
  issuedAt = "2024-01-01",
) => ({
  number,
  issuedAt: new Date(issuedAt),
  expiresAt: new Date(expiresAt),
  cancelledAt: cancelledAt ? new Date(cancelledAt) : null,
});

describe("caStatus", () => {
  it("vigente ate a data de validade, vencido depois", () => {
    expect(caStatus(ca("1", "2027-01-01"), NOW)).toBe("VIGENTE");
    expect(caStatus(ca("1", "2026-10-01"), NOW)).toBe("VENCIDO");
  });

  it("cancelado prevalece sobre a validade", () => {
    expect(caStatus(ca("1", "2030-01-01", "2026-01-01"), NOW)).toBe("CANCELADO");
  });
});

describe("currentCa", () => {
  it("escolhe o vigente de maior validade, ignorando vencidos e cancelados", () => {
    const result = currentCa(
      [
        ca("antigo", "2026-01-01"),
        ca("cancelado", "2031-01-01", "2026-05-01"),
        ca("atual", "2029-01-01"),
        ca("outro", "2028-01-01"),
      ],
      NOW,
    );
    expect(result?.number).toBe("atual");
  });

  it("ignora CA com emissao futura", () => {
    expect(currentCa([ca("futuro", "2030-01-01", null, "2027-01-01")], NOW)).toBeNull();
  });

  it("devolve null quando nao ha CA vigente", () => {
    expect(currentCa([ca("vencido", "2025-01-01")], NOW)).toBeNull();
  });
});
