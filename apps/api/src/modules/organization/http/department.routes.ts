import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { authorize } from "../../../shared/middlewares/authorize.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { DepartmentService } from "../application/department.service.js";
import { PrismaBusinessUnitRepository } from "../infra/prisma-business-unit-repository.js";
import { PrismaDepartmentRepository } from "../infra/prisma-department-repository.js";
import { DepartmentController } from "./department.controller.js";
import { createDepartmentBodySchema, updateDepartmentBodySchema } from "./department.schemas.js";

const MANAGE_ROLES = ["ADMINISTRADOR", "RH"] as const;

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Setores]
 *     summary: Lista setores (opcionalmente filtrados por businessUnitId)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de setores }
 *   post:
 *     tags: [Setores]
 *     summary: Cadastra um novo setor
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Setor criado }
 * /departments/{id}:
 *   get:
 *     tags: [Setores]
 *     summary: Busca um setor por id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Setor encontrado }
 *   patch:
 *     tags: [Setores]
 *     summary: Atualiza um setor (nome ou setor pai)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Setor atualizado }
 */
export function createDepartmentRouter(): Router {
  const service = new DepartmentService(
    new PrismaDepartmentRepository(),
    new PrismaBusinessUnitRepository(),
  );
  const controller = new DepartmentController(service);
  const router = Router();

  router.use(authenticate);

  router.get("/departments", controller.list);
  router.get("/departments/:id", controller.getById);
  router.post(
    "/departments",
    authorize(...MANAGE_ROLES),
    validateBody(createDepartmentBodySchema),
    controller.create,
  );
  router.patch(
    "/departments/:id",
    authorize(...MANAGE_ROLES),
    validateBody(updateDepartmentBodySchema),
    controller.update,
  );

  return router;
}
