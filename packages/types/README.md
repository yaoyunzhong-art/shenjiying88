# @m5/types — 公共类型定义

## 模块简介

`@m5/types` 是 神机营 平台 monorepo 中的公共类型定义包，使用 TypeScript 接口（interface）与类型别名（type alias）为所有消费者模块（API 服务、小程序、Web 前端）提供统一的类型契约。该包在编译期通过 tsup 输出 CJS + 类型声明文件（`.d.ts`），不包含任何运行时逻辑。

所有业务模块的类型定义集中于此，避免跨包类型重复和接口不一致。当前涵盖基础治理（Foundation）、运行时治理（Runtime Governance）、基础引导（Bootstrap）、订单与支付、会员、语言/区域、AI 大模型配置等领域的类型体系。

## 技术栈

| 类别         | 技术                                    |
| ------------ | --------------------------------------- |
| 语言         | TypeScript 5.8+                         |
| 构建         | tsup (CJS + DTS 双输出)                 |
| 消费方       | `@m5/api`、`@m5/miniapp`、`@m5/domain` |
| 测试         | Node `--test` runner (tsx)              |

## 目录结构

```
packages/types/
├── src/
│   ├── index.ts              # 类型定义主文件（所有类型导出）
│   └── index.test.ts         # 类型使用示例与测试
├── dist/                     # 构建产物 (CJS + .d.ts)
│   ├── index.js
│   └── index.d.ts
├── tsconfig.json             # TypeScript 编译配置
├── tsup.config.ts            # 打包配置
└── package.json              # @m5/types 包定义
```

## 包含的类型领域

| 领域                      | 关键类型                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| **基础治理 (Foundation)** | 告警目录、告警时间线、告警筛选、告警面板状态、系统概览、模块与消费者描述符       |
| **运行时治理**            | Receipt、Callback、Replay、Rate Limit、Ticket、Stall 检测、升降级动作         |
| **基础引导 (Bootstrap)**  | 能力规则、客户端应用、缓存层、降级策略、Feature Flag、脱敏策略、租户作用域     |
| **订单与支付**            | Order、Payment、Refund、OrderEvent、创建/退款输入、EventWithId                |
| **AI 大模型配置**         | LLMProvider、TenantLLMConfig、创建/更新请求、调用统计、调用日志               |
| **全球化**                | GeoContext、SupportedLanguage、SupportedCurrency                            |
| **通用工具**              | PaginationInput、PaginationMeta、ApiResult\<T\>                             |
| **工具函数**              | 时间线过滤/摘要/构建、Stall 评估、Replay 策略推进、搜索参数序列化等           |

## 快速开始

### 构建

```bash
# 在 monorepo 根目录
pnpm --filter @m5/types build
```

### 在其他包中使用

```typescript
import type {
  ApiResult,
  PaginationInput,
  FoundationAlertCatalogItem,
  FoundationOperationsOverviewResponse,
  Order,
  RuntimeGovernanceReceipt,
  TenantLLMConfig,
  GeoContext,
} from '@m5/types';
```

### 本地开发 (watch 模式)

```bash
pnpm --filter @m5/types dev
```

### 测试

```bash
pnpm --filter @m5/types test
```

### 类型检查

```bash
pnpm --filter @m5/types typecheck
```

## 使用原则

1. **纯类型包**：仅包含 `interface` / `type` / `function` 声明，不包含运行时副作用
2. **单文件导出**：所有类型统一在 `src/index.ts` 中导出，消费者通过 `@m5/types` 按需 import type
3. **更新即发布**：修改类型后需重新构建，消费者包需更新 lockfile 或重新安装
4. **向下兼容**：新增字段使用可选属性（`?`），避免破坏已有消费者

## 相关包

| 包名          | 说明                     |
| ------------- | ------------------------ |
| `@m5/api`     | API 服务 (类型使用者)    |
| `@m5/miniapp` | 微信小程序 (类型使用者)  |
| `@m5/domain`  | 领域模型 (类型使用者)    |

## 许可证

私有 — 仅供 神机营 平台内部使用。
