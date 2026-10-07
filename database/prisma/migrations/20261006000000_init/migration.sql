-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ALMOXARIFADO');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO', 'DESLIGADO');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('ENTRADA', 'SAIDA', 'ENTREGA', 'DEVOLUCAO', 'AJUSTE', 'PERDA', 'AVARIA');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "DeliveryReason" AS ENUM ('DESGASTE', 'DANO', 'ROTINA', 'ATIVIDADE_ESPECIAL', 'PERDA', 'EXTRAVIO', 'NOVO_COLABORADOR', 'OUTRO');

-- CreateEnum
CREATE TYPE "ReturnCondition" AS ENUM ('BOM', 'DANIFICADO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_warehouses" (
    "user_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,

    CONSTRAINT "user_warehouses_pkey" PRIMARY KEY ("user_id","warehouse_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trade_name" TEXT,
    "cnpj" TEXT NOT NULL,
    "responsible_name" TEXT,
    "responsible_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_units" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "street" TEXT,
    "number" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_role_required_epis" (
    "id" TEXT NOT NULL,
    "job_role_id" TEXT NOT NULL,
    "epi_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "job_role_required_epis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photo_url" TEXT,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ATIVO',
    "badge_code" TEXT NOT NULL,
    "admission_date" TIMESTAMP(3),
    "termination_date" TIMESTAMP(3),
    "cost_center" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "job_role_id" TEXT NOT NULL,
    "supervisor_id" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epi_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "epi_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epi_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "internal_code" TEXT NOT NULL,
    "barcode" TEXT,
    "category_id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT,
    "photo_url" TEXT,
    "manual_url" TEXT,
    "min_quantity" INTEGER NOT NULL DEFAULT 0,
    "unit_price_cents" INTEGER,
    "useful_life_days" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epi_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "epi_cas" (
    "id" TEXT NOT NULL,
    "epi_item_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "epi_cas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "epi_item_id" TEXT NOT NULL,
    "size" TEXT NOT NULL DEFAULT '',
    "batch_number" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "stock_item_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" TEXT,
    "performed_by_id" TEXT NOT NULL,
    "delivery_item_id" TEXT,
    "return_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'CONCLUIDA',
    "reason" "DeliveryReason" NOT NULL,
    "reason_detail" TEXT,
    "notes" TEXT,
    "employee_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "delivered_by_id" TEXT NOT NULL,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_items" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "epi_item_id" TEXT NOT NULL,
    "stock_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "epi_name" TEXT NOT NULL,
    "ca_number" TEXT NOT NULL,
    "size" TEXT NOT NULL DEFAULT '',
    "batch_number" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "expected_replacement_at" TIMESTAMP(3),

    CONSTRAINT "delivery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_signatures" (
    "delivery_id" TEXT NOT NULL,
    "image" BYTEA NOT NULL,
    "image_type" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,

    CONSTRAINT "delivery_signatures_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "epi_returns" (
    "id" TEXT NOT NULL,
    "delivery_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" "ReturnCondition" NOT NULL,
    "reason" TEXT,
    "stock_item_id" TEXT,
    "received_by_id" TEXT NOT NULL,
    "returned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "epi_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_warehouses_warehouse_id_idx" ON "user_warehouses"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "business_units_company_id_code_key" ON "business_units"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_business_unit_id_code_key" ON "departments"("business_unit_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "job_roles_name_key" ON "job_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "job_role_required_epis_job_role_id_epi_item_id_key" ON "job_role_required_epis"("job_role_id", "epi_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_key" ON "employees"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "employees_badge_code_key" ON "employees"("badge_code");

-- CreateIndex
CREATE INDEX "employees_name_idx" ON "employees"("name");

-- CreateIndex
CREATE INDEX "employees_registration_idx" ON "employees"("registration");

-- CreateIndex
CREATE UNIQUE INDEX "employees_business_unit_id_registration_key" ON "employees"("business_unit_id", "registration");

-- CreateIndex
CREATE UNIQUE INDEX "epi_categories_name_key" ON "epi_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "epi_items_internal_code_key" ON "epi_items"("internal_code");

-- CreateIndex
CREATE UNIQUE INDEX "epi_items_barcode_key" ON "epi_items"("barcode");

-- CreateIndex
CREATE INDEX "epi_items_name_idx" ON "epi_items"("name");

-- CreateIndex
CREATE INDEX "epi_cas_epi_item_id_idx" ON "epi_cas"("epi_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_business_unit_id_code_key" ON "warehouses"("business_unit_id", "code");

-- CreateIndex
CREATE INDEX "stock_items_epi_item_id_idx" ON "stock_items"("epi_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_warehouse_id_epi_item_id_size_batch_number_key" ON "stock_items"("warehouse_id", "epi_item_id", "size", "batch_number");

-- CreateIndex
CREATE INDEX "stock_movements_stock_item_id_created_at_idx" ON "stock_movements"("stock_item_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_number_key" ON "deliveries"("number");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_idempotency_key_key" ON "deliveries"("idempotency_key");

-- CreateIndex
CREATE INDEX "deliveries_employee_id_delivered_at_idx" ON "deliveries"("employee_id", "delivered_at");

-- CreateIndex
CREATE INDEX "deliveries_warehouse_id_delivered_at_idx" ON "deliveries"("warehouse_id", "delivered_at");

-- CreateIndex
CREATE INDEX "deliveries_delivered_at_idx" ON "deliveries"("delivered_at");

-- CreateIndex
CREATE INDEX "delivery_items_delivery_id_idx" ON "delivery_items"("delivery_id");

-- CreateIndex
CREATE INDEX "epi_returns_delivery_item_id_idx" ON "epi_returns"("delivery_item_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "user_warehouses" ADD CONSTRAINT "user_warehouses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warehouses" ADD CONSTRAINT "user_warehouses_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_units" ADD CONSTRAINT "business_units_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_role_required_epis" ADD CONSTRAINT "job_role_required_epis_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_role_required_epis" ADD CONSTRAINT "job_role_required_epis_epi_item_id_fkey" FOREIGN KEY ("epi_item_id") REFERENCES "epi_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_job_role_id_fkey" FOREIGN KEY ("job_role_id") REFERENCES "job_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epi_items" ADD CONSTRAINT "epi_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "epi_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epi_cas" ADD CONSTRAINT "epi_cas_epi_item_id_fkey" FOREIGN KEY ("epi_item_id") REFERENCES "epi_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_epi_item_id_fkey" FOREIGN KEY ("epi_item_id") REFERENCES "epi_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_delivery_item_id_fkey" FOREIGN KEY ("delivery_item_id") REFERENCES "delivery_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "epi_returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_delivered_by_id_fkey" FOREIGN KEY ("delivered_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_epi_item_id_fkey" FOREIGN KEY ("epi_item_id") REFERENCES "epi_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_signatures" ADD CONSTRAINT "delivery_signatures_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epi_returns" ADD CONSTRAINT "epi_returns_delivery_item_id_fkey" FOREIGN KEY ("delivery_item_id") REFERENCES "delivery_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epi_returns" ADD CONSTRAINT "epi_returns_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "epi_returns" ADD CONSTRAINT "epi_returns_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================================
-- Restricoes de integridade nao expressas no schema Prisma (escritas a mao).
-- ==========================================================================

-- Saldo nunca negativo: rede de seguranca para a baixa condicional feita na aplicacao.
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_quantity_non_negative" CHECK ("quantity" >= 0);

-- Movimentacao coerente: saldo posterior = anterior + delta, ambos nao negativos, delta != 0.
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_balance_consistent"
  CHECK ("balance_after" = "balance_before" + "delta" AND "balance_before" >= 0 AND "balance_after" >= 0 AND "delta" <> 0);

-- Quantidades entregues/devolvidas sempre positivas.
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "epi_returns" ADD CONSTRAINT "epi_returns_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "job_role_required_epis" ADD CONSTRAINT "job_role_required_epis_quantity_positive" CHECK ("quantity" > 0);
