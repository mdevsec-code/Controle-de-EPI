import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { authorize } from "../../../shared/middlewares/authorize.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { BusinessUnitService } from "../application/business-unit.service.js";
import { PrismaBusinessUnitRepository } from "../infra/prisma-business-unit-repository.js";
import { PrismaCompanyRepository } from "../infra/prisma-company-repository.js";
import { BusinessUnitController } from "./business-unit.controller.js";
import {
  createBusinessUnitBodySchema,
  updateBusinessUnitBodySchema,
} from "./business-unit.schemas.js";

const MANAGE_ROLES = ["ADMINISTRADOR"] as const;

/**
 * @openapi
 * /business-units:
 *   get:
 *     tags: [Unidades]
 *     summary: Lista unidades (opcionalmente filtradas por companyId)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de unidades }
 *   post:
 *     tags: [Unidades]
 *     summary: Cadastra uma nova unidade/filial
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Unidade criada }
 *       404: { description: Empresa informada nao existe }
 *       409: { description: Codigo ja utilizado nesta empresa }
 * /business-units/{id}:
 *   get:
 *     tags: [Unidades]
 *     summary: Busca uma unidade por id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Unidade encontrada }
 *   patch:
 *     tags: [Unidades]
 *     summary: Atualiza dados de uma unidade
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Unidade atualizada }
 */
export function createBusinessUnitRouter(): Router {
  const service = new BusinessUnitService(
    new PrismaBusinessUnitRepository(),
    new PrismaCompanyRepository(),
  );
  const controller = new BusinessUnitController(service);
  const router = Router();

  router.use(authenticate);

  router.get("/business-units", controller.list);
  router.get("/business-units/:id", controller.getById);
  router.post(
    "/business-units",
    authorize(...MANAGE_ROLES),
    validateBody(createBusinessUnitBodySchema),
    controller.create,
  );
  router.patch(
    "/business-units/:id",
    authorize(...MANAGE_ROLES),
    validateBody(updateBusinessUnitBodySchema),
    controller.update,
  );

  return router;
}
