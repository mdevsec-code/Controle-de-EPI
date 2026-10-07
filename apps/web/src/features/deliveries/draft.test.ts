import type { EmployeeSummaryDto, StockItemDto } from "@epi-manager/contracts";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clampQuantity,
  firstIncompleteStep,
  maxQuantityFor,
  toCreateRequest,
  useDeliveryDraft,
} from "./draft";

const stock = (quantity: number, id = "s-1"): StockItemDto => ({
  id,
  warehouseId: "w-1",
  warehouseName: "Almoxarifado Central",
  epiItemId: "epi-1",
  epiName: "Mascara PFF2",
  model: null,
  internalCode: "EPI-PFF2",
  categoryName: "Protecao Respiratoria",
  size: "",
  batchNumber: "",
  location: "",
  quantity,
  minQuantity: 0,
  caNumber: "12345",
});

const employee: EmployeeSummaryDto = {
  id: "e-1",
  name: "Joao Carlos da Silva",
  registration: "2541",
  status: "ATIVO",
  photoUrl: null,
  jobRoleName: "Soldador",
  companyName: "EngeNova",
  businessUnitName: "Matriz",
  departmentName: "Obras",
  costCenter: "Obras Industriais",
};

beforeEach(() => useDeliveryDraft.getState().start("w-1"));

describe("regras de quantidade", () => {
  it("limita ao menor entre 50 (legado) e o saldo exibido", () => {
    expect(maxQuantityFor(stock(200))).toBe(50);
    expect(maxQuantityFor(stock(3))).toBe(3);
    expect(clampQuantity(stock(3), 10)).toBe(3);
    expect(clampQuantity(stock(3), 0)).toBe(1);
  });
});

describe("rascunho da entrega", () => {
  it("iniciar uma entrega nova descarta selecoes anteriores e gera nova chave de idempotencia", () => {
    const draft = useDeliveryDraft.getState();
    draft.setEmployee(employee);
    draft.toggleItem(stock(10));
    const firstKey = useDeliveryDraft.getState().idempotencyKey;

    useDeliveryDraft.getState().start("w-1");

    const fresh = useDeliveryDraft.getState();
    expect(fresh.employee).toBeNull();
    expect(fresh.items).toEqual({});
    expect(fresh.idempotencyKey).not.toBe(firstKey);
  });

  it("indica a primeira etapa pendente", () => {
    const draft = useDeliveryDraft.getState;
    expect(firstIncompleteStep(draft())).toBe("colaborador");
    draft().setEmployee(employee);
    expect(firstIncompleteStep(draft())).toBe("epis");
    draft().toggleItem(stock(10));
    expect(firstIncompleteStep(draft())).toBe("motivo");
    draft().setReason("OUTRO");
    expect(firstIncompleteStep(draft())).toBe("motivo");
    draft().setReasonDetail("Troca por tamanho");
    expect(firstIncompleteStep(draft())).toBeNull();
  });

  it("monta a requisicao com quantidades limitadas e observacoes vazias omitidas", () => {
    const draft = useDeliveryDraft.getState;
    draft().setEmployee(employee);
    draft().toggleItem(stock(4));
    draft().setQuantity("s-1", 99);
    draft().setReason("DESGASTE");

    const request = toCreateRequest(draft(), "data:image/png;base64,AAAA");

    expect(request.items).toEqual([{ stockItemId: "s-1", quantity: 4, notes: undefined }]);
    expect(request.reasonDetail).toBeUndefined();
    expect(request.warehouseId).toBe("w-1");
  });
});
