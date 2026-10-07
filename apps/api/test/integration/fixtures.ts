import { randomUUID } from "node:crypto";
import { prisma, type UserRole } from "@epi-manager/database";
import bcrypt from "bcrypt";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { jwtTokenService } from "../../src/shared/security/token-service.js";

export const app = createApp();

/** PNG 1x1 real (assinatura minima valida). */
export const SIGNATURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export async function resetDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

let counter = 0;
const unique = (prefix: string) => `${prefix}${++counter}${Date.now() % 100000}`;

export async function createUser(
  role: UserRole,
  warehouseIds: string[] = [],
  password = "Senha@Forte123",
) {
  const user = await prisma.user.create({
    data: {
      name: role === "ADMIN" ? "Admin Teste" : "Almox Teste",
      email: `${unique("user")}@teste.local`,
      passwordHash: await bcrypt.hash(password, 4),
      role,
      warehouses: { create: warehouseIds.map((warehouseId) => ({ warehouseId })) },
    },
  });
  const token = jwtTokenService.signAccessToken({
    sub: user.id,
    role: user.role,
    ver: user.tokenVersion,
  });
  return { user, token, password };
}

/** Empresa > unidade > setor/cargo > almoxarifado, colaborador ativo e EPI com CA vigente. */
export async function createScenario(options: { stock?: number; size?: string } = {}) {
  const company = await prisma.company.create({
    data: { name: "EngeNova", cnpj: unique("").padStart(14, "0").slice(-14) },
  });
  const unit = await prisma.businessUnit.create({
    data: { companyId: company.id, name: "Matriz", code: unique("U") },
  });
  const department = await prisma.department.create({
    data: { businessUnitId: unit.id, name: "Obras", code: unique("D") },
  });
  const jobRole = await prisma.jobRole.create({ data: { name: unique("Soldador") } });
  const warehouse = await prisma.warehouse.create({
    data: { businessUnitId: unit.id, name: "Almoxarifado Central", code: unique("W") },
  });
  const employee = await prisma.employee.create({
    data: {
      registration: unique("R"),
      cpf: unique("").padStart(11, "1").slice(-11),
      name: "Joao Carlos da Silva",
      badgeCode: randomUUID().replaceAll("-", ""),
      businessUnitId: unit.id,
      departmentId: department.id,
      jobRoleId: jobRole.id,
    },
  });
  const category = await prisma.epiCategory.create({ data: { name: unique("Respiratoria") } });
  const epi = await prisma.epiItem.create({
    data: {
      name: "Mascara PFF2",
      internalCode: unique("EPI"),
      categoryId: category.id,
      manufacturer: "3M",
      usefulLifeDays: 7,
      cas: {
        create: {
          number: "12345",
          issuedAt: new Date("2025-01-01"),
          expiresAt: new Date("2030-01-01"),
        },
      },
    },
  });
  const stockItem = await prisma.stockItem.create({
    data: {
      warehouseId: warehouse.id,
      epiItemId: epi.id,
      size: options.size ?? "",
      quantity: options.stock ?? 10,
    },
  });
  const almox = await createUser("ALMOXARIFADO", [warehouse.id]);
  return {
    company,
    unit,
    department,
    jobRole,
    warehouse,
    employee,
    category,
    epi,
    stockItem,
    almox,
  };
}

export function deliveryBody(
  scenario: Awaited<ReturnType<typeof createScenario>>,
  quantity = 1,
  overrides: object = {},
) {
  return {
    idempotencyKey: randomUUID(),
    employeeId: scenario.employee.id,
    warehouseId: scenario.warehouse.id,
    reason: "DESGASTE",
    items: [{ stockItemId: scenario.stockItem.id, quantity }],
    signature: SIGNATURE,
    ...overrides,
  };
}

export function api(token?: string) {
  const agent = request(app);
  return {
    get: (url: string) =>
      token ? agent.get(url).set("Authorization", `Bearer ${token}`) : agent.get(url),
    post: (url: string) =>
      token ? agent.post(url).set("Authorization", `Bearer ${token}`) : agent.post(url),
    patch: (url: string) =>
      token ? agent.patch(url).set("Authorization", `Bearer ${token}`) : agent.patch(url),
  };
}
