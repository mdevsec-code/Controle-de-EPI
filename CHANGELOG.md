# Changelog

Mudanças relevantes do projeto. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.1.0] - 2026-10-07

Primeira versão completa após a refatoração do protótipo (`legado/`). Detalhes por achado em
[AUDIT.md](AUDIT.md) e registro das decisões em [docs/refactor-plan.md](docs/refactor-plan.md).

### Adicionado

- **Fluxo de entrega** de ponta a ponta: identificação por QR Code do crachá ou busca, conferência do
  colaborador, seleção de vários EPIs, quantidade e observação por item, 8 motivos, assinatura na
  tela, confirmação e comprovante com hash SHA-256.
- **Estoque** por almoxarifado × EPI × tamanho × lote, com entradas, ajustes de inventário, saídas,
  perdas e avarias, e histórico de movimentações com saldo anterior e posterior.
- **Estoque agrupado por equipamento**: um card por EPI com filtros de modelo e tamanho, detalhamento
  por variação e barra de nível em relação ao mínimo.
- **Local de armazenamento** por item de estoque: marcar, alterar e aplicar a vários tamanhos; visão
  "Por local"; filtro e busca por local; local na entrada de material e na seleção do fluxo de
  entrega; alerta de itens sem local. Novas rotas `PATCH /api/stock/items/:id/location` e
  `GET /api/stock/locations`.
- **Início no computador**: painel com resumo do dia, gráfico dos últimos 7 dias, tabela das últimas
  entregas, alerta de estoque abaixo do mínimo e de itens sem local. O resumo da API passou a trazer
  `week` e `unplacedStockCount`.
- **Devoluções** parciais (bom volta ao estoque; danificado/descartado não).
- Catálogo de **EPIs e CAs** (vigente, vencido, cancelado), **colaboradores** com máquina de estados e
  QR Code do crachá, **usuários** com perfis ADMIN e ALMOXARIFADO e escopo por almoxarifado.
- **Auditoria** de logins, sessões, cadastros, permissões, estoque, entregas e devoluções.
- Logo da ENGENOVA em **SVG vetorial** (completa e só o prédio) e favicon.
- Documentação: guia do usuário, referência da API, banco de dados, interface, desenvolvimento,
  deploy, segurança e contribuição.

### Segurança

- Access token JWT de 15 min só em memória; refresh token rotativo em cookie `httpOnly`
  `SameSite=Strict` com detecção de reuso; revogação imediata por `tokenVersion`.
- Bloqueio de conta por tentativas, rate limit separado para login e refresh, resposta igual para
  e-mail inexistente.
- Baixa de estoque condicional no banco + `CHECK (quantity >= 0)`; entregas idempotentes.

### Alterado

- Interface refeita conforme as capturas do protótipo legado, com animações leves (~0,3 s) que
  respeitam "reduzir movimento".
- API sob `/api` com erros padronizados `{ error: { code, message, details } }`.

### Removido

- App mobile/PWA separado (substituído por um app único e responsivo).
- Logo em PNG de baixa resolução.
