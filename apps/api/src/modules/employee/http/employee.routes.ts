import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { authorize } from "../../../shared/middlewares/authorize.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { PrismaBusinessUnitRepository } from "../../organization/infra/prisma-business-unit-repository.js";
import { PrismaCompanyRepository } from "../../organization/infra/prisma-company-repository.js";
import { PrismaDepartmentRepository } from "../../organization/infra/prisma-department-repository.js";
import { PrismaJobRoleRepository } from "../../organization/infra/prisma-job-role-repository.js";
import { EmployeeService } from "../application/employee.service.js";
import { PrismaEmployeeRepository } from "../infra/prisma-employee-repository.js";
import { EmployeeController } from "./employee.controller.js";
import {
  createEmployeeBodySchema,
  terminateEmployeeBodySchema,
  updateEmployeeBodySchema,
} from "./employee.schemas.js";

const MANAGE_ROLES = ["ADMINISTRADOR", "RH"] as const;
const STATUS_ROLES = ["ADMINISTRADOR", "RH", "SUPERVISOR"] as const;

/**
 * @openapi
 * /employees:
 *   get:
 *     tags: [Colaboradores]
 *     summary: Lista colaboradores (filtros por unidade, setor e status)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de colaboradores }
 *   post:
 *     tags: [Colaboradores]
 *     summary: Cadastra um novo colaborador
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Colaborador criado }
 *       404: { description: Empresa, unidade, setor, cargo ou supervisor nao encontrado }
 *       409: { description: CPF ou matricula ja cadastrados }
 * /employees/{id}:
 *   get:
 *     tags: [Colaboradores]
 *     summary: Busca um colaborador por id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Colaborador encontrado }
 *   patch:
 *     tags: [Colaboradores]
 *     summary: Atualiza dados de um colaborador
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Colaborador atualizado }
 * /employees/{id}/block:
 *   post:
 *     tags: [Colaboradores]
 *     summary: Bloqueia um colaborador (impede novas entregas de EPI)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Colaborador bloqueado }
 * /employees/{id}/unblock:
 *   post:
 *     tags: [Colaboradores]
 *     summary: Reativa um colaborador bloqueado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Colaborador reativado }
 * /employees/{id}/terminate:
 *   post:
 *     tags: [Colaboradores]
 *     summary: Registra o desligamento de um colaborador
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Colaborador desligado }
 */
export function createEmployeeRouter(): Router {
  const service = new EmployeeService(
    new PrismaEmployeeRepository(),
    new PrismaCompanyRepository(),
    new PrismaBusinessUnitRepository(),
    new PrismaDepartmentRepository(),
    new PrismaJobRoleRepository(),
  );
  const controller = new EmployeeController(service);
  const router = Router();

  router.use(authenticate);

  router.get("/employees", controller.list);
  router.get("/employees/:id", controller.getById);
  router.post(
    "/employees",
    authorize(...MANAGE_ROLES),
    validateBody(createEmployeeBodySchema),
    controller.create,
  );
  router.patch(
    "/employees/:id",
    authorize(...MANAGE_ROLES),
    validateBody(updateEmployeeBodySchema),
    controller.update,
  );
  router.post("/employees/:id/block", authorize(...STATUS_ROLES), controller.block);
  router.post("/employees/:id/unblock", authorize(...STATUS_ROLES), controller.unblock);
  router.post(
    "/employees/:id/terminate",
    authorize(...STATUS_ROLES),
    validateBody(terminateEmployeeBodySchema),
    controller.terminate,
  );

  return router;
}
