# 营销券模块 — 圈梁五道箍 验收文档

> 模块: Coupon (P-48 / P-17 Cross-Store Coupon)
> 版本: v2.0 (Phase-17 Pulse-68 T2 实施版本)
> 验收日期: 2026-07-23
> 审核人: 树哥A — 圈梁五道箍
> 关联PRD: [PRD-009](/docs/knowledge/prd/prd-coupon-p48.md) · [Coupon合约](/docs/knowledge/prd-summary/coupon-ac-summary.md)
> 关联Phase: P-48 联名券 / Phase-17 跨门店优惠券

---

## 一、模块概述

营销券模块是 ShenJiYing 核心营销基础设施，提供优惠券的完整生命周期管理：
创建 → 发放 → 核销 → 过期清理。

### 1.1 核心能力

| 能力 | 说明 | 优先级 |
|:----|:-----|:------:|
| 优惠券CRUD | 创建/查询/列表/状态变更 | P0 |
| 跨门店核销 | 支持 single-store / multi-store / tenant-wide 三种scope | P0 |
| 批量核销 | 一次性核销多张优惠券 | P0 |
| 营销活动发放 | CouponCampaign + CouponAIDistribution | P0 |
| AI智能发放 | 评分排序、优化发放时机、ROI统计 | P1 |
| 联盟券 | 多合作伙伴阶梯满减联盟计划 | P1 |
| 过期清理 | 定时扫描过期券自动标记 expired | P2 |
| 幂等保障 | idempotencyKey 防止重复核销 | P0 |
| 多租户隔离 | TenantGuard + quota 限制 | P0 |

### 1.2 模块文件清单

| 文件 | 类型 | 说明 |
|:-----|:-----|:------|
| coupon.entity.ts | Entity | CouponV2 实体 (TypeORM, JSONB scope/rules) |
| coupon-redemption-log.entity.ts | Entity | 核销日志 (唯一ID: idempotencyKey) |
| coupon.types.ts | Types | 公共类型定义 (Scope/Status/Result) |
| coupon.dto.ts | DTO | 请求校验 (class-validator) |
| coupon.contract.ts | Contract | API契约 + 实体→契约转换器 |
| coupon.controller.ts | Controller | 6个REST端点 |
| coupon.service.ts | Service | 核心业务逻辑 (核销/校验/事务) |
| coupon-cleanup.service.ts | Service | 过期清理Cron |
| coupon-alliance.service.ts | Service | 联盟券阶梯满减 |
| coupon-ai-distribute.service.ts | Service | AI智能发放引擎 |
| coupon.module.ts | Module | NestJS Module 定义 |

---

## 二、核心实体

### 2.1 CouponV2

| 字段 | 类型 | 说明 | 边界注意 |
|:-----|:-----|:-----|:---------|
| id | UUID | PK | — |
| tenantId | string | 租户隔离 | 所有查询强制 tenantId 过滤 |
| code | string | 优惠码 (tenantId+code唯一) | 特殊字符处理、大小写敏感 |
| scope | JSONB | { type, storeIds, includeSubordinates } | storeIds 空数组时行为 |
| redemptionRules | JSONB | { minAmount, categories, excludeItems, userSegments } | 全为空时无限制 |
| value | decimal(10,2) | 面额 | 负数校验、0值券 |
| valueType | fixed / percentage | 折扣类型 | percentage 无上限限制 |
| expiresAt | timestamp | 过期时间 | 时区一致性 (UTC) |
| status | active / paused / expired / exhausted | 状态机 | 状态转换合法性 |
| redemptionCount | int | 已核销数 | 并发竞争安全 |
| maxRedemptions | int? | 核销上限 | null=无限制 |

### 2.2 CouponRedemptionLog

| 字段 | 类型 | 说明 |
|:-----|:-----|:------|
| id | UUID | PK |
| couponId | string | 关联优惠券 |
| userId | string | 核销用户 |
| storeId | string | 核销门店 |
| orderId | string | 订单 |
| amount | decimal | 核销金额 |
| idempotencyKey | string (Unique) | 幂等键 |
| redeemedAt | timestamp | 核销时间 |

---

## 三、接口清单

| 方法 | 端点 | 说明 | 鉴权 |
|:----|:-----|:-----|:----:|
| POST | /coupons | 创建优惠券 | TenantGuard |
| GET | /coupons | 列表查询 (status/tenantId/page/pageSize) | TenantGuard |
| GET | /coupons/:id | 详情 | TenantGuard |
| PATCH | /coupons/:id/status | 更新状态 (active/paused) | TenantGuard |
| POST | /coupons/redeem | 跨门店核销 | TenantGuard |
| POST | /coupons/batch-redeem | 批量核销 | TenantGuard |

---

## 四、验收 Case（圈梁五道箍 × 15条）

### 维度 A: 功能完整性 (AC-01 ~ AC-04)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-01 | 创建固定金额多门店券 | tenant-A 有效, scope.type=multi-store | POST /coupons { code, value=50, scope: {type:'multi-store',storeIds:['s1','s2']} } | 201 Created, 返回完整 coupon 对象, status=active, redemptionCount=0 | 功能完整性 |
| AC-02 | 创建百分比折扣券 | tenant-A 有效 | POST /coupons { valueType:'percentage', value:20, maxRedemptions:100 } | 创建成功, valueType=percentage, maxRedemptions=100 | 功能完整性 |
| AC-03 | 查询优惠券列表 | tenant-A 有3张券 (2 active, 1 expired) | GET /coupons?status=active&page=1&pageSize=20 | 返回 coupon[2], total=2, 分页信息正确 | 功能完整性 |
| AC-04 | 核销一张有效优惠券 | coupon active, storeId in scope, orderAmount 满足 minAmount | POST /coupons/redeem { userId, couponCode, storeId, orderAmount, orderId, idempotencyKey } | success=true, couponId 返回, redemptionCount+1 | 功能完整性 |

