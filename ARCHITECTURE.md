# Arquitetura — ENGENOVA · Controle de Entrega de EPIs

## Visão geral

```
navegador (SPA React)
   │  /api/*  (mesmo site; proxy)
   ▼
API REST (Express 5)
   │  Prisma (adapter pg)
   ▼
PostgreSQL 16
```

Monorepo pnpm + Turborepo:

| Pacote               | Papel                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`           | SPA única e responsiva. Fluxo de entrega mobile-first; gestão (estoque, EPIs, colaboradores, usuários) desktop-first.                                                        |
| `apps/api`           | API REST. Única dona das regras de negócio e da autorização.                                                                                                                 |
| `packages/contracts` | Enums, schemas Zod de request/response, códigos de erro e constantes de domínio. **Fonte única** dos contratos usados pela API (validação) e pelo web (tipos e formulários). |
| `packages/database`  | Prisma Client singleton.                                                                                                                                                     |
| `packages/config`    | ESLint e tsconfig compartilhados.                                                                                                                                            |
| `database/prisma`    | Schema, migrations versionadas e seed.                                                                                                                                       |

## Camadas da API

Pragmático, sem container de DI e sem interfaces sem segunda implementação além do teste:

```
http/        rotas + validação (Zod do contracts) + autorização por perfil → chama o caso de uso
application/ casos de uso (RegisterDelivery, AdjustStock, Login…) — regras e orquestração, transações
domain/      tipos e regras puras (ex.: transições de status, validade de CA, rascunho de entrega)
infra/       repositórios Prisma
```

- **Erros**: `AppError(code, status, message, details?)` → `{ "error": { "code", "message", "details" } }`. Os códigos vivem em `contracts`; o web traduz por código, não por texto.
- **Transações**: casos de uso que tocam mais de uma tabela (entrega, estoque, devolução) usam `prisma.$transaction` e gravam a auditoria **dentro** da mesma transação.
- **Autorização**: `authorize("ADMIN" | "ALMOXARIFADO")` por rota + **escopo de dados** no caso de uso (almoxarife só enxerga colaboradores das unidades e estoques dos almoxarifados aos quais está vinculado). Esconder botão no web nunca é proteção.

## Domínio

| Conceito                      | Entidade                                          | Observação                                                                                                  |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Pessoa que recebe EPI         | `Employee` (colaborador)                          | Não faz login nesta fase. Identificado por busca ou pelo QR do crachá (`badgeCode` opaco).                  |
| Quem opera o sistema          | `User` (`ADMIN`, `ALMOXARIFADO`)                  | Vinculado a almoxarifados (`UserWarehouse`).                                                                |
| Catálogo                      | `EpiItem`, `EpiCategory`, `EpiCA`                 | CA vigente = não cancelado e `expiresAt` ≥ hoje.                                                            |
| Disponibilidade               | `StockItem` (almoxarifado × EPI × tamanho × lote) | `quantity` é o saldo materializado, protegido por `CHECK >= 0`. `location` = onde está guardado (auditado). |
| O que aconteceu com o estoque | `StockMovement`                                   | Toda alteração de saldo gera uma movimentação com `delta`, saldo anterior e posterior.                      |
| Operação de entrega           | `Delivery` + `DeliveryItem` + `DeliverySignature` | Imutável após registrada. Itens guardam snapshot de nome e CA. Assinatura guarda PNG + SHA-256 + data/hora. |
| Devolução                     | `EpiReturn`                                       | Pode retornar ao estoque (movimento `DEVOLUCAO`) ou ser descartada.                                         |
| Rastreabilidade               | `AuditLog`                                        | Quem, quando, o quê, registro, antes/depois, IP/UA.                                                         |

### Entrega e concorrência

`POST /deliveries` executa numa única transação:

1. valida colaborador (`ATIVO`, no escopo do usuário), almoxarifado (vinculado ao usuário), itens (1–50 un., CA vigente, item de estoque do almoxarifado);
2. para cada item: `UPDATE stock_items SET quantity = quantity - n WHERE id = $id AND quantity >= n RETURNING quantity` — se nenhuma linha voltar, aborta com `ESTOQUE_INSUFICIENTE` (409). O lock de linha do PostgreSQL serializa entregas concorrentes do mesmo item; o `CHECK` é a rede de segurança;
3. grava entrega, itens, movimentações `ENTREGA` (com saldos), assinatura e auditoria;
4. `idempotencyKey` único: reenvio da mesma entrega devolve a entrega já gravada em vez de duplicar.

O frontend **nunca** calcula saldo para enviar; apenas exibe o saldo informado pela API.

## Autenticação

- Access token JWT HS256 (15 min) **somente em memória** no web; payload validado (`iss`, `aud`, `alg`) e `tokenVersion` conferido (desativar usuário ou trocar perfil revoga na hora).
- Refresh token opaco (7 dias) em cookie `httpOnly`, `Secure` em produção, `SameSite=Strict`, `path=/api/auth`; armazenado como SHA-256; rotação atômica; reapresentar token já usado revoga todas as sessões do usuário.
- Proteção contra força bruta: rate limit por IP + bloqueio progressivo por conta.

## Frontend

```
src/
├── app/          providers, router (lazy por rota), layouts, guardas
├── assets/       logo ENGENOVA em SVG (completa e só o prédio)
├── components/ui/ design system: botão, campos, escolhas, card, badge, diálogo, toast, estados
├── features/
│   ├── auth/         sessão, login, guardas
│   ├── dashboard/
│   ├── deliveries/   fluxo de nova entrega, histórico, detalhe, comprovante
│   ├── employees/    busca, leitura de crachá
│   ├── epis/
│   ├── stock/
│   └── users/
└── lib/          cliente HTTP, erros, formatação, rótulos, animação, ícones de EPI, media query
```

| Tipo de estado                          | Ferramenta                                                             |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Server state (listas, detalhes, saldos) | TanStack Query                                                         |
| Sessão (usuário, access token)          | store pequena (zustand) fora do React Query                            |
| Rascunho da entrega entre telas         | zustand (`features/deliveries/draft`), resetado ao iniciar uma entrega |
| UI local (busca, abas)                  | `useState`                                                             |

Formulários: react-hook-form + schemas do `contracts` no login e na troca de senha; formulários de
gestão usam estado local simples e exibem os erros de campo devolvidos pela API (`VALIDACAO`).

Princípios de UI:

- **Estados explícitos** em toda operação assíncrona: carregando, vazio, erro (com "Tentar
  novamente") e sucesso; botões de envio ficam desabilitados com indicador durante a requisição.
- **Code splitting**: cada página é um chunk sob demanda; leitor de QR, assinatura e gerador de QR
  carregam só nas telas que os usam. Carga inicial ≈ 190 KB de JS + 31 KB de CSS (gzip), incluindo o núcleo de animação.
- **Acessibilidade**: rótulos associados (`Field`), foco visível, alvos de toque ≥ 44 px, contraste
  AA calculado para cada combinação da paleta, `aria-live` em avisos, lint `jsx-a11y`.

### Estoque: agrupamento e local de armazenamento

- A API mantém **um item de estoque por variação** (almoxarifado × EPI × tamanho × lote): é a unidade
  de saldo, de movimentação e de baixa na entrega. A tela de estoque **agrupa** essas variações num
  card por equipamento (mesmo nome de EPI), com filtros de **modelo** (campo `model` do EPI) e
  **tamanho**, sem mudar o modelo de dados (`features/stock/stock-groups.ts`, com testes).
- `stock_items.location` guarda **onde** a variação está guardada (texto livre até 60 caracteres;
  vazio = não definido). Muda por `PATCH /stock/items/:id/location` (auditado, não mexe no saldo) ou
  na entrada de material. `GET /stock/locations` lista os locais em uso, para sugestões e filtro.
- A visão **Por local** e o filtro por local são feitos no cliente sobre a lista já carregada
  (até 100 itens por almoxarifado; acima disso a tela pede para refinar a busca).
- O local também aparece na seleção de EPIs do fluxo de entrega, para facilitar a separação.

### Início por tipo de tela

`DashboardPage` usa `useMediaQuery("(min-width: 1024px)")` e renderiza **uma** das versões:
`MobileHome` (a Home do legado) ou `DesktopHome` (painel com resumo, últimos 7 dias, tabela de
entregas e alertas de estoque/local). Os dois consomem o mesmo `GET /dashboard/summary`, que inclui
a série de 7 dias e a contagem de itens sem local.

### Identidade visual e animação

Logo vetorial, tokens, componentes, regras de animação, responsividade e acessibilidade estão em
[docs/interface.md](docs/interface.md).

## Testes

| Nível                     | Onde                           | O que cobre                                                                                              |
| ------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Unitário (domínio)        | `apps/api/src/**/*.spec.ts`    | casos de uso de autenticação, transições de status, CA vigente, hash da assinatura, ciclo de setores     |
| Integração (API + banco)  | `apps/api/test/integration`    | concorrência de estoque, transações, idempotência, constraints, autenticação, autorização, escopo        |
| Contratos                 | `packages/contracts`           | CPF, regras da entrega                                                                                   |
| Web (unitário/componente) | `apps/web/src/**/*.test.ts(x)` | cliente HTTP (refresh single-flight), erros, guardas, rascunho e etapas do fluxo, agrupamento do estoque |

## Documentos relacionados

- [docs/api.md](docs/api.md): referência das rotas.
- [docs/banco-de-dados.md](docs/banco-de-dados.md): modelo de dados, restrições e migrations.
- [docs/interface.md](docs/interface.md): design system e animações.
- [docs/desenvolvimento.md](docs/desenvolvimento.md) e [docs/deploy.md](docs/deploy.md).
- [SECURITY.md](SECURITY.md): modelo de segurança.
