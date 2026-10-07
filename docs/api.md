# Referência da API

API REST do Controle de Entrega de EPIs. Todos os contratos (corpos, filtros e respostas) são
definidos em `packages/contracts` com Zod e compartilhados com o web; esta página resume esses
contratos. Em caso de dúvida, o código em `packages/contracts/src` é a fonte da verdade.

## Sumário

- [Convenções](#convenções)
- [Autenticação e sessão](#autenticação-e-sessão)
- [Erros](#erros)
- [Limites](#limites)
- [Rotas](#rotas)
  - [Saúde](#saúde)
  - [Sessão (`/auth`)](#sessão-auth)
  - [Usuários (`/users`)](#usuários-users)
  - [Organização](#organização)
  - [Almoxarifados (`/warehouses`)](#almoxarifados-warehouses)
  - [Colaboradores (`/employees`)](#colaboradores-employees)
  - [EPIs e CAs (`/epis`, `/epi-categories`)](#epis-e-cas-epis-epi-categories)
  - [Estoque (`/stock`)](#estoque-stock)
  - [Entregas (`/deliveries`)](#entregas-deliveries)
  - [Dashboard (`/dashboard`)](#dashboard-dashboard)
- [Enums](#enums)

## Convenções

| Item               | Regra                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Base               | Todas as rotas ficam sob **`/api`** (ex.: `POST /api/auth/login`). Em produção, no mesmo domínio do web.                                        |
| Formato            | JSON (`Content-Type: application/json`), UTF-8.                                                                                                 |
| IDs                | UUID v4 em texto.                                                                                                                               |
| Datas              | ISO 8601 em UTC (`2026-10-07T12:32:00.000Z`). O "dia" de negócio usa UTC-3 (America/Sao_Paulo).                                                 |
| Textos opcionais   | String vazia é tratada como ausente (`undefined`). Textos são aparados (`trim`).                                                                |
| Paginação          | Query `page` (≥ 1, padrão 1) e `pageSize` (1–100, padrão 20). Resposta: `{ items, total, page, pageSize }`.                                     |
| Booleanos em query | `true`/`false` (ex.: `?available=true`).                                                                                                        |
| Escopo             | O almoxarife só vê dados dos almoxarifados vinculados ao seu usuário. Registros fora do escopo respondem **404**, para não revelar que existem. |

Perfis abreviados nas tabelas: **A** = ADMIN, **X** = ALMOXARIFADO.

## Autenticação e sessão

1. `POST /api/auth/login` devolve `{ accessToken, expiresIn, user }` e grava o **refresh token** num
   cookie `httpOnly` (`epi_refresh`, `SameSite=Strict`, `Path=/api/auth`, `Secure` em produção).
2. Envie o access token em toda requisição autenticada:

   ```http
   Authorization: Bearer <accessToken>
   ```

3. O access token vale **15 minutos**. Antes de expirar (ou ao receber 401 `SESSAO_EXPIRADA`), chame
   `POST /api/auth/refresh` com o cookie: a API **rotaciona** o refresh token (7 dias) e devolve um novo
   access token. Reapresentar um refresh token já usado revoga **todas** as sessões do usuário.
4. `POST /api/auth/logout` revoga o refresh token e apaga o cookie.

O web guarda o access token **só em memória** e renova automaticamente (uma única renovação por vez,
mesmo com várias requisições simultâneas).

Exemplo com `curl`:

```bash
# login (guarda o cookie de refresh em cookies.txt)
curl -s -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"email":"marcio.almox@engenova.example.com","password":"<senha>"}' \
  http://localhost:3333/api/auth/login

# chamada autenticada
curl -s -H "Authorization: Bearer $TOKEN" 'http://localhost:3333/api/stock/items?pageSize=5'

# renovar
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:3333/api/auth/refresh
```

## Erros

Toda resposta de erro tem o mesmo formato:

```json
{
  "error": {
    "code": "ESTOQUE_INSUFICIENTE",
    "message": "Estoque insuficiente para Máscara PFF2: solicitado 3, disponivel 1.",
    "details": [{ "stockItemId": "…", "epiName": "Máscara PFF2", "requested": 3, "available": 1 }]
  }
}
```

O cliente deve decidir pelo **`code`** (estável), nunca pelo texto da mensagem.

| Código                      | HTTP                                      | Quando                                                                        | `details`                   |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- | --------------------------- |
| `VALIDACAO`                 | 422 (400 JSON inválido, 413 corpo grande) | Corpo, query ou parâmetro inválido, ou regra simples violada                  | `{ campo: [mensagens] }`    |
| `NAO_AUTENTICADO`           | 401                                       | Requisição sem token                                                          | —                           |
| `SESSAO_EXPIRADA`           | 401                                       | Token inválido/expirado, usuário desativado, sessão revogada                  | —                           |
| `CREDENCIAIS_INVALIDAS`     | 401                                       | E-mail ou senha incorretos (mesma resposta para e-mail inexistente)           | —                           |
| `CONTA_BLOQUEADA`           | 423                                       | 5 falhas seguidas; bloqueio de 15 minutos                                     | —                           |
| `SENHA_ATUAL_INCORRETA`     | 422                                       | Troca de senha com a senha atual errada                                       | —                           |
| `SEM_PERMISSAO`             | 403                                       | Perfil sem acesso à rota ou almoxarifado fora do escopo                       | —                           |
| `NAO_ENCONTRADO`            | 404 / 422                                 | Registro inexistente ou fora do escopo (422 quando é uma referência no corpo) | —                           |
| `CONFLITO`                  | 409                                       | Valor único repetido (e-mail, CPF, código, CNPJ…)                             | campos em conflito          |
| `ESTOQUE_INSUFICIENTE`      | 409                                       | Saldo menor que o pedido (entrega ou saída)                                   | `InsufficientStockDetail[]` |
| `COLABORADOR_INDISPONIVEL`  | 422                                       | Colaborador não está `ATIVO`                                                  | —                           |
| `CA_INVALIDO`               | 422                                       | EPI sem CA vigente                                                            | —                           |
| `EPI_INATIVO`               | 422                                       | EPI desativado                                                                | —                           |
| `TRANSICAO_INVALIDA`        | 422                                       | Mudança de situação não permitida                                             | —                           |
| `DEVOLUCAO_EXCEDE_ENTREGUE` | 422                                       | Devolução maior que a quantidade pendente                                     | —                           |
| `MUITAS_TENTATIVAS`         | 429                                       | Limite de requisições por IP                                                  | —                           |
| `ROTA_NAO_ENCONTRADA`       | 404                                       | Rota inexistente                                                              | —                           |
| `ERRO_INTERNO`              | 500                                       | Falha inesperada (detalhes só no log do servidor)                             | —                           |

## Limites

| Limite                            | Valor                                                         |
| --------------------------------- | ------------------------------------------------------------- |
| Corpo JSON                        | 100 KB (512 KB em `/api/deliveries`, por causa da assinatura) |
| Requisições por IP (geral)        | 1000 a cada 15 min                                            |
| Login por IP                      | 50 a cada 15 min                                              |
| Refresh por IP                    | 300 a cada 15 min                                             |
| Bloqueio de conta                 | 5 senhas erradas → 15 min                                     |
| Quantidade de um EPI numa entrega | 1 a 50                                                        |
| Itens distintos numa entrega      | 1 a 20                                                        |
| Assinatura                        | PNG, até 300 KB                                               |
| Observação do item / da entrega   | 200 / 500 caracteres                                          |
| Local de armazenamento            | 60 caracteres                                                 |
| Senha nova                        | mínimo 10 caracteres                                          |

## Rotas

### Saúde

| Método | Rota          | Perfis  | Resposta             |
| ------ | ------------- | ------- | -------------------- |
| GET    | `/api/health` | público | `{ "status": "ok" }` |

### Sessão (`/auth`)

| Método | Rota                        | Perfis  | Corpo                              | Resposta                                                 |
| ------ | --------------------------- | ------- | ---------------------------------- | -------------------------------------------------------- |
| POST   | `/api/auth/login`           | público | `{ email, password }`              | `SessionResponse` + cookie                               |
| POST   | `/api/auth/refresh`         | cookie  | —                                  | `SessionResponse` + novo cookie                          |
| POST   | `/api/auth/logout`          | cookie  | —                                  | 204                                                      |
| GET    | `/api/auth/me`              | A, X    | —                                  | `SessionUser`                                            |
| POST   | `/api/auth/change-password` | A, X    | `{ currentPassword, newPassword }` | `SessionResponse` (nova sessão; as demais são revogadas) |

```ts
SessionResponse = { accessToken: string; expiresIn: number /* segundos */; user: SessionUser };
SessionUser = {
  id; name; email; role: "ADMIN" | "ALMOXARIFADO";
  mustChangePassword: boolean;            // true = o web força a troca de senha
  warehouses: { id; name }[];             // almoxarifados vinculados
};
```

### Usuários (`/users`)

Somente **ADMIN**.

| Método | Rota                            | Corpo / Query                                              | Resposta        |
| ------ | ------------------------------- | ---------------------------------------------------------- | --------------- |
| GET    | `/api/users`                    | `page`, `pageSize`                                         | `Page<UserDto>` |
| POST   | `/api/users`                    | `{ name, email, role, password, warehouseIds?: string[] }` | `UserDto` (201) |
| PATCH  | `/api/users/:id`                | `{ name?, role?, active?, warehouseIds? }`                 | `UserDto`       |
| POST   | `/api/users/:id/reset-password` | `{ password }`                                             | 204             |

- A senha definida pelo ADMIN é **provisória** (`mustChangePassword = true`).
- Desativar, mudar perfil ou almoxarifados, ou redefinir a senha incrementa `tokenVersion` e revoga
  as sessões do usuário imediatamente. Redefinir também zera o bloqueio por tentativas.

`UserDto`: `id, name, email, role, active, mustChangePassword, lockedUntil, lastLoginAt, warehouses, createdAt`.

### Organização

Somente **ADMIN**. Cadastros de base (o seed cria os de exemplo).

| Recurso  | Rotas                                                                           | Campos principais                                                                                   |
| -------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Empresas | `GET/POST /api/companies`, `GET/PATCH /api/companies/:id`                       | `name`, `tradeName?`, `cnpj` (14 dígitos, imutável), `responsibleName?`, `responsibleEmail?`        |
| Unidades | `GET/POST /api/business-units` (`?companyId=`), `PATCH /api/business-units/:id` | `companyId`, `name`, `code` (único por empresa, imutável), endereço opcional (`state` com 2 letras) |
| Setores  | `GET/POST /api/departments`, `PATCH /api/departments/:id`                       | `businessUnitId`, `name`, `code`, `parentId?` (hierarquia; ciclos são recusados)                    |
| Cargos   | `GET/POST /api/job-roles`, `PATCH /api/job-roles/:id`                           | `name` (único), `description?`                                                                      |

### Almoxarifados (`/warehouses`)

| Método | Rota                  | Perfis | Observação                                                  |
| ------ | --------------------- | ------ | ----------------------------------------------------------- |
| GET    | `/api/warehouses`     | A, X   | ADMIN vê todos; almoxarife vê só os vinculados              |
| POST   | `/api/warehouses`     | A      | `{ businessUnitId, name, code }` (código único por unidade) |
| PATCH  | `/api/warehouses/:id` | A      | `{ name? }`                                                 |

### Colaboradores (`/employees`)

| Método | Rota                            | Perfis | Corpo / Query                                                                                                                                                                              | Resposta                   |
| ------ | ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| GET    | `/api/employees`                | A, X   | `q` (nome parcial ou matrícula), `businessUnitId`, `departmentId`, `status`, paginação                                                                                                     | `Page<EmployeeSummaryDto>` |
| GET    | `/api/employees/by-badge/:code` | A, X   | `code` = conteúdo do QR (16–64 caracteres `[A-Za-z0-9_-]`)                                                                                                                                 | `EmployeeSummaryDto`       |
| GET    | `/api/employees/:id`            | A, X   | —                                                                                                                                                                                          | `EmployeeDto`              |
| POST   | `/api/employees`                | A      | `registration`, `cpf` (validado; aceita máscara), `name`, `email?`, `phone?`, `photoUrl?`, `admissionDate?`, `costCenter?`, `businessUnitId`, `departmentId`, `jobRoleId`, `supervisorId?` | `EmployeeDto` (201)        |
| PATCH  | `/api/employees/:id`            | A      | Mesmos campos, exceto `registration`, `cpf` e `businessUnitId`; `supervisorId` aceita `null`                                                                                               | `EmployeeDto`              |
| PATCH  | `/api/employees/:id/status`     | A      | `{ status, terminationDate? }` (obrigatória para `DESLIGADO`)                                                                                                                              | `EmployeeDto`              |
| POST   | `/api/employees/:id/badge`      | A      | — (reemite o crachá; o código anterior deixa de funcionar)                                                                                                                                 | `{ badgeCode }`            |

- Transições de situação: `ATIVO → INATIVO | BLOQUEADO | DESLIGADO`; `INATIVO → ATIVO | DESLIGADO`;
  `BLOQUEADO → ATIVO | DESLIGADO`; `DESLIGADO → ATIVO`. Outras respondem `TRANSICAO_INVALIDA`.
- `EmployeeSummaryDto` (visão mínima do fluxo de entrega): `id, name, registration, status, photoUrl,
jobRoleName, companyName, businessUnitName, departmentName, costCenter`.
- `EmployeeDto` acrescenta `cpf` (completo para ADMIN, **mascarado** `***.456.789-**` para o
  almoxarife), contatos, datas, IDs de vínculo e `badgeCode` (**somente ADMIN**).

### EPIs e CAs (`/epis`, `/epi-categories`)

Perfis: **A, X**.

| Método | Rota                             | Corpo / Query                                                                                                                                                                 | Resposta         |
| ------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| GET    | `/api/epi-categories`            | —                                                                                                                                                                             | `{ id, name }[]` |
| POST   | `/api/epi-categories`            | `{ name }`                                                                                                                                                                    | categoria (201)  |
| GET    | `/api/epis`                      | `q` (nome/código), `categoryId`, `active`, paginação                                                                                                                          | `Page<EpiDto>`   |
| GET    | `/api/epis/:id`                  | —                                                                                                                                                                             | `EpiDto`         |
| POST   | `/api/epis`                      | `name`, `internalCode` (único, imutável), `barcode?`, `categoryId`, `manufacturer`, `model?`, `photoUrl?`, `manualUrl?`, `minQuantity?`, `unitPriceCents?`, `usefulLifeDays?` | `EpiDto` (201)   |
| PATCH  | `/api/epis/:id`                  | Mesmos campos (exceto `internalCode`) + `active`                                                                                                                              | `EpiDto`         |
| GET    | `/api/epis/:id/cas`              | —                                                                                                                                                                             | `CaDto[]`        |
| POST   | `/api/epis/:id/cas`              | `{ number, issuedAt, expiresAt }` (`expiresAt` > `issuedAt`)                                                                                                                  | `CaDto` (201)    |
| POST   | `/api/epis/:id/cas/:caId/cancel` | —                                                                                                                                                                             | `CaDto`          |

- `EpiDto.currentCa` = `{ number, expiresAt }` do CA **vigente** (não cancelado e dentro da validade),
  ou `null`; sem CA vigente o EPI não pode ser entregue.
- `CaDto.status`: `VIGENTE`, `VENCIDO` ou `CANCELADO` (calculado, não gravado).
- `usefulLifeDays` define a **troca prevista** (`expectedReplacementAt`) de cada item entregue.

### Estoque (`/stock`)

Perfis: **A, X** (almoxarife restrito aos seus almoxarifados).

| Método | Rota                            | Corpo / Query                                                                                                                                  | Resposta                             |
| ------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| GET    | `/api/stock/items`              | `warehouseId`, `epiItemId`, `q` (nome/código do EPI **ou local**), `available` (saldo > 0 e EPI ativo), `lowStock` (saldo < mínimo), paginação | `Page<StockItemDto>`                 |
| POST   | `/api/stock/entries`            | `{ warehouseId, epiItemId, size?, batchNumber?, quantity (1–1.000.000), reason?, location? }`                                                  | `StockItemDto` (201)                 |
| POST   | `/api/stock/adjustments`        | ver abaixo                                                                                                                                     | `StockItemDto` (201)                 |
| PATCH  | `/api/stock/items/:id/location` | `{ location }` (até 60 caracteres; `""` remove)                                                                                                | `StockItemDto`                       |
| GET    | `/api/stock/locations`          | `warehouseId` (obrigatório)                                                                                                                    | `string[]` (locais em uso, em ordem) |
| GET    | `/api/stock/movements`          | `warehouseId`, `epiItemId`, `stockItemId`, `type`, `from`, `to`, paginação                                                                     | `Page<StockMovementDto>`             |

**Entrada:** cria o item (almoxarifado × EPI × tamanho × lote) se não existir e soma o saldo com uma
movimentação `ENTRADA`. `size` é normalizado em maiúsculas; vazio = sem grade. `location` omitido
mantém o local atual; informado, atualiza.

**Ajuste** (`/stock/adjustments`), corpo discriminado por `type`:

```jsonc
// Saída, perda ou avaria: informa a quantidade retirada
{ "type": "PERDA", "stockItemId": "…", "quantity": 2, "reason": "Rasgou no uso" }
// Inventário: informa o saldo CONTADO; a API calcula a diferença
{ "type": "AJUSTE", "stockItemId": "…", "countedQuantity": 37, "reason": "Inventário mensal" }
```

Retirar mais que o saldo responde `ESTOQUE_INSUFICIENTE`; saldo contado igual ao atual responde
`VALIDACAO`.

**Local:** `PATCH /stock/items/:id/location` não mexe no saldo e grava auditoria (`ATUALIZAR`, com
local anterior e novo).

```ts
StockItemDto = {
  id; warehouseId; warehouseName; epiItemId; epiName;
  model: string | null;        // modelo do EPI
  internalCode; categoryName;
  size: string;                // "" = sem grade
  batchNumber: string;         // "" = sem lote
  location: string;            // "" = local não definido
  quantity: number; minQuantity: number;
  caNumber: string | null;     // null = sem CA vigente
};
StockMovementDto = {
  id; type; delta /* assinado */; balanceBefore; balanceAfter; reason;
  performedByName; createdAt; stockItemId; epiName; size; batchNumber; warehouseName;
  deliveryId: string | null; deliveryNumber: number | null;
};
```

### Entregas (`/deliveries`)

Perfis: **A, X** (escopo: almoxarifados do usuário e colaboradores das unidades desses almoxarifados).

| Método | Rota                            | Corpo / Query                                                                           | Resposta                                        |
| ------ | ------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| POST   | `/api/deliveries`               | `CreateDeliveryRequest`                                                                 | `DeliveryDto` (**201** criada, **200** reenvio) |
| GET    | `/api/deliveries`               | `q` (nome ou matrícula), `employeeId`, `warehouseId`, `status`, `from`, `to`, paginação | `Page<DeliveryListItemDto>`                     |
| GET    | `/api/deliveries/:id`           | —                                                                                       | `DeliveryDto`                                   |
| GET    | `/api/deliveries/:id/signature` | —                                                                                       | imagem `image/png`                              |
| POST   | `/api/deliveries/:id/returns`   | `{ deliveryItemId, quantity, condition, reason? }`                                      | `ReturnDto` (201)                               |

**Registrar entrega:**

```json
{
  "idempotencyKey": "6f1c2a7e-0b7e-4d0b-9a6c-2f0f6a0e9d11",
  "employeeId": "…",
  "warehouseId": "…",
  "reason": "OUTRO",
  "reasonDetail": "Troca por tamanho",
  "notes": "opcional, até 500",
  "items": [{ "stockItemId": "…", "quantity": 1, "notes": "opcional, até 200" }],
  "signature": "data:image/png;base64,iVBORw0KGgo…"
}
```

- `idempotencyKey` é gerado pelo cliente ao iniciar o fluxo. Reenviar a mesma chave devolve a entrega
  já gravada (**200**) em vez de criar outra.
- `reasonDetail` é obrigatório quando `reason = OUTRO`. Cada `stockItemId` só pode aparecer uma vez.
- A assinatura precisa ser PNG real (validado pelos _magic bytes_), até 300 KB.
- Tudo acontece numa **transação**: valida colaborador (`ATIVO`, no escopo), almoxarifado, EPI ativo e
  CA vigente; baixa cada item com `UPDATE … WHERE quantity >= n`; grava entrega, itens (com _snapshot_
  de nome e CA), movimentações `ENTREGA`, assinatura (PNG + SHA-256) e auditoria. Qualquer falha
  desfaz tudo.
- Possíveis erros: `COLABORADOR_INDISPONIVEL`, `EPI_INATIVO`, `CA_INVALIDO`, `ESTOQUE_INSUFICIENTE`
  (com os itens em `details`), `NAO_ENCONTRADO`, `SEM_PERMISSAO`, `VALIDACAO`.

**Assinatura:** servida com `Content-Type: image/png`, `Content-Security-Policy: default-src 'none'` e
`Cache-Control: private, no-store`.

**Devolução:** `condition` = `BOM` (volta ao estoque com movimentação `DEVOLUCAO`; `restocked: true`),
`DANIFICADO` ou `DESCARTADO` (só registra). A soma das devoluções não passa do entregue
(`DEVOLUCAO_EXCEDE_ENTREGUE`).

```ts
DeliveryDto = {
  id; number /* sequencial */; status; reason; reasonDetail; notes; deliveredAt;
  employee: EmployeeSummaryDto; warehouse: { id; name }; deliveredBy: { id; name };
  items: { id; epiItemId; epiName; caNumber; size; batchNumber; quantity;
           returnedQuantity; notes; expectedReplacementAt }[];
  signature: { signedAt; contentHash /* SHA-256 */ } | null;
};
DeliveryListItemDto = { id; number; status; deliveredAt; employeeName; employeeRegistration;
                        items: { epiName; quantity }[]; totalQuantity };
```

### Dashboard (`/dashboard`)

| Método | Rota                     | Perfis | Resposta              |
| ------ | ------------------------ | ------ | --------------------- |
| GET    | `/api/dashboard/summary` | A, X   | `DashboardSummaryDto` |

```ts
DashboardSummaryDto = {
  today: { deliveries: number; employeesServed: number; epiTypes: number };
  lowStockCount: number;          // itens abaixo do mínimo
  unplacedStockCount: number;     // itens com saldo sem local de armazenamento
  week: { date: "AAAA-MM-DD"; deliveries: number }[];   // 7 dias, do mais antigo até hoje (UTC-3)
  recentDeliveries: DeliveryListItemDto[];               // 5 mais recentes
};
```

Considera apenas entregas `CONCLUIDA` no escopo do usuário.

## Enums

| Enum                | Valores                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `UserRole`          | `ADMIN`, `ALMOXARIFADO`                                                                              |
| `EmployeeStatus`    | `ATIVO`, `INATIVO`, `BLOQUEADO`, `DESLIGADO`                                                         |
| `DeliveryStatus`    | `CONCLUIDA`, `CANCELADA`                                                                             |
| `DeliveryReason`    | `DESGASTE`, `DANO`, `ROTINA`, `ATIVIDADE_ESPECIAL`, `PERDA`, `EXTRAVIO`, `NOVO_COLABORADOR`, `OUTRO` |
| `StockMovementType` | `ENTRADA`, `SAIDA`, `ENTREGA`, `DEVOLUCAO`, `AJUSTE`, `PERDA`, `AVARIA`                              |
| `ReturnCondition`   | `BOM`, `DANIFICADO`, `DESCARTADO`                                                                    |
| `CaStatus`          | `VIGENTE`, `VENCIDO`, `CANCELADO`                                                                    |
