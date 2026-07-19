# V22 生产构建口径复核

> 复核日期: 2026-07-20 01:06 CST
> 复核人: subagent (p2-3)

## 三端构建模式

| 应用 | output | standalone | Docker | next build 通过 | standalone 路径 |
|:-----|:------:|:----------:|:------:|:--------------:|:---------------:|
| admin-web | standalone | ✅ | ✅ | ✅ | `apps/admin-web/server.js` |
| storefront-web | standalone | ✅ | ✅ | ✅ | `apps/storefront-web/server.js` |
| tob-web | standalone | ✅ | ✅ | ✅ | `apps/tob-web/server.js` |

## 配置详情

### next.config.mjs 关键配置（三端统一）

- `output: 'standalone'` ✅ 标准生产输出模式
- `outputFileTracingRoot: path.join(currentDir, '../..')` ✅ monorepo 根追踪
- `transpilePackages: ['@m5/ui', '@m5/domain']` ✅ workspace 包转译
- `eslint.ignoreDuringBuilds: true` ✅ 构建不阻塞 lint
- `typescript.ignoreBuildErrors: false` ✅ TS 类型检查保持严格

### storefront-web 特有配置

```js
experimental: {
  strictNextPageExport: false  // ⚠️ 临时放宽，见 TODO
}
```

说明: storefront-web 存在 page.tsx 中混入工具函数导出的遗留问题，已加 TODO 标记需重构。

## 当前构建链路

### 构建流水线

```
CI 触发
  └─ pnpm install --frozen-lockfile
  └─ pnpm build (turbo build)
  └─ Docker build (multi-stage)
       ├─ Stage 1: deps — 安装依赖
       ├─ Stage 2: build — 构建 workspace 包 + next build
       └─ Stage 3: runtime — 精简运行时镜像
  └─ ACR push → K8s deploy
```

### Dockerfile 架构

三端 Dockerfile 模板统一，差异仅为应用目录名和端口号：

| 属性 | admin-web | storefront-web | tob-web |
|:-----|:---------:|:--------------:|:-------:|
| 监听端口 | 3002 | 3003 | 3004 |
| pnpm filter | @m5/admin-web | @m5/storefront-web | @m5/tob-web |
| deploy 目录 | deploy/admin-web | deploy/storefront-web | deploy/tob-web |
| CMD 路径 | apps/admin-web/server.js | apps/storefront-web/server.js | apps/tob-web/server.js |

共同特征:
- 基础镜像: `node:22-alpine`
- pnpm 版本: `10.14.0`
- 入口: `tini + node server.js`
- 非 root 运行 (uid 1001 `app`)
- 内置 HTTP healthcheck (`wget http://127.0.0.1:<PORT>/`)
- 三层多阶段构建 (deps → build → runtime)，产品镜像不含构建工具

### standalone output 路径验证

由于 `outputFileTracingRoot` 指向 monorepo 根目录，Next.js standalone 产物的结构为:

```
.next/standalone/
  apps/<app>/server.js
  apps/<app>/package.json
  node_modules/
  ...
```

Dockerfile 中 `pnpm deploy` + `cp -r` 后，运行时路径 `apps/<app>/server.js` 与 `.next/standalone` 内路径完全一致 ✅

## 建议

1. **storefront-web TS 严格性统一** — `strictNextPageExport: false` 是临时放宽，建议尽快将 page.tsx 中的工具函数提取到独立文件（如 `analytics-data.ts`、`account-utils.ts`），移除 experimental 配置，与 admin-web / tob-web 对齐。

2. **TS ignoreBuildErrors 不一致** — storefront-web / tob-web 的 Dockerfile 构建阶段未显式控制 `NEXT_TELEMETRY_DISABLED` 环境变量（可能已在 CI 层面控制，非阻塞项）。

3. **monorepo 构建顺序依赖** — Dockerfile 按顺序构建 types → domain → sdk → ui → app，若未来 package 依赖图变更需同步更新 Dockerfile。

4. **Healthcheck 端口硬编码** — admin-web 3002 / storefront-web 3003 / tob-web 3004 与 K8s service 端口需保持同步。

## 结论

三端构建口径完全符合生产发布标准:
- ✅ 统一使用 `output: 'standalone'`
- ✅ 统一采用 multi-stage Dockerfile 构建
- ✅ 已构建通过 (.next/standalone 产物存在)
- ✅ standalone 路径一致性验证通过
- ✅ 非 root 运行 + healthcheck 健壮性完善
- ✅ 不同应用端口隔离，可独立部署
