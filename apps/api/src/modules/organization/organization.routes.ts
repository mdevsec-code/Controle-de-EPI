import {
  createBusinessUnitRequestSchema,
  createCompanyRequestSchema,
  createDepartmentRequestSchema,
  createJobRoleRequestSchema,
  idParamSchema,
  listBusinessUnitsQuerySchema,
  listDepartmentsQuerySchema,
  pageQuerySchema,
  updateBusinessUnitRequestSchema,
  updateCompanyRequestSchema,
  updateDepartmentRequestSchema,
  updateJobRoleRequestSchema,
  type BusinessUnitDto,
  type CompanyDto,
  type DepartmentDto,
  type JobRoleDto,
} from "@epi-manager/contracts";
import {
  prisma,
  type BusinessUnit,
  type Company,
  type Department,
  type JobRole,
} from "@epi-manager/database";
import { Router } from "express";
import { recordAudit } from "../../shared/audit.js";
import { conflict, notFound, unprocessable } from "../../shared/errors.js";
import { iso, pageArgs, toPage } from "../../shared/format.js";
import { authenticate, authorize } from "../../shared/http/authenticate.js";
import { actor, handler } from "../../shared/http/handler.js";
import { createsCycle } from "./domain/department-hierarchy.js";

const toCompanyDto = (c: Company): CompanyDto => ({
  id: c.id,
  name: c.name,
  tradeName: c.tradeName,
  cnpj: c.cnpj,
  responsibleName: c.responsibleName,
  responsibleEmail: c.responsibleEmail,
  createdAt: iso(c.createdAt),
});

const toBusinessUnitDto = (u: BusinessUnit): BusinessUnitDto => ({
  id: u.id,
  companyId: u.companyId,
  name: u.name,
  code: u.code,
  street: u.street,
  number: u.number,
  city: u.city,
  state: u.state,
  zipCode: u.zipCode,
  createdAt: iso(u.createdAt),
});

const toDepartmentDto = (d: Department): DepartmentDto => ({
  id: d.id,
  businessUnitId: d.businessUnitId,
  name: d.name,
  code: d.code,
  parentId: d.parentId,
  createdAt: iso(d.createdAt),
});

const toJobRoleDto = (j: JobRole): JobRoleDto => ({
  id: j.id,
  name: j.name,
  description: j.description,
  createdAt: iso(j.createdAt),
});

