# ═══════════════════════════════════════════════════════════════
# M5 Monorepo — 根 Dockerfile (多阶段构建)
#
# 构建产物:
#   docker build --target=api-prod    -t m5-api:latest .
#   docker build --target=admin-prod  -t m5-admin:latest .
#   docker build --target=storefront-prod -t m5-storefront:latest .
#   docker build --target=tob-prod    -t m5-tob:latest .
#
# 开发镜像:
#   docker build --target=api-dev     -t m5-api:dev .
# ═══════════════════════════════════════════════════════════════

# ─── 基础镜像 ─────────────────────────────────────────────
FROM docker.m.daocloud.io/library/node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

WORKDIR /workspace

# ─── 依赖层 ──────────────────────────────────────────────
FROM base AS deps

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json turbo.json eslint.config.mjs ./

# 复制所有 apps/package.json (结构声明,不含源码)
COPY apps/api/package.json         apps/api/
COPY apps/admin-web/package.json   apps/admin-web/
COPY apps/storefront-web/package.json apps/storefront-web/
COPY apps/tob-web/package.json     apps/tob-web/
COPY apps/app/package.json         apps/app/
COPY apps/mobile/package.json      apps/mobile/
COPY apps/miniapp/package.json     apps/miniapp/

# 复制所有 packages/*/package.json
COPY packages/domain/package.json   packages/domain/
COPY packages/sdk/package.json     packages/sdk/
COPY packages/types/package.json   packages/types/
COPY packages/ui/package.json      packages/ui/
COPY packages/config-typescript/package.json packages/config-typescript/

# API 特有的 prisma schema (用于 generate)
COPY apps/api/prisma                apps/api/prisma

RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm config set node-linker hoisted

RUN pnpm install --frozen-lockfile --ignore-scripts

# Prisma generate (需要 schema + client 依赖)
RUN pnpm --filter @m5/api prisma:generate

# ─── 构建层 ──────────────────────────────────────────────
FROM deps AS build

COPY tsconfig.base.json turbo.json ./

# 复制全部源码 (monorepo 构建需要)
COPY packages/domain/src           packages/domain/src
COPY packages/domain/tsconfig.json packages/domain/
COPY packages/sdk/src              packages/sdk/src
COPY packages/sdk/tsconfig.json    packages/sdk/
COPY packages/types/src            packages/types/src
COPY packages/types/tsconfig.json  packages/types/
COPY packages/ui/src               packages/ui/src
COPY packages/ui/tsconfig.json     packages/ui/
COPY packages/config-typescript/   packages/config-typescript/

COPY apps/api/src                  apps/api/src
COPY apps/api/tsconfig.json        apps/api/
COPY apps/api/tsconfig.build.json  apps/api/

COPY apps/app/                     apps/app/
COPY apps/miniapp/                 apps/miniapp/
COPY apps/admin-web/               apps/admin-web/
COPY apps/storefront-web/          apps/storefront-web/
COPY apps/tob-web/                 apps/tob-web/

# 构建 API 及其依赖
RUN pnpm turbo build --filter=@m5/api...

# 分别构建三个前端，产出 Next standalone 目录供运行时镜像直接拷贝
RUN pnpm --filter @m5/admin-web build
RUN pnpm --filter @m5/storefront-web build
RUN pnpm --filter @m5/tob-web build

# ──────────────────────────────────────────────────────────
# 🎯 目标: api-prod
# ──────────────────────────────────────────────────────────
FROM base AS api-prod

WORKDIR /app

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

# 使用 pnpm deploy 提取最小生产依赖
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/packages ./packages
COPY --from=build /workspace/packages/domain/dist ./packages/domain/dist
COPY --from=build /workspace/packages/types/dist ./packages/types/dist
RUN mkdir -p node_modules/@m5 && ln -sf ../../packages/types node_modules/@m5/types && ln -sf ../../packages/domain node_modules/@m5/domain

COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/prisma ./prisma
COPY --from=build /workspace/apps/api/package.json ./

ENV NODE_ENV=production
ENV API_PORT=3001

USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/v1/health/ping').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/apps/api/src/main.js"]

# ──────────────────────────────────────────────────────────
# 🎯 目标: admin-prod
# ──────────────────────────────────────────────────────────
FROM base AS admin-prod

WORKDIR /app

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

COPY --from=build /workspace/apps/admin-web/.next ./.next
COPY --from=build /workspace/apps/admin-web/package.json ./
COPY --from=build /workspace/apps/admin-web/next.config.mjs ./

ENV NODE_ENV=production
ENV PORT=3002

USER app

EXPOSE 3002

ENTRYPOINT ["/sbin/tini", "--"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/api/health || exit 1

CMD ["node", ".next/standalone/apps/admin-web/server.js"]

# ──────────────────────────────────────────────────────────
# 🎯 目标: storefront-prod
# ──────────────────────────────────────────────────────────
FROM base AS storefront-prod

WORKDIR /app

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

COPY --from=build /workspace/apps/storefront-web/.next ./.next
COPY --from=build /workspace/apps/storefront-web/package.json ./
COPY --from=build /workspace/apps/storefront-web/next.config.mjs ./

ENV NODE_ENV=production
ENV PORT=3003

USER app

EXPOSE 3003

ENTRYPOINT ["/sbin/tini", "--"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3003/api/health || exit 1

CMD ["node", ".next/standalone/apps/storefront-web/server.js"]

# ──────────────────────────────────────────────────────────
# 🎯 目标: tob-prod
# ──────────────────────────────────────────────────────────
FROM base AS tob-prod

WORKDIR /app

RUN addgroup -g 1001 -S app && adduser -S app -u 1001 -G app

COPY --from=build /workspace/apps/tob-web/.next ./.next
COPY --from=build /workspace/apps/tob-web/package.json ./
COPY --from=build /workspace/apps/tob-web/next.config.mjs ./

ENV NODE_ENV=production
ENV PORT=3011

USER app

EXPOSE 3011

ENTRYPOINT ["/sbin/tini", "--"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3011/api/health || exit 1

CMD ["node", ".next/standalone/apps/tob-web/server.js"]
