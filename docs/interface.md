# Interface: identidade, componentes e animação

O visual segue as capturas do protótipo aprovado (`legado/*.png` e `legado/index.html`): fundo claro,
cartões brancos, laranja ENGENOVA e animações curtas. Este documento descreve os tokens, os
componentes e as regras para manter a interface consistente.

## Sumário

- [Logo](#logo)
- [Tokens](#tokens)
- [Tipografia](#tipografia)
- [Componentes](#componentes)
- [Layouts e responsividade](#layouts-e-responsividade)
- [Animações](#animações)
- [Acessibilidade](#acessibilidade)
- [Ícones de EPI](#ícones-de-epi)

## Logo

| Arquivo                                 | Uso                                                           |
| --------------------------------------- | ------------------------------------------------------------- |
| `apps/web/src/assets/engenova-logo.svg` | Logo completa (prédio + ENGENOVA + "Engenharia e Construção") |
| `apps/web/src/assets/engenova-mark.svg` | Só o prédio, para espaços pequenos                            |
| `apps/web/public/favicon.svg`           | Ícone da aba do navegador (o prédio)                          |

A logo foi **redesenhada em vetor** a partir do PNG do legado (320 × 176 px, com fundo cinza):
o texto está em contornos da fonte Sora e o prédio foi redesenhado nas mesmas proporções e cores.
Fica nítida em qualquer tamanho e sem caixa de fundo. Se a ENGENOVA fornecer o arquivo vetorial
original, basta substituir os SVGs mantendo os nomes.

Componente: `<Logo className="w-48" />` (completa) ou `<Logo variant="mark" />`. Tamanhos usados:
login `w-72`, barra lateral `w-52`, menu e comprovante `w-48`, carregamento `w-60`.

## Tokens

Definidos em `apps/web/src/styles/globals.css` (`@theme` do Tailwind 4) e usados como classes
(`bg-primary-500`, `text-neutral-600`, `rounded-card`…).

**Cores**

| Token                       | Valor                 | Uso                                                                       |
| --------------------------- | --------------------- | ------------------------------------------------------------------------- |
| `primary-50` / `100`        | `#FFF7F2` / `#FFF0E6` | Fundo de item selecionado, fundo de ícone ativo                           |
| `primary-200` / `300`       | `#FFD8B8` / `#FFB27A` | Avatar (gradiente pêssego)                                                |
| `primary-400`               | `#FF8A3D`             | Início do gradiente do botão, destaques em fundo escuro                   |
| `primary-500`               | `#EE5A24`             | Laranja principal: chips ativos, ícones, abas                             |
| `primary-600`               | `#D8481A`             | Iniciais do avatar, fim do gradiente do cabeçalho                         |
| `primary-700`               | `#C4410F`             | **Texto/links laranja** (contraste AA sobre branco)                       |
| `neutral-0` … `neutral-900` | `#FFFFFF` … `#1B1B1F` | Fundo `#F4F4F6` (`50`), linhas `#ECECEE` (`100`), texto `#1B1B1F` (`900`) |
| `success-*`                 | `#1E8F5E`…            | Situação ok, entrega concluída                                            |
| `warning-*`                 | `#B45309`…            | Estoque abaixo do mínimo, local não definido                              |
| `danger-*`                  | `#C53030`…            | Erros, colaborador indisponível                                           |

**Formas e sombras**

| Token             | Valor                                   | Uso                     |
| ----------------- | --------------------------------------- | ----------------------- |
| `rounded-control` | 14 px                                   | Campos, seletores       |
| `rounded-card`    | 20 px                                   | Cartões                 |
| `rounded-sheet`   | 28 px                                   | Diálogos (sheet)        |
| `shadow-card`     | sombra suave dupla                      | Cartões                 |
| `shadow-cta`      | `0 10px 20px -8px rgb(238 90 36 / .55)` | Botão principal laranja |
| `shadow-pop`      | `0 18px 40px rgb(20 20 30 / .16)`       | Diálogos, toasts        |

Utilitários: `skeleton` (brilho de carregamento), `tabular` (números alinhados), `animate-scan`
(laser do leitor de QR).

## Tipografia

| Fonte              | Uso                                         | Origem                                |
| ------------------ | ------------------------------------------- | ------------------------------------- |
| **Sora**           | Títulos, botões principais, números grandes | `@fontsource/sora` (servida pelo app) |
| **Inter**          | Texto e interface                           | `@fontsource/inter`                   |
| **JetBrains Mono** | Somente número de CA e hash                 | `@fontsource/jetbrains-mono`          |

As fontes são empacotadas no build: nenhuma requisição a serviços de terceiros.

## Componentes

`apps/web/src/components/ui`:

| Componente                                                           | Descrição                                                                                                                                                                                                        |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button` / `buttonVariants`                                          | Variantes `primary` (gradiente laranja), `outline`, `secondary`, `ghost`, `danger`; tamanhos `sm`, `md`, `lg` (CTA em caixa alta). Props `loading`, `fullWidth`, `trailingIcon` (seta à direita, como no legado) |
| `Field`, `Input`, `PasswordInput`, `Textarea`, `Select`              | Campo com rótulo associado, dica, erro e `hideLabel` (rótulo só para leitor de tela); `Input` aceita `icon`                                                                                                      |
| `CheckboxRow`, `RadioRow`                                            | Linhas de escolha do legado (quadrado/anel laranja); o input nativo cobre a linha inteira                                                                                                                        |
| `Card`, `Badge`, `Avatar`, `PageHeader`, `DetailRow`, `SectionHead`  | Superfícies e cabeçalhos; `Avatar` com iniciais em gradiente pêssego ou foto                                                                                                                                     |
| `SearchInput`                                                        | Busca com _debounce_ (300 ms) e botão limpar                                                                                                                                                                     |
| `QuantityStepper`                                                    | `−` valor `+` com bordas; número "rola" ao mudar                                                                                                                                                                 |
| `Dialog`                                                             | Sheet (sobe de baixo no celular, centralizado no PC), fecha com Esc e foco preso                                                                                                                                 |
| `toast`                                                              | Avisos rápidos (sucesso/erro) em pílula escura                                                                                                                                                                   |
| `Spinner`, `SkeletonList`, `EmptyState`, `ErrorState`, `InlineError` | Estados de carregamento, vazio e erro (com "Tentar novamente")                                                                                                                                                   |
| `Logo`                                                               | Logo vetorial (`variant="full"                                                                                                                                                                                   | "mark"`) |

`apps/web/src/components/motion`: `MotionProvider` (LazyMotion + respeito a "reduzir movimento"),
`AnimatedOutlet` (transição entre páginas) e `primitives` (`Stagger`, `StaggerItem`, `CountUp`,
`NumberRoll`, `AnimatedCheck`, `Confetti`).

Componentes de área relevantes:

- `features/stock/stock-group-card.tsx`: card por equipamento com chips de tamanho, seletor de
  modelo, detalhamento por variação e barra de nível.
- `features/stock/stock-by-location.tsx` e `stock-location.tsx`: visão por local e formulário de local.
- `features/dashboard/mobile-home.tsx` e `desktop-home.tsx`: início de cada tipo de tela.
- `features/deliveries/flow/*`: etapas do fluxo de entrega (layout com cabeçalho e rodapé fixos).

## Layouts e responsividade

| Largura                    | Layout                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| < 1024 px (celular/tablet) | Barra inferior (Início, Entregas, Histórico, Menu); início = Home do legado (cabeçalho laranja e atalhos)  |
| ≥ 1024 px (computador)     | Barra lateral fixa com logo e **Nova entrega**; início = painel próprio (resumo + 7 dias, tabela, alertas) |
| Fluxo de entrega           | Tela cheia em qualquer largura, conteúdo até `max-w-xl`, botão principal fixo no rodapé                    |

A troca do início é feita por `useMediaQuery("(min-width: 1024px)")`, que renderiza só a versão
certa. Listas em grid usam `grid-cols-1` explícito no celular (evita que conteúdo largo, como chips
roláveis, estique a coluna).

Verificado sem rolagem horizontal em 360, 390, 768, 1024, 1366, 1440 e 1920 px.

## Animações

Linguagem de movimento do protótipo: transições de ~0,3 s com a curva `cubic-bezier(.32,.72,0,1)`
(`EASE` em `lib/motion.ts`), deslocamentos de poucos pixels, sem desfoque, 3D ou loops decorativos.
Biblioteca: **Motion** (`motion/react`), carregada com `LazyMotion`.

| Onde             | Animação                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Navegação        | Páginas deslizam e aparecem (no fluxo de entrega, na direção de avançar/voltar); indicador ativo da barra lateral/inferior desliza |
| Listas e cartões | Entrada em cascata curta (`Stagger`, 30–60 ms entre itens)                                                                         |
| Números          | `CountUp` nos indicadores; `NumberRoll` no stepper de quantidade                                                                   |
| Escolhas         | Check desenhado no checkbox, ponto que cresce no rádio                                                                             |
| Estoque          | Barra de nível anima a largura ao trocar tamanho; alternância Por EPI/Por local com pílula deslizante                              |
| Início (PC)      | Barras do gráfico de 7 dias crescem em sequência                                                                                   |
| Leitor de QR     | Cantoneiras surgem, laser percorre o quadro, confirmação em verde                                                                  |
| Sucesso          | Círculo com "pop" (mola, como o `@keyframes pop` do legado), check desenhado, confetes caindo devagar                              |
| Toque            | Escala 0,98 em botões e cartões clicáveis                                                                                          |

Regras:

- Só `transform` e `opacity` em transições de página (nada de `filter`, que quebraria elementos
  `position: fixed`).
- Presets em `lib/motion.ts`: `EASE`, `SPRING_SNAPPY` (indicadores), `SPRING_POP` (sucesso),
  `fadeUp`, `stagger()`.
- `MotionConfig reducedMotion="user"` + CSS: quem ativa "reduzir movimento" no sistema operacional
  recebe a interface sem deslocamentos nem confetes em queda.

## Acessibilidade

- Todo campo tem rótulo associado (`Field`); botões só com ícone têm `aria-label`.
- Foco visível em todos os controles; diálogos prendem o foco e fecham com Esc.
- Alvos de toque ≥ 44 px.
- `aria-live` em avisos (erros de formulário, toasts, status do leitor de QR, contadores).
- Navegação por teclado completa: escolhas usam inputs nativos (checkbox/rádio) cobrindo a linha.
- Lint `eslint-plugin-jsx-a11y` no CI e no _pre-commit_.
- **Contraste:** textos e links laranja usam `primary-700` (`#C4410F`, AA sobre branco). O botão
  principal mantém o texto branco sobre o gradiente laranja do legado (≈ 3,4:1 na ponta mais
  escura), abaixo dos 4,5:1 do WCAG AA para 15,5 px; foi mantido por fidelidade ao visual aprovado.
  Para atingir AA, escureça o gradiente para `primary-600 → primary-700`.

## Ícones de EPI

`lib/epi-icons.ts` escolhe um ícone do Lucide pela categoria ou pelo nome do EPI, ignorando acentos
e maiúsculas: respiratória/máscara → ar (`Wind`), mãos/luva → mão, olhos/óculos/facial → óculos,
auditiva/auricular → ouvido, pés/bota/calçado → pegadas, tronco/colete/avental → camisa,
cabeça/capacete → capacete. Categorias novas caem num ícone genérico; para mapear outra, acrescente
a regra no arquivo (há teste em `epi-icons.test.ts`).
