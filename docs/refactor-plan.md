# Plano de refatoração (Fase 2)

Base: [AUDIT.md](../AUDIT.md). Decisões em AUDIT §14.1. Este documento lista **o que muda, em que ordem e por quê**; a arquitetura-alvo está em [ARCHITECTURE.md](../ARCHITECTURE.md).

## Defaults adotados para as perguntas em aberto (AUDIT §14.2)

São reversíveis com baixo custo; mudar qualquer um exige apenas ajuste localizado.

| Pergunta                | Default                                                                                                                                                                                                          | Por quê                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Tamanho/lote no estoque | `StockItem` tem `size` e `batchNumber` **opcionais** (string vazia = "sem grade"/"sem lote"). Vários almoxarifados por unidade são suportados pelo modelo; a UI mostra seletor só se o usuário tiver mais de um. | Atende EPIs com e sem grade sem tabela extra.                 |
| Topologia de deploy     | **Mesmo site**: web serve a SPA e faz proxy de `/api` para a API (Vite proxy em dev, reverse proxy em produção). `TRUST_PROXY` configurável.                                                                     | Cookie de refresh continua `SameSite=Strict`, sem token CSRF. |
| Login                   | **E-mail** (como a API já faz).                                                                                                                                                                                  | Evita mudança de contrato; o campo é rotulado "E-mail".       |

## Ordem de execução

Cada etapa termina com `lint` + `typecheck` + `test` + `build` verdes.

### Etapa 1 — Banco (C-02, C-03, C-04, A-09, A-11)

Schema revisado e **migration inicial versionada** (gerada por `prisma migrate diff --from-empty`), incluindo SQL manual para `CHECK (quantity >= 0)`.

| ATUAL → problema                                                                                        | NOVO → solução                                                                                                                                                                                                  | IMPACTO                                         |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 7 perfis sem uso real                                                                                   | `ADMIN`, `ALMOXARIFADO`                                                                                                                                                                                         | Rotas reescritas com a nova matriz              |
| `User` sem nome nem vínculo com almoxarifado                                                            | `name`, `tokenVersion`, `failedLoginCount`, `lockedUntil`, `mustChangePassword`; N–N `UserWarehouse`                                                                                                            | Escopo de dados por almoxarifado                |
| `RefreshToken.tokenHash` sem índice                                                                     | `@unique`                                                                                                                                                                                                       | Rotação atômica                                 |
| `Employee.companyId` sem FK e `deletedAt` conflitando com CPF único                                     | Removidos; empresa derivada da unidade; desligado = status `DESLIGADO`                                                                                                                                          | API de colaborador deixa de receber `companyId` |
| Sem identificador de crachá                                                                             | `Employee.badgeCode` aleatório, único, reemitível                                                                                                                                                               | QR passa a conter só esse código                |
| `EpiItem.category` texto livre; `controlType` sem comportamento                                         | `EpiCategory`; `controlType` removido                                                                                                                                                                           | Cadastro de EPI usa `categoryId`                |
| `EpiCA.situation` gravada (fica desatualizada)                                                          | `cancelledAt`; validade derivada de `expiresAt`                                                                                                                                                                 | —                                               |
| `StockItem.quantity` sem proteção; `assetTag` sem uso                                                   | `CHECK >= 0`, `size`, `batchNumber`, unique `(warehouse, epi, size, batch)`                                                                                                                                     | —                                               |
| Movimentação sem saldo e com tipos incompletos                                                          | `delta`, `balanceBefore`, `balanceAfter`, tipos `ENTRADA, SAIDA, ENTREGA, DEVOLUCAO, AJUSTE, PERDA, AVARIA`, vínculo com item de entrega / devolução                                                            | Histórico explica cada saldo                    |
| `Delivery` sem status/motivo/observação/idempotência; assinatura como URL solta; lat/long sem requisito | `number` sequencial, `status`, `reason` (enum dos 8 motivos do legado) + `reasonDetail`, `notes`, `warehouseId`, `idempotencyKey`; `DeliverySignature` (PNG + SHA-256 + `signedAt` + IP/UA); lat/long removidos | Comprovante e evidência NR-6                    |
| `DeliveryItem` sem CA/tamanho                                                                           | Snapshots `epiName`, `caNumber`; `size`, `batchNumber`, `notes`                                                                                                                                                 | —                                               |
| `EpiReturn` 1:1 e FK solta                                                                              | 1:N com `quantity`, `receivedBy`, `stockItem`                                                                                                                                                                   | Devolução parcial                               |
| `Training` sem requisito/uso                                                                            | Removido (volta quando houver módulo de treinamentos)                                                                                                                                                           | Nenhum (sem dados)                              |

