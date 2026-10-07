import {
  createUserRequestSchema,
  idParamSchema,
  pageQuerySchema,
  resetPasswordRequestSchema,
  updateUserRequestSchema,
  type UserDto,
} from "@epi-manager/contracts";
import { prisma, type Prisma, type Tx } from "@epi-manager/database";
import { Router } from "express";
import { recordAudit } from "../../shared/audit.js";
import { conflict, notFound, unprocessable } from "../../shared/errors.js";
import { iso, isoOrNull, pageArgs, toPage } from "../../shared/format.js";
import { authenticate, authorize } from "../../shared/http/authenticate.js";
import { actor, authOf, handler } from "../../shared/http/handler.js";
import { bcryptPasswordHasher } from "../../shared/security/password-hasher.js";

const select = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  mustChangePassword: true,
  lockedUntil: true,
  lastLoginAt: true,
  createdAt: true,
  warehouses: { select: { warehouse: { select: { id: true, name: true } } } },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof select }>;

function toDto(u: UserRow): UserDto {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    mustChangePassword: u.mustChangePassword,
    lockedUntil: isoOrNull(u.lockedUntil),
    lastLoginAt: isoOrNull(u.lastLoginAt),
    warehouses: u.warehouses.map((link) => link.warehouse),
    createdAt: iso(u.createdAt),
  };
}

/** Snapshot para auditoria: nunca inclui hash de senha. */
function auditSnapshot(u: UserRow) {
  return { ...toDto(u), warehouses: u.warehouses.map((link) => link.warehouse.id) };
}

async function assertWarehousesExist(tx: Tx, warehouseIds: string[]) {
  const found = await tx.warehouse.count({ where: { id: { in: warehouseIds } } });
  if (found !== new Set(warehouseIds).size) {
    throw unprocessable("NAO_ENCONTRADO", "Algum almoxarifado informado nao existe");
  }
}

/** Gestao de usuarios do sistema (exclusiva do ADMIN). */
export function createUsersRouter(): Router {
  const router = Router();
  router.use("/users", authenticate, authorize("ADMIN"));

  router.get(
    "/users",
    handler({ query: pageQuerySchema }, async ({ query }) => {
      const [items, total] = await Promise.all([
        prisma.user.findMany({ select, ...pageArgs(query), orderBy: { name: "asc" } }),
        prisma.user.count(),
      ]);
      return toPage(items.map(toDto), total, query);
    }),
  );

  router.post(
    "/users",
    handler({ body: createUserRequestSchema, status: 201 }, async ({ body, req }) => {
      if (await prisma.user.findUnique({ where: { email: body.email } })) {
        throw conflict("Ja existe um usuario com este e-mail");
      }
      const passwordHash = await bcryptPasswordHasher.hash(body.password);
      return prisma.$transaction(async (tx) => {
        await assertWarehousesExist(tx, body.warehouseIds);
        const created = await tx.user.create({
          data: {
            name: body.name,
            email: body.email,
            role: body.role,
            passwordHash,
            // Senha definida pelo ADMIN e provisoria: o usuario troca no primeiro acesso.
            mustChangePassword: true,
            warehouses: { create: body.warehouseIds.map((warehouseId) => ({ warehouseId })) },
          },
          select,
        });
        await recordAudit(
          {
            ...actor(req),
            action: "CRIAR",
            entity: "User",
            entityId: created.id,
            after: auditSnapshot(created),
          },
          tx,
        );
        return toDto(created);
      });
    }),
  );

  router.patch(
    "/users/:id",
    handler(
      { params: idParamSchema, body: updateUserRequestSchema },
      async ({ params, body, req }) => {
        const before = await prisma.user.findUnique({ where: { id: params.id }, select });
        if (!before) throw notFound("Usuario nao encontrado");

        const isSelf = params.id === authOf(req).userId;
        if (isSelf && (body.active === false || (body.role && body.role !== "ADMIN"))) {
          throw unprocessable(
            "VALIDACAO",
            "Voce nao pode desativar nem rebaixar o proprio usuario",
          );
        }

        const permissionsChanged =
          (body.role !== undefined && body.role !== before.role) ||
          (body.active !== undefined && body.active !== before.active) ||
          body.warehouseIds !== undefined;

        return prisma.$transaction(async (tx) => {
          if (body.warehouseIds) {
            await assertWarehousesExist(tx, body.warehouseIds);
            await tx.userWarehouse.deleteMany({ where: { userId: params.id } });
            await tx.userWarehouse.createMany({
              data: body.warehouseIds.map((warehouseId) => ({ userId: params.id, warehouseId })),
            });
          }
          const updated = await tx.user.update({
            where: { id: params.id },
            data: {
              name: body.name,
              role: body.role,
              active: body.active,
              // Mudou perfil/ativo/escopo: access tokens emitidos deixam de valer imediatamente.
              ...(permissionsChanged ? { tokenVersion: { increment: 1 } } : {}),
            },
            select,
          });
          if (body.active === false) {
            await tx.refreshToken.updateMany({
              where: { userId: params.id, revokedAt: null },
              data: { revokedAt: new Date() },
            });
          }
          await recordAudit(
            {
              ...actor(req),
              action: permissionsChanged ? "ALTERAR_PERMISSOES" : "ATUALIZAR",
              entity: "User",
              entityId: params.id,
              before: auditSnapshot(before),
              after: auditSnapshot(updated),
            },
            tx,
          );
          return toDto(updated);
        });
      },
    ),
  );

  router.post(
    "/users/:id/reset-password",
    handler(
      { params: idParamSchema, body: resetPasswordRequestSchema, status: 204 },
      async ({ params, body, req }) => {
        if (!(await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } }))) {
          throw notFound("Usuario nao encontrado");
        }
        const passwordHash = await bcryptPasswordHasher.hash(body.password);
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: params.id },
            data: {
              passwordHash,
              mustChangePassword: true,
              failedLoginCount: 0,
              lockedUntil: null,
              tokenVersion: { increment: 1 },
            },
          });
          await tx.refreshToken.updateMany({
            where: { userId: params.id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          await recordAudit(
            { ...actor(req), action: "SENHA_REDEFINIDA", entity: "User", entityId: params.id },
            tx,
          );
        });
      },
    ),
  );

  return router;
}
