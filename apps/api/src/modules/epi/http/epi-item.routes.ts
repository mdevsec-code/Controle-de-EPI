import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { authorize } from "../../../shared/middlewares/authorize.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { EpiItemService } from "../application/epi-item.service.js";
import { PrismaEpiItemRepository } from "../infra/prisma-epi-item-repository.js";
import { EpiItemController } from "./epi-item.controller.js";
import { createEpiItemBodySchema, updateEpiItemBodySchema } from "./epi-item.schemas.js";

const MANAGE_ROLES = ["ADMINISTRADOR", "ALMOXARIFE", "TECNICO_SEGURANCA"] as const;

/**
 * @openapi
 * /epis:
 *   get:
 *     tags: [EPIs]
 *     summary: Lista EPIs cadastrados (opcionalmente filtrados por categoria)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de EPIs }
 *   post:
 *     tags: [EPIs]
 *     summary: Cadastra um novo EPI
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: EPI criado }
 *       409: { description: Codigo interno ja utilizado }
 * /epis/{id}:
 *   get:
 *     tags: [EPIs]
 *     summary: Busca um EPI por id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: EPI encontrado }
 *   patch:
 *     tags: [EPIs]
 *     summary: Atualiza dados de um EPI
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: EPI atualizado }
 */
export function createEpiItemRouter(): Router {
  const service = new EpiItemService(new PrismaEpiItemRepository());
  const controller = new EpiItemController(service);
  const router = Router();

  router.use(authenticate);

  router.get("/epis", controller.list);
  router.get("/epis/:id", controller.getById);
  router.post(
    "/epis",
    authorize(...MANAGE_ROLES),
    validateBody(createEpiItemBodySchema),
    controller.create,
  );
  router.patch(
    "/epis/:id",
    authorize(...MANAGE_ROLES),
    validateBody(updateEpiItemBodySchema),
    controller.update,
  );

  return router;
}
