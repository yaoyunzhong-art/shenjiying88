# ─────────────────────────────────────────────────────────────
# M5 API Dockerfile (multi-stage, pnpm + monorepo)
# ─────────────────────────────────────────────────────────────

# ─── Stage 1: deps ───
FROM node:22-alpine AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# OpenSSL for Prisma
RUN apk add --no-cache openssl tini

WORKDIR /workspace

# 1) 复制 workspace 根 + 锁文件
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
COPY packages ./packages

# 2) 安装依赖 (含 devDependencies,用于 build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# 3) 跑 Prisma generate
RUN pnpm --filter @m5/api prisma:generate

# ─── Stage 2: build ───
FROM deps AS build

# 复制 api 源码
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

# 跑 TypeScript 编译
RUN pnpm --filter @m5/api build

# 清理 dev deps 缩减 prod node_modules
RUN pnpm deploy --legacy --filter @m5/api --prod /workspace/deploy/api

# ─── Stage 3: runtime ───
FROM node:22-alpine AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

RUN apk add --no-cache openssl tini wget

# 非 root user
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app

WORKDIR /app

# 复制 prod 部署产物 (含 dist + node_modules)
COPY --from=build --chown=app:app /workspace/deploy/api ./

# Prisma schema + 生成的 client
COPY --from=build --chown=app:app /workspace/apps/api/prisma ./prisma

ENV NODE_ENV=production
ENV API_PORT=3001

USER app

EXPOSE 3001

# tini 转发信号 + PID 1
ENTRYPOINT ["/sbin/tini", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/v1/health/ping || exit 1

CMD ["node", "dist/main.js"]
