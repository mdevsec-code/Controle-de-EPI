import { createHash } from "node:crypto";
import { SIGNATURE_DATA_URL_PREFIX, SIGNATURE_MAX_BYTES } from "@epi-manager/contracts";
import { AppError } from "../../../shared/errors.js";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Decodifica a assinatura e confere que e de fato um PNG (assinatura binaria), sem confiar no
 * prefixo enviado pelo cliente. Evita armazenar/servir SVG/HTML disfarcado de imagem.
 */
export function decodeSignaturePng(dataUrl: string): Buffer {
  const invalid = () =>
    new AppError("VALIDACAO", 422, "Assinatura invalida. Assine novamente.", {
      fields: { signature: ["Assinatura invalida"] },
    });
  if (!dataUrl.startsWith(SIGNATURE_DATA_URL_PREFIX)) throw invalid();

  const base64 = dataUrl.slice(SIGNATURE_DATA_URL_PREFIX.length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw invalid();

  const image = Buffer.from(base64, "base64");
  if (image.length > SIGNATURE_MAX_BYTES || image.length < 64) throw invalid();
  if (!image.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) throw invalid();
  return image;
}

export interface SignedDeliveryContent {
  deliveryId: string;
  number: number;
  employeeId: string;
  warehouseId: string;
  deliveredById: string;
  deliveredAt: string;
  reason: string;
  items: {
    stockItemId: string;
    epiItemId: string;
    caNumber: string;
    size: string;
    batchNumber: string;
    quantity: number;
  }[];
}

/**
 * SHA-256 do conteudo canonico da entrega + SHA-256 da imagem. Qualquer alteracao posterior
 * nos dados assinados (quantidade, CA, colaborador...) ou na imagem muda o hash.
 */
export function signatureContentHash(content: SignedDeliveryContent, image: Buffer): string {
  const canonical = JSON.stringify({
    ...content,
    items: [...content.items].sort((a, b) => a.stockItemId.localeCompare(b.stockItemId)),
  });
  const imageHash = createHash("sha256").update(image).digest("hex");
  return createHash("sha256").update(canonical).update("\n").update(imageHash).digest("hex");
}

/** Data prevista para troca, pela vida util do EPI. */
export function expectedReplacement(deliveredAt: Date, usefulLifeDays: number | null): Date | null {
  if (!usefulLifeDays) return null;
  return new Date(deliveredAt.getTime() + usefulLifeDays * 24 * 60 * 60 * 1000);
}
