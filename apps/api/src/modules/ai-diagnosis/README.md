# AI 诊断模块 / AI Diagnosis Module

## 模块概述 / Module Overview

AI 诊断模块是对**规则引擎执行结果**进行诊断分析的核心模块。它在规则引擎（ai-rule-engine）完成场景评估后，记录"为什么这个 case 被这个规则命中/未命中"，提供诊断结果（DiagnosisEntity）、批量诊断（DiagnosisBatch）、风险报告（RiskReport）及高级分析能力（根因分析、因果关系图、规则冲突检测等）。

**业务定位 / Business Role**：运维人员排查误报/漏报的首选入口 — 每一次规则命中/未命中都有对应的诊断记录。

---

## 核心功能 / Core Features

| 功能 | 说明 |
|------|------|
| 诊断 CRUD       | 创建、查询、更新、删除单条诊断记录 |
| 批量诊断        | 批量创建场景诊断，自动完成并生成风险分布 |
| 风险报告        | 聚合所有诊断生成风险分布报告 |
| 根因分析        | 基于诊断记录推理根因和影响因子 |
| 因果关系图      | 构建场景—规则—条件—指标因果关系拓扑 |
| 规则冲突检测    | 检测规则间的矛盾/冗余/包含/循环冲突 |
| 诊断建议生成    | 自动生成优化/修复/预防/监控建议 |
| 模型对比评估    | 多引擎准确率/召回率/F1对比 |
| 异常聚类        | 按风险等级聚类诊断 |
| 引擎健康检查    | 检查引擎规则数/响应时间/错误率/吞吐量 |
| 趋势分析        | 诊断指标时序变化趋势分析与预测 |
| 批量分析摘要    | 批量诊断性能/风险摘要 |

---

## 架构图 / Architecture Diagram

```mermaid
graph TD
    subgraph 外部调用 / External
        A[ai-rule-engine / 规则引擎]
        B[ai-insight / 洞察模块]
        C[ai-recommend / 推荐模块]
    end

    subgraph AiDiagnosisModule
        Controller[AiDiagnosisController<br/>REST API 端点]
        Service[AiDiagnosisService<br/>诊断 CRUD + 批量 + 报告]
        AdvancedSvc[AdvancedDiagnosisService<br/>根因分析/因果图/冲突检测/健康检查]
        Entity[Entity / 实体定义<br/>DiagnosisEntity / DiagnosisBatch]
        Contract[Contract / 合约<br/>跨模块安全子集]
        DTO[DTO / 请求校验<br/>class-validator]
    end

    subgraph 存储 / Storage
        MemStore[Map{string, DiagnosisEntity}<br/>Map{string, DiagnosisBatch}]
    end

    A -->|POST /ai-diagnosis| Controller
    B -->|GET /ai-diagnosis/report/risk| Controller
    C -->|跨模块合约消费| Contract

    Controller --> Service
    Controller --> AdvancedSvc
    Service --> MemStore
    AdvancedSvc --> Service

    Contract -.->|输出合约子集| 外部模块
```

---

## API 端点 / API Endpoints

### 诊断 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| POST   | `/ai-diagnosis/`                    | 创建诊断 |
| GET    | `/ai-diagnosis/`                    | 诊断列表（支持 engineId/status/riskLevel/tenantId 过滤） |
| GET    | `/ai-diagnosis/:diagnosisId`        | 获取单条诊断 |
| PATCH  | `/ai-diagnosis/:diagnosisId`        | 更新诊断状态/风险/建议 |
| DELETE | `/ai-diagnosis/:diagnosisId`        | 删除诊断 |

### 批量诊断

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai-diagnosis/batch`          | 创建批量诊断 |
| GET  | `/ai-diagnosis/batch/:batchId` | 获取批量诊断详情 |
| GET  | `/ai-diagnosis/batch`          | 批量诊断列表 |

### 风险报告

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/ai-diagnosis/report/risk` | 风险报告（支持 engineId/tenantId 过滤） |

---

## 配置说明 / Configuration

本模块**无需额外配置**（无 TypeORM 实体注册，无数据库依赖）。诊断数据存储在内存 Map 中，适合**开发/测试/演示**场景。生产环境需接入持久化存储。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `TENANT_GUARD` | 中间件 | 启用 | 租户隔离守卫 |

---

## 依赖关系 / Dependencies

| 依赖模块 | 方向 | 说明 |
|----------|------|------|
| `@nestjs/common` | 框架 | NestJS 核心 |
| `class-validator` | 外部 | DTO 校验 |
| `../agent/tenant.guard` | 内部 | 租户隔离守卫 |

**跨模块合约消费方 / Contract Consumers**：
- `ai-rule-engine` — 诊断结果驱动规则调优
- `ai-insight` — 诊断洞察聚合
- `ai-recommend` — 基于诊断推荐优化建议
- `observability` — 诊断指标可观测

---

## 实体结构 / Entity Structure

### DiagnosisEntity（诊断结果）

| 字段 | 类型 | 说明 |
|------|------|------|
| diagnosisId | string | 诊断唯一标识 |
| engineId | string | 关联规则引擎 ID |
| scenarioId | string | 关联场景 ID |
| status | PENDING \| IN_PROGRESS \| COMPLETED \| FAILED | 诊断状态 |
| riskLevel | low \| medium \| high \| critical | 风险等级 |
| recommendation | string | 诊断建议 |
| matchedRuleIds | string[] | 命中的规则 ID |
| matchedConditionIds | string[] | 命中的条件 ID |
| triggeredActionIds | string[] | 触发的动作 ID |
| evaluationDurationMs | number | 评估耗时(ms) |
| tenantId | string | 租户 ID |
| requestedBy | string | 发起人 |

### DiagnosisBatch（批量诊断）

| 字段 | 类型 | 说明 |
|------|------|------|
| batchId | string | 批量诊断 ID |
| engineId | string | 关联引擎 ID |
| totalDiagnoses | number | 诊断总数 |
| matchedDiagnoses | number | 命中数 |
| matchRate | number | 命中率 |
| riskDistribution | object | 风险等级分布 |
| avgEvaluationDurationMs | number | 平均耗时(ms) |

---

## 测试 / Testing

模块测试覆盖：
- **单元测试** — service 层 CRUD / 批量 / 风险报告
- **进阶测试** — advanced service 根因分析 / 因果图 / 冲突检测
- **契约测试** — contract 映射器转换
- **E2E 测试** — 全链路端点测试
- **角色测试** — 多角色权限场景
- **综合测试** — 批量 + 报告 + 建议全场景
- **RingBeam 测试** — 圈梁集成测试
