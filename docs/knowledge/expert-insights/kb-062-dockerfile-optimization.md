# Dockerfile优化技巧

> 分类: DevOps | 标签: Docker, Dockerfile, 镜像优化, 构建性能 | 适用: DevOps, 开发

## 概述

Dockerfile的质量直接影响镜像构建速度、镜像大小、部署速度和运行时安全性。一个优化良好的Dockerfile可以生成体积小、构建快、漏洞少、部署快的镜像。Shenjiying88系统早期使用的Dockerfile构建出的Node.js镜像体积为1.2GB，构建时间超过5分钟。通过多阶段构建和依赖缓存优化，镜像体积降至98MB(减少92%），构建时间缩短至45秒。

根据Docker Inc的报告，镜像体积每减少50%，拉取时间减少约40%，部署速度提升约30%。同时，更小的镜像意味着更小的攻击面——less packages installed means less CVEs to worry about。Shenjiying88的镜像优化策略包括：多阶段构建、依赖缓存分层、基础镜像精简、非root用户运行、层级压缩和安全性扫描。

## 核心原则

- **原则1: 多阶段构建(Multi-stage Build）**: 构建阶段使用带编译工具的完整镜像(`node:20-slim`），运行阶段使用最小基础镜像(`node:20-alpine`）。构建阶段生成编译产物，运行阶段仅复制编译产物和运行时依赖。Shenjiying88的NestJS镜像: 第一阶段`npm run build` + `npm ci --production`，第二阶段将 `dist/` 和 `node_modules/` 复制到 `node:20-alpine` 镜像。
- **原则2: 依赖缓存分层**: 先复制 `package.json` 和 `pnpm-lock.yaml`，执行 `RUN pnpm install`(这一层只有在依赖变更时才重建，利用Docker的Layer Cache），然后再复制源代码。这样源代码修改不会触发 `pnpm install`，节省大量构建时间。Shenjiying88用 `COPY package*.json ./` → `RUN pnpm install` → `COPY . .` 的顺序。
- **原则3: 精简基础镜像**: 使用 `node:20-alpine` 而非 `node:20`(Alpine体积约5MB vs 完整镜像约300MB）。对于不需要编译原生模块的服务，Alpine Linux的musl libc和busybox已足够。Shenjiying88还裁剪了Alpine镜像中的不必要工具：`apk del` 构建时安装的编译工具，运行时不留。
- **原则4: 非root用户运行**: Dockerfile中创建非root用户并切换到该用户运行应用。`RUN addgroup -S appgroup && adduser -S appuser -G appgroup` + `USER appuser`。这防止了容器被攻破后攻击者获得root权限。Shenjiying88的审计服务监听在3000端口(非特权端口<1024）配合非root用户。
- **原则5: 漏洞扫描集成**: 镜像构建完成后自动使用Trivy或Docker Scout扫描CVE漏洞。Critical/High级别的漏洞阻断镜像推送。Shenjiying88的CI流水线在 `docker build` 后执行 `trivy image --severity HIGH,CRITICAL`，如果发现漏洞则构建失败。

## 实践案例（基于shenjiying88项目）

- **案例1: Audit Service的Dockerfile**: `FROM node:20-slim AS builder` → `WORKDIR /app` → `COPY package*.json pnpm-lock.yaml ./` → `RUN pnpm install`(`--frozen-lockfile`确保依赖一致） → `COPY . .` → `RUN pnpm run build`。第二阶段 `FROM node:20-alpine AS runner` → `WORKDIR /app` → 复制 `node_modules` 和 `dist/` → `RUN addgroup -S appgroup && adduser -S appuser -G appgroup` → `USER appuser` → `EXPOSE 3000` → `CMD ["node", "dist/main.js"]`。

- **案例2: 依赖层优化**: 在 `pnpm-lock.yaml` 未变更(常见于feature分支开发）的场景下，`COPY package*.json pnpm-lock.yaml ./` → `RUN pnpm install` 直接从缓存命中，仅需毫秒级执行。开发者在本地调试时也受益于这种分层缓存——修改业务代码后next build只需要几秒。

## 反模式警示

- **反模式1: 在运行时镜像中保留构建工具**: 将gcc、g++、TypeScript编译器、测试框架等构建时工具包含在运行镜像中。这些工具占体积且可能引入安全漏洞。Shenjiying88使用多阶段构建确保运行时镜像只包含运行所需的最小文件集。

- **反模式2: 使用Ubuntu作为Node.js基础镜像**: Ubuntu镜像体积约200MB，比 `node:20-alpine`(约120MB包含Node.js在内）大得多。Ubuntu虽然兼容性好于Alpine(特别是原生C++模块），但如果应用不需要原生模块，应优先使用Alpine。即使需要原生模块，也可以使用 `node:20-slim` Debian系镜像作为折中。

## 参考文献

- Docker Inc (2025) "Best practices for writing Dockerfiles"
- Trivy Documentation (2025) "Vulnerability Scanning"
- Node.js Docker Team (2025) "Docker Best Practices for Node.js"