### Etapa 2 — Contratos e fundações da API (M-03, M-04, M-06, A-08, M-05)

- `packages/contracts` (substitui `packages/types`): enums, schemas Zod de request/response, códigos de erro, regras numéricas compartilhadas (ex.: `MAX_ITEM_QUANTITY = 50`). Compilado para `dist`.
- `packages/database` compilado para `dist` (fim da dependência de type stripping).
- Erro estruturado `{ error: { code, message, details? } }`; mapeamento de erros Prisma.
- Helper de rota que valida `params/query/body` e entrega tipos inferidos (fim do `any` implícito).
- `/docs` só fora de produção.

### Etapa 3 — Segurança de autenticação + auditoria (A-04, A-05, A-07, A-10, M-09, M-14, B-12)

Rotação atômica com detecção de reuso; payload JWT validado (alg/iss/aud) e `tokenVersion` checado; bloqueio progressivo por conta + rate limit por IP com `trust proxy`; comparação com hash fictício; e-mail normalizado; seed bloqueado em produção; `AuditService` gravando na mesma transação.

### Etapa 4 — Domínio: colaboradores, EPIs, estoque, entregas (C-01, C-03, C-04, A-03, A-06)

- Colaboradores: busca por nome/matrícula, `GET /employees/by-badge/:code`, projeção sem CPF para almoxarifado, escopo por unidade dos almoxarifados do usuário, máquina de estados de status.
- EPIs: categorias; CA vigente.
- Estoque: saldos, entrada, ajuste, perda/avaria, histórico de movimentações.
- Entregas: `POST /deliveries` transacional (baixa condicional de estoque, snapshots, assinatura, auditoria, idempotência); listagem com filtros de período; detalhe; comprovante; devolução.
- Usuários (ADMIN): CRUD mínimo e reset de senha.
- Dashboard: resumo do dia.

### Etapa 5 — Frontend (A-01, A-02, A-12, M-01, M-02, M-10, M-13, B-03, B-04)

Identidade ENGENOVA; sessão (token em memória + refresh), guardas por perfil; camada de API tipada; fluxo de entrega integrado com estados `idle/loading/success/error/empty`; comportamentos do legado recuperados; lazy routes; acessibilidade; acentuação.

### Etapa 6 — Testes, CI, limpeza e documentação

Testes de integração (Postgres real) para estoque/concorrência/autorização; testes de componentes do fluxo; CI completo; remoção de dependências/pacotes mortos e enxugamento de `legado/`; README, ARCHITECTURE.md, SECURITY.md.

## Fora do escopo desta refatoração

Login do colaborador, PWA/offline, relatórios analíticos, gestão de treinamentos, telas de cadastro organizacional (empresas/unidades/setores/cargos continuam via API + seed).

## Registro de execução (2026-10-06)

Todas as etapas foram executadas. Situação por achado: [AUDIT.md §16](../AUDIT.md).

### Mudanças de comportamento e contrato

