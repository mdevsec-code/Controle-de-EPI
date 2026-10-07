import { randomBytes } from "node:crypto";
import {
  badgeCodeParamSchema,
  changeEmployeeStatusRequestSchema,
  createEmployeeRequestSchema,
  idParamSchema,
  listEmployeesQuerySchema,
  updateEmployeeRequestSchema,
  type BadgeCodeResponse,
} from "@epi-manager/contracts";
import { prisma, type Prisma } from "@epi-manager/database";
import { Router } from "express";
import { recordAudit } from "../../shared/audit.js";
import { AppError, conflict, notFound, unprocessable } from "../../shared/errors.js";
import { pageArgs, toPage } from "../../shared/format.js";
import type { AuthContext } from "../../shared/http/auth-context.js";
import { authenticate, authorize } from "../../shared/http/authenticate.js";
import { actor, authOf, handler } from "../../shared/http/handler.js";
import { businessUnitFilter } from "../../shared/http/scope.js";
import { canTransition } from "./domain/employee-status.js";
import { employeeInclude, toEmployeeDto, toEmployeeSummary } from "./employee.mapper.js";

/** Codigo opaco do QR do cracha: 144 bits aleatorios, sem relacao com CPF/ID/matricula. */
export function generateBadgeCode(): string {
  return randomBytes(18).toString("base64url");
}

/** Colaborador fora do escopo do usuario e tratado como inexistente (nao revela que existe). */
async function findInScope(auth: AuthContext, where: Prisma.EmployeeWhereUniqueInput) {
  const employee = await prisma.employee.findUnique({ where, include: employeeInclude });
  const units = businessUnitFilter(auth);
  if (!employee || (units && !units.in.includes(employee.businessUnitId))) return null;
  return employee;
}

async function validateReferences(input: {
  businessUnitId: string;
  departmentId?: string;
  jobRoleId?: string;
  supervisorId?: string | null;
  employeeId?: string;
}) {
  if (input.departmentId) {
    const department = await prisma.department.findUnique({ where: { id: input.departmentId } });
    if (!department || department.businessUnitId !== input.businessUnitId) {
      throw unprocessable(
        "VALIDACAO",
        "Setor informado nao existe ou nao pertence a unidade do colaborador",
      );
    }
  }
  if (input.jobRoleId && !(await prisma.jobRole.findUnique({ where: { id: input.jobRoleId } }))) {
    throw unprocessable("VALIDACAO", "Cargo informado nao existe");
  }
  if (input.supervisorId) {
    if (input.supervisorId === input.employeeId) {
      throw unprocessable("VALIDACAO", "O colaborador nao pode ser supervisor de si mesmo");
    }
    const [supervisor, unit] = await Promise.all([
      prisma.employee.findUnique({
        where: { id: input.supervisorId },
        include: { businessUnit: true },
      }),
      prisma.businessUnit.findUnique({ where: { id: input.businessUnitId } }),
    ]);
    if (!supervisor || supervisor.businessUnit.companyId !== unit?.companyId) {
      throw unprocessable("VALIDACAO", "Supervisor informado nao existe ou e de outra empresa");
    }
  }
}

