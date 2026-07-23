# V23 PRD · AI 中台基础版 (WP-03A)

> **范围**: BS-0066 ~ BS-0077  
> **优先级**: P1  
> **依赖**: WP-02A (多租户) / WP-02B (安全审计)  
> **状态**: 已扫描完成  
> **日期**: 2026-07-23  

---

## 1. 现状扫描结论

### 1.1 AI 网关 (Gateway)

| 组件 | 状态 | 说明 |
|------|------|------|
| `GatewayModule` | ✅ 存在 | `apps/api/src/modules/gateway/` — 通用 OpenAPI 网关，非 AI 专属 |
| `APIGateway` | ✅ 完整 | 路由表（8 条）、API Key 认证、JWT 验证、令牌桶限流、请求日志 |
| `GatewayAnalyticsService` | ✅ 完整 | 摘要统计、端点/客户端分析、时间序列、异常检测 |
| `RateLimiterService` | ✅ 完整 | 令牌桶实现，支持配额设置/查询/消费 |
| `APIKeyManager` | ✅ 完整 | 创建/验证/吊销/过期管理 |

**关键发现**: 当前 `GatewayModule` 是一个**通用 API 网关**，拦截的是业务微服务路由（agent-service、ai-cs-service、analytics-service 等），**不是 AI 模型请求的专用网关**。它提供认证/限流/日志能力，但没有 AI 模型路由、Provider 健康检查、模型优先级调度等功能。

### 1.2 AI Fallback

| 组件 | 状态 | 说明 |
|------|------|------|
| `FallbackService` | ✅ 存在 | `apps/api/src/modules/ai-cs/fallback.service.ts` — 仅限 AI-CS 模块使用 |
| Provider 主备 | ✅ 完整 | OpenAI (priority=1) → DeepSeek (priority=2) → Mock (priority=99) |
| 超时控制 | ✅ 完整 | 5s 超时，2 次重试 |
| 可用性检测 | ✅ 完整 | `isAvailable()` 健康检查 |

**关键发现**: Fallback 仅存在于 `ai-cs` 模块内，**不是全局共享的 AI Fallback 服务**。其他 AI 模块（ai-content、ai-diagnosis、ai-forecast、ai-insight、ai-marketing、ai-push、ai-rag、ai-recommend、ai-review、ai-reviewer、ai-sales、aiops）各自直接调用 LLM Provider，缺乏统一的 Fallback 层。

### 1.3 Circuit Breaker

| 组件 | 状态 | 说明 |
|------|------|------|
| `CircuitBreaker` | ✅ 存在 | `apps/api/src/modules/foundation/resilience-operations/circuit-breaker.ts` — 通用实现 |
| 状态机 | ✅ 完整 | CLOSED → OPEN → HALF_OPEN → CLOSED |
| 探测期互斥 | ✅ 完整 | HALF_OPEN 仅放一个探测请求 |
| 可配置 | ✅ 完整 | failureThreshold/successThreshold/cooldownMs/isFailure/onStateChange |

**关键发现**: CircuitBreaker 在 foundation 层，但**当前未被任何 AI 模块引用**。AI 模块的 Provider 调用链中没有熔断保护。

### 1.4 规则引擎 (Rule Engine)

| 组件 | 状态 | 说明 |
|------|------|------|
| `rule-engine.ts` (纯函数) | ✅ 存在 | `apps/api/src/modules/ai-rule-engine/rule-engine.ts` — 条件评估 + 规则链 |
| `AiRuleEngineService` (NestJS) | ✅ 完整 | `ai-rule-engine.service.ts` — 3 个预置引擎 + Simulator |
| 成员等级评估 | ✅ 完整 | member-level-v1: ALL 策略, 3 条件, 3 动作 |
| 设备异常检测 | ✅ 完整 | device-anomaly-v1: ANY 策略, 5 条件, 2 动作 |
| 风险评分评估 | ✅ 完整 | risk-score-v1: ANY 策略, 5 条件, 3 动作 |
| 批量评估 | ✅ 完整 | batchEvaluate: 同时评估多人/设备 |
| 模拟器 | ✅ 完整 | runSimulator + runSimulatorBatch + 数据变异 |
| 条件覆盖可配置 | ✅ 完整 | 支持 override 条件值 |
| 规则链 | ✅ 完整 | 排序 → 执行 → 超时控制 |
| Controller/Module | ✅ 完整 | REST API 暴露 |

**关键发现**: ai-rule-engine 模块功能完整，覆盖了成员等级、设备异常、风控三种业务场景。引擎定义在内存中硬编码（无动态规则加载），适合当前 Phase 需要。**规则引擎当前**不集成 Provider Fallback/CircuitBreaker。

### 1.5 审计与成本追踪

