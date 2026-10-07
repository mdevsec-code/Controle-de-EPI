import { describe, expect, it } from "vitest";
import { createDeliveryRequestSchema, SIGNATURE_DATA_URL_PREFIX } from "./deliveries.js";
import { createEmployeeRequestSchema } from "./employees.js";
import { isValidCpf, maskCpf, MAX_ITEM_QUANTITY } from "./rules.js";

const ID_A = "0b6f8a8e-1c1d-4c3a-9d55-1b9b8c2e7a01";
const ID_B = "5d0c3f62-8a4e-4b1f-a7e2-0c9d2b6f4e12";

function validDelivery() {
  return {
    idempotencyKey: ID_A,
    employeeId: ID_A,
    warehouseId: ID_B,
    reason: "DESGASTE",
    items: [{ stockItemId: ID_B, quantity: 2 }],
    signature: `${SIGNATURE_DATA_URL_PREFIX}iVBORw0KGgo=`,
  };
}

describe("isValidCpf", () => {
  it("aceita CPF com digitos verificadores corretos", () => {
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejeita digito verificador errado, sequencias repetidas e tamanho invalido", () => {
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("5299822472")).toBe(false);
  });

  it("mascara o CPF mantendo so os digitos centrais", () => {
    expect(maskCpf("52998224725")).toBe("***.982.247-**");
  });
});

describe("createEmployeeRequestSchema", () => {
  it("normaliza CPF com pontuacao para somente digitos", () => {
    const parsed = createEmployeeRequestSchema.parse({
      registration: "2541",
      cpf: "529.982.247-25",
      name: "Joao Carlos da Silva",
      businessUnitId: ID_A,
      departmentId: ID_A,
      jobRoleId: ID_B,
    });
    expect(parsed.cpf).toBe("52998224725");
  });
});

describe("createDeliveryRequestSchema", () => {
  it("aceita uma entrega valida", () => {
    expect(createDeliveryRequestSchema.safeParse(validDelivery()).success).toBe(true);
  });

  it(`rejeita quantidade acima de ${MAX_ITEM_QUANTITY}`, () => {
    const input = {
      ...validDelivery(),
      items: [{ stockItemId: ID_B, quantity: MAX_ITEM_QUANTITY + 1 }],
    };
    expect(createDeliveryRequestSchema.safeParse(input).success).toBe(false);
  });

  it("rejeita o mesmo item de estoque repetido", () => {
    const input = {
      ...validDelivery(),
      items: [
        { stockItemId: ID_B, quantity: 1 },
        { stockItemId: ID_B, quantity: 1 },
      ],
    };
    expect(createDeliveryRequestSchema.safeParse(input).success).toBe(false);
  });

  it("exige descricao quando o motivo e OUTRO", () => {
    const result = createDeliveryRequestSchema.safeParse({ ...validDelivery(), reason: "OUTRO" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["reasonDetail"]);
  });

  it("rejeita assinatura que nao seja PNG em data URL", () => {
    const input = { ...validDelivery(), signature: "data:image/svg+xml;base64,PHN2Zz4=" };
    expect(createDeliveryRequestSchema.safeParse(input).success).toBe(false);
  });
});
