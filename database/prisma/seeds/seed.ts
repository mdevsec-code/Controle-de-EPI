import "dotenv/config";
import { prisma, EpiControlType, UserRole } from "@epi-manager/database";
import bcrypt from "bcrypt";

async function main() {
  const company = await prisma.company.upsert({
    where: { cnpj: "12345678000199" },
    update: {},
    create: {
      name: "EngeNova Industria S.A.",
      tradeName: "EngeNova",
      cnpj: "12345678000199",
      responsibleName: "Departamento de SESMT",
      responsibleEmail: "sesmt@engenova.example.com",
    },
  });

  const businessUnit = await prisma.businessUnit.upsert({
    where: { companyId_code: { companyId: company.id, code: "MATRIZ" } },
    update: {},
    create: {
      companyId: company.id,
      name: "Matriz",
      code: "MATRIZ",
      city: "Sao Paulo",
      state: "SP",
    },
  });

  const departmentProducao = await prisma.department.upsert({
    where: { businessUnitId_code: { businessUnitId: businessUnit.id, code: "PROD" } },
    update: {},
    create: { businessUnitId: businessUnit.id, name: "Producao", code: "PROD" },
  });

  const jobRoleOperador = await prisma.jobRole.upsert({
    where: { id: "seed-job-role-operador" },
    update: {},
    create: {
      id: "seed-job-role-operador",
      name: "Operador de Producao",
      description: "Atua diretamente na linha de producao",
    },
  });

  const capacete = await prisma.epiItem.upsert({
    where: { internalCode: "EPI-CAP-001" },
    update: {},
    create: {
      name: "Capacete de Seguranca",
      internalCode: "EPI-CAP-001",
      category: "Protecao da Cabeca",
      manufacturer: "3M",
      controlType: EpiControlType.PATRIMONIO,
      minQuantity: 10,
      usefulLifeDays: 1825,
      cas: {
        create: {
          number: "31469",
          issuedAt: new Date("2023-01-10"),
          expiresAt: new Date("2028-01-10"),
        },
      },
    },
  });

  const luva = await prisma.epiItem.upsert({
    where: { internalCode: "EPI-LUV-001" },
    update: {},
    create: {
      name: "Luva de Protecao",
      internalCode: "EPI-LUV-001",
      category: "Protecao das Maos",
      manufacturer: "Danny",
      controlType: EpiControlType.LOTE,
      minQuantity: 50,
      usefulLifeDays: 90,
      cas: {
        create: {
          number: "28011",
          issuedAt: new Date("2024-03-01"),
          expiresAt: new Date("2027-03-01"),
        },
      },
    },
  });

  await prisma.jobRoleRequiredEpi.upsert({
    where: { jobRoleId_epiItemId: { jobRoleId: jobRoleOperador.id, epiItemId: capacete.id } },
    update: {},
    create: { jobRoleId: jobRoleOperador.id, epiItemId: capacete.id, quantity: 1 },
  });
  await prisma.jobRoleRequiredEpi.upsert({
    where: { jobRoleId_epiItemId: { jobRoleId: jobRoleOperador.id, epiItemId: luva.id } },
    update: {},
    create: { jobRoleId: jobRoleOperador.id, epiItemId: luva.id, quantity: 2 },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { businessUnitId_code: { businessUnitId: businessUnit.id, code: "ALM01" } },
    update: {},
    create: { businessUnitId: businessUnit.id, name: "Almoxarifado Central", code: "ALM01" },
  });

  await prisma.stockItem.upsert({
    where: { id: "seed-stock-capacete" },
    update: {},
    create: {
      id: "seed-stock-capacete",
      epiItemId: capacete.id,
      warehouseId: warehouse.id,
      quantity: 40,
    },
  });
  await prisma.stockItem.upsert({
    where: { id: "seed-stock-luva" },
    update: {},
    create: {
      id: "seed-stock-luva",
      epiItemId: luva.id,
      warehouseId: warehouse.id,
      quantity: 200,
    },
  });

  const employee = await prisma.employee.upsert({
    where: { businessUnitId_registration: { businessUnitId: businessUnit.id, registration: "0001" } },
    update: {},
    create: {
      businessUnitId: businessUnit.id,
      companyId: company.id,
      departmentId: departmentProducao.id,
      jobRoleId: jobRoleOperador.id,
      registration: "0001",
      cpf: "00000000000",
      name: "Colaborador Exemplo",
      email: "colaborador.exemplo@engenova.example.com",
    },
  });

  const passwordHash = await bcrypt.hash("Trocar@123", 10);
  await prisma.user.upsert({
    where: { email: "admin@engenova.example.com" },
    update: {},
    create: {
      email: "admin@engenova.example.com",
      passwordHash,
      role: UserRole.ADMINISTRADOR,
      employeeId: employee.id,
    },
  });

  console.log("Seed concluido com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
