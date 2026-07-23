---
module: ai-rule-engine
date: 2026-07-24
status: 已评审
author: 树哥A
tags: [prd, ai-rule-engine, 圈梁五道箍]
---

# AI 规则引擎 — PRD 文档

## 1. 背景

### 1.1 业务背景

神机营 SaaS 多租户零售平台在其智能门店运营中需要灵活的策略评估引擎。不同门店、不同设备、不同会员需要差异化规则判定，例如：

- 会员等级自动升降级（基于消费、积分、到访）
- 设备运行异常自动检测（基于 CPU、内存、磁盘、错误率等）
- 综合业务风险评分（结合退款、投诉、设备异常等维度）

传统硬编码规则无法满足快速迭代的业务需求，因此设计 AI 规则引擎模块，提供**可配置规则链的实时评估能力**。

### 1.2 痛点

1. 各模块各自实现规则判断，逻辑重复、维护成本高
2. 规则变更需发版，无法线上调优
3. 缺乏统一的异常检测和风险评分框架
4. 多租户场景下规则隔离困难

### 1.3 目标

- 提供统一的规则定义 → 匹配 → 执行链路
- 支持成员等级、设备异常、风险评分三类标准场景
- 支持批量评估，减少网络开销
- 提供模拟器用于规则上线前验证
- 引擎配置可在线调整（开关、阈值、策略）

---

## 2. 功能需求

### 2.1 单次评估 (Evaluate)

| ID | 功能 | 描述 |
|----|------|------|
| F-01 | 成员等级评估 | 输入 memberId / totalPoints / totalSpend / visitCount → 输出建议等级 + 触发规则 |
| F-02 | 设备异常检测 | 输入设备 CPU/内存/磁盘/延迟/错误率 → 输出是否异常 + 类型 + 建议 |
| F-03 | 通用评估路由 | `POST /evaluate` 根据 type 参数自动路由到 F-01 或 F-02 |

**路由**:
- `POST /ai-rule-engine/evaluate`
- `POST /ai-rule-engine/evaluate/member-level`
- `POST /ai-rule-engine/evaluate/device-anomaly`

### 2.2 批量评估 (Batch Evaluate)

| ID | 功能 | 描述 |
|----|------|------|
| F-04 | 批量评估 | 一次请求包含多个评估项（成员等级 + 设备异常混合），返回总计数 + 成功/失败明细 |

**路由**: `POST /ai-rule-engine/evaluate/batch`

### 2.3 风险评分 (Risk Score)

| ID | 功能 | 描述 |
|----|------|------|
| F-05 | 风险评分 | 综合退款、异常支付、设备异常、投诉等指标，输出 0-100 风险分数 + 等级 + 原因 + 建议 |

**路由**: `POST /ai-rule-engine/evaluate/risk-score`

**subjectType** 支持: `member` | `device` | `store`

### 2.4 引擎管理 (Engine Management)

| ID | 功能 | 描述 |
|----|------|------|
| F-06 | 引擎列表 | 获取所有规则引擎状态（条件数、动作数、匹配策略、启停状态） |
| F-07 | 引擎详情 | 获取指定引擎的完整配置（含所有条件和动作详情） |
| F-08 | 引擎配置更新 | 在线修改引擎的 enabled / matchStrategy / conditionOverrides |
| F-09 | 引擎重置 | 将引擎配置恢复到出厂默认状态 |

**路由**:
- `GET /ai-rule-engine/engines`
- `GET /ai-rule-engine/engines/:id`
- `POST /ai-rule-engine/engines/:id/config`
- `POST /ai-rule-engine/engines/:id/reset`

### 2.5 模拟器 (Simulator)

| ID | 功能 | 描述 |
|----|------|------|
| F-10 | 模拟器列表 | 列出所有已注册模拟器 |
| F-11 | 单次模拟运行 | 给定数据和条件覆盖 → 模拟结果（匹配条件、动作、耗时） |
| F-12 | 批量模拟运行 | 多轮模拟（>1k 轮），输出 matchRate / P50/P95/P99 耗时 / 最常触发条件排布 |

**路由**:
- `GET /ai-rule-engine/simulators`
- `GET /ai-rule-engine/simulators/:id`
- `POST /ai-rule-engine/simulators/run`
- `POST /ai-rule-engine/simulators/run-batch`