#### AI 调用审计

| 组件 | 状态 | 说明 |
|------|------|------|
| `tenant-llm` `logCall()` | ✅ 存在 | `apps/api/src/modules/tenant-llm/llm-config.service.ts` — 记录每次 LLM 调用日志 |
| 审计日志 `recordAudit()` | ✅ 存在 | 同上 — 审批/配置变更/吊销审计追踪 |
| `ai-review/llm` 无审计 | ⚠️ 缺口 | ai-review/llm 模块有成本跟踪但无审计日志写入 |

#### 成本追踪

| 组件 | 状态 | 说明 |
|------|------|------|
| `CostTrackerService` | ✅ 存在 | `apps/api/src/modules/ai-review/llm/cost-tracker.service.ts` |
| 月度预算 (硬/软上限) | ✅ 完整 | hardLimitUsd / softLimitUsd / alertThreshold |
| Token 计量 + 累加 | ✅ 完整 | recordUsage() |
| Prompt 缓存 | ✅ 完整 | checkCache() / setCache() (内存版, 计划 Redis) |
| 成本快照 | ✅ 完整 | snapshot() |
| `tenant-llm` 成本估算 | ✅ 完整 | `llm-gateway.ts` estimateCost() — 按模型定价表计算 |
| `tenant-llm` 调用统计 | ✅ 完整 | `getStats()` — 汇总 totalCalls/successes/failures/cost |

**关键发现**: 
- 成本追踪在 `ai-review/llm` 模块和 `tenant-llm` 模块各有一份
- **没有全局统一的 AI 成本追踪中心**：各 AI 模块各自的 Provider 调用不经过 cost tracker
- 审计日志由 `tenant-llm/llm-config.service.ts` 管理，但仅覆盖通过 `TenantLLMGateway` 的调用

---

## 2. 架构全景图 (文字描述)

```
┌──────────────────────────────────────────────────────────┐
│                   通用 API 网关 (GatewayModule)              │
│  认证/限流/KPI/异常检测  ← 业务微服务入口，非 AI 专用        │
└──────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                      ▼
┌───────────────┐    ┌───────────────┐     ┌──────────────┐
│  TenantLLM     │    │  ai-cs         │     │  12+ 其他 AI  │
│  Gateway       │    │  FallbackSvc  │     │  模块 (直接   │
│  (多租户隔离)  │    │  (OpenAI→DS→  │     │  调用 Provider, │
│  有审计+成本)  │    │   Mock)       │     │  无 Fallback)  │
└───────────────┘    └───────────────┘     └──────────────┘
                                                    │
        ┌───────────────────────────────────────────┘
        ▼
┌──────────────────────────────────────────────────────────┐
│               Foundation 层 (可用但未接入)                  │
│  CircuitBreaker · TokenBucket · HeterogeneousChannelRouter │
└──────────────────────────────────────────────────────────┘
        ▲
┌───────┴──────────────────────────────────────────────┐
│          规则引擎 (AiRuleEngineService)                │
│  成员等级 · 设备异常 · 风险评分 · 模拟器               │
│  无 CircuitBreaker / Fallback 集成                    │
└──────────────────────────────────────────────────────┘
```

---

## 3. 门禁缺口

| 门禁 | 当前状态 | 风险等级 |
|------|---------|---------|
| 统一 AI 模型请求入口 | ❌ 缺失 | H — 各模块各自调用 Provider，无统一路由/兜底 |
| 全局 Fallback 链 | ❌ 缺失 | H — 仅 ai-cs 有 Fallback，其他模块无降级机制 |
| 熔断器接 AI Provider | ❌ 缺失 | M — CircuitBreaker 存在但未接入任何 AI 模块 |
| 全局成本追踪中心 | ❌ 缺失 | M — 两套独立实现，未统一聚合 |
| 全局 AI 审计日志 | ✅ 部分 | M — tenant-llm 有覆盖，但其他模块不经过它 |
| 规则引擎动态加载 | ❌ 缺失 | L — 规则硬编码在内存中 |
| AI Provider 健康检查聚合 | ❌ 缺失 | L — 无统一健康检查面板 |

---

## 4. 关联模块

| 模块 | 关系 |
|------|------|
| `ai-cs` | 唯一有 Fallback 的模块，可作参考实现 |
| `tenant-llm` | 多租户 LLM 网关，有审计+成本+隔离，是最接近 AI 网关的组件 |
| `foundation/resilience-operations` | CircuitBreaker 基础设施，待接入 |
| `ai-rule-engine` | 规则引擎，功能完整可运行 |
| `ai-review/llm` | 成本追踪参考实现 |
| `gateway` | 通用 API 网关，能力可复用但不是 AI 专用 |
