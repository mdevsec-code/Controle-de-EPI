import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { authorize } from "../../../shared/middlewares/authorize.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { EpiCaService } from "../application/epi-ca.service.js";
import { PrismaEpiCaRepository } from "../infra/prisma-epi-ca-repository.js";
import { PrismaEpiItemRepository } from "../infra/prisma-epi-item-repository.js";
import { EpiCaController } from "./epi-ca.controller.js";
import { createEpiCaBodySchema } from "./epi-ca.schemas.js";

const MANAGE_ROLES = ["ADMINISTRADOR", "ALMOXARIFE", "TECNICO_SEGURANCA"] as const;

/**
 * @openapi
 * /epis/{epiItemId}/cas:
 *   get:
 *     tags: [EPIs]
 *     summary: Historico de Certificados de Aprovacao (CA) de um EPI
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Historico de CAs }
 *   post:
 *     tags: [EPIs]
 *     summary: Registra um novo Certificado de Aprovacao para o EPI
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: CA registrado }
 *       404: { description: EPI informado nao existe }
 *       422: { description: Data de validade invalida }
 */
export function createEpiCaRouter(): Router {
  const service = new EpiCaService(new PrismaEpiCaRepository(), new PrismaEpiItemRepository());
  const controller = new EpiCaController(service);
  const router = Router();

  router.use(authenticate);

  router.get("/epis/:epiItemId/cas", controller.history);
  router.post(
    "/epis/:epiItemId/cas",
    authorize(...MANAGE_ROLES),
    validateBody(createEpiCaBodySchema),
    controller.register,
  );

  return router;
}
