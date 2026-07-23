# Anomaly Detector 异常检测模块

> **阶段:** Phase-19 T26 | **状态:** ✅ Active

异常检测引擎，提供**3σ (Z-score) / IQR (Tukey fence) / EWMA (指数加权移动平均)** 三种检测算法，支持单点检测与批量检测，配合白名单机制减少误报。

## 核心功能特性

| # | 特性 | 说明 |
|---|------|------|
| 1 | **三重检测算法** | 3σ Z-score（正态分布假设）、IQR Tukey fence（箱线图离群值检测）、EWMA（指数加权移动平均，捕捉缓慢漂移） |
| 2 | **综合评分机制** | 多检测器一致时增加置信度，score ∈ [0,1]，自动判定 NORMAL / WARNING / CRITICAL |
| 3 | **业务白名单** | 支持按 metricKey 配置白名单，忽略已知业务波动（如月底/周末高峰），白名单优先于检测 |
| 4 | **批量检测** | `detectBatch` 一次检测多个 metric 的最新点 |
| 5 | **动态配置** | 运行时调整 sigmaThreshold、ewmaAlpha、warningThreshold 等参数 |

## 技术栈 / 依赖

| 依赖 | 用途 |
|------|------|
| NestJS `@nestjs/common` | Module / Controller / Service 框架 |
| `class-validator` / `class-transformer` | DTO 校验与转换 |
| `TenantGuard` (agent 模块) | 多租户认证守卫 |
| `time-series-collector` (同层模块) | `TimeSeriesPoint` 类型引用 |

## API 端点概览

| 方法 | 路径 | 描述 | 入参 |
|------|------|------|------|
| `POST` | `/anomaly-detector/detect` | 单点异常检测 | `metricKey`, `value`, `history[]`, `timestamp?` |
| `POST` | `/anomaly-detector/detect/batch` | 批量异常检测 | `points[]`, `timestamp?` |
| `POST` | `/anomaly-detector/configure` | 动态调整检测参数 | `sigmaThreshold?`, `ewmaAlpha?`, `criticalThreshold?`, 等 |
| `GET` | `/anomaly-detector/status` | 引擎健康状态 | — |

### 检测结果格式

```json
{
  "data": {
    "metricKey": "api.coupons.p95",
    "value": 3500,
    "baseline": 1200,
    "deviation": 2300,
    "score": 0.92,
    "severity": "CRITICAL",
    "detectors": {
      "threeSigma": { "zScore": 4.2, "detected": true },
      "iqr": { "lower": 800, "upper": 1800, "deviation": 2.1, "detected": true },
      "ewma": { "expected": 1300, "deviation": 0.63, "detected": true }
    },
    "whitelisted": false,
    "reason": "3σ violated (z=4.20); IQR fence violated; EWMA drift detected",
    "detectedAt": "2026-07-23T11:57:00.000Z"
  }
}
```

## 测试覆盖情况

| 测试文件 | 类型 | Test 数 |
|----------|------|---------|
| `anomaly-detector.service.spec.ts` | 单元测试 (Service) | 32 |
| `anomaly-detector.controller.spec.ts` | 单元测试 (Controller) | 28 |
| `anomaly-detector.dto.test.ts` | DTO 验证测试 | 32 |
| `anomaly-detector.entity.test.ts` | 实体类型测试 | 21 |
| `anomaly-detector.contract.test.ts` | 跨模块合约测试 | 16 |
| `anomaly-detector.module.test.ts` | 模块依赖注入测试 | 3 |
| `anomaly-detector.service.test.ts` | Service 集成测试 | 9 |
| `anomaly-detector.controller.test.ts` | Controller 集成测试 | 10 |
| `anomaly-detector.role.test.ts` | 角色场景测试 | 27 |
| `anomaly-detector.role-v2.test.ts` | 角色场景 v2 | 29 |
| `anomaly-detector.role-extended.test.ts` | 扩展场景测试 | 34 |
| `anomaly-detector.phase-p41.test.ts` | P41 阶段回归测试 | 24 |
| `anomaly-detector.e2e.test.ts` | E2E 测试 | 6 |
| `anomaly-detector.e2e-enhanced.test.ts` | 增强 E2E 测试 | 34 |
| `anomaly-detector-ringbeam.test.ts` | RingBeat 兼容性测试 | 2 |

**共计 15 个测试文件，~307 个测试用例。**

## 配置与环境变量

### 默认参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `sigmaThreshold` | 3 | 3σ Z-score 阈值 |
| `ewmaAlpha` | 0.3 | EWMA α 平滑系数 (0-1) |
| `criticalThreshold` | 0.8 | CRITICAL 严重级别 score 阈值 |
| `warningThreshold` | 0.5 | WARNING 严重级别 score 阈值 |

### 运行时配置

通过 `POST /anomaly-detector/configure` 动态设置，无需重启。

### 模块注册

```typescript
// app.module.ts
import { AnomalyDetectorModule } from './modules/anomaly-detector/anomaly-detector.module'

@Module({
  imports: [AnomalyDetectorModule],
})
export class AppModule {}
```

## 算法说明

- **3σ (Z-score):** `z = (value - mean) / stddev`，至少需要 3 个历史点
- **IQR (Tukey fence):** `上限 = Q3 + 1.5 * IQR，下限 = Q1 - 1.5 * IQR`，至少需要 4 个历史点
- **EWMA:** `EWMA_t = α * x_t + (1 - α) * EWMA_{t-1}`，持续更新状态缓存
- **综合评分:** `score = max(z_norm * 0.4, iqr_norm * 0.3, ewma_norm * 0.3) + (多检测器一致? +0.2 : 0)`

## 跨模块合约

通过 `anomaly-detector.contract.ts` 暴露稳定接口，供 `ai-diagnosis`、`ai-rule-engine`、`observability`、`notifications` 等模块消费。
