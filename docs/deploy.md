# Deploy em produção

Guia para publicar o sistema num servidor próprio (VM Linux). A mesma lógica vale para contêineres
ou PaaS: **um PostgreSQL**, **a API Node** e **arquivos estáticos do web** atrás de um proxy reverso
com HTTPS, todos no **mesmo domínio**.

## Sumário

- [Topologia](#topologia)
- [Requisitos do servidor](#requisitos-do-servidor)
- [1. Banco de dados](#1-banco-de-dados)
- [2. Build](#2-build)
- [3. Configuração da API](#3-configuração-da-api)
- [4. Migrations](#4-migrations)
- [5. Processo da API (systemd)](#5-processo-da-api-systemd)
- [6. Proxy reverso e HTTPS (Nginx)](#6-proxy-reverso-e-https-nginx)
- [7. Primeiro acesso](#7-primeiro-acesso)
- [Atualizar para uma nova versão](#atualizar-para-uma-nova-versão)
- [Backup e restauração](#backup-e-restauração)
- [Monitoramento](#monitoramento)
- [Checklist de produção](#checklist-de-produção)

## Topologia

```
                 https://epi.suaempresa.com.br
navegador ─────────────► Nginx (TLS)
                           ├─ /        → arquivos de apps/web/dist (SPA; fallback index.html)
                           └─ /api/*   → API Node em 127.0.0.1:3333
                                              │
                                              ▼
                                        PostgreSQL 16
```

Por que o mesmo domínio: o refresh token vai num cookie `httpOnly` com `SameSite=Strict` e
`Path=/api/auth`. Com web e API no mesmo site não é preciso CORS nem token CSRF. Se for
indispensável separar as origens, configure `CORS_ORIGIN` na API, mas a recomendação é o proxy.

## Requisitos do servidor

- Linux com Node.js 22 LTS e pnpm 9 (`corepack enable`).
- PostgreSQL 16 (local ou gerenciado), de preferência com collation `pt_BR.UTF-8`.
- Nginx (ou outro proxy reverso) e certificado TLS (ex.: Let's Encrypt). **HTTPS é obrigatório**: o
  cookie de sessão é `Secure` em produção e a câmera do leitor de QR só funciona em HTTPS.
- Dimensionamento inicial: 1 vCPU e 1–2 GB de RAM atendem um almoxarifado com folga.

## 1. Banco de dados

```sql
CREATE ROLE epi_manager LOGIN PASSWORD '<senha-forte>';
CREATE DATABASE epi_manager OWNER epi_manager
  ENCODING 'UTF8' LC_COLLATE 'pt_BR.UTF-8' LC_CTYPE 'pt_BR.UTF-8' TEMPLATE template0;
```

Use um usuário só para a aplicação e restrinja o acesso de rede ao servidor da API.

## 2. Build

```bash
git clone https://github.com/mdevsec-code/Controle-de-EPI.git /opt/epi
cd /opt/epi
git checkout <tag-ou-commit>
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build          # contracts, database, api (apps/api/dist) e web (apps/web/dist)
```

## 3. Configuração da API

Crie `/opt/epi/apps/api/.env` (permissão `600`, dono = usuário do serviço):

```dotenv
NODE_ENV=production
PORT=3333
DATABASE_URL="postgresql://epi_manager:<senha>@localhost:5432/epi_manager?schema=public"
# node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
JWT_SECRET="<segredo-aleatorio-com-48-bytes>"
# 1 = um proxy (Nginx) à frente da API; necessário para o IP real no rate limit e na auditoria
TRUST_PROXY=1
```

O Prisma CLI (migrations) lê o `.env` da **raiz**; crie `/opt/epi/.env` só com o `DATABASE_URL`
(não precisa das senhas do seed, que não roda em produção).

A API valida o ambiente ao iniciar e **não sobe** com `JWT_SECRET` curto ou de exemplo.

## 4. Migrations

```bash
cd /opt/epi
pnpm db:deploy      # aplica apenas migrations pendentes; seguro de rodar a cada versão
```

Sempre **antes** de iniciar a nova versão da API. Nunca rode `db:migrate` (desenvolvimento) nem
`db:seed` em produção; o seed recusa rodar com `NODE_ENV=production`.

## 5. Processo da API (systemd)

`/etc/systemd/system/epi-api.service`:

```ini
[Unit]
Description=ENGENOVA EPI - API
After=network.target postgresql.service

[Service]
Type=simple
User=epi
WorkingDirectory=/opt/epi/apps/api
EnvironmentFile=/opt/epi/apps/api/.env
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now epi-api
curl -s http://127.0.0.1:3333/api/health      # {"status":"ok"}
```

Os logs (winston, JSON) vão para o journal: `journalctl -u epi-api -f`.

> O rate limit por IP fica em memória. Com **uma** instância da API isso é suficiente; para várias
> instâncias atrás de um balanceador, troque por um store compartilhado (ex.: Redis).

## 6. Proxy reverso e HTTPS (Nginx)

`/etc/nginx/sites-available/epi`:

```nginx
server {
  listen 443 ssl http2;
  server_name epi.suaempresa.com.br;

  ssl_certificate     /etc/letsencrypt/live/epi.suaempresa.com.br/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/epi.suaempresa.com.br/privkey.pem;

  # Cabeçalhos da SPA (a API já envia os seus via helmet)
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(self), microphone=(), geolocation=()" always;
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

  # API
  location /api/ {
    proxy_pass http://127.0.0.1:3333;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 1m;           # entregas com assinatura (a API limita a 512 KB)
  }

  # Web (SPA)
  root /opt/epi/apps/web/dist;
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri =404;
  }
  location / {
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;
  }
}

server {
  listen 80;
  server_name epi.suaempresa.com.br;
  return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/epi /etc/nginx/sites-enabled/epi
sudo nginx -t && sudo systemctl reload nginx
```

Os arquivos em `/assets/` têm hash no nome e podem ficar em cache por 1 ano; o `index.html` não,
para que uma nova versão seja carregada na hora. Teste a CSP no navegador (console) depois do
primeiro deploy: o leitor de QR precisa de `media-src blob:` e da permissão `camera=(self)`.

## 7. Primeiro acesso

O seed não roda em produção. Crie o primeiro ADMIN direto no banco, com senha **provisória**
(o sistema obriga a troca no primeiro login):

```bash
# gera o hash bcrypt (custo 12) da senha provisória
cd /opt/epi/apps/api
node -e "require('bcrypt').hash(process.argv[1], 12).then(console.log)" 'SenhaProvisoria@2026'
```

```sql
INSERT INTO users (id, name, email, password_hash, role, must_change_password, updated_at)
VALUES (gen_random_uuid()::text, 'Administrador', 'admin@suaempresa.com.br',
        '<hash-gerado-acima>', 'ADMIN', true, now());
```

Depois, autenticado como ADMIN (pela API, já que as telas de cadastro organizacional ainda não
existem; veja [api.md](api.md#organização)):

1. `POST /api/companies` → `POST /api/business-units` → `POST /api/departments` e `POST /api/job-roles`.
2. `POST /api/warehouses` para cada almoxarifado.
3. No sistema: **Usuários** → criar os almoxarifes e vincular aos almoxarifados.
4. **EPIs** → cadastrar EPIs e CAs; **Estoque** → entradas de material com local de armazenamento.
5. **Colaboradores** → cadastrar e imprimir os crachás com QR Code.

## Atualizar para uma nova versão

```bash
cd /opt/epi
git fetch && git checkout <nova-tag>
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
pg_dump --format=custom --file=/var/backups/epi/pre-$(date +%F-%H%M).dump "$DATABASE_URL"   # segurança
pnpm db:deploy
sudo systemctl restart epi-api
```

O web é atualizado assim que o `apps/web/dist` muda (o `index.html` não fica em cache). Usuários com
o sistema aberto recebem a nova versão ao navegar ou recarregar.

## Backup e restauração

Agende um backup diário (ex.: `cron` às 2h) e guarde cópias fora do servidor:

```bash
pg_dump --format=custom --file=/var/backups/epi/epi-$(date +%F).dump "$DATABASE_URL"
find /var/backups/epi -name 'epi-*.dump' -mtime +30 -delete      # retenção de 30 dias
```

Restauração (em um banco vazio ou de homologação primeiro):

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" epi-2026-10-07.dump
```

As assinaturas ficam no próprio banco (`delivery_signatures`): o backup do banco é o backup das
evidências. Defina a política de retenção (LGPD) junto com o SESMT/jurídico.

## Monitoramento

- **Saúde:** `GET /api/health` (para o balanceador ou um monitor externo).
- **Logs:** `journalctl -u epi-api`. Erros 5xx são registrados com stack; as respostas ao cliente
  nunca expõem detalhes internos.
- **Auditoria:** tabela `audit_logs` (logins com falha, bloqueios, reuso de sessão, alterações).
  Vale revisar periodicamente `LOGIN_BLOQUEADO` e `SESSAO_REUSO_DETECTADO`.
- **Banco:** espaço em disco (assinaturas), conexões e duração do backup.

## Checklist de produção

- [ ] HTTPS ativo e HTTP redirecionando para HTTPS
- [ ] `NODE_ENV=production` e `JWT_SECRET` aleatório (≥ 32 caracteres), fora do Git
- [ ] `TRUST_PROXY` igual ao número de proxies à frente da API
- [ ] `pnpm db:deploy` executado; seed **não** executado
- [ ] Primeiro ADMIN criado com senha provisória e trocada no 1º acesso
- [ ] Web e API no mesmo domínio (`/api` pelo proxy); sem `CORS_ORIGIN`
- [ ] CSP e cabeçalhos de segurança configurados no proxy; câmera funcionando no celular
- [ ] Backup diário agendado, testado com uma restauração e copiado para fora do servidor
- [ ] Monitor do `/api/health` e acesso aos logs
- [ ] Usuário de banco exclusivo da aplicação, sem acesso de rede externo
