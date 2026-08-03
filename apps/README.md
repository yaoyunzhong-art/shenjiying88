# 📱 应用模块 (Apps)

> M5 平台所有可部署应用的集合，涵盖管理后台、API 服务、前端门户及移动端。

## 目录构成

| 应用 | 包名 | 说明 |
|------|------|------|
| **api** | `@m5/api` | NestJS 后端 API 服务，承载多租户、营销券、物流等核心业务 |
| **admin-web** | `@m5/admin-web` | 管理后台 (Next.js)，面向运营/门店/品牌的管理界面 |
| **storefront-web** | `@m5/storefront-web` | C 端前台 (Next.js)，面向消费者的数字运动潮玩门户 |
| **tob-web** | `@m5/tob-web` | B 端企业门户 (Next.js)，面向商家/合作伙伴的协同平台 |
| **app** | `@m5/app` | 通用应用入口模块 |
| **mobile** | `shenjiying-mobile` | 移动端 (React Native + Offline-First)，支持线下离线操作 |
| **miniapp** | `@m5/miniapp` | 小程序应用，覆盖微信/支付宝等生态入口 |

## 使用

```bash
# 启动所有应用
pnpm dev

# 单独启动某应用
pnpm --filter @m5/api dev
pnpm --filter @m5/admin-web dev
```

各应用通过 monorepo 共享 `packages/` 下的公共库，由 Turborepo 编排构建与缓存。
