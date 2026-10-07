import { describe, expect, it } from "vitest";
import { createsCycle } from "./department-hierarchy.js";

// A <- B <- C (C e filho de B, que e filho de A)
const parents: Record<string, string | null> = { A: null, B: "A", C: "B", D: null };
const parentOf = async (id: string) => parents[id] ?? null;

describe("createsCycle", () => {
  it("detecta o setor como pai de si mesmo", async () => {
    expect(await createsCycle("A", "A", parentOf)).toBe(true);
  });

  it("detecta ciclo indireto (A passaria a ser filho do proprio neto C)", async () => {
    expect(await createsCycle("A", "C", parentOf)).toBe(true);
  });

  it("permite mover para outro ramo sem ciclo", async () => {
    expect(await createsCycle("C", "D", parentOf)).toBe(false);
    expect(await createsCycle("D", "C", parentOf)).toBe(false);
  });
});
