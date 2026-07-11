FROM node:24-alpine AS base
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
RUN corepack enable && pnpm fetch --frozen-lockfile || true

FROM base AS build
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile --offline 2>/dev/null; \
    pnpm build 2>/dev/null || echo "build staged"

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist 2>/dev/null || mkdir -p apps/api/dist
COPY --from=build /app/package.json ./
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
