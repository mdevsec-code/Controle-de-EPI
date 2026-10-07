# Segurança

Modelo de segurança do sistema de entrega de EPIs da ENGENOVA e decisões tomadas na refatoração.
Vulnerabilidades: comunicar ao responsável técnico do projeto, sem abrir issue pública.

## Autenticação

| Item          | Implementação                                                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Senhas        | bcrypt custo 12. Política: ≥ 10 caracteres na criação/troca. Senha definida pelo ADMIN é provisória (`mustChangePassword`), com troca obrigatória no 1º acesso.  |
| Access token  | JWT HS256, 15 min, `iss`/`aud` fixos, claims validadas com Zod. Guardado **só em memória** no navegador (nunca em `localStorage`).                               |
| Revogação     | Cada requisição confere no banco se o usuário está ativo e se o `tokenVersion` confere. Desativar, trocar perfil/almoxarifados ou senha invalida tokens na hora. |
| Refresh token | Opaco (384 bits), 7 dias, cookie `httpOnly` + `Secure` (produção) + `SameSite=Strict` + `Path=/api/auth`. No banco só o SHA-256.                                 |
| Rotação       | Atômica (`UPDATE … WHERE revoked_at IS NULL`). Reapresentar um token já usado fora da janela de 30 s revoga **todas** as sessões do usuário e gera auditoria.    |
| Força bruta   | Bloqueio por conta (5 falhas → 15 min, persistido no banco) + rate limit por IP separado para login (50/15 min) e refresh (300/15 min).                          |
| Enumeração    | E-mail inexistente compara contra um hash bcrypt real (mesmo tempo de resposta) e recebe a mesma mensagem de senha errada.                                       |
| Logout        | Revoga o refresh token no servidor e limpa todo cache de dados no cliente.                                                                                       |

## Autorização

- Perfis: `ADMIN` e `ALMOXARIFADO`. Cada rota declara os perfis no backend (`authorize`); esconder
  botões no web é só conveniência.
- **Escopo de dados**: o almoxarife só acessa os almoxarifados vinculados ao seu usuário e os
  colaboradores das unidades desses almoxarifados. Registros fora do escopo respondem 404 (não
  revelam que existem).
- **Minimização**: almoxarife recebe CPF mascarado e não recebe o código do crachá; a leitura por
  QR devolve só a visão mínima do colaborador.

## QR Code do crachá

- O QR contém **apenas** um código aleatório de 144 bits (`badgeCode`), sem CPF, matrícula ou ID.
- O código só é resolvido pela API, por usuário autenticado e dentro do escopo; reemitir invalida o
  anterior (crachá perdido).

## Entrega, estoque e assinatura

- Local de armazenamento: só altera texto descritivo (até 60 caracteres, `CHECK` no banco), exige
  acesso ao almoxarifado do item e é auditado com o valor anterior e o novo.
- O cliente nunca envia saldo: a baixa é um `UPDATE` condicional no banco, dentro da transação da
  entrega; o `CHECK (quantity >= 0)` é a rede de segurança. Ver ARCHITECTURE.md.
- Idempotência por `idempotencyKey` (reenvio não duplica a entrega).
- Assinatura: PNG validado por _magic bytes_ (não basta o prefixo `data:image/png`), limite de
  300 KB, servida sempre como `image/png` com `Content-Security-Policy: default-src 'none'` e
  `Cache-Control: private, no-store`.
- Integridade: SHA-256 do conteúdo canônico da entrega + imagem, exibido no comprovante.
- Entregas são imutáveis; correções acontecem por devolução, que também gera movimentação e auditoria.

## Validação e erros

- Toda entrada (body, query, params) é validada no backend com os schemas do `@epi-manager/contracts`.
- Respostas de erro têm código estável e mensagem útil; stack traces e SQL ficam só no log.
- Corpo JSON limitado a 100 KB (512 KB apenas em `/api/deliveries`, por causa da assinatura).

## Auditoria

`audit_logs` registra quem, quando, o quê, qual registro, estado anterior/posterior (sem hash de
senha), IP e user-agent para: login (sucesso, falha, bloqueio), logout, reuso de sessão, troca e
redefinição de senha, criação/edição de cadastros, alteração de status e permissões, reemissão de
crachá, cancelamento de CA, entradas e ajustes de estoque, mudança de local de armazenamento,
entregas e devoluções. Sempre gravado na mesma transação da operação.

## Infraestrutura

- `helmet` (headers de segurança), `x-powered-by` desligado, `trust proxy` configurável.
- Sem CORS por padrão (web e API no mesmo site via proxy `/api`).
- Segredos só em variáveis de ambiente; `.env` fora do git; `JWT_SECRET` de exemplo é recusado em
  produção; seed bloqueado em produção.
- Fontes servidas pelo próprio app (sem requisições a terceiros a cada acesso).

## Riscos conhecidos e próximos passos

- Rate limit por IP fica em memória: com mais de uma instância da API, usar store compartilhada.
- Ainda não há recuperação de senha por e-mail: o ADMIN redefine a senha (provisória).
- Definir política de retenção (LGPD) para assinaturas, fotos e logs de auditoria.
- CSP para a SPA deve ser configurada no servidor web/proxy que a serve.
