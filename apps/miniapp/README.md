# @m5/miniapp — 微信小程序

## 模块简介

`@m5/miniapp` 是 神机营 平台的微信小程序端，基于 Taro 4 跨端框架构建，使用 React 18 作为 UI 运行时。该小程序面向门店运营和管理人员，提供会员管理、采购订单、退货处理、兑换中心、客服工具、销售工具等功能，是对接后端 API 的核心移动入口。

## 技术栈

| 类别         | 技术                                     |
| ------------ | ---------------------------------------- |
| 框架         | Taro 4 (跨端编译)                        |
| UI 运行时    | React 18 + @tarojs/components            |
| 平台         | 微信小程序 (weapp)                       |
| 语言         | TypeScript                               |
| 状态管理     | React 内置 hooks (组件级状态)            |
| 后端 SDK     | `@m5/sdk` (API 接口封装)                 |
| 类型定义     | `@m5/types` (公共类型)                   |
| 构建工具     | Taro CLI + Webpack 5                     |
| 测试         | Node `--test` runner (tsx)               |

## 目录结构

```
apps/miniapp/
├── config/                     # Taro 编译配置
│   ├── index.js                # 通用配置
│   ├── dev.js                  # 开发环境配置
│   └── prod.js                 # 生产环境配置
├── src/
│   ├── app.tsx                 # 应用入口组件
│   ├── app.config.ts           # 小程序全局配置
│   ├── app.scss                # 全局样式
│   ├── pages/                  # 页面
│   │   ├── index/              # 首页
│   │   ├── member/             # 会员管理
│   │   ├── purchase-orders/    # 采购订单
│   │   ├── return-orders/      # 退货订单
│   │   ├── redeem-center/      # 兑换中心
│   │   ├── customer-service/   # 客服工具
│   │   └── sales-tools/        # 销售工具
│   ├── components/             # 通用组件
│   │   ├── DomainGovernancePanel.tsx
│   │   └── TriStateComponents.tsx
│   ├── hooks/                  # 自定义 hooks
│   ├── api-integration.test.ts # API集成测试
│   ├── market-bootstrap.ts     # 市场引导逻辑
│   ├── supplychain-runtime.ts  # 供应链运行时
│   └── __smoke__/              # 冒烟测试
├── package.json                # 依赖与脚本
└── tsconfig.json               # TypeScript 配置
```

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm (推荐)
- 微信开发者工具
- 微信小程序 AppID

### 安装与启动

```bash
# 1. 安装依赖 (在 monorepo 根目录执行)
pnpm install

# 2. 启动开发构建 (热重载)
pnpm --filter @m5/miniapp dev

# 3. 在微信开发者工具中打开 dist/ 目录

# 4. 生产构建
pnpm --filter @m5/miniapp build:weapp

# 5. 类型检查
pnpm --filter @m5/miniapp typecheck

# 6. 运行测试
pnpm --filter @m5/miniapp test
```

### 可用命令

| 命令                                  | 说明                   |
| ------------------------------------- | ---------------------- |
| `pnpm --filter @m5/miniapp dev`       | 开发模式 (热重载)      |
| `pnpm --filter @m5/miniapp build`     | TypeScript 类型检查    |
| `pnpm --filter @m5/miniapp build:weapp` | 微信小程度生产构建   |
| `pnpm --filter @m5/miniapp test`      | 运行测试               |
| `pnpm --filter @m5/miniapp typecheck` | TypeScript 类型检查    |
| `pnpm --filter @m5/miniapp lint`      | ESLint 代码检查        |

### 配置说明

小程序配置位于 `config/` 目录，通过环境变量区分开发/生产环境：
- `dev.js` — 开发环境，连接本地或开发 API 服务
- `prod.js` — 生产环境，连接线上 API 网关

后端 API 基地址通过 `@m5/sdk` 的配置注入，需在对应环境配置中填写正确的 API endpoint。

## 相关包

| 包名          | 说明                     |
| ------------- | ------------------------ |
| `@m5/sdk`     | API 接口 SDK 封装        |
| `@m5/types`   | 公共类型定义             |
| `@m5/api`     | 后端 API 服务            |

## 许可证

私有 — 仅供 神机营 平台内部使用。
