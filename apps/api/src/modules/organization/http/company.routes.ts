import { Router } from "express";
import { authenticate } from "../../../shared/middlewares/authenticate.js";
import { authorize } from "../../../shared/middlewares/authorize.js";
import { validateBody } from "../../../shared/middlewares/validate.js";
import { CompanyService } from "../application/company.service.js";
import { PrismaCompanyRepository } from "../infra/prisma-company-repository.js";
import { CompanyController } from "./company.controller.js";
import { createCompanyBodySchema, updateCompanyBodySchema } from "./company.schemas.js";

const MANAGE_ROLES = ["ADMINISTRADOR"] as const;

/**
 * @openapi
 * /companies:
 *   get:
 *     tags: [Empresas]
 *     summary: Lista empresas cadastradas (paginado)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de empresas }
 *   post:
 *     tags: [Empresas]
 *     summary: Cadastra uma nova empresa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Empresa criada }
 *       409: { description: CNPJ ja cadastrado }
 * /companies/{id}:
 *   get:
 *     tags: [Empresas]
 *     summary: Busca uma empresa por id
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Empresa encontrada }
 *       404: { description: Empresa nao encontrada }
 *   patch:
 *     tags: [Empresas]
 *     summary: Atualiza dados cadastrais de uma empresa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Empresa atualizada }
 */
export function createCompanyRouter(): Router {
  const service = new CompanyService(new PrismaCompanyRepository());
  const controller = new CompanyController(service);
  const router = Router();

  router.use(authenticate);

  router.get("/companies", controller.list);
  router.get("/companies/:id", controller.getById);
  router.post(
    "/companies",
    authorize(...MANAGE_ROLES),
    validateBody(createCompanyBodySchema),
    controller.create,
  );
  router.patch(
    "/companies/:id",
    authorize(...MANAGE_ROLES),
    validateBody(updateCompanyBodySchema),
    controller.update,
  );

  return router;
}
