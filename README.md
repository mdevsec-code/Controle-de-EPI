# EPI Manager

Sistema corporativo de gestão do ciclo de vida de Equipamentos de Proteção Individual (EPIs): cadastro, estoque, entregas, devoluções, assinaturas, QR Code, auditoria, dashboard e relatórios.

## Stack

- **apps/web** — painel administrativo (React 19, Vite, TypeScript, TailwindCSS, shadcn/ui)
- **apps/mobile-pwa** — fluxo de campo: scanner, entrega, assinatura digital (PWA offline-first)
- **apps/api** — API (Node, Express, TypeScript, Prisma, PostgreSQL)
- **packages/** — design system, tipos compartilhados, config, utils e hooks reutilizados entre os apps
- **database/** — schema Prisma, migrations, seeds e diagrama ER
- **docker/** — containers de desenvolvimento (API, Web, PostgreSQL)

## Status

Estrutura de monorepo (pnpm + Turborepo) inicializada. Os apps ainda não foram implementados — em construção módulo por módulo. Ver `docs/roadmap.md` (a criar) para a ordem de implementação.

## Legado

A pasta `legado/` contém o protótipo visual original (HTML estático da marca "EngeNova") e um scaffold React inicial, mantidos apenas como referência de UX para o módulo de Entrega de EPIs — não fazem parte do sistema em construção.

## Desenvolvimento

Requer Node ≥ 20 e pnpm (via `corepack enable`).

```bash
pnpm install
pnpm dev
```
