import {
  createCaRequestSchema,
  createEpiCategoryRequestSchema,
  createEpiRequestSchema,
  idParamSchema,
  listEpisQuerySchema,
  updateEpiRequestSchema,
  type CaDto,
  type EpiCategoryDto,
  type EpiDto,
} from "@epi-manager/contracts";
import { prisma, type EpiCA, type Prisma } from "@epi-manager/database";
import { Router } from "express";
import { z } from "zod";
import { recordAudit } from "../../shared/audit.js";
import { conflict, notFound, unprocessable } from "../../shared/errors.js";
import { iso, isoOrNull, pageArgs, toPage } from "../../shared/format.js";
import { authenticate, authorize } from "../../shared/http/authenticate.js";
import { actor, handler } from "../../shared/http/handler.js";
import { caStatus, currentCa } from "./domain/ca.js";

const epiInclude = {
  category: { select: { name: true } },
  cas: { where: { cancelledAt: null }, orderBy: { expiresAt: "desc" } },
} satisfies Prisma.EpiItemInclude;

type EpiRow = Prisma.EpiItemGetPayload<{ include: typeof epiInclude }>;

function toEpiDto(e: EpiRow, now = new Date()): EpiDto {
  const ca = currentCa(e.cas, now);
  return {
    id: e.id,
    name: e.name,
    internalCode: e.internalCode,
    barcode: e.barcode,
    categoryId: e.categoryId,
    categoryName: e.category.name,
    manufacturer: e.manufacturer,
    model: e.model,
    photoUrl: e.photoUrl,
    manualUrl: e.manualUrl,
    minQuantity: e.minQuantity,
    unitPriceCents: e.unitPriceCents,
    usefulLifeDays: e.usefulLifeDays,
    active: e.active,
    currentCa: ca ? { number: ca.number, expiresAt: iso(ca.expiresAt) } : null,
  };
}

function toCaDto(ca: EpiCA, now = new Date()): CaDto {
  return {
    id: ca.id,
    number: ca.number,
    issuedAt: iso(ca.issuedAt),
    expiresAt: iso(ca.expiresAt),
    cancelledAt: isoOrNull(ca.cancelledAt),
    status: caStatus(ca, now),
  };
}

const MANAGE = ["ADMIN", "ALMOXARIFADO"] as const;
const caParamsSchema = z.object({ id: z.uuid(), caId: z.uuid() });

