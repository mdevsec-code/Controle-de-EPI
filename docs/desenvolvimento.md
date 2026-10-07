# Desenvolvimento

Como preparar o ambiente, rodar, testar e estender o projeto.

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Primeira execução](#primeira-execução)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Rodando no dia a dia](#rodando-no-dia-a-dia)
- [Monorepo e pacotes](#monorepo-e-pacotes)
- [Testes](#testes)
- [Convenções de código](#convenções-de-código)
- [Receitas](#receitas)
- [Solução de problemas](#solução-de-problemas)

## Pré-requisitos

| Ferramenta | Versão                     | Observação                                               |
| ---------- | -------------------------- | -------------------------------------------------------- |
| Node.js    | ≥ 20 (CI usa 22)           |                                                          |
| pnpm       | 9.15 (`packageManager`)    | `corepack enable` instala a versão certa                 |
| PostgreSQL | 16                         | Docker (`pnpm docker:up`) ou instalação local            |
| Git        | qualquer recente           | Hooks do Husky são instalados no `pnpm install`          |
| Navegador  | Chrome/Edge/Firefox/Safari | Para o leitor de QR, a câmera exige `localhost` ou HTTPS |

## Primeira execução

```bash
git clone https://github.com/mdevsec-code/Controle-de-EPI.git
cd Controle-de-EPI
corepack enable
pnpm install

cp .env.example .env
cp apps/api/.env.example apps/api/.env
# gere um segredo e cole em JWT_SECRET (apps/api/.env):
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

pnpm docker:up       # PostgreSQL 16 com os bancos epi_manager e epi_manager_test
pnpm db:generate     # Prisma Client
pnpm db:deploy       # migrations
pnpm db:seed         # dados de exemplo
pnpm dev
```

- Web: http://localhost:5173 (o Vite repassa `/api` para a API).
- API: http://localhost:3333/api (`GET /api/health` → `{ "status": "ok" }`).
- Usuários do seed: veja o [README](../README.md#começando-desenvolvimento-local).

**Sem Docker:** instale o PostgreSQL 16, crie os bancos `epi_manager` e `epi_manager_test` (de
preferência com `LC_COLLATE 'pt_BR.UTF-8'`) e ajuste `DATABASE_URL`/`TEST_DATABASE_URL` no `.env` e
`DATABASE_URL` em `apps/api/.env`.

## Variáveis de ambiente

Arquivo `.env` na **raiz** (usado pelo Prisma CLI, seed e testes de integração):

| Variável              | Obrigatória               | Descrição                                                                |
| --------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`        | sim                       | Banco de desenvolvimento                                                 |
| `TEST_DATABASE_URL`   | para testes de integração | Banco **descartável**: as tabelas são truncadas a cada teste             |
| `SEED_ADMIN_PASSWORD` | para o seed               | Senha inicial do ADMIN (≥ 10 caracteres; troca obrigatória no 1º acesso) |
| `SEED_ALMOX_PASSWORD` | para o seed               | Senha inicial do almoxarife (≥ 10 caracteres)                            |

Arquivo `apps/api/.env` (validado na inicialização com Zod; a API não sobe com valor inválido):

| Variável       | Padrão        | Descrição                                                                                      |
| -------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `NODE_ENV`     | `development` | `production` liga cookie `Secure`, recusa `JWT_SECRET` de exemplo e bloqueia o seed            |
| `PORT`         | `3333`        | Porta HTTP                                                                                     |
| `DATABASE_URL` | —             | Conexão PostgreSQL                                                                             |
| `JWT_SECRET`   | —             | ≥ 32 caracteres aleatórios. Valores começando com `troque-` são recusados em produção          |
| `TRUST_PROXY`  | `0`           | Quantos proxies reversos confiáveis ficam à frente (IP real para rate limit e auditoria)       |
| `CORS_ORIGIN`  | vazio         | Só se web e API ficarem em origens diferentes **sem** proxy (o padrão é mesmo site via `/api`) |

Web (tempo de build/dev):

| Variável           | Padrão                  | Descrição                                       |
| ------------------ | ----------------------- | ----------------------------------------------- |
| `API_PROXY_TARGET` | `http://localhost:3333` | Destino do proxy `/api` no `vite dev`/`preview` |

Nenhum `.env` vai para o Git (veja `.gitignore`); só os `.env.example`.

## Rodando no dia a dia

| Comando                                  | Uso                                                                |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                               | Sobe tudo: contracts em _watch_, API com `tsx watch`, web com Vite |
| `pnpm --filter @epi-manager/api dev`     | Só a API                                                           |
| `pnpm --filter @epi-manager/web dev`     | Só o web                                                           |
| `pnpm --filter @epi-manager/web preview` | Serve o build de produção do web (porta 4173) com o proxy `/api`   |
| `pnpm db:studio`                         | Navegar nos dados com o Prisma Studio                              |

Para abrir no celular durante o desenvolvimento, rode o Vite com `--host` e acesse pelo IP da
máquina. A câmera do leitor de QR só funciona em `localhost` ou HTTPS; para testar no aparelho, use
um túnel HTTPS ou um certificado local.

## Monorepo e pacotes

pnpm workspaces + Turborepo. Cada pacote compila para `dist/` e os apps dependem dos pacotes pelo
nome (`workspace:*`). O Turbo garante a ordem: `contracts` → `database` → `api`/`web`.

| Pacote               | Papel                                                                  | Ao alterar                                                                       |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/contracts` | Schemas Zod de request, DTOs, enums, códigos de erro, regras (limites) | `pnpm dev` recompila sozinho; senão `pnpm --filter @epi-manager/contracts build` |
| `packages/database`  | Prisma Client singleton e seed                                         | Depois de `pnpm db:generate`, rode `pnpm --filter @epi-manager/database build`   |
| `packages/config`    | ESLint e tsconfig base                                                 | —                                                                                |
| `apps/api`           | API REST                                                               | `tsx watch` recarrega                                                            |
| `apps/web`           | SPA                                                                    | HMR do Vite                                                                      |

Organização interna resumida (detalhes em [ARCHITECTURE.md](../ARCHITECTURE.md)):

```
apps/api/src/
  app.ts, main.ts          montagem do Express e inicialização
  modules/<recurso>/       rotas (*.routes.ts) e, quando há regra, application/ domain/ infra/
  shared/                  audit, errors, env, format, logger, http/ (authenticate, scope, handler, rate limit)
apps/web/src/
  app/                     App, router (lazy), layouts, guardas
  components/ui            design system  ·  components/motion  animações
  features/<área>/         páginas, hooks de API (api.ts) e componentes da área
  lib/                     api-client, errors, format, labels, motion, epi-icons, use-media-query
```

## Testes

| Comando                                           | O que roda                                                                                    |     Precisa de banco      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- | :-----------------------: |
| `pnpm test`                                       | Unitários da API, contratos e testes de componentes do web (Vitest + Testing Library + jsdom) |            não            |
| `pnpm --filter @epi-manager/api test:integration` | API real (Supertest) contra PostgreSQL; aplica as migrations antes                            | sim (`TEST_DATABASE_URL`) |
| `pnpm --filter @epi-manager/web test -- --watch`  | Web em modo _watch_                                                                           |            não            |

Os testes de integração rodam **um arquivo por vez** (compartilham o banco) e truncam as tabelas a
cada teste; use um banco que possa ser apagado. As _fixtures_ em
`apps/api/test/integration/fixtures.ts` criam um cenário completo (empresa → unidade → almoxarifado →
colaborador → EPI com CA → item de estoque → usuário) com uma chamada: `createScenario()`.

O que vale testar ao mexer em cada parte:

- **Regra de negócio na API:** teste de integração (status HTTP, código de erro, efeito no banco e
  auditoria). Ex.: `apps/api/test/integration/stock.int.spec.ts`.
- **Lógica pura** (domínio, agrupamentos, formatação): teste unitário ao lado do arquivo
  (`*.spec.ts` na API, `*.test.ts` no web).
- **Telas:** Testing Library pelo papel acessível (`getByRole`), como em
  `features/deliveries/flow/reason-page.test.tsx`.

## Convenções de código

- **TypeScript estrito**, sem `any` e sem desligar regras de lint/TS para "resolver" erro.
- **Contratos primeiro:** toda entrada da API é validada com o schema do `contracts`; o web usa os
  mesmos tipos. Não duplique regra (ex.: limite de quantidade) entre API e web: exporte do
  `contracts`.
- **Autorização no backend:** `authorize(...)` na rota + escopo (`assertWarehouseAccess`,
  `warehouseFilter`) no caso de uso. Esconder botão no web não é proteção.
- **Transação + auditoria juntas:** operações que mudam várias tabelas usam `prisma.$transaction`
  e gravam `recordAudit(..., tx)` dentro dela.
- **Erros:** lance `AppError` com um `code` de `ERROR_CODES`; o web traduz pelo código
  (`lib/errors.ts`).
- **Saldo de estoque** só muda pelo `stock-ledger` (nunca `update` direto de `quantity`).
- **Web:** server state no TanStack Query (hooks em `features/<área>/api.ts`), sessão e rascunho da
  entrega no Zustand, estado de tela em `useState`. Estados de carregando, vazio, erro e sucesso em
  toda tela.
- **UI:** use os componentes de `components/ui` e os tokens de `styles/globals.css`; animações curtas
  com os presets de `lib/motion.ts` (veja [interface.md](interface.md)).
- **Acessibilidade:** rótulo em todo campo (`Field`), `aria-label` em botões só com ícone, alvos de
  toque ≥ 44 px; o lint `jsx-a11y` bloqueia o commit em caso de violação.
- **Formatação:** Prettier (`pnpm format`). Comentários e textos de interface em português;
  identificadores em inglês.
- **Commits:** Conventional Commits (`feat(web): …`, `fix(api): …`, `docs: …`), validados pelo
  commitlint. Veja [CONTRIBUTING.md](../CONTRIBUTING.md).

## Receitas

### Adicionar um campo a uma entidade

1. `database/prisma/schema.prisma` → `pnpm db:migrate --name add_campo` (revise o SQL gerado).
2. `pnpm db:generate && pnpm --filter @epi-manager/database build`.
3. `packages/contracts`: acrescente o campo ao DTO e, se for editável, ao schema de request.
4. API: inclua o campo no `select`/`include` e no mapeamento para DTO; trate auditoria se for
   alteração relevante.
5. Web: hook de API, formulário/tela. Atualize _fixtures_ de teste que montam o DTO.
6. Teste de integração cobrindo o comportamento. Rode `pnpm lint typecheck test` e a integração.

Exemplo real: o local de armazenamento do estoque (migration `20261007000000_stock_location`,
`PATCH /stock/items/:id/location`, `features/stock/stock-location.tsx` e os testes em
`stock.int.spec.ts`).

### Criar uma rota

```ts
router.patch(
  "/recurso/:id",
  authorize("ADMIN"), // perfis
  handler({ params: idParamSchema, body: updateRecursoSchema }, async ({ params, body, req }) => {
    const auth = authOf(req);
    // 1) carregar e checar escopo  2) transação com regra + recordAudit(..., tx)  3) devolver DTO
  }),
);
```

`handler` valida `params`/`query`/`body` com Zod e entrega os tipos inferidos; erros de validação
viram `422 VALIDACAO` com os campos em `details`.

### Criar uma tela

1. Componente em `features/<área>/<nome>-page.tsx`, registrado em `app/router.tsx` com `lazy`.
2. Dados com um hook em `features/<área>/api.ts` (TanStack Query; invalide as chaves afetadas nas
   mutações).
3. Layout com `PageHeader`, `Card` e estados `SkeletonList` / `EmptyState` / `ErrorState`.
4. Verifique em 360 px, 390 px, 768 px e 1440 px.

## Solução de problemas

| Sintoma                                                       | Causa provável / solução                                                                                 |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| API não sobe: erro de validação de ambiente                   | `apps/api/.env` ausente ou `JWT_SECRET` curto; confira a mensagem no terminal                            |
| `Cannot find module '@epi-manager/contracts'` / tipos antigos | Pacote sem build: `pnpm --filter @epi-manager/contracts build` (ou rode `pnpm dev`)                      |
| Erro do Prisma sobre coluna inexistente                       | Migration pendente (`pnpm db:deploy`) ou client desatualizado (`pnpm db:generate` + build do `database`) |
| Teste de integração reclama de `TEST_DATABASE_URL`            | Defina a variável apontando para um banco descartável                                                    |
| Login responde 429                                            | Limite por IP atingido em testes repetidos; reinicie a API (o contador fica em memória)                  |
| Conta bloqueada no desenvolvimento                            | Espere 15 min ou redefina a senha como ADMIN                                                             |
| Câmera não abre no celular                                    | O navegador só libera câmera em HTTPS ou `localhost`                                                     |
| `vite build` falha com `EPERM` no Windows                     | Um `vite preview` está usando `apps/web/dist`; encerre-o (porta 4173) e rode de novo                     |
| Commit bloqueado                                              | O hook roda `pnpm lint` e o commitlint; corrija o lint ou a mensagem (`tipo(escopo): descrição`)         |
| Porta 5432/3333/5173 ocupada                                  | Outro serviço usando a porta; altere `PORT`, a porta do Docker ou finalize o processo                    |
