import { SIGNATURE_DATA_URL_PREFIX } from "@epi-manager/contracts";
import { describe, expect, it } from "vitest";
import {
  decodeSignaturePng,
  expectedReplacement,
  signatureContentHash,
  type SignedDeliveryContent,
} from "./signature.js";

// PNG minimo valido (assinatura de 8 bytes + bytes suficientes para passar do tamanho minimo).
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(120, 1),
]);
const pngDataUrl = SIGNATURE_DATA_URL_PREFIX + png.toString("base64");

const content: SignedDeliveryContent = {
  deliveryId: "d-1",
  number: 42,
  employeeId: "e-1",
  warehouseId: "w-1",
  deliveredById: "u-1",
  deliveredAt: "2026-10-06T12:00:00.000Z",
  reason: "DESGASTE",
  items: [
    {
      stockItemId: "s-2",
      epiItemId: "epi-2",
      caNumber: "30981",
      size: "G",
      batchNumber: "",
      quantity: 2,
    },
    {
      stockItemId: "s-1",
      epiItemId: "epi-1",
      caNumber: "12345",
      size: "",
      batchNumber: "",
      quantity: 1,
    },
  ],
};

describe("decodeSignaturePng", () => {
  it("aceita PNG real", () => {
    expect(decodeSignaturePng(pngDataUrl).equals(png)).toBe(true);
  });

  it("recusa conteudo que nao e PNG mesmo com prefixo de PNG (ex.: SVG/HTML disfarcado)", () => {
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg">${"x".repeat(100)}</svg>`);
    expect(() => decodeSignaturePng(SIGNATURE_DATA_URL_PREFIX + svg.toString("base64"))).toThrow(
      "Assinatura invalida",
    );
  });

  it("recusa base64 malformado e imagem vazia", () => {
    expect(() => decodeSignaturePng(`${SIGNATURE_DATA_URL_PREFIX}@@@`)).toThrow();
    expect(() => decodeSignaturePng(SIGNATURE_DATA_URL_PREFIX)).toThrow();
  });
});

describe("signatureContentHash", () => {
  it("e deterministico e independe da ordem dos itens", () => {
    const reversed = { ...content, items: [...content.items].reverse() };
    expect(signatureContentHash(content, png)).toBe(signatureContentHash(reversed, png));
    expect(signatureContentHash(content, png)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("muda se qualquer dado assinado ou a imagem mudar", () => {
    const base = signatureContentHash(content, png);
    const changedQty = {
      ...content,
      items: [{ ...content.items[0]!, quantity: 3 }, content.items[1]!],
    };
    expect(signatureContentHash(changedQty, png)).not.toBe(base);
    expect(signatureContentHash({ ...content, employeeId: "e-2" }, png)).not.toBe(base);
    expect(signatureContentHash(content, Buffer.concat([png, Buffer.from([0])]))).not.toBe(base);
  });
});

describe("expectedReplacement", () => {
  it("soma a vida util em dias; sem vida util nao ha previsao", () => {
    const at = new Date("2026-10-06T12:00:00Z");
    expect(expectedReplacement(at, 30)?.toISOString()).toBe("2026-11-05T12:00:00.000Z");
    expect(expectedReplacement(at, null)).toBeNull();
  });
});
