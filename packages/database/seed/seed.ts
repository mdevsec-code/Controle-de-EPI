/**
 * Seed de DESENVOLVIMENTO. Recria os dados de exemplo do prototipo legado (legado/index.html):
 * colaboradores, catalogo de EPIs/CAs, almoxarifado e usuarios. Idempotente.
 *
 *   pnpm db:seed
 *
 * Senhas iniciais: SEED_ADMIN_PASSWORD e SEED_ALMOX_PASSWORD (minimo 10 caracteres).
 */
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import { config } from "dotenv";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

if (process.env.NODE_ENV === "production") {
  console.error("Seed de desenvolvimento bloqueado em producao (NODE_ENV=production).");
  process.exit(1);
}

const { prisma, UserRole, StockMovementType } = await import("../src/client.js");

function requirePassword(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  if (value.length < 10) throw new Error(`${name} deve ter pelo menos 10 caracteres`);
  return value;
}

/** Gera um CPF valido e deterministico a partir de 9 digitos-base (apenas para dados ficticios). */
function cpfFromBase(base: string): string {
  const digits = base.split("").map(Number);
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += (digits[i] ?? 0) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    digits.push(rest === 10 ? 0 : rest);
  }
  return digits.join("");
}

function newBadgeCode(): string {
  return randomBytes(18).toString("base64url");
}

