import {
  createWarehouseRequestSchema,
  idParamSchema,
  updateWarehouseRequestSchema,
  type WarehouseDto,
} from "@epi-manager/contracts";
import { prisma } from "@epi-manager/database";
import { Router } from "express";
import { recordAudit } from "../../shared/audit.js";
import { conflict, notFound, unprocessable } from "../../shared/errors.js";
import { authenticate, authorize } from "../../shared/http/authenticate.js";
import { actor, authOf, handler } from "../../shared/http/handler.js";
import { warehouseFilter } from "../../shared/http/scope.js";

const include = { businessUnit: { select: { name: true } } } as const;

function toDto(w: {
  id: string;
  name: string;
  code: string;
  businessUnitId: string;
  businessUnit: { name: string };
}): WarehouseDto {
  return {
    id: w.id,
    name: w.name,
    code: w.code,
    businessUnitId: w.businessUnitId,
    businessUnitName: w.businessUnit.name,
  };
}

export function createWarehousesRouter(): Router {
  const router = Router();
  router.use("/warehouses", authenticate);

  /** ADMIN ve todos; ALMOXARIFADO so os vinculados. */
  router.get(
    "/warehouses",
    handler({}, async ({ req }) => {
      const warehouses = await prisma.warehouse.findMany({
        where: { id: warehouseFilter(authOf(req)) },
        include,
        orderBy: { name: "asc" },
      });
      return warehouses.map(toDto);
    }),
  );

  router.post(
    "/warehouses",
    authorize("ADMIN"),
    handler({ body: createWarehouseRequestSchema, status: 201 }, async ({ body, req }) => {
      if (!(await prisma.businessUnit.findUnique({ where: { id: body.businessUnitId } }))) {
        throw unprocessable("NAO_ENCONTRADO", "Unidade informada nao existe");
      }
      const key = { businessUnitId: body.businessUnitId, code: body.code };
      if (await prisma.warehouse.findUnique({ where: { businessUnitId_code: key } })) {
        throw conflict("Ja existe um almoxarifado com este codigo nesta unidade");
      }
      return prisma.$transaction(async (tx) => {
        const created = await tx.warehouse.create({ data: body, include });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "Warehouse",
            entityId: created.id,
            after: created,
          },
          tx,
        );
        return toDto(created);
      });
    }),
  );

  router.patch(
    "/warehouses/:id",
    authorize("ADMIN"),
    handler(
      { params: idParamSchema, body: updateWarehouseRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.warehouse.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("Almoxarifado nao encontrado");
        return prisma.$transaction(async (tx) => {
          const updated = await tx.warehouse.update({
            where: { id: params.id },
            data: body,
            include,
          });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "Warehouse",
              entityId: updated.id,
              before,
              after: updated,
            },
            tx,
          );
          return toDto(updated);
        });
      },
    ),
  );

  return router;
}
