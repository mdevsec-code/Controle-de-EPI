import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { authorize } from "../../../shared/middlewares/authorize.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { JobRoleService } from "../application/job-role.service.js";
import { PrismaJobRoleRepository } from "../infra/prisma-job-role-repository.js";
import { JobRoleController } from "./job-role.controller.js";
import { createJobRoleBodySchema, updateJobRoleBodySchema } from "./job-role.schemas.js";

const MANAGE_ROLES = ["ADMINISTRADOR", "RH"] as const;

/**
 * @openapi
 * /job-roles:
 *   get:
 *     tags: [Cargos]
 *     summary: Lista cargos cadastrados
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de cargos }
 *   post:
 *     tags: [Cargos]
 *     summary: Cadastra um novo cargo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Cargo criado }
 *       409: { description: Nome de cargo ja utilizado }
 * /job-roles/{id}:
 *   get:
 *     tags: [Cargos]
 *     summary: Busca um cargo por id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cargo encontrado }
 *   patch:
 *     tags: [Cargos]
 *     summary: Atualiza um cargo
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cargo atualizado }
 */
export function createJobRoleRouter(): Router {
  const service = new JobRoleService(new PrismaJobRoleRepository());
  const controller = new JobRoleController(service);
  const router = Router();

  router.use(authenticate);

  router.get("/job-roles", controller.list);
  router.get("/job-roles/:id", controller.getById);
  router.post(
    "/job-roles",
    authorize(...MANAGE_ROLES),
    validateBody(createJobRoleBodySchema),
    controller.create,
  );
  router.patch(
    "/job-roles/:id",
    authorize(...MANAGE_ROLES),
    validateBody(updateJobRoleBodySchema),
    controller.update,
  );

  return router;
}
