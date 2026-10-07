import type { StockItemDto } from "@epi-manager/contracts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useDeliveryDraft } from "../draft";
import { ReasonPage } from "./reason-page";

const stock: StockItemDto = {
  id: "s-1",
  warehouseId: "w-1",
  warehouseName: "Almoxarifado Central",
  epiItemId: "epi-1",
  epiName: "Mascara PFF2",
  model: null,
  internalCode: "EPI-PFF2",
  categoryName: "Respiratoria",
  size: "",
  batchNumber: "",
  location: "",
  quantity: 10,
  minQuantity: 0,
  caNumber: "12345",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/entregas/nova/motivo"]}>
      <Routes>
        <Route path="/entregas/nova/motivo" element={<ReasonPage />} />
        <Route path="/entregas/nova/assinatura" element={<p>tela de assinatura</p>} />
        <Route path="/entregas/nova" element={<p>identificacao</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  const draft = useDeliveryDraft.getState();
  draft.start("w-1");
  draft.setEmployee({
    id: "e-1",
    name: "Joao",
    registration: "2541",
    status: "ATIVO",
    photoUrl: null,
    jobRoleName: "Soldador",
    companyName: "EngeNova",
    businessUnitName: "Matriz",
    departmentName: "Obras",
    costCenter: null,
  });
  draft.toggleItem(stock);
});

describe("ReasonPage", () => {
  it("lista os 8 motivos do legado e so libera continuar apos escolher", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getAllByRole("radio")).toHaveLength(8);
    const next = screen.getByRole("button", { name: /continuar/i });
    expect(next).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Desgaste" }));
    expect(next).toBeEnabled();
    await user.click(next);
    expect(screen.getByText("tela de assinatura")).toBeInTheDocument();
  });

  it("motivo Outro exige descricao", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("radio", { name: "Outro" }));
    const next = screen.getByRole("button", { name: /continuar/i });
    expect(next).toBeDisabled();

    await user.type(
      screen.getByRole("textbox", { name: /descreva o motivo/i }),
      "Troca por tamanho",
    );
    expect(next).toBeEnabled();
  });

  it("sem EPIs selecionados, volta para a etapa pendente", () => {
    useDeliveryDraft.getState().start("w-1");
    renderPage();
    expect(screen.getByText("identificacao")).toBeInTheDocument();
  });
});
