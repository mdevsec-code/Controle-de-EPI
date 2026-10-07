<p align="center">
  <img src="apps/web/src/assets/engenova-logo.svg" alt="ENGENOVA Engenharia e Construção" width="320">
</p>

<h1 align="center">Controle de Entrega de EPIs</h1>

<p align="center">
  Sistema web da <strong>ENGENOVA</strong> para registrar a entrega de Equipamentos de Proteção
  Individual com assinatura do colaborador, controlar o estoque por almoxarifado e local de
  armazenamento, e manter a rastreabilidade exigida pela NR-6.
</p>

<p align="center">
  <img alt="Node 20+" src="https://img.shields.io/badge/node-%E2%89%A520-339933">
  <img alt="pnpm 9" src="https://img.shields.io/badge/pnpm-9-F69220">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6">
  <img alt="PostgreSQL 16" src="https://img.shields.io/badge/PostgreSQL-16-4169E1">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB">
</p>

---

## Sumário

- [Visão geral](#visão-geral)
- [Telas](#telas)
- [Funcionalidades](#funcionalidades)
- [Perfis de acesso](#perfis-de-acesso)
- [Stack](#stack)
- [Começando (desenvolvimento local)](#começando-desenvolvimento-local)
- [Scripts](#scripts)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Documentação](#documentação)
- [Qualidade e testes](#qualidade-e-testes)
- [Deploy](#deploy)
- [Licença](#licença)

## Visão geral

O almoxarife identifica o colaborador (pelo **QR Code do crachá** ou por busca), escolhe os EPIs,
informa quantidade e motivo, e o colaborador **assina na tela** do celular ou tablet. A entrega é
gravada numa única transação no banco: baixa o estoque, registra a movimentação, guarda a
assinatura com um hash SHA-256 e gera o comprovante. Nada é perdido e nada é duplicado, mesmo com
várias entregas simultâneas do mesmo item.

Na gestão (pensada para o computador), o almoxarifado controla saldos por EPI, tamanho, lote e
**local de armazenamento** (corredor/prateleira), registra entradas, ajustes, perdas e avarias,
mantém o catálogo de EPIs com seus Certificados de Aprovação (CA) e os cadastros de colaboradores e
usuários. Toda ação relevante fica na **auditoria**.

| Requisito                                            | Como o sistema atende                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Comprovar que o colaborador recebeu o EPI (NR-6)     | Assinatura desenhada + data/hora + responsável + hash de integridade + comprovante       |
| Só entregar EPI com CA válido                        | A API recusa itens sem CA vigente (`CA_INVALIDO`)                                        |
| Não entregar o que não existe no estoque             | Baixa condicional no banco + `CHECK (quantity >= 0)`; nunca fica negativo                |
| Saber onde cada EPI está guardado                    | Local de armazenamento por item de estoque, visão "Por local" e filtro                   |
| Saber quem fez o quê                                 | `audit_logs` com usuário, ação, antes/depois, IP e navegador, na mesma transação da ação |
| Funcionar no celular do almoxarife e no PC da gestão | App único e responsivo (360 px a 1920 px), com telas de início diferentes para cada um   |

## Telas

### Celular: fluxo de entrega

|                                     Início                                      |                                       Buscar                                       |                                         Funcionário                                         |                                Selecionar EPI                                |
| :-----------------------------------------------------------------------------: | :--------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------: |
| <img src="docs/imagens/celular-inicio.png" width="190" alt="Início no celular"> | <img src="docs/imagens/celular-1-buscar.png" width="190" alt="Buscar funcionário"> | <img src="docs/imagens/celular-2-funcionario.png" width="190" alt="Funcionário encontrado"> | <img src="docs/imagens/celular-3-epis.png" width="190" alt="Selecionar EPI"> |

|                                   Quantidade                                   |                                      Motivo                                       |                                   Assinatura                                   |                                       Sucesso                                       |
| :----------------------------------------------------------------------------: | :-------------------------------------------------------------------------------: | :----------------------------------------------------------------------------: | :---------------------------------------------------------------------------------: |
| <img src="docs/imagens/celular-4-quantidade.png" width="190" alt="Quantidade"> | <img src="docs/imagens/celular-5-motivo.png" width="190" alt="Motivo da entrega"> | <img src="docs/imagens/celular-6-assinatura.png" width="190" alt="Assinatura"> | <img src="docs/imagens/celular-7-sucesso.png" width="190" alt="Entrega registrada"> |

### Computador: gestão

**Início** (painel com resumo do dia, últimos 7 dias, últimas entregas e alertas)

<img src="docs/imagens/desktop-inicio.png" alt="Início no computador" width="860">

**Estoque** (um card por equipamento, com filtros de modelo e tamanho e o local de armazenamento)

<img src="docs/imagens/desktop-estoque.png" alt="Estoque por EPI" width="860">

**Estoque por local** (o que está guardado em cada corredor/prateleira)

<img src="docs/imagens/desktop-estoque-por-local.png" alt="Estoque por local" width="860">

Mais telas em [docs/guia-do-usuario.md](docs/guia-do-usuario.md).

## Funcionalidades

**Entrega de EPI (celular)**

- Identificação do colaborador por **QR Code do crachá** (câmera, com lanterna quando disponível) ou
  busca por nome/matrícula.
- Conferência do colaborador (foto/iniciais, matrícula, função, empresa, centro de custo). Só
  colaborador **Ativo** pode receber.
- Seleção de vários EPIs, com saldo, CA e **local de armazenamento** de cada item na lista.
- Quantidade por EPI (1 a 50, limitada ao saldo) e observação por item.
- Os 8 motivos do processo (Desgaste, Dano, Rotina, Atividade especial, Perda, Extravio, Novo
  colaborador, Outro com descrição).
- Assinatura na tela, com resumo do que está sendo assinado.
- Confirmação só com os dados devolvidos pela API, e **comprovante** imprimível/PDF com hash SHA-256.
- Previsão de troca calculada pela vida útil do EPI.

**Gestão (computador)**

- **Início**: resumo do dia, gráfico dos últimos 7 dias, últimas entregas, EPIs abaixo do mínimo e
  itens sem local definido.
- **Histórico de entregas**: filtros por período (hoje, ontem, semana, mês) e busca; detalhe com
  assinatura, hash e **devolução** (parcial, com condição: bom volta ao estoque, danificado/descartado
  não volta).
- **Estoque**: um card por equipamento com filtros de **modelo** e **tamanho**; saldo, mínimo e barra
  de nível; **local de armazenamento** (marcar, alterar, aplicar a todos os tamanhos); visão **Por
  local**; filtro "só abaixo do mínimo"; entrada de material; movimentação (ajuste de inventário,
  saída, perda, avaria); histórico de movimentações com saldo anterior e posterior.
- **EPIs**: catálogo com categoria, fabricante, modelo, estoque mínimo, vida útil e gestão de CAs
  (vigente, vencido, cancelado).
- **Colaboradores**: busca, ficha completa, situação (Ativo, Inativo, Bloqueado, Desligado com
  regras de transição), QR Code do crachá para impressão e reemissão.
- **Usuários** (ADMIN): perfis, vínculo com almoxarifados, ativação e senha provisória.
- **Conta**: troca de senha (obrigatória no 1º acesso com senha provisória).

## Perfis de acesso

| Ação                                           | ADMIN | ALMOXARIFADO                                     |
| ---------------------------------------------- | :---: | :----------------------------------------------- |
| Registrar entrega, devolução e ver histórico   |  ✅   | ✅ (só dos seus almoxarifados)                   |
| Estoque: saldos, entradas, ajustes, locais     |  ✅   | ✅ (só dos seus almoxarifados)                   |
| Catálogo de EPIs e CAs                         |  ✅   | ✅                                               |
| Ver colaboradores                              |  ✅   | ✅ (das unidades dos seus almox.; CPF mascarado) |
| Cadastrar/editar colaborador, situação, crachá |  ✅   | ❌                                               |
| Usuários, empresas, unidades, setores, cargos  |  ✅   | ❌                                               |

As permissões são verificadas **na API** em todas as rotas. Esconder um botão na tela é só
conveniência. Detalhes em [SECURITY.md](SECURITY.md).

## Stack

| Camada    | Tecnologia                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Web       | React 19, TypeScript, Vite 8, Tailwind CSS 4, Motion (animações), React Router 7, TanStack Query 5, Zustand |
| API       | Node.js, Express 5, TypeScript, Zod 4, JWT + refresh token em cookie httpOnly, bcrypt, helmet, winston      |
| Banco     | PostgreSQL 16, Prisma 7 (adapter `pg`), migrations versionadas com `CHECK` constraints                      |
| Contratos | `@epi-manager/contracts`: schemas Zod, DTOs, enums e códigos de erro compartilhados entre API e web         |
| Testes    | Vitest, Testing Library (web), Supertest + PostgreSQL real (integração da API)                              |
| Qualidade | ESLint 9 (incl. `jsx-a11y`), Prettier, commitlint, Husky, Turborepo, GitHub Actions                         |

## Começando (desenvolvimento local)

Pré-requisitos: **Node.js ≥ 20** (CI usa 22), **pnpm 9** (`corepack enable`) e **PostgreSQL 16**
(via Docker ou instalação local).

```bash
# 1. Dependências
pnpm install

# 2. Variáveis de ambiente
cp .env.example .env                     # banco, banco de testes e senhas do seed
cp apps/api/.env.example apps/api/.env   # gere um JWT_SECRET forte (instrução no arquivo)

# 3. Banco de dados (Docker sobe epi_manager e epi_manager_test)
pnpm docker:up
pnpm db:generate     # gera o Prisma Client
pnpm db:deploy       # aplica as migrations versionadas
pnpm db:seed         # dados de exemplo (somente desenvolvimento)

# 4. Rodar
pnpm dev             # API em http://localhost:3333/api e web em http://localhost:5173
```

Abra **http://localhost:5173** e entre com um usuário do seed:

| Perfil       | E-mail                              | Senha                                                           |
| ------------ | ----------------------------------- | --------------------------------------------------------------- |
| ADMIN        | `admin@engenova.example.com`        | valor de `SEED_ADMIN_PASSWORD` (troca obrigatória no 1º acesso) |
| ALMOXARIFADO | `marcio.almox@engenova.example.com` | valor de `SEED_ALMOX_PASSWORD`                                  |

O seed cria a empresa, a unidade, o Almoxarifado Central, colaboradores, 9 EPIs com CA, saldos e
locais de armazenamento. Para testar o QR Code, abra um colaborador como ADMIN e mostre o QR do
crachá na tela de outro aparelho.

Passo a passo completo, variáveis de ambiente, solução de problemas e convenções em
[docs/desenvolvimento.md](docs/desenvolvimento.md).

## Scripts

| Comando                                           | O que faz                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| `pnpm dev`                                        | API (watch) + web (Vite) em paralelo                              |
| `pnpm build`                                      | Build de todos os pacotes (contracts → database → api/web)        |
| `pnpm lint` / `pnpm typecheck`                    | ESLint e TypeScript em todo o monorepo                            |
| `pnpm test`                                       | Testes unitários e de componentes (sem banco)                     |
| `pnpm --filter @epi-manager/api test:integration` | Testes de integração contra PostgreSQL real (`TEST_DATABASE_URL`) |
| `pnpm format` / `pnpm format:check`               | Prettier                                                          |
| `pnpm db:generate`                                | Gera o Prisma Client                                              |
| `pnpm db:migrate --name <nome>`                   | Cria uma nova migration (desenvolvimento)                         |
| `pnpm db:deploy`                                  | Aplica migrations pendentes (CI/produção)                         |
| `pnpm db:seed`                                    | Dados de exemplo (recusa rodar com `NODE_ENV=production`)         |
| `pnpm db:studio`                                  | Prisma Studio                                                     |
| `pnpm docker:up` / `pnpm docker:down`             | PostgreSQL de desenvolvimento via Docker                          |

## Estrutura do repositório

```
apps/
  api/                 API REST (Express 5)
    src/modules/       auth, users, organization, warehouses, employees, epis, stock, deliveries
    src/shared/        erros, auditoria, autenticação, escopo, validação, rate limit, logs
    test/integration/  testes contra PostgreSQL real
  web/                 SPA React (responsiva)
    src/app/           providers, rotas, layouts (sidebar no PC, barra inferior no celular)
    src/components/    design system (ui/) e animações (motion/)
    src/features/      auth, dashboard, deliveries, stock, epis, employees, users
    src/lib/           cliente HTTP, erros, formatação, ícones de EPI, animação
packages/
  contracts/           schemas Zod, DTOs, enums, códigos de erro, regras compartilhadas
  database/            Prisma Client compartilhado e seed de desenvolvimento
  config/              ESLint e tsconfig base
database/prisma/       schema.prisma e migrations versionadas
docker/                PostgreSQL de desenvolvimento
docs/                  documentação detalhada e imagens
legado/                protótipo original e capturas (referência visual e funcional)
```

## Documentação

| Documento                                          | Conteúdo                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [docs/guia-do-usuario.md](docs/guia-do-usuario.md) | Manual de uso, tela a tela, para almoxarifes e administradores                           |
| [ARCHITECTURE.md](ARCHITECTURE.md)                 | Arquitetura, camadas, domínio, concorrência, autenticação, frontend                      |
| [docs/api.md](docs/api.md)                         | Referência da API REST: rotas, parâmetros, respostas, erros e permissões                 |
| [docs/banco-de-dados.md](docs/banco-de-dados.md)   | Modelo de dados, diagrama, tabelas, restrições, migrations e seed                        |
| [docs/interface.md](docs/interface.md)             | Identidade visual, design system, animações, responsividade e acessibilidade             |
| [docs/desenvolvimento.md](docs/desenvolvimento.md) | Ambiente local, variáveis, scripts, testes, convenções, como criar features e migrations |
| [docs/deploy.md](docs/deploy.md)                   | Produção: build, migrations, proxy reverso, HTTPS, backup e checklist                    |
| [SECURITY.md](SECURITY.md)                         | Modelo de segurança, autenticação, autorização, auditoria e riscos conhecidos            |
| [CONTRIBUTING.md](CONTRIBUTING.md)                 | Fluxo de trabalho, branches, commits e checklist de PR                                   |
| [CHANGELOG.md](CHANGELOG.md)                       | Histórico de mudanças                                                                    |
| [AUDIT.md](AUDIT.md)                               | Auditoria do sistema original e situação de cada achado                                  |
| [docs/refactor-plan.md](docs/refactor-plan.md)     | Plano da refatoração e registro das mudanças (ATUAL → NOVO → IMPACTO)                    |

## Qualidade e testes

| Nível                     | Onde                           | O que cobre                                                                                               |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Unitário (API)            | `apps/api/src/**/*.spec.ts`    | login, refresh, transições de status, CA vigente, hash da assinatura, hierarquia de setores               |
| Integração (API + banco)  | `apps/api/test/integration`    | concorrência de estoque, transações, idempotência, constraints, autenticação, autorização, escopo, locais |
| Contratos                 | `packages/contracts`           | CPF, regras da entrega                                                                                    |
| Web (unitário/componente) | `apps/web/src/**/*.test.ts(x)` | cliente HTTP (refresh single-flight), erros, guardas, rascunho e etapas do fluxo, agrupamento do estoque  |

Destaque dos testes de integração: **10 entregas simultâneas disputando 1 unidade resultam em
exatamente 1 sucesso**; reenvio com a mesma chave não duplica a entrega; o banco recusa saldo
negativo mesmo fora da aplicação; reuso de refresh token revoga todas as sessões.

O GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) roda em todo push e PR:
formatação, lint, typecheck, testes unitários, integração com PostgreSQL 16, conferência de drift
entre migrations e schema, e build.

## Deploy

Resumo: `pnpm install --frozen-lockfile && pnpm db:generate && pnpm build`, depois `pnpm db:deploy`
antes de subir a API (`node apps/api/dist/main.js`). O web (`apps/web/dist`) é servido como estático
com proxy de `/api` para a API **no mesmo domínio** e HTTPS obrigatório. Guia completo, exemplo de
Nginx, backup e checklist em [docs/deploy.md](docs/deploy.md).

## Licença

Nenhuma licença de código aberto foi definida para este repositório. Sem um arquivo `LICENSE`,
todos os direitos ficam reservados aos autores; defina a licença antes de distribuir o código.