export function createEmployeesRouter(): Router {
  const router = Router();
  router.use("/employees", authenticate);

  /** Busca por nome (parcial) ou matricula (prefixo), restrita as unidades do usuario. */
  router.get(
    "/employees",
    handler({ query: listEmployeesQuerySchema }, async ({ query, req }) => {
      const auth = authOf(req);
      const units = businessUnitFilter(auth);
      if (query.businessUnitId && units && !units.in.includes(query.businessUnitId)) {
        return toPage([], 0, query);
      }
      const where: Prisma.EmployeeWhereInput = {
        businessUnitId: query.businessUnitId ?? units,
        departmentId: query.departmentId,
        status: query.status,
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { registration: { startsWith: query.q } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          include: employeeInclude,
          ...pageArgs(query),
          orderBy: { name: "asc" },
        }),
        prisma.employee.count({ where }),
      ]);
      return toPage(
        items.map((e) => toEmployeeDto(e, auth)),
        total,
        query,
      );
    }),
  );

  /** Leitura do QR do cracha. Devolve a visao minima usada no fluxo de entrega. */
  router.get(
    "/employees/by-badge/:code",
    handler({ params: badgeCodeParamSchema }, async ({ params, req }) => {
      const employee = await findInScope(authOf(req), { badgeCode: params.code });
      if (!employee)
        throw notFound("Cracha nao reconhecido. Busque o colaborador pelo nome ou matricula.");
      return toEmployeeSummary(employee);
    }),
  );

  router.get(
    "/employees/:id",
    handler({ params: idParamSchema }, async ({ params, req }) => {
      const auth = authOf(req);
      const employee = await findInScope(auth, { id: params.id });
      if (!employee) throw notFound("Colaborador nao encontrado");
      return toEmployeeDto(employee, auth);
    }),
  );

  router.post(
    "/employees",
    authorize("ADMIN"),
    handler({ body: createEmployeeRequestSchema, status: 201 }, async ({ body, req }) => {
      if (!(await prisma.businessUnit.findUnique({ where: { id: body.businessUnitId } }))) {
        throw unprocessable("VALIDACAO", "Unidade informada nao existe");
      }
      await validateReferences(body);
      if (await prisma.employee.findUnique({ where: { cpf: body.cpf } })) {
        throw conflict("Ja existe um colaborador cadastrado com este CPF");
      }
      const registrationKey = {
        businessUnitId: body.businessUnitId,
        registration: body.registration,
      };
      if (
        await prisma.employee.findUnique({
          where: { businessUnitId_registration: registrationKey },
        })
      ) {
        throw conflict("Ja existe um colaborador com esta matricula nesta unidade");
      }
      return prisma.$transaction(async (tx) => {
        const created = await tx.employee.create({
          data: { ...body, badgeCode: generateBadgeCode() },
          include: employeeInclude,
        });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "Employee",
            entityId: created.id,
            after: created,
          },
          tx,
        );
        return toEmployeeDto(created, authOf(req));
      });
    }),
  );

  router.patch(
    "/employees/:id",
    authorize("ADMIN"),
    handler(
      { params: idParamSchema, body: updateEmployeeRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.employee.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("Colaborador nao encontrado");
        await validateReferences({
          ...body,
          businessUnitId: before.businessUnitId,
          employeeId: params.id,
        });
        return prisma.$transaction(async (tx) => {
          const updated = await tx.employee.update({
            where: { id: params.id },
            data: body,
            include: employeeInclude,
          });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "Employee",
              entityId: params.id,
              before,
              after: updated,
            },
            tx,
          );
          return toEmployeeDto(updated, authOf(req));
        });
      },
    ),
  );

  router.patch(
    "/employees/:id/status",
    authorize("ADMIN"),
    handler(
      { params: idParamSchema, body: changeEmployeeStatusRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.employee.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("Colaborador nao encontrado");
        if (!canTransition(before.status, body.status)) {
          throw new AppError(
            "TRANSICAO_INVALIDA",
            422,
            `Nao e possivel alterar o status de ${before.status} para ${body.status}`,
          );
        }
        return prisma.$transaction(async (tx) => {
          const updated = await tx.employee.update({
            where: { id: params.id },
            data: {
              status: body.status,
              terminationDate:
                body.status === "DESLIGADO"
                  ? body.terminationDate
                  : body.status === "ATIVO"
                    ? null
                    : undefined,
            },
            include: employeeInclude,
          });
          await recordAudit(
            {
              ...actor(req),
              action: "ALTERAR_STATUS",
              entity: "Employee",
              entityId: params.id,
              before: { status: before.status },
              after: { status: updated.status, terminationDate: updated.terminationDate },
            },
            tx,
          );
          return toEmployeeDto(updated, authOf(req));
        });
      },
    ),
  );

  /** Reemite o codigo do cracha (ex.: cracha perdido): o QR antigo deixa de funcionar. */
  router.post(
    "/employees/:id/badge",
    authorize("ADMIN"),
    handler({ params: idParamSchema }, async ({ params, req }): Promise<BadgeCodeResponse> => {
      if (!(await prisma.employee.findUnique({ where: { id: params.id }, select: { id: true } }))) {
        throw notFound("Colaborador nao encontrado");
      }
      const badgeCode = generateBadgeCode();
      await prisma.$transaction(async (tx) => {
        await tx.employee.update({ where: { id: params.id }, data: { badgeCode } });
        await recordAudit(
          { ...actor(req), action: "REEMITIR_CRACHA", entity: "Employee", entityId: params.id },
          tx,
        );
      });
      return { badgeCode };
    }),
  );

  return router;
}
