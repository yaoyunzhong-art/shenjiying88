# AI 规则引擎模块

> 模块路径: `apps/api/src/modules/ai-rule-engine`  
> 更新: 2026-07-24 · Phase-17

---

## 业务概述

AI 规则引擎是 ShenJiYing 系统的**风控与自动化决策核心**，提供基于可配置规则的成员等级评估、设备异常检测和业务风险评分能力。规则引擎采用**声明式条件-动作模型**，通过权重加权策略和匹配策略（ALL/ANY）驱动自动决策，无需实时调用大模型 API，适合高频低延迟的业务场景。

**核心应用场景：**
- **成员等级定级**：根据消费金额、积分、到访频次自动判定 SVIP/VIP/REGULAR
- **设备异常检测**：实时监测 CPU/内存/磁盘/网络/错误率指标，发现异常自动升级运维
- **业务风险评分**：综合退款、异常支付、投诉等多维度指标，输出 0-100 风险分并标记风险等级
- **模拟器验证**：支持单次和批量模拟运行，验证规则配置的合理性和性能表现

---

## 领域模型 / 核心实体

### 规则引擎 (RuleEngine)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 引擎唯一标识 |
| `name` | `string` | 引擎名称 |
| `provider` | `AiProvider` | AI 提供商 (DeepSeek) |
| `model` | `string` | 模型标识 |
| `conditions` | `RuleCondition[]` | 条件列表 |
| `actions` | `RuleAction[]` | 动作列表 |
| `matchStrategy` | `'ALL' \| 'ANY'` | 匹配策略 |
| `status` | `AiExecutionStatus` | 运行状态 |
| `description?` | `string` | 引擎描述 |

### 规则条件 (RuleCondition)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 条件 ID |
| `field` | `string` | 评估字段名 |
| `operator` | `PolicyConditionOperator` | 运算符 (Eq/Gte/Lte/In/NotIn/Exists等) |
| `value` | `number \| string \| boolean \| (string\|number)[]` | 比较值 |
| `weight` | `number` | 权重 (0.0-1.0) |
| `description?` | `string` | 条件描述 |

### 规则动作 (RuleAction)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 动作 ID |
| `type` | `string` | 动作类型 (ASSIGN_LEVEL/FLAG_ANOMALY/ESCALATE/SEND_NOTIFICATION) |
| `params` | `Record<string, unknown>` | 动作参数 |
| `priority` | `number` | 执行优先级 |

### 内置引擎一览

| 引擎 ID | 名称 | 条件数 | 动作数 | 策略 |
|---------|------|--------|--------|------|
| `member-level-v1` | Member Level Evaluator | 3 | 3 | ALL |
| `device-anomaly-v1` | Device Anomaly Detector | 5 | 2 | ANY |
| `risk-score-v1` | Risk Score Evaluator | 5 | 3 | ANY |

### 模拟器 (Simulator)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 模拟器 ID |
| `engineId` | `string` | 关联引擎 ID |
| `rounds` | `number` | 运行轮数 |
| `enableMutation` | `boolean` | 是否启用数据变异 |
| `timeoutMs` | `number` | 单次超时 |

---

## API 端点一览

### 规则评估

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/ai-rule-engine/evaluate` | 通用评估 (type 区分 member-level / device-anomaly) |
| `POST` | `/ai-rule-engine/evaluate/member-level` | 成员等级评估 |
| `POST` | `/ai-rule-engine/evaluate/device-anomaly` | 设备异常检测 |
| `POST` | `/ai-rule-engine/evaluate/batch` | 批量评估 |
| `POST` | `/ai-rule-engine/evaluate/risk-score` | 风险评分 |

### 引擎管理

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/ai-rule-engine/engines` | 获取所有引擎状态 |
| `GET` | `/ai-rule-engine/engines/:id` | 获取指定引擎详情 |
| `POST` | `/ai-rule-engine/engines/:id/config` | 更新引擎配置 |
| `POST` | `/ai-rule-engine/engines/:id/reset` | 重置引擎配置 |

### 模拟器

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/ai-rule-engine/simulators` | 获取所有模拟器 |
| `GET` | `/ai-rule-engine/simulators/:id` | 获取指定模拟器 |
| `POST` | `/ai-rule-engine/simulators/run` | 单次模拟运行 |
| `POST` | `/ai-rule-engine/simulators/run-batch` | 批量模拟运行 |

---

## 依赖模块

| 模块 | 用途 |
|------|------|
| `@m5/domain` | 领域类型 (AiProvider, PolicyConditionOperator, AiExecutionStatus) |
| `agent` | 租户守卫 (TenantGuard) — 多租户隔离 |

---

## 使用示例

### 成员等级评估

```ts
// POST /ai-rule-engine/evaluate/member-level
{
  "memberId": "m-001",
  "totalPoints": 6000,
  "totalSpend": 15000,
  "visitCount": 30,
  "tenantId": "tenant-A"
}
```

响应:
```json
{
  "type": "member-level",
  "result": {
    "memberId": "m-001",
    "currentLevel": "SVIP",
    "suggestedLevel": "SVIP",
    "triggeredRules": ["cond-high-spend", "cond-high-points", "cond-frequent-visit"],
    "confidence": 1.0
  },
  "timestamp": "2026-07-24T00:00:00.000Z"
}
```

### 风险评分

```ts
// POST /ai-rule-engine/evaluate/risk-score
{
  "subjectId": "m-001",
  "subjectType": "member",
  "metrics": {
    "refundCount": 5,
    "abnormalPaymentCount": 3,
    "complaintCount": 2
  },
  "tenantId": "tenant-A"
}
```

响应:
```json
{
  "type": "risk-score",
  "result": {
    "subjectId": "m-001",
    "riskScore": 90,
    "riskLevel": "CRITICAL",
    "triggeredRules": ["cond-high-refund", "cond-abnormal-payment", "cond-complaints"],
    "reasons": ["退款次数 >= 3", "异常支付次数 >= 2", "投诉次数 >= 1"],
    "recommendations": ["限制退款频率或要求审核", "冻结异常支付渠道，人工审核", "调查投诉原因，必要时封号"],
    "evaluatedAt": "2026-07-24T00:00:00.000Z"
  }
}
```

### 模拟器批量运行

```ts
// POST /ai-rule-engine/simulators/run-batch
{
  "simulatorId": "sim-member-level-v1",
  "dataType": "member-level",
  "data": { "memberId": "m-sim", "totalSpend": 12000, "totalPoints": 3000, "visitCount": 15, "tenantId": "tenant-A" },
  "rounds": 50
}
```

---

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `member-level-v1` 条件阈值 | `number` | spend≥10000, points≥5000, visit≥20 | 可过 `POST /engines/:id/config` 动态调整 |
| `device-anomaly-v1` 条件阈值 | `number` | cpu≥90, memory≥85, disk≥90, latency≥500, error≥5 | 同上 |
| `risk-score-v1` 条件阈值 | `number` | refund≥3, abnormalPay≥2, anomalyCount≥2, complaint≥1, voidRefund≥500 | 同上 |
| 模拟器变异幅度 | `number` | ±10% | `enableMutation: true` 时生效 |
| 模拟器超时 | `ms` | 5000 / 10000 | 在 `simulators[]` 中按 ID 配置 |

> **注意**: 当前引擎配置和模拟器数据为内存硬编码，生产环境应迁移至 DB 持久化。