### 维度 B: 边界条件 (AC-05 ~ AC-07)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-05 | 核销恰满足最低消费 | coupon.minAmount=100, orderAmount=100 | redeem 同 AC-04, orderAmount=100 | success=true, 边界值通过 | 边界条件 |
| AC-06 | 最大核销数恰好用完 | coupon.maxRedemptions=1, redemptionCount=0 | redeem 成功; 再次 redeem 同 coupon | 第一次 success=true, 第二次 error=COUPON_EXHAUSTED, status 自动变为 exhausted | 边界条件 |
| AC-07 | percentage 类型 value>100% | valueType=percentage, value=200 | POST /coupons 创建 | 创建成功 (业务上是否允许 200% 折扣需确认) | 边界条件 |

### 维度 C: 异常路径 (AC-08 ~ AC-11)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-08 | 未达到最低消费 | coupon.minAmount=100, orderAmount=50 | redeem | success=false, error.code=MIN_AMOUNT_NOT_MET | 异常路径 |
| AC-09 | 门店不在 scope 范围 | coupon.scope=['s1'], 在 s2 核销 | redeem storeId=s2 | success=false, error.code=STORE_NOT_IN_SCOPE, reason 明确 | 异常路径 |
| AC-10 | 已过期券核销 | coupon.expiresAt < now, status=active (未执行过期扫描) | redeem | success=false, error.code=COUPON_EXPIRED | 异常路径 |
| AC-11 | 幂等键重复提交 | 某 redeem 已成功 | 同 idempotencyKey 再次 redeem | success=true (幂等返回第一次结果), 不扣减双重 | 异常路径 |

### 维度 D: 权限控制 (AC-12 ~ AC-13)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-12 | 跨租户访问隔离 | tenant-B 创建 coupon, tenant-C 查询 | tenant-C 身份 GET /coupons | 只返回 tenant-C 的券, 不泄漏 tenant-B 数据 | 权限控制 |
| AC-13 | tenant 的 quota 超限时核销 | quota.coupon 已满 | redeem | success=false, error.code=QUOTA_EXCEEDED | 权限控制 |

### 维度 E: 可观测性 (AC-14 ~ AC-15)

| ID | 场景 | 前置条件 | 操作步骤 | 预期结果 | 审核维度 |
|:---|:-----|:---------|:---------|:---------|:--------:|
| AC-14 | 核销操作日志 | redeem 成功/失败 | 检查 Logger 输出 | 成功: `Redeemed: coupon=... user=... store=... redemption=...`; 失败: `Business check failed: ${code}` | 可观测性 |
| AC-15 | 过期清理执行统计 | tenant-A 有3张过期未标 expired 的券 | scanExpiredCoupons('tenant-A') | 返回3, coupon.status='expired'; 无过期券时返回0 | 可观测性 |

---

## 五、风险点

| 风险 | 影响 | 严重度 | 缓解措施 |
|:-----|:-----|:------:|:---------|
| 并发核销竞争 | coupon.redemptionCount 可能超限 | **高** | 事务中使用 `WHERE redemptionCount = oldCount` CAS 更新, updateResult.affected===0 时抛错回滚 |
| percentage 无上限 | 面额200%+的percentage券导致负订单 | **高** | 需补充 valueType=percentage 的上限校验 (max 100%) |
| 联盟券 controller 缺失 | alliance.service 代码完整但无 Controller 端点和路由注册 | **中** | P-48 联名券阶段补充 REST API |
| AI发放引擎使用 mock 数据 | campaignGetter/distribution 依赖 mock 而非真实数据库 | **中** | Phase-17 后的 Pulse-69 T5 任务计划切换真实数据源 |
| cleanup service 未注册 @Cron | 过期清理需外部 scheduler 调用 | **低** | 当前设计为 task-scheduler 模块定时调用, 确保集成测试覆盖 |
| storeId 所有权校验 | requireTenantContext() 在测试环境可能 mock 不完整导致抛出异常 | **低** | E2E 测试需覆盖 store 所有权场景 |

---

## 六、审核结论

| 审核维度 | 覆盖度 | 备注 |
|:---------|:------:|:-----|
| 功能完整性 | ✅ 完整 | CRUD + 核销 + 批量 + 联盟 + AI发放 + 过期清理 |
| 边界条件 | ⚠️ 需补充 | percentage 上限值、storeIds 空数组、value=0 等边界 |
| 异常路径 | ✅ 完整 | 7种错误码全覆盖 (COUPON_NOT_FOUND / EXPIRED / EXHAUSTED / STORE_NOT_IN_SCOPE / MIN_AMOUNT_NOT_MET / USER_SEGMENT_NOT_MATCH / QUOTA_EXCEEDED) |
| 权限控制 | ✅ 完善 | TenantGuard + tenant-context 双守卫 + quota 检查 |
| 可观测性 | ✅ 良好 | Logger 全覆盖, 事务日志记录完整, cleanup 统计返回 |
