# Gestor

Monorepo **TypeScript** para gestão **multi-tenant**: painel web (Next.js), app móvel (Expo) e API tipada (tRPC). O núcleo de negócio integra-se a bases **MySQL** por tenant (ERP legado / DFE), enquanto metadados de aplicação, usuários, assinaturas e tenants ficam em **PostgreSQL**.

O projeto nasceu a partir do [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack); a estrutura evoluiu com pacotes próprios (`@gestor/*`) e múltiplos bancos.

---

## Visão geral da arquitetura

| Camada | Tecnologia | Papel |
|--------|------------|--------|
| Web | Next.js 16, React 19, Tailwind 4, tRPC + TanStack Query | Áreas `(tenant)` e `(admin)`, autenticação `(auth)` |
| Mobile | Expo 55, React Native, expo-router | Cliente tRPC alinhado ao pacote `@gestor/api` |
| API | tRPC 11, Zod | Rotas `admin`, `tenant`, `audit`, `permission`, `debug` |
| Auth | Better Auth (sessão, 2FA, passkey, integração Expo) | E-mail via Resend ou SMTP |
| Dados centrais | Prisma + PostgreSQL (`@gestor/db`) | Usuários, tenants, planos, assinaturas, credenciais de DB por tenant |
| Dados ERP / DFE | Prisma + MySQL (`@gestor/db-gestor`, `@gestor/db-dfe`) | Leitura/escrita nas bases legadas (credenciais configuradas por tenant no Postgres) |

Fluxo resumido: o utilizador autentica-se contra o Postgres; o contexto tRPC resolve tenant, role, permissões e assinatura; operações de negócio usam clientes Prisma MySQL quando o tenant tem credenciais completas (`dbHost`, `dbPort`, `dbUsername`, `dbPassword`).

---

## Funcionalidades principais (web)

- **Tenant**: dashboard, vendas (lista, orçamentos), produtos (lista, cartazes, venda), financeiro (contas a pagar/receber, fechamento), notas (entrada, DFE), relatórios (vendas, financeiro, estoque, produtos, vendedores, tipos), utilizadores, perfil, definições, suporte.
- **Admin**: tenants, utilizadores globais, planos, subscrições, permissões, filiais, suporte, auditoria, estado do sistema, estatísticas.
- **Auth**: login, recuperação de password, ativação de conta, 2FA.
- **PWA**: manifest em `apps/web/src/app/manifest.ts` e ícones em `public/favicon/`.

---

## Requisitos

- [Node.js](https://nodejs.org/) compatível com as versões do monorepo
- [pnpm](https://pnpm.io/) 10.x (definido em `packageManager` na raiz)
- **PostgreSQL** para `@gestor/db`
- **MySQL** para desenvolvimento ou introspection de `@gestor/db-gestor` e `@gestor/db-dfe` (conforme o teu ambiente)

---

## Começar

```bash
pnpm install
```

### Variáveis de ambiente

1. Copia `apps/web/.env.example` para `apps/web/.env`.
2. Preenche pelo menos `DATABASE_URL` (Postgres para correr a app), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` / URLs públicas conforme o Better Auth, `CORS_ORIGIN`, e e-mail (`RESEND_*` ou `SMTP_*`).
3. Para produção, usa `apps/web/.env.production.example` como referência.

**Prisma:** `@gestor/db`, `@gestor/db-gestor` e `@gestor/db-dfe` carregam o mesmo ficheiro `apps/web/.env` (via `prisma.config.ts` em cada pacote) e usam a variável `DATABASE_URL`. Em desenvolvimento, para `db:gestor:*` ou `db:dfe:*`, o valor de `DATABASE_URL` tem de ser uma URL **MySQL** válida para esse schema; para a app e `db:push` no pacote principal, deve ser **PostgreSQL**. Se precisares dos dois ao mesmo tempo sem trocar o ficheiro, considera estender o projeto com variáveis separadas (ex.: `GESTOR_DATABASE_URL`) e ajustar os `prisma.config.ts` — hoje o repositório assume um único `DATABASE_URL` por contexto de comando.

### Banco principal (PostgreSQL)

```bash
pnpm run db:generate
pnpm run db:push
# ou migrações:
pnpm run db:migrate
```

### Bancos Gestor e DFE (MySQL)

Geração de clientes e Studio por pacote:

```bash
pnpm run db:gestor:generate
pnpm run db:gestor:studio

pnpm run db:dfe:generate
pnpm run db:dfe:studio
```

### Desenvolvimento

- **Tudo o que o Turbo tiver com `dev`**: `pnpm run dev`
- **Só a web** (porta **3001**): `pnpm run dev:web` → [http://localhost:3001](http://localhost:3001)
- **Só o Expo**: `pnpm run dev:native` (usa a app Expo Go ou build nativo)

---

## Estrutura do repositório

```
gestor/
├── apps/
│   ├── web/                 # Next.js — UI tenant, admin e auth
│   └── native/              # Expo — cliente móvel
├── packages/
│   ├── api/                 # tRPC — routers e middleware
│   ├── auth/                # Better Auth, e-mail, passkey
│   ├── db/                  # Prisma — PostgreSQL (app)
│   ├── db-gestor/           # Prisma — MySQL (ERP / gestor)
│   ├── db-dfe/              # Prisma — MySQL (DFE)
│   └── config/              # Configuração partilhada (TypeScript)
├── package.json             # Scripts e workspaces pnpm
├── pnpm-workspace.yaml      # Workspaces + catalog de versões
└── turbo.json               # Pipeline Turbo (build, dev, db:*)
```

### Pacote `@gestor/api` (resumo)

- **Middleware**: sessão, roles (`SUPER_ADMIN`, etc.), tenant ativo, subscrição, permissões em cache.
- **Admin**: CRUD de tenants e users, planos, subscrições, suporte, auditoria, permissões, filiais, status, stats.
- **Tenant**: dashboard, empresas, clientes, fornecedores, grupos, vendas, orçamentos, produtos, financeiro (fechamento, contas, recebimentos), faturação (entrada, DFE), relatórios, vendedores, tipos de recebimento, utilizadores do tenant, suporte, testes de ligação às bases MySQL.

---

## Scripts úteis (raiz)

| Script | Descrição |
|--------|-----------|
| `pnpm run dev` | Dev em paralelo (Turbo) |
| `pnpm run dev:web` | Apenas `apps/web` |
| `pnpm run dev:native` | Apenas `apps/native` |
| `pnpm run build` | Build de todos os pacotes/apps |
| `pnpm run check-types` | Verificação TypeScript |
| `pnpm run check` | Biome (`check --write`) |
| `pnpm run db:push` | `prisma db push` em `@gestor/db` |
| `pnpm run db:generate` | Gera cliente `@gestor/db` |
| `pnpm run db:migrate` | Migrações dev em `@gestor/db` |
| `pnpm run db:studio` | Prisma Studio — Postgres principal |
| `pnpm run db:gestor:generate` / `db:gestor:studio` | Cliente / Studio — `db-gestor` |
| `pnpm run db:dfe:generate` / `db:dfe:studio` | Cliente / Studio — `db-dfe` |

**Qualidade de código**: Husky + lint-staged executam [Ultracite](https://github.com/haydenbleasel/ultracite) em ficheiros alterados; a formatação/lint base usa Biome.

---

## Licença e contribuição

Este repositório é **privado**.