---

## 3. 非功能需求

| ID | 维度 | 要求 |
|----|------|------|
| NFR-01 | 响应时间（单次） | P95 < 200ms |
| NFR-02 | 响应时间（批量 10 条） | P95 < 500ms |
| NFR-03 | 响应时间（模拟 1000 轮） | P95 < 3000ms |
| NFR-04 | 多租户隔离 | TenantGuard 校验，租户间零数据泄露 |
| NFR-05 | 可观测性 | 每次评估记录诊断信息（diagnosisId / 耗时 / 匹配规则） |
| NFR-06 | 并发保护 | 批量请求中部分失败不影响其他项处理 |
| NFR-07 | 可配置性 | 条件、权重、匹配策略、动作均可运行时调整 |
| NFR-08 | 输入验证 | ValidationPipe + whitelist: true 防止注入 |

---

## 4. 数据模型概要

### 4.1 RuleEngine

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 引擎唯一标识 |
| name | string | 引擎名称 |
| provider | AiProvider | 底层 AI 提供商 |
| model | string | 模型名称 |
| description | string? | 描述 |
| conditions | RuleCondition[] | 条件列表 |
| actions | RuleAction[] | 动作列表 |
| matchStrategy | 'ALL' \| 'ANY' | 全部匹配/任一匹配 |
| status | AiExecutionStatus | 引擎状态 |
| lastEvaluatedAt | string? | 上次评估时间 |

### 4.2 RuleCondition

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 条件 ID |
| engineId | string | 所属引擎 ID |
| field | string | 评估字段名 |
| operator | PolicyConditionOperator | 操作符（Gte/Lte/Eq/Neq/In/NotIn 等） |
| value | number \| string \| boolean \| array | 阈值 |
| weight | number | 权重（0-1） |
| description | string? | 条件说明 |

### 4.3 MemberLevelInput / Output

**Input**:

| 字段 | 类型 | 说明 |
|------|------|------|
| memberId | string | 会员 ID |
| totalPoints | number | 累计积分 |
| totalSpend | number | 累计消费金额 |
| visitCount | number | 到访次数 |
| tenantId | string | 租户 ID |

**Output**:

| 字段 | 类型 | 说明 |
|------|------|------|
| memberId | string | 会员 ID |
| currentLevel | string | 当前等级 |
| suggestedLevel | string | 建议等级 |
| triggeredRules | string[] | 触发的规则 ID 列表 |
| confidence | number | 置信度 |

### 4.4 DeviceAnomalyInput / Output

**Input**:

| 字段 | 类型 | 说明 |
|------|------|------|
| deviceId | string | 设备 ID |
| storeId | string | 门店 ID |
| metrics | DeviceMetrics | CPU/内存/磁盘/延迟/错误率 |
| tenantId | string | 租户 ID |

**Output**:

| 字段 | 类型 | 说明 |
|------|------|------|
| deviceId | string | 设备 ID |
| isAnomaly | boolean | 是否异常 |
| anomalyType | string? | 异常类型 |
| severity | string | 严重等级 |
| triggeredRules | string[] | 触发规则 |
| recommendations | string[] | 处置建议 |

### 4.5 RiskScoreInput / Output

**Input**:

| 字段 | 类型 | 说明 |
|------|------|------|
| subjectId | string | 评估主体 ID |
| subjectType | 'member' \| 'device' \| 'store' | 主体类型 |
| metrics | RiskMetrics | 退款/异常支付/设备异常/投诉等 |
| tenantId | string | 租户 ID |

**Output**:

| 字段 | 类型 | 说明 |
|------|------|------|
| subjectId | string | 主体 ID |
| riskScore | number | 0-100 风险分数 |
| riskLevel | string | 风险等级 |
| triggeredRules | string[] | 触发规则 |
| reasons | string[] | 原因列表 |
| recommendations | string[] | 建议 |
| evaluatedAt | string | 评估时间戳 |

---

## 5. 依赖关系

- `@m5/domain`: 提供 AiProvider / PolicyConditionOperator / AiExecutionStatus 枚举类型
- `TenantGuard`: 多租户 RLS 守卫（位于 `agent/tenant.guard`）
- 当前为内存运行模式，**无数据库依赖**。后续可接入持久化存储。
