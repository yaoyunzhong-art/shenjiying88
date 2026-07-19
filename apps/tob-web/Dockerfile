# ─────────────────────────────────────────────────────────────
# M5 ToB Web Dockerfile (multi-stage, pnpm + monorepo)
# Next.js standalone output
# ─────────────────────────────────────────────────────────────

# ─── Stage 1: deps ───
FROM node:22-alpine AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

RUN apk add --no-cache tini

WORKDIR /workspace

# 1) 复制 workspace 根 + 锁文件
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/tob-web/package.json apps/tob-web/
COPY packages/types/package.json packages/types/
COPY packages/domain/package.json packages/domain/
COPY packages/sdk/package.json packages/sdk/
COPY packages/ui/package.json packages/ui/

# 2) 安装依赖 (含 devDependencies, 用于 build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Stage 2: build ───
FROM deps AS build

WORKDIR /workspace

# 复制所有需要的源码
COPY tsconfig.base.json ./
COPY packages/config-typescript ./packages/config-typescript
COPY packages/types ./packages/types
COPY packages/domain ./packages/domain
COPY packages/sdk ./packages/sdk
COPY packages/ui ./packages/ui
COPY apps/tob-web ./apps/tob-web

# 先构建依赖的 workspace packages
RUN pnpm --filter @m5/types build
RUN pnpm --filter @m5/domain build
RUN pnpm --filter @m5/sdk build
RUN pnpm --filter @m5/ui build

# 构建 Next.js (output: standalone)
RUN pnpm --filter @m5/tob-web build

# 使用 pnpm deploy 提取生产依赖
RUN pnpm deploy --legacy --filter @m5/tob-web --prod /workspace/deploy/tob-web

# 复制 .next 产物和 public 资源到 deploy 目录
RUN cp -r apps/tob-web/.next /workspace/deploy/tob-web/.next && \
    cp -r apps/tob-web/public /workspace/deploy/tob-web/public 2>/dev/null || true

# ─── Stage 3: runtime ───
FROM node:22-alpine AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

RUN apk add --no-cache tini wget

# 非 root user
RUN addgroup -g 1001 -S app && \
    adduser -S app -u 1001 -G app

WORKDIR /app

# 复制 deploy 产物
COPY --from=build --chown=app:app /workspace/deploy/tob-web ./

ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0

USER app

EXPOSE 3004

ENTRYPOINT ["/sbin/tini", "--"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3004/ || exit 1

# Next.js standalone entry: server.js in the root of .next/standalone
CMD ["node", "apps/tob-web/server.js"]