/** Catalogo de EPIs: leitura e manutencao por ADMIN e ALMOXARIFADO (catalogo e global). */
export function createEpisRouter(): Router {
  const router = Router();
  router.use(["/epis", "/epi-categories"], authenticate, authorize(...MANAGE));

  // --- Categorias ------------------------------------------------------------
  router.get(
    "/epi-categories",
    handler({}, async (): Promise<EpiCategoryDto[]> =>
      prisma.epiCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ),
  );

  router.post(
    "/epi-categories",
    handler(
      { body: createEpiCategoryRequestSchema, status: 201 },
      async ({ body, req }): Promise<EpiCategoryDto> => {
        if (await prisma.epiCategory.findUnique({ where: { name: body.name } })) {
          throw conflict("Ja existe uma categoria com este nome");
        }
        return prisma.$transaction(async (tx) => {
          const created = await tx.epiCategory.create({
            data: body,
            select: { id: true, name: true },
          });
          await recordAudit(
            {
              ...actor(req),
              action: "CRIAR",
              entity: "EpiCategory",
              entityId: created.id,
              after: created,
            },
            tx,
          );
          return created;
        });
      },
    ),
  );

  // --- EPIs ------------------------------------------------------------------
  router.get(
    "/epis",
    handler({ query: listEpisQuerySchema }, async ({ query }) => {
      const where: Prisma.EpiItemWhereInput = {
        categoryId: query.categoryId,
        active: query.active,
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { internalCode: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      };
      const [items, total] = await Promise.all([
        prisma.epiItem.findMany({
          where,
          include: epiInclude,
          ...pageArgs(query),
          orderBy: { name: "asc" },
        }),
        prisma.epiItem.count({ where }),
      ]);
      const now = new Date();
      return toPage(
        items.map((e) => toEpiDto(e, now)),
        total,
        query,
      );
    }),
  );

  router.get(
    "/epis/:id",
    handler({ params: idParamSchema }, async ({ params }) => {
      const epi = await prisma.epiItem.findUnique({
        where: { id: params.id },
        include: epiInclude,
      });
      if (!epi) throw notFound("EPI nao encontrado");
      return toEpiDto(epi);
    }),
  );

  router.post(
    "/epis",
    handler({ body: createEpiRequestSchema, status: 201 }, async ({ body, req }) => {
      if (!(await prisma.epiCategory.findUnique({ where: { id: body.categoryId } }))) {
        throw unprocessable("VALIDACAO", "Categoria informada nao existe");
      }
      if (await prisma.epiItem.findUnique({ where: { internalCode: body.internalCode } })) {
        throw conflict("Ja existe um EPI com este codigo interno");
      }
      return prisma.$transaction(async (tx) => {
        const created = await tx.epiItem.create({ data: body, include: epiInclude });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "EpiItem",
            entityId: created.id,
            after: created,
          },
          tx,
        );
        return toEpiDto(created);
      });
    }),
  );

  router.patch(
    "/epis/:id",
    handler(
      { params: idParamSchema, body: updateEpiRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.epiItem.findUnique({ where: { id: params.id } });
        if (!before) throw notFound("EPI nao encontrado");
        if (
          body.categoryId &&
          !(await prisma.epiCategory.findUnique({ where: { id: body.categoryId } }))
        ) {
          throw unprocessable("VALIDACAO", "Categoria informada nao existe");
        }
        return prisma.$transaction(async (tx) => {
          const updated = await tx.epiItem.update({
            where: { id: params.id },
            data: body,
            include: epiInclude,
          });
          await recordAudit(
            {
              ...actor(req),
              action: "ATUALIZAR",
              entity: "EpiItem",
              entityId: params.id,
              before,
              after: updated,
            },
            tx,
          );
          return toEpiDto(updated);
        });
      },
    ),
  );

  // --- CAs -------------------------------------------------------------------
  router.get(
    "/epis/:id/cas",
    handler({ params: idParamSchema }, async ({ params }) => {
      if (!(await prisma.epiItem.findUnique({ where: { id: params.id }, select: { id: true } }))) {
        throw notFound("EPI nao encontrado");
      }
      const cas = await prisma.epiCA.findMany({
        where: { epiItemId: params.id },
        orderBy: { issuedAt: "desc" },
      });
      const now = new Date();
      return cas.map((ca) => toCaDto(ca, now));
    }),
  );

  router.post(
    "/epis/:id/cas",
    handler(
      { params: idParamSchema, body: createCaRequestSchema, status: 201 },
      async ({ params, body, req }) => {
        if (
          !(await prisma.epiItem.findUnique({ where: { id: params.id }, select: { id: true } }))
        ) {
          throw notFound("EPI nao encontrado");
        }
        return prisma.$transaction(async (tx) => {
          const created = await tx.epiCA.create({ data: { ...body, epiItemId: params.id } });
          await recordAudit(
            {
              ...actor(req),
              action: "CRIAR",
              entity: "EpiCA",
              entityId: created.id,
              after: created,
            },
            tx,
          );
          return toCaDto(created);
        });
      },
    ),
  );

  router.post(
    "/epis/:id/cas/:caId/cancel",
    handler({ params: caParamsSchema }, async ({ params, req }) => {
      const ca = await prisma.epiCA.findUnique({ where: { id: params.caId } });
      if (!ca || ca.epiItemId !== params.id) throw notFound("CA nao encontrado");
      if (ca.cancelledAt) return toCaDto(ca);
      return prisma.$transaction(async (tx) => {
        const updated = await tx.epiCA.update({
          where: { id: ca.id },
          data: { cancelledAt: new Date() },
        });
        await recordAudit(
          {
            ...actor(req),
            action: "CANCELAR_CA",
            entity: "EpiCA",
            entityId: ca.id,
            before: ca,
            after: updated,
          },
          tx,
        );
        return toCaDto(updated);
      });
    }),
  );

  return router;
}
