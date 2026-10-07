# Como contribuir

Obrigado por ajudar a manter o Controle de Entrega de EPIs. Este guia resume o fluxo de trabalho;
o passo a passo técnico está em [docs/desenvolvimento.md](docs/desenvolvimento.md).

## Fluxo

1. Crie uma branch a partir de `main`: `feat/estoque-por-local`, `fix/assinatura-ios`,
   `docs/guia-usuario`.
2. Faça commits pequenos e coesos (veja [mensagens de commit](#mensagens-de-commit)).
3. Rode localmente:

   ```bash
   pnpm format && pnpm lint && pnpm typecheck && pnpm test
   pnpm --filter @epi-manager/api test:integration   # se mexeu na API ou no banco
   pnpm build
   ```

4. Abra um Pull Request para `main` descrevendo **o que mudou, por quê e o impacto** (formato
   ATUAL → NOVO → IMPACTO para mudanças de comportamento).
5. O CI precisa passar: formatação, lint, typecheck, testes, integração com PostgreSQL, drift de
   migrations e build.

## Mensagens de commit

[Conventional Commits](https://www.conventionalcommits.org/pt-br/), validadas pelo commitlint no
hook `commit-msg`:

```
<tipo>(<escopo opcional>): <descrição no imperativo, em português>
```

| Tipo       | Quando                                      |
| ---------- | ------------------------------------------- |
| `feat`     | Nova funcionalidade                         |
| `fix`      | Correção de bug                             |
| `docs`     | Somente documentação                        |
| `refactor` | Mudança de código sem alterar comportamento |
| `test`     | Testes                                      |
| `chore`    | Build, dependências, configuração           |
| `ci`       | Pipeline                                    |
| `perf`     | Desempenho                                  |
| `style`    | Formatação (sem mudança de lógica)          |

Escopos usados: `api`, `web`, `db`, `contracts`, `deps`, `ci`.

Exemplos:

```
feat(web): estoque agrupado por equipamento com filtros de modelo e tamanho
fix(api): recusar devolução maior que a quantidade pendente
docs: guia do usuário com o fluxo de entrega
```

O hook `pre-commit` roda `pnpm lint`; um commit com erro de lint é bloqueado.

## Checklist do Pull Request

- [ ] A regra de negócio e a autorização estão **na API** (não só na tela)
- [ ] Entradas validadas com schema do `@epi-manager/contracts`; nada de `any`
- [ ] Mudança de banco tem migration versionada (e `CHECK`/índice escritos à mão quando necessário)
- [ ] Operações em várias tabelas usam transação e gravam auditoria na mesma transação
- [ ] Testes cobrindo o comportamento novo (integração para regras da API)
- [ ] Telas com estados de carregando, vazio e erro; testadas em 360 px e 1440 px
- [ ] Rótulos e `aria-label` em campos e botões de ícone; lint `jsx-a11y` limpo
- [ ] Nenhum segredo, senha ou `.env` no commit
- [ ] Documentação atualizada (README, `docs/`, CHANGELOG) quando a mudança for visível

## Segurança

Não abra issue pública para vulnerabilidades. Comunique o responsável técnico do projeto; veja
[SECURITY.md](SECURITY.md).