| ATUAL → problema                                                 | NOVO → solução                                                            | IMPACTO → compatibilidade                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Rotas da API na raiz (`/auth/login`)                             | Todas sob `/api`                                                          | Web e proxy usam `/api`; cookie com `Path=/api/auth`                       |
| Erros `{ message }`                                              | `{ error: { code, message, details } }`                                   | Clientes traduzem por `code`                                               |
| Bloquear/desbloquear/desligar em 3 rotas                         | `PATCH /employees/:id/status` com máquina de estados                      | Transições inválidas → 422 `TRANSICAO_INVALIDA`                            |
| `swagger-jsdoc` em `/docs` (vazio no build, público em produção) | Removido; rotas documentadas no README                                    | OpenAPI gerado do Zod é próximo passo                                      |
| EPI "Outro (especificar)" no protótipo                           | Removido: todo EPI entregue precisa estar cadastrado (CA + estoque, NR-6) | Cadastrar o EPI antes de entregar                                          |
| Quantidade EPI a EPI (legado)                                    | Todas as quantidades numa tela                                            | Menos toques; mesmos limites (1–50 e saldo)                                |
| Rate limit único para login e refresh                            | Limitadores separados                                                     | Recarregar páginas não consome tentativas de senha (bug revelado pelo e2e) |
| Assinatura em `signatureUrl`                                     | Imagem no banco (`delivery_signatures`) + hash                            | Sem infraestrutura de arquivos; servida por rota autenticada               |

### Verificação executada

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format:check`.
- Integração da API contra PostgreSQL 16 real (28 testes), migration aplicada com `migrate deploy` e sem drift.
- Ponta a ponta no Microsoft Edge (Playwright, fora do repositório) contra o build de produção:
  login, dashboard, entrega completa com assinatura desenhada, comprovante, histórico, troca de senha
  obrigatória do ADMIN e ausência de overflow horizontal em 7 telas × 6 larguras (360–1920 px).

## Registro de execução (2026-10-07)

Pedidos do usuário após a refatoração: visual fiel às capturas do legado com animações leves;
estoque agrupado por equipamento; organização por local; início próprio para computador; logo em
melhor qualidade.

| ATUAL → problema                                                       | NOVO → solução                                                                                                                                                                                 | IMPACTO → compatibilidade                                                                                                        |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Visual "Canteiro Digital" (escuro, animações pesadas) fora do aprovado | Tokens, componentes e telas refeitos conforme `legado/*.png`; animações ~0,3 s na curva do protótipo                                                                                           | Só frontend; ver [interface.md](interface.md)                                                                                    |
| Estoque: um card por tamanho/lote (equipamento repetido)               | Um card por equipamento com filtros de modelo e tamanho; agrupamento só na tela                                                                                                                | API inalterada (um item por variação continua sendo a unidade de saldo)                                                          |
| Sem registro de onde o EPI fica guardado                               | `stock_items.location` + `PATCH /stock/items/:id/location` (auditado) + `GET /stock/locations`; visão "Por local", filtro, busca por local, local na entrada de material e no fluxo de entrega | Migration `20261007000000_stock_location` (coluna com padrão ``, sem perda de dados); `StockItemDto` ganhou `location` e `model` |
| Início do PC era a tela do celular centralizada                        | `DesktopHome` (≥ 1024 px): resumo, gráfico de 7 dias, tabela de entregas, alertas de estoque e de local                                                                                        | `DashboardSummaryDto` ganhou `week` e `unplacedStockCount`                                                                       |
| Logo PNG 320 × 176 com fundo cinza, borrada quando ampliada            | Logo e favicon em SVG vetorial redesenhados a partir do PNG; maiores no login, barra lateral e menu                                                                                            | PNG removido                                                                                                                     |
| Grid de cards podia passar da largura do celular (chips roláveis)      | `grid-cols-1` explícito e `min-w-0` nos cards                                                                                                                                                  | —                                                                                                                                |

Verificação: lint, typecheck, testes (web 26, API 34 unitários + 32 de integração, contratos 9),
build, formatação, migration sem drift, e conferência visual em 360–1440 px sem rolagem horizontal.
