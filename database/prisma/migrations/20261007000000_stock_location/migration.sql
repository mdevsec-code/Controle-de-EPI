-- Local de armazenamento do item de estoque dentro do almoxarifado.
-- String vazia = local nao definido (mesma convencao de size/batch_number).
ALTER TABLE "stock_items" ADD COLUMN "location" TEXT NOT NULL DEFAULT '';

-- Mesmo limite validado na API (contracts: STOCK_LOCATION_MAX_LENGTH).
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_location_length" CHECK (char_length("location") <= 60);

-- CreateIndex
CREATE INDEX "stock_items_warehouse_id_location_idx" ON "stock_items"("warehouse_id", "location");
