# Dockerfile para aplicação Next.js em monorepo
FROM node:20-alpine AS base

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Stage de dependências
FROM base AS deps

# Copiar todos os package.json dos workspaces
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/db-gestor/package.json ./packages/db-gestor/
COPY packages/db-dfe/package.json ./packages/db-dfe/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/

# Instalar dependências
# Tenta com frozen-lockfile primeiro, se falhar, atualiza o lockfile
RUN pnpm install --frozen-lockfile || (echo "Lockfile desatualizado, atualizando..." && pnpm install --no-frozen-lockfile && echo "Lockfile atualizado com sucesso")

# Stage de build
FROM base AS builder

# Variáveis de ambiente necessárias para o build
# (valores fake apenas para permitir o build, serão substituídos em runtime)
ENV BETTER_AUTH_SECRET=build-time-secret-123456789012345678901234567890
ENV DATABASE_URL=postgresql://user:password@localhost:5432/dbname
ENV CORS_ORIGIN=http://localhost:3000

# Copiar tudo do stage deps (incluindo node_modules e packages com suas dependências)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copiar código fonte (isso sobrescreve apenas os arquivos de código, mantendo node_modules)
COPY apps/web/src ./apps/web/src
COPY apps/web/public ./apps/web/public
COPY apps/web/next.config.ts ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/postcss.config.mjs ./apps/web/
COPY apps/web/components.json ./apps/web/
COPY packages/db/src ./packages/db/src
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/prisma.config.ts ./packages/db/
COPY packages/db/tsconfig.json ./packages/db/
COPY packages/db-gestor/src ./packages/db-gestor/src
COPY packages/db-gestor/prisma ./packages/db-gestor/prisma
COPY packages/db-gestor/prisma.config.ts ./packages/db-gestor/
COPY packages/db-gestor/tsconfig.json ./packages/db-gestor/
COPY packages/db-dfe/src ./packages/db-dfe/src
COPY packages/db-dfe/prisma ./packages/db-dfe/prisma
COPY packages/db-dfe/prisma.config.ts ./packages/db-dfe/
COPY packages/db-dfe/tsconfig.json ./packages/db-dfe/
COPY packages/api/src ./packages/api/src
COPY packages/api/tsconfig.json ./packages/api/
COPY packages/auth/src ./packages/auth/src
COPY packages/auth/tsconfig.json ./packages/auth/
COPY packages/config/tsconfig.base.json ./packages/config/

# Gerar Prisma Clients para todos os bancos de dados
RUN pnpm --filter @gestor/db db:generate || true
RUN pnpm --filter @gestor/db-gestor db:generate || true
RUN pnpm --filter @gestor/db-dfe db:generate || true

# Build da aplicação
RUN pnpm build --filter=web

# Stage de produção
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários do build standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar a aplicação
CMD ["node", "apps/web/server.js"]