/** Cadastros organizacionais: exclusivos do ADMIN (leitura e escrita). */
export function createOrganizationRouter(): Router {
  const router = Router();
  router.use(
    ["/companies", "/business-units", "/departments", "/job-roles"],
    authenticate,
    authorize("ADMIN"),
  );

  // --- Empresas --------------------------------------------------------------
  router.get(
    "/companies",
    handler({ query: pageQuerySchema }, async ({ query }) => {
      const [items, total] = await Promise.all([
        prisma.company.findMany({ ...pageArgs(query), orderBy: { name: "asc" } }),
        prisma.company.count(),
      ]);
      return toPage(items.map(toCompanyDto), total, query);
    }),
  );

  router.get(
    "/companies/:id",
    handler({ params: idParamSchema }, async ({ params }) => {
      const company = await prisma.company.findUnique({ where: { id: params.id } });
      if (!company) throw notFound("Empresa nao encontrada");
      return toCompanyDto(company);
    }),
  );

  router.post(
    "/companies",
    handler({ body: createCompanyRequestSchema, status: 201 }, async ({ body, req }) => {
      if (await prisma.company.findUnique({ where: { cnpj: body.cnpj } })) {
        throw conflict("Ja existe uma empresa cadastrada com este CNPJ");
      }
      const company = await prisma.$transaction(async (tx) => {
        const created = await tx.company.create({ data: body });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "Company",
            entityId: created.id,
            after: created,
          },
          tx,
        );
        return created;
      });
      return toCompanyDto(company);
    }),
  );

  router.patch(
    "/companies/:id",
    handler(
      { params: idParamSchema, body: updateCompanyRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.company.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("Empresa nao encontrada");
        const company = await prisma.$transaction(async (tx) => {
          const updated = await tx.company.update({ where: { id: params.id }, data: body });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "Company",
              entityId: updated.id,
              before,
              after: updated,
            },
            tx,
          );
          return updated;
        });
        return toCompanyDto(company);
      },
    ),
  );

  // --- Unidades --------------------------------------------------------------
  router.get(
    "/business-units",
    handler({ query: listBusinessUnitsQuerySchema }, async ({ query }) => {
      const where = query.companyId ? { companyId: query.companyId } : {};
      const [items, total] = await Promise.all([
        prisma.businessUnit.findMany({ where, ...pageArgs(query), orderBy: { name: "asc" } }),
        prisma.businessUnit.count({ where }),
      ]);
      return toPage(items.map(toBusinessUnitDto), total, query);
    }),
  );

  router.post(
    "/business-units",
    handler({ body: createBusinessUnitRequestSchema, status: 201 }, async ({ body, req }) => {
      if (!(await prisma.company.findUnique({ where: { id: body.companyId } }))) {
        throw unprocessable("NAO_ENCONTRADO", "Empresa informada nao existe");
      }
      if (
        await prisma.businessUnit.findUnique({
          where: { companyId_code: { companyId: body.companyId, code: body.code } },
        })
      ) {
        throw conflict("Ja existe uma unidade com este codigo nesta empresa");
      }
      const unit = await prisma.$transaction(async (tx) => {
        const created = await tx.businessUnit.create({ data: body });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "BusinessUnit",
            entityId: created.id,
            after: created,
          },
          tx,
        );
        return created;
      });
      return toBusinessUnitDto(unit);
    }),
  );

  router.patch(
    "/business-units/:id",
    handler(
      { params: idParamSchema, body: updateBusinessUnitRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.businessUnit.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("Unidade nao encontrada");
        const unit = await prisma.$transaction(async (tx) => {
          const updated = await tx.businessUnit.update({ where: { id: params.id }, data: body });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "BusinessUnit",
              entityId: updated.id,
              before,
              after: updated,
            },
            tx,
          );
          return updated;
        });
        return toBusinessUnitDto(unit);
      },
    ),
  );

  // --- Setores ---------------------------------------------------------------
  const parentOf = async (id: string) =>
    (await prisma.department.findUnique({ where: { id }, select: { parentId: true } }))?.parentId ??
    null;

  router.get(
    "/departments",
    handler({ query: listDepartmentsQuerySchema }, async ({ query }) => {
      const where = query.businessUnitId ? { businessUnitId: query.businessUnitId } : {};
      const [items, total] = await Promise.all([
        prisma.department.findMany({ where, ...pageArgs(query), orderBy: { name: "asc" } }),
        prisma.department.count({ where }),
      ]);
      return toPage(items.map(toDepartmentDto), total, query);
    }),
  );

  router.post(
    "/departments",
    handler({ body: createDepartmentRequestSchema, status: 201 }, async ({ body, req }) => {
      if (!(await prisma.businessUnit.findUnique({ where: { id: body.businessUnitId } }))) {
        throw unprocessable("NAO_ENCONTRADO", "Unidade informada nao existe");
      }
      if (body.parentId) {
        const parent = await prisma.department.findUnique({ where: { id: body.parentId } });
        if (!parent || parent.businessUnitId !== body.businessUnitId) {
          throw unprocessable("VALIDACAO", "O setor pai deve existir e pertencer a mesma unidade");
        }
      }
      if (
        await prisma.department.findUnique({
          where: { businessUnitId_code: { businessUnitId: body.businessUnitId, code: body.code } },
        })
      ) {
        throw conflict("Ja existe um setor com este codigo nesta unidade");
      }
      const department = await prisma.$transaction(async (tx) => {
        const created = await tx.department.create({ data: body });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "Department",
            entityId: created.id,
            after: created,
          },
          tx,
        );
        return created;
      });
      return toDepartmentDto(department);
    }),
  );

  router.patch(
    "/departments/:id",
    handler(
      { params: idParamSchema, body: updateDepartmentRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.department.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("Setor nao encontrado");
        if (body.parentId) {
          const parent = await prisma.department.findUnique({ where: { id: body.parentId } });
          if (!parent || parent.businessUnitId !== before.businessUnitId) {
            throw unprocessable(
              "VALIDACAO",
              "O setor pai deve existir e pertencer a mesma unidade",
            );
          }
          if (await createsCycle(params.id, body.parentId, parentOf)) {
            throw unprocessable("VALIDACAO", "Este setor pai criaria um ciclo na hierarquia");
          }
        }
        const department = await prisma.$transaction(async (tx) => {
          const updated = await tx.department.update({ where: { id: params.id }, data: body });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "Department",
              entityId: updated.id,
              before,
              after: updated,
            },
            tx,
          );
          return updated;
        });
        return toDepartmentDto(department);
      },
    ),
  );

  // --- Cargos ----------------------------------------------------------------
  router.get(
    "/job-roles",
    handler({ query: pageQuerySchema }, async ({ query }) => {
      const [items, total] = await Promise.all([
        prisma.jobRole.findMany({ ...pageArgs(query), orderBy: { name: "asc" } }),
        prisma.jobRole.count(),
      ]);
      return toPage(items.map(toJobRoleDto), total, query);
    }),
  );

  router.post(
    "/job-roles",
    handler({ body: createJobRoleRequestSchema, status: 201 }, async ({ body, req }) => {
      if (await prisma.jobRole.findUnique({ where: { name: body.name } })) {
        throw conflict("Ja existe um cargo com este nome");
      }
      const jobRole = await prisma.$transaction(async (tx) => {
        const created = await tx.jobRole.create({ data: body });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "JobRole",
            entityId: created.id,
            after: created,
          },
          tx,
        );
        return created;
      });
      return toJobRoleDto(jobRole);
    }),
  );

  router.patch(
    "/job-roles/:id",
    handler(
      { params: idParamSchema, body: updateJobRoleRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.jobRole.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("Cargo nao encontrado");
        if (body.name) {
          const sameName = await prisma.jobRole.findUnique({ where: { name: body.name } });
          if (sameName && sameName.id !== params.id)
            throw conflict("Ja existe um cargo com este nome");
        }
        const jobRole = await prisma.$transaction(async (tx) => {
          const updated = await tx.jobRole.update({ where: { id: params.id }, data: body });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "JobRole",
              entityId: updated.id,
              before,
              after: updated,
            },
            tx,
          );
          return updated;
        });
        return toJobRoleDto(jobRole);
      },
    ),
  );

  return router;
}
