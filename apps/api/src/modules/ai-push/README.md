# AI 精准推送模块 (ai-push)

## 模块概述

AI 精准推送模块（编号 T113-2）是 shenjiying88 平台的会员精准触达与推送任务管理子系统。该模块基于 AI 驱动的会员分群、最优时机预测和 A/B 测试框架，实现千人千面的精准推送，显著提升推送转化率与用户体验。

## 核心功能

- **会员分群（Member Segmentation）**：基于行为分群、价值分群和生命周期分群三种维度，对会员进行精细化分层，支持 RFM 模型、活跃度分析等。
- **最优推送时机（Optimal Timing）**：基于用户历史行为模式，预测每个会员的最佳推送时段（小时级），支持多通道独立预测。
- **A/B 测试框架（A/B Test）**：创建和管理推送实验，支持多变量实验配置，自动计算置信度与显著性，产出可量化实验结论。
- **推送任务管理（Push Task）**：创建、调度、追踪推送任务，支持定时推送、分群推送、重试机制和状态追踪。
- **推送分析（Push Analytics）**：推送后深度数据分析，包括推送表现总览、渠道对比、分群对比、用户标签画像、多通道组合策略优化和归因分析。
- **任务扩展服务（Task Expanded）**：高级调度与执行追踪，支持优先级队列、多通道分发、统计聚合。
- **跨模块合约（Contract）**：定义稳定的对外公开接口，供 member、loyalty、campaign、analytics 等模块稳定消费。
- **多租户隔离**：所有 API 通过 `TenantGuard` 实现租户级数据隔离。

## 目录结构

```
ai-push/
├── README.md                              # 本文件
├── ai-push.module.ts                      # NestJS 模块定义
├── ai-push.controller.ts                  # REST API 控制器
├── ai-push.service.ts                     # 核心服务（分群/时机/A/B）
├── ai-push-task.service.ts                # 推送任务管理服务
├── ai-push-task-expanded.service.ts       # 推送任务扩展服务（调度/统计/重试）
├── ai-push-analytics.service.ts           # 推送分析增值服务
├── ai-push.entity.ts                      # 实体/类型定义
├── ai-push.dto.ts                         # 请求/响应 DTO
├── ai-push.contract.ts                    # 跨模块合约类型
├── ai-push.controller.spec.ts             # 控制器单元测试
├── ai-push.controller.test.ts             # 控制器集成测试
├── ai-push.service.spec.ts                # 服务单元测试
├── ai-push.service.test.ts                # 服务集成测试
├── ai-push-task.service.spec.ts           # 任务服务单元测试
├── ai-push-task.service.test.ts           # 任务服务集成测试
├── ai-push.dto.test.ts                    # DTO 验证测试
├── ai-push.entity.test.ts                 # 实体测试
├── ai-push.module.test.ts                 # 模块注入测试
├── ai-push.e2e.test.ts                    # E2E 测试
├── ai-push.e2e-enhanced.test.ts           # E2E 增强测试
├── ai-push.contract.test.ts               # 合约测试
├── ai-push.comprehensive.test.ts          # 综合测试
├── ai-push.ringbeam.test.ts               # 圈梁测试
├── ai-push.role.test.ts                   # 角色测试
├── ai-push.role-scenario.test.ts          # 角色场景测试
├── ai-push.role-extended.test.ts          # 角色扩展测试
├── ai-push.task-extended.spec.ts          # 任务扩展单测
├── ai-all-edge-cases.test.ts              # 边界用例测试
├── ai-all-advanced.spec.test.ts           # 高级功能测试
├── ai-all-final.test.ts                   # 终审汇聚测试
└── ai-push.cross-tenant.test.ts           # 跨租户测试
```

## 使用方法

### 创建推送任务

```bash
POST /api/ai-push/tasks
Content-Type: application/json

{
  "title": "春节优惠活动",
  "content": "春节限时特惠，全场 8 折！",
  "channel": "push",
  "targetMemberIds": ["m001", "m002"],
  "scheduledAt": 1706774400000
}
```

### 按分群推送

```bash
POST /api/ai-push/segment-push
Content-Type: application/json

{
  "title": "沉睡会员唤醒",
  "content": "您有一张专属优惠券待领取",
  "channel": "sms",
  "segmentType": "behavior",
  "segmentValue": "sleeping"
}
```

### 查询推送统计

```bash
GET /api/ai-push/stats?tenantId=tenant-001&startDate=2026-01-01&endDate=2026-06-30
```

### 创建 A/B 实验

```bash
POST /api/ai-push/experiments
Content-Type: application/json

{
  "name": "推送文案 A/B 测试",
  "variants": [
    { "id": "A", "content": "优惠活动火热进行中" },
    { "id": "B", "content": "🔥 限时特惠，手慢无！" }
  ],
  "channel": "push",
  "targetMemberIds": ["m001", "m002", "m003"]
}
```

### 获取最优推送时机

```bash
POST /api/ai-push/optimal-time
Content-Type: application/json

{
  "memberId": "m001",
  "channels": ["push", "email"]
}
```

## 依赖说明

| 依赖 | 用途 |
|------|------|
| `@nestjs/common` | NestJS 核心装饰器（`@Injectable`, `@Module`, `@Controller` 等） |
| `@nestjs/core` | NestJS 运行时 |
| `class-validator` | DTO 请求参数校验 |
| `class-transformer` | DTO 类型转换 |
| `vitest` | 测试框架（`describe`, `it`, `expect`） |
| `reflect-metadata` | 装饰器元数据反射 |
| 租户守卫 (`agent/tenant.guard`) | 多租户隔离 |

