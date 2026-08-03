# @m5/domain — 领域层包

> 领域模型与核心实体定义包，为 admin-web 和 storefront-web 提供统一的领域类型约束和 Mock 服务实现。

## 核心职责

- **领域枚举** — 用户角色、渠道、范围类型、多市场配置等全局枚举
- **领域接口** — 身份账户、组织节点、配置项、策略、事件、通知等核心实体接口
- **Mock 服务** — 为前端开发提供运行时操作(告警/运行时操作)的模拟数据层
- **类型约束** — 与 `@m5/types` 协作，确保跨模块领域模型的一致

## 核心实体

### 门户与市场 (Portal & Market)

| 实体 | 说明 |
|------|------|
| `MarketProfile` | 市场配置(国家/时区/货币/税率/网络/CDN/邮件/社交平台) |
| `BasePortal` / `StorePortal` / `TobPortal` | 门户定义(作用域/渠道/域名/语言) |
| `RegionalConfigOverride` | 区域配置覆盖(继承模式) |

### 身份与访问控制 (Identity & Access)

| 实体 | 说明 |
|------|------|
| `UserRole` | 10 种角色枚举(SuperAdmin → Coach) |
| `IdentityAccount` | 身份账户(平台/租户/品牌/门店/员工/会员) |
| `OrganizationNode` / `OrganizationMembership` | 组织架构(平台→租户→品牌→区域→门店→部门→团队) |
| `AccessPolicy` | 访问控制策略(ABAC: Subject/Action/Resource/Condition) |
| `PolicySubject` / `PolicyCondition` | 策略主体与条件 |

### 运行时治理 (Runtime Governance)

| 实体 | 说明 |
|------|------|
| `FoundationAlert` | 基础告警(级别/状态/来源) |
| `RuntimeOperation` | 运行时操作(部署/回滚/扩缩容/重启/配置更新) |
| `RuntimeReceipt` | 操作回执 |
| `EdgeNode` / `EdgeSyncTask` | 边缘节点与同步任务 |

### 配置与特性 (Configuration & Feature)

| 实体 | 说明 |
|------|------|
| `ConfigEntry` / `ConfigRevision` | 配置条目(多类型值 + 版本管理) |
| `SecretAsset` / `CertificateAsset` | Secret / 证书资产管理 |
| `FeatureFlag` | 特性标记(灰度发布/百分比/白名单) |
| `RateLimitPolicy` / `QuotaLedger` | 限流策略与额度台账 |

### 安全与合规 (Security & Compliance)

| 实体 | 说明 |
|------|------|
| `AuditTrailRecord` | 审计日志(谁/何时/做了什么/变更前后) |
| `PiiPolicy` | PII 数据保护策略 |
| `BackupSnapshot` / `RestoreRun` | 备份与恢复 |

### 消息与通知 (Messaging & Notification)

| 实体 | 说明 |
|------|------|
| `DomainEvent` | 领域事件 |
| `WebhookSubscription` | Webhook 订阅 |
| `NotificationTemplate` / `NotificationDispatch` | 通知模版与分发 |

### AI 能力 (AI)

| 实体 | 说明 |
|------|------|
| `AiModelConfig` | AI 模型配置(多 Provider) |
| `AiPromptTemplate` | Prompt 模版 |
| `AiExecutionRecord` | AI 执行记录 |

## 使用方式

```typescript
// 导入领域类型
import { UserRole, StorePortal, FeatureFlag } from '@m5/domain';

// 使用枚举
const role: UserRole = UserRole.StoreManager;

// 使用接口
const portal: StorePortal = {
  audience: PortalAudience.ToC,
  scopeType: PortalScopeType.Store,
  // ...
};

// 使用 Mock 服务（开发阶段）
import { fetchOperations, fetchAlerts } from '@m5/domain';

// 获取分页运行时操作列表
const ops = await fetchOperations(1, 10);

// 带过滤条件查询告警
const alerts = await fetchAlerts({ severity: 'error', status: 'open', page: 1 });
```

## 技术栈

| 层     | 技术                    |
| ------ | ----------------------- |
| 语言   | TypeScript 5.8          |
| 构建   | tsup (CJS + 类型声明)   |
| 测试   | Node Test Runner        |
| 依赖   | @m5/types (workspace)   |

## 目录结构

```
packages/domain/
├── src/
│   ├── index.ts               # 包入口(导出所有领域类型和 Mock 服务)
│   ├── index.d.ts             # 补充类型声明
│   ├── index.test.ts          # 包入口测试
│   ├── domain-deep.test.ts    # 深度领域模型测试
│   ├── service-types.ts       # Mock 服务类型定义
│   ├── service-types.test.ts  # 服务类型测试
│   ├── runtime-service.ts     # 运行时操作 Mock 服务
│   ├── runtime-service.test.ts# 运行时服务测试
│   ├── alert-service.ts       # 告警 Mock 服务
│   └── alert-service.test.ts  # 告警服务测试
├── dist/                      # 构建产物(编译后输出)
├── tsconfig.json              # TypeScript 配置
├── package.json               # 依赖与构建脚本
└── README.md                  # 本文件
```

## 开发命令

```bash
# 构建(tsup → cjs + .d.ts)
pnpm build

# 开发模式(监听文件变化自动构建)
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

## 设计说明

- **纯类型层**：本包不依赖 UI 框架，保持纯数据结构定义
- **Mock 策略**：开发阶段通过 Mock 服务模拟后端数据，方便前端独立开发
- **与 @m5/types 的关系**：`@m5/types` 提供共通的底层类型(如分页)，本包定义业务领域的聚合实体
- **向后兼容**：所有导出的类型和枚举保持语义版本兼容性
