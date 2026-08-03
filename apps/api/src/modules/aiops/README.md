# AIOps 模块

## 功能概述

AIOps 模块 (`aiops`) 是智能化运维引擎，提供时序异常检测、指标预测、攻击检测和自愈编排能力，实现对系统的智能监控与自动化故障响应。

### 核心能力

- **时序异常检测**: 基于时间序列的异常点检测，识别 spike / drop / trend / seasonal 四种异常类型，三级严重度评定
- **指标预测**: 使用预测算法对未来 N 步指标进行预测，输出置信度评分
- **攻击检测**: 多模式攻击识别 — DDoS / 暴力破解 / 数据泄露，基于行为特征与阈值规则
- **自愈编排**: 支持 restart / rollback / scale / isolate 四种自愈动作，全生命周期状态跟踪
- **一站式检测自愈**: 异常检测 + 攻击检测 + 自愈触发的组合流程，异常严重度 > 0.7 自动触发自愈
- **系统健康看板**: 实时展示所有受监控系统的健康状态

## 核心 Service 列表

| Service | 文件 | 职责 |
|---------|------|------|
| `AIOpsService` | `aiops.service.ts` | 主编排服务 — 异常检测、预测、攻击检测、自愈、一站式检测自愈、引擎状态 |
| `AIOpsPredictionService` | `aiops-prediction.service.ts` | 预测引擎 — 时序预测算法、数据点记录与管理 |
| `TimeSeriesAnomalyDetector` | `aiops-prediction.service.ts` | 异常检测器 — 异常判定、攻击检测、预测未来值 |
| `SelfHealingService` | `aiops-prediction.service.ts` | 自愈管理器 — 自愈任务调度、系统健康状态跟踪 |

## 主要 API 端点

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/aiops/detect` | 执行异常检测（注入历史数据并检测当前值） |
| `POST` | `/api/aiops/predict` | 预测未来指标（指定步长） |
| `POST` | `/api/aiops/attack` | 攻击检测（DDoS/暴力破解/数据泄露） |
| `POST` | `/api/aiops/heal` | 触发自愈流程（指定目标系统） |
| `GET` | `/api/aiops/status` | 获取引擎状态（规则数/已治愈系统数） |
| `GET` | `/api/aiops/health` | 获取所有系统健康状态 |

## 依赖关系

| 依赖 | 说明 |
|------|------|
| `@nestjs/common` | NestJS 框架基础 |
| `../agent/tenant.guard` | 多租户守卫 |

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| 异常严重度阈值 — CRITICAL | `number` | > 0.8 | 异常分数超过触发 CRITICAL 告警 |
| 异常严重度阈值 — WARNING | `number` | > 0.5 | 异常分数超过触发 WARNING 告警 |
| 自愈触发阈值 | `number` | > 0.7 | 异常分数超过自动触发自愈流程 |
| 异常检测规则 | — | 3 条 | spike / drop / trend / seasonal |
| 攻击检测规则 | — | 4 条 | DDoS / brute_force / data_exfil + 通用 |
| 攻击类型 | — | 3 种 | ddos / brute_force / data_exfil |
| 自愈动作 | — | 4 种 | restart / rollback / scale / isolate |

## 目录结构

```
aiops/
├── README.md                            # 本文件
├── aiops.service.ts                     # 主编排服务
├── aiops.controller.ts                  # API 控制器
├── aiops.module.ts                      # NestJS 模块
├── aiops.entity.ts                      # 实体定义
├── aiops.dto.ts                         # 入参校验 DTO
├── aiops.contract.ts                    # 跨模块合约
├── aiops-prediction.service.ts          # 预测引擎 + 异常检测器 + 自愈管理器
└── __tests__/                           # 测试目录
    ├── aiops-e2e.test.ts                # E2E 测试
    ├── aiops-prediction.service.spec.ts # 预测服务单元测试
    └── aiops.simulator.test.ts          # 场景模拟测试
```
