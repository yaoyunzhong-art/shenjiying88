# Auto Rollback 自动回滚模块

> **阶段:** Phase-19 T27 | **状态:** ✅ Active

异常触发自动回滚引擎，提供**快照 → 回滚 → 验证** 全流程编排，内置误触发防护（CRITICAL 级别二次确认）、自动超时取消、并发限流。

## 核心功能特性

| # | 特性 | 说明 |
|---|------|------|
| 1 | **完整回滚状态机** | PENDING → AWAITING_CONFIRM → SNAPSHOTTING → ROLLING_BACK → VERIFYING → COMPLETED / FAILED |
| 2 | **误触发防护** | CRITICAL 级别需二次确认（默认），WARNING 直接执行但有限速；任何阶段可手动取消 |
| 3 | **自动超时取消** | 二次确认配置超时后自动取消，避免悬挂任务 |
| 4 | **多类型快照** | 支持 DB / REDIS / CONFIG / FULL 四种快照类型 |
| 5 | **回滚验证** | 回滚后自动验证数值是否恢复到 baseline 的 ±20% 内 |
| 6 | **同步执行模式** | 测试专用 `executeRollbackSync()` 跳过所有异步 sleep |

## 技术栈 / 依赖

| 依赖 | 用途 |
|------|------|
| NestJS `@nestjs/common` | Module / Controller / Service 框架 |
| `class-validator` / `class-transformer` | DTO 校验与转换 |
| `TenantGuard` (agent 模块) | 多租户认证守卫 |
| `node:crypto` | UUID 生成 |

## API 端点概览

| 方法 | 路径 | 描述 | 入参 |
|------|------|------|------|
| `POST` | `/auto-rollback/trigger` | 触发回滚（通常由 anomaly-detector 调用） | `reason`, `severity`, `metricKey`, `anomalyValue`, `baselineValue`, `snapshotKind?` |
| `POST` | `/auto-rollback/confirm` | 二次确认执行回滚 | `id` |
| `POST` | `/auto-rollback/cancel` | 手动取消回滚 | `id`, `reason?` |
| `POST` | `/auto-rollback/configure` | 动态调整回滚配置 | `criticalRequiresConfirm?`, `confirmationDelayMs?`, `maxConcurrent?` 等 |
| `GET` | `/auto-rollback/status` | 引擎健康状态与活跃回滚数 | — |
| `GET` | `/auto-rollback/records` | 查询回滚记录列表 | `status?`, `metricKey?` |
| `GET` | `/auto-rollback/records/:id` | 查询单条回滚记录详情 | — |
| `GET` | `/auto-rollback/snapshots/:id` | 查询回滚快照 | — |

### 回滚状态机

```
      ┌──────────────────────────────────────────────┐
      │                  触发回滚                      │
      │  severity=WARNING ─────→ PENDING ─────────────│
      │  severity=CRITICAL ───→ AWAITING_CONFIRM ────│
      └────┬──────────────┬──────────────┬────────────┘
           │              │              │
           ▼              ▼              ▼
      SNAPSHOTTING ──→ ROLLING_BACK ──→ VERIFYING ──→ COMPLETED
           │              │              │
           └───── FAILED ─┘              │
                                         ▼
                                     CANCELLED
```

## 测试覆盖情况

| 测试文件 | 类型 | Test 数 |
|----------|------|---------|
| `auto-rollback.service.spec.ts` | 单元测试 (Service) | 31 |
| `auto-rollback.controller.spec.ts` | 单元测试 (Controller) | 38 |
| `auto-rollback.service.test.ts` | Service 集成测试 | 32 |
| `auto-rollback.controller.test.ts` | Controller 集成测试 | 17 |
| `auto-rollback.dto.test.ts` | DTO 验证测试 | 17 |
| `auto-rollback.entity.test.ts` | 实体类型测试 | 14 |
| `auto-rollback.contract.test.ts` | 跨模块合约测试 | 35 |
| `auto-rollback.module.test.ts` | 模块依赖注入测试 | 6 |
| `auto-rollback.role.test.ts` | 角色场景测试 | 35 |
| `auto-rollback.role-extended.test.ts` | 扩展场景测试 | 26 |
| `auto-rollback.e2e.test.ts` | E2E 测试 | 8 |
| `auto-rollback.simulator.test.ts` | 回滚模拟器测试 | 19 |
| `auto-rollback-ringbeam.test.ts` | RingBeat 兼容性测试 | 5 |

**共计 13 个测试文件，~283 个测试用例。**

## 配置与环境变量

### 默认参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `criticalRequiresConfirm` | `true` | CRITICAL 级别是否需要二次确认 |
| `confirmationDelayMs` | 30000 | 二次确认等待超时 (30s) |
| `autoTimeoutMs` | 300000 | 回滚执行超时 (5min) |
| `maxConcurrent` | 3 | 最大并发回滚数 |
| `snapshotRetentionMs` | 604800000 | 快照保留时间 (7 天) |

### 运行时配置

通过 `POST /auto-rollback/configure` 动态设置。

### 模块注册

```typescript
// app.module.ts
import { AutoRollbackModule } from './modules/auto-rollback/auto-rollback.module'

@Module({
  imports: [AutoRollbackModule],
})
export class AppModule {}
```

## 回滚执行流程

1. **触发** — 异常检测模块（如 AnomalyDetector）调用 `trigger()`
2. **等待确认** — CRITICAL 级别进入 `AWAITING_CONFIRM`，启动 30s 自动取消定时器
3. **确认/取消** — 运维人员通过 `confirm()` / `cancel()` API 决策
4. **快照** — 创建 DB / REDIS / CONFIG / FULL 快照
5. **回滚** — 执行回滚操作（V1 内存模拟，V2 接入实际资源）
6. **验证** — 校验异常值是否恢复到 baseline ±20% 内
7. **完成/失败** — 标记最终状态

## 跨模块合约

通过 `auto-rollback.contract.ts` 暴露稳定接口（`RollbackRecordContract`、`SnapshotContract`、`RollbackTriggerContract` 等），供 `observability`、`anomaly-detector`、`notification` 等模块消费。
