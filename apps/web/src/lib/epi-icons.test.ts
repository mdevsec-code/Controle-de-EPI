import { Ear, Footprints, Glasses, Hand, ShieldCheck, Shirt, Wind } from "lucide-react";
import { describe, expect, it } from "vitest";
import { epiIcon } from "./epi-icons";

describe("epiIcon", () => {
  it("escolhe o icone pela categoria, ignorando acentos", () => {
    expect(epiIcon("Proteção Respiratória")).toBe(Wind);
    expect(epiIcon("Proteção das Mãos")).toBe(Hand);
    expect(epiIcon("Proteção dos Olhos")).toBe(Glasses);
    expect(epiIcon("Proteção Auditiva")).toBe(Ear);
    expect(epiIcon("Proteção dos Pés")).toBe(Footprints);
    expect(epiIcon("Proteção do Tronco")).toBe(Shirt);
  });

  it("nao confunde trechos de palavras (ex.: 'pe' dentro de outra palavra)", () => {
    expect(epiIcon("Superior", "Peneira")).toBe(ShieldCheck);
  });
});