async function main() {
  const company = await prisma.company.upsert({
    where: { cnpj: "12345678000199" },
    update: {},
    create: {
      name: "EngeNova Engenharia e Construção Ltda.",
      tradeName: "EngeNova",
      cnpj: "12345678000199",
      responsibleName: "SESMT",
      responsibleEmail: "sesmt@engenova.example.com",
    },
  });

  const unit = await prisma.businessUnit.upsert({
    where: { companyId_code: { companyId: company.id, code: "MATRIZ" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Matriz",
      code: "MATRIZ",
      city: "São Paulo",
      state: "SP",
    },
  });

  const departmentNames: Record<string, string> = {
    OBI: "Obras Industriais",
    MAN: "Manutenção",
    OBC: "Obras Civis",
    ALM: "Almoxarifado",
  };
  const departments: Record<string, string> = {};
  for (const [code, name] of Object.entries(departmentNames)) {
    const department = await prisma.department.upsert({
      where: { businessUnitId_code: { businessUnitId: unit.id, code } },
      update: {},
      create: { businessUnitId: unit.id, code, name },
    });
    departments[code] = department.id;
  }

  const jobRoles: Record<string, string> = {};
  for (const name of ["Soldador", "Eletricista", "Pedreiro", "Encarregado", "Almoxarife"]) {
    const jobRole = await prisma.jobRole.upsert({ where: { name }, update: {}, create: { name } });
    jobRoles[name] = jobRole.id;
  }

  const warehouse = await prisma.warehouse.upsert({
    where: { businessUnitId_code: { businessUnitId: unit.id, code: "ALM01" } },
    update: {},
    create: { businessUnitId: unit.id, name: "Almoxarifado Central", code: "ALM01" },
  });

  // --- Colaboradores (mesmos do prototipo) ----------------------------------
  const employees = [
    {
      registration: "2541",
      name: "João Carlos da Silva",
      jobRole: "Soldador",
      dept: "OBI",
      cpfBase: "529982247",
    },
    {
      registration: "1122",
      name: "Pedro Santos",
      jobRole: "Eletricista",
      dept: "MAN",
      cpfBase: "111444777",
    },
    {
      registration: "1987",
      name: "Carlos Souza",
      jobRole: "Pedreiro",
      dept: "OBC",
      cpfBase: "390533447",
    },
    {
      registration: "3390",
      name: "João Silva",
      jobRole: "Encarregado",
      dept: "OBI",
      cpfBase: "123456789",
    },
    {
      registration: "4471",
      name: "Marcos Lima",
      jobRole: "Almoxarife",
      dept: "ALM",
      cpfBase: "987654321",
    },
  ];
  for (const employee of employees) {
    await prisma.employee.upsert({
      where: {
        businessUnitId_registration: {
          businessUnitId: unit.id,
          registration: employee.registration,
        },
      },
      update: {},
      create: {
        registration: employee.registration,
        name: employee.name,
        cpf: cpfFromBase(employee.cpfBase),
        badgeCode: newBadgeCode(),
        costCenter: departmentNames[employee.dept],
        businessUnitId: unit.id,
        departmentId: departments[employee.dept]!,
        jobRoleId: jobRoles[employee.jobRole]!,
      },
    });
  }

  // --- Usuarios ------------------------------------------------------------
  const adminHash = await bcrypt.hash(
    requirePassword("SEED_ADMIN_PASSWORD", "Admin@Engenova1"),
    12,
  );
  await prisma.user.upsert({
    where: { email: "admin@engenova.example.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@engenova.example.com",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      mustChangePassword: true,
    },
  });

  const almoxHash = await bcrypt.hash(
    requirePassword("SEED_ALMOX_PASSWORD", "Almox@Engenova1"),
    12,
  );
  const almox = await prisma.user.upsert({
    where: { email: "marcio.almox@engenova.example.com" },
    update: {},
    create: {
      name: "Márcio",
      email: "marcio.almox@engenova.example.com",
      passwordHash: almoxHash,
      role: UserRole.ALMOXARIFADO,
    },
  });
  await prisma.userWarehouse.upsert({
    where: { userId_warehouseId: { userId: almox.id, warehouseId: warehouse.id } },
    update: {},
    create: { userId: almox.id, warehouseId: warehouse.id },
  });

  // --- Catalogo de EPIs (mesmo do prototipo) + estoque inicial ----------------
  const catalog = [
    {
      code: "EPI-PFF2",
      name: "Máscara PFF2",
      category: "Proteção Respiratória",
      ca: "12345",
      maker: "3M",
      sizes: [""],
      qty: 120,
      min: 30,
      life: 7,
    },
    {
      code: "EPI-LUV-RASPA",
      name: "Luva Raspa",
      category: "Proteção das Mãos",
      ca: "30981",
      maker: "Danny",
      sizes: ["M", "G"],
      qty: 60,
      min: 20,
      life: 30,
    },
    {
      code: "EPI-OCULOS",
      name: "Óculos de Segurança",
      category: "Proteção dos Olhos",
      ca: "20456",
      maker: "Kalipso",
      sizes: [""],
      qty: 40,
      min: 10,
      life: 180,
    },
    {
      code: "EPI-PROT-AUR",
      name: "Protetor Auricular",
      category: "Proteção Auditiva",
      ca: "18823",
      maker: "3M",
      sizes: [""],
      qty: 200,
      min: 50,
      life: 30,
    },
    {
      code: "EPI-RESP",
      name: "Respirador",
      category: "Proteção Respiratória",
      ca: "40112",
      maker: "3M",
      sizes: [""],
      qty: 15,
      min: 5,
      life: 365,
    },
    {
      code: "EPI-LUV-VAQ",
      name: "Luva Vaqueta",
      category: "Proteção das Mãos",
      ca: "30982",
      maker: "Danny",
      sizes: ["M", "G"],
      qty: 50,
      min: 20,
      life: 60,
    },
    {
      code: "EPI-AVENTAL",
      name: "Avental",
      category: "Proteção do Tronco",
      ca: "50221",
      maker: "Delta Plus",
      sizes: [""],
      qty: 10,
      min: 5,
      life: 365,
    },
    {
      code: "EPI-BOTA",
      name: "Bota de Segurança",
      category: "Proteção dos Pés",
      ca: "60110",
      maker: "Marluvas",
      sizes: ["38", "39", "40", "41", "42", "43", "44"],
      qty: 6,
      min: 3,
      life: 365,
    },
    {
      code: "EPI-COLETE",
      name: "Colete Refletivo",
      category: "Proteção do Tronco",
      ca: "70334",
      maker: "Plastcor",
      sizes: [""],
      qty: 25,
      min: 10,
      life: 365,
    },
  ];

  // Onde cada EPI fica guardado no almoxarifado de exemplo.
  const locations: Record<string, string> = {
    "EPI-PFF2": "Corredor A · Prateleira 1",
    "EPI-RESP": "Corredor A · Prateleira 1",
    "EPI-OCULOS": "Corredor A · Prateleira 2",
    "EPI-PROT-AUR": "Corredor A · Prateleira 2",
    "EPI-LUV-RASPA": "Corredor B · Prateleira 1",
    "EPI-LUV-VAQ": "Corredor B · Prateleira 1",
    "EPI-AVENTAL": "Corredor B · Prateleira 3",
    "EPI-COLETE": "Corredor B · Prateleira 3",
    "EPI-BOTA": "Corredor C · Gaveteiro",
  };

  for (const item of catalog) {
    const category = await prisma.epiCategory.upsert({
      where: { name: item.category },
      update: {},
      create: { name: item.category },
    });
    const epi = await prisma.epiItem.upsert({
      where: { internalCode: item.code },
      update: {},
      create: {
        name: item.name,
        internalCode: item.code,
        categoryId: category.id,
        manufacturer: item.maker,
        minQuantity: item.min,
        usefulLifeDays: item.life,
      },
    });
    if ((await prisma.epiCA.count({ where: { epiItemId: epi.id } })) === 0) {
      await prisma.epiCA.create({
        data: {
          epiItemId: epi.id,
          number: item.ca,
          issuedAt: new Date("2025-01-10"),
          expiresAt: new Date("2030-01-10"),
        },
      });
    }

    for (const size of item.sizes) {
      const key = { warehouseId: warehouse.id, epiItemId: epi.id, size, batchNumber: "" };
      const location = locations[item.code] ?? "";
      const existing = await prisma.stockItem.findUnique({
        where: { warehouseId_epiItemId_size_batchNumber: key },
      });
      if (existing) {
        // So preenche o local se ainda nao foi definido (nao sobrescreve o que o usuario marcou).
        if (!existing.location && location) {
          await prisma.stockItem.update({ where: { id: existing.id }, data: { location } });
        }
        continue;
      }
      // Saldo inicial sempre acompanhado da movimentacao que o explica.
      await prisma.stockItem.create({
        data: {
          ...key,
          location,
          quantity: item.qty,
          movements: {
            create: {
              type: StockMovementType.ENTRADA,
              delta: item.qty,
              balanceBefore: 0,
              balanceAfter: item.qty,
              reason: "Saldo inicial (seed de desenvolvimento)",
              performedById: almox.id,
            },
          },
        },
      });
    }
  }

  console.log("Seed concluido.");
  console.log(
    "  ADMIN:        admin@engenova.example.com (troca de senha obrigatoria no 1o acesso)",
  );
  console.log("  ALMOXARIFADO: marcio.almox@engenova.example.com");
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
