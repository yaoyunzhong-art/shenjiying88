# 🗺️ PRD: 全员营销与绩效 — WP-11
> 日期: 2026-07-23 | 圈梁: 代码✅ 测试✅ 审计✅ PRD新建
> 分支: `tree/codeup-acr-ci-20260717`
> 优先级: P1（全新模块）

**用途**: 全员营销推广码管理 + KPI 绩效配置与考核 + 推广排行榜 + 营销任务 + 违规识别
**产出**: `apps/api/src/modules/employee-marketing/`
**作用**: WP-11 全员营销与绩效 · BS-0147~BS-0154
**验收**: 推广码、KPI、排行榜、违规识别形成闭环

---

## 1. 背景与目标

### 1.1 业务背景

shenjiying88 平台在 P1 阶段需要建立全员营销体系，支持一线员工通过推广码进行获客转化，同时建立 7 类岗位的 KPI 绩效评估体系，实现推广与绩效的一体化管理。

### 1.2 目标

1. **推广码管理**: 支持员工生成 coupon/discount/ticket 三类推广码，带佣金费率和使用上限
2. **推广追踪**: 跟踪每次推广的转化路径（客户/订单/被推荐人），支持 pending→confirmed→cancelled 状态流转
3. **员工推广统计**: 按员工查询推广数、佣金、转化率、排名
4. **KPI 配置与考核**: 支持 7 类岗位（收银/销售/运营/管理/清洁/安保/客服）的 KPI 配置，加权评分和奖金计算
5. **推广排行榜**: 按佣金降序排列，支持分页限制
6. **营销任务**: 创建分配营销任务，支持 active/completed/expired 状态
7. **违规识别**: 检测短时间内大量推广、异常高频转化等异常行为
8. **多租户隔离**: 全量端点受 TenantGuard 保护

### 1.3 范围

| BS 编号 | 名称 | 模块 | 状态 |
|---------|------|------|:----:|
| BS-0147 | 全员推广码系统 | employee-marketing | ✅ IMPLEMENTED |
| BS-0148 | 推广追踪与佣金记录 | employee-marketing | ✅ IMPLEMENTED |
| BS-0150 | 员工推广统计与排名 | employee-marketing | ✅ IMPLEMENTED |
| BS-0152 | 7类岗位 KPI 配置 | employee-marketing | ✅ IMPLEMENTED |
| BS-0153 | 绩效考核与奖金计算 | employee-marketing | ✅ IMPLEMENTED |
| BS-0154 | 推广违规识别 | employee-marketing | ✅ IMPLEMENTED |

---

## 2. 模块架构

### 2.1 模块结构

```
apps/api/src/modules/employee-marketing/
├── employee-marketing.module.ts       # NestJS 模块定义
├── employee-marketing.controller.ts   # REST API 控制器（10端点）
├── employee-marketing.service.ts      # 核心业务逻辑
├── employee-marketing.entity.ts       # 数据模型定义
├── employee-marketing.dto.ts          # 请求/响应 DTO
├── employee-marketing.controller.spec.ts  # 控制器测试
└── employee-marketing.service.spec.ts     # 服务层测试
```

### 2.2 数据模型

**PromoCode** — 推广码
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| employeeId | string | 所属员工 |
| code | string | 推广码（唯一） |
| type | 'coupon'/'discount'/'ticket' | 推广码类型 |
| commissionRate | number | 佣金费率 |
| createdAt | Date | 创建时间 |
| validUntil | Date | 过期时间 |
| usageLimit | number | 使用上限 |
| currentUsage | number | 当前使用次数 |

**PromoTracking** — 推广追踪
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| promoCodeId | string | 关联推广码 |
| customerId | string? | 关联客户 |
| orderId | string? | 关联订单 |
| commission | number | 佣金 |
| status | 'pending'/'confirmed'/'cancelled' | 状态 |
| createdAt | Date | 创建时间 |

**KpiConfig** — KPI 配置
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| positionType | 7类岗位 | 收银/销售/运营/管理/清洁/安保/客服 |
| metricName | string | 指标名 |
| target | number | 目标值 |
| weight | 0~1 | 权重 |
| period | 'daily'/'weekly'/'monthly' | 周期 |

**KpiResult** — 绩效结果
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| employeeId | string | 员工 |
| period | YYYY-MM | 考核周期 |
| scores | Record<string, number> | 各指标分数 |
| totalScore | number | 加权总分 |
| bonusAmount | number | 奖金金额（总×50） |
| createdAt | Date | |

**MarketingTask** — 营销任务
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| title | string | 标题 |
| description | string | 描述 |
| points | number | 积分 |
| deadline | Date | 截止日期 |
| status | 'active'/'completed'/'expired' | 状态 |
| assignedTo | string[] | 分配员工 |

---

## 3. API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /employee-marketing/promo-code | 生成推广码 |
| GET | /employee-marketing/promo-codes | 查询推广码列表 |
| POST | /employee-marketing/track | 追踪推广转化 |
| GET | /employee-marketing/stats/:employeeId | 员工推广统计 |
| POST | /employee-marketing/kpi/config | 配置 KPI（管理端） |
| GET | /employee-marketing/kpi/:employeeId | 查询员工 KPI |
| POST | /employee-marketing/kpi/submit | 提交绩效结果 |
| GET | /employee-marketing/leaderboard | 推广排行榜 |
| POST | /employee-marketing/tasks | 创建营销任务 |
| GET | /employee-marketing/tasks/:employeeId | 员工待办任务 |
| POST | /employee-marketing/compliance/check | 违规检测 |

---

## 4. 违规识别逻辑

### 4.1 检测规则

1. **短时间大量推广**: 全系统 1 分钟内超过 100 条 → high 风险
2. **员工高频推广**: 单员工 1 分钟内超过 10 条 → medium 风险
3. **pending 率异常**: 超过 90% 未确认 → medium 风险
4. **重复客户**: 同一客户被多个推广码推广超过 3 次 → medium 风险

### 4.2 风险等级

- **low** (score < 20): 无异常
- **medium** (20 ≤ score < 50): 可疑行为
- **high** (score ≥ 50): 严重异常，需人工审核

---

## 5. 圈梁要求

- ❌ 无 test.skip/only
- ✅ TSC 零错误
- ✅ 所有端点含正反例测试（controller: 13 项, service: 30+ 项）
- ✅ 全端点受 TenantGuard 保护
- ✅ 依赖: WP-08A 会员权益 / WP-08B AI 营销

---

## 6. 参考

- `BS-0147` 全员推广码系统
- `BS-0148` 推广追踪与佣金记录
- `BS-0150` 员工推广统计与排名
- `BS-0152` 7类岗位 KPI 配置
- `BS-0153` 绩效考核与奖金计算
- `BS-0154` 推广违规识别
