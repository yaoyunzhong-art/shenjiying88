# V23 PRD: 会员管理模块 (Membership)

> **版本**: v1.0 · **签发人**: 🐜 树哥 · **日期**: 2026-07-21  
> **核心模块**: `membership` · **代码路径**: `apps/api/src/modules/membership/`  
> **关联Phase**: P-36 (会员店A) · **关联PRD**: `prd-member-p36.md`

---

## 1. 模块概述

### 1.1 定位

会员管理是门店核心模块，提供会员全生命周期管理：注册→消费积分→等级成长→余额管理→交易流水。

为收银系统、小程序端、后台管理提供统一 API。

### 1.2 交付内容

| 交付物 | 路径 |
|:-------|:-------|
| 会员管理 Service | `membership.service.ts` |
| 会员管理 Controller | `membership.controller.ts` |
| 模块定义 | `membership.module.ts` |
| DTO 定义 | `membership.dto.ts` |
| Controller Test | `membership.controller.test.ts` (≥20个用例) |
| E2E 测试 | `cross-module-e2e-58-membership.test.ts` |
| 本文档 | `v23-prd-membership.md` |

### 1.3 路由总览

```
POST   /membership/register         注册会员
POST   /membership/get-or-create    获取或创建
GET    /membership/:id              按ID查询
GET    /membership/phone/:phone     按手机号查询
PUT    /membership/:id              更新会员信息
DELETE /membership/:id              删除会员
GET    /membership                  会员列表/搜索
GET    /membership/levels           等级配置查询
GET    /membership/:id/level        会员等级详情
GET    /membership/:id/upgrade      升级进度
POST   /membership/:id/refresh-level 刷新等级
POST   /membership/:id/points/earn  积分累计
POST   /membership/:id/points/redeem 积分扣减
GET    /membership/:id/points/history 积分流水
POST   /membership/:id/points/adjust 管理员调整积分
POST   /membership/:id/balance/recharge 余额充值
POST   /membership/:id/balance/pay   余额支付
GET    /membership/:id/balance/history 余额流水
GET    /membership/stats             会员统计
```

---

## 2. 业务需求

### 2.1 会员等级体系

| 等级 | 注册即可 | 升级条件 | 积分倍率 | 折扣率 | 说明 |
|:-----|:---------|:---------|:--------:|:------:|:-----|
| 🟤 普通 | ✅ | 0 | 1x | 无 | 默认等级 |
| 🩶 银卡 |   | 累计消费≥500元 | 1.2x | 95折 |  |
| 🟡 金卡 |   | 累计消费≥2000元 | 1.5x | 90折 |  |
| 💎 钻石 |   | 累计消费≥5000元 | 2x | 85折 | 含生日礼 |

### 2.2 功能矩阵

| 领域 | 功能 | RQ编号 | 优先级 | 实现状态 |
|:----|:-----|:------:|:------:|:--------:|
| 会员 | 注册 | RQ-36-01 | P0 | ✅ |
| 会员 | 查询 | RQ-36-02 | P0 | ✅ |
| 等级 | 等级展示 | RQ-36-03 | P0 | ✅ |
| 积分 | 积分累计 | RQ-36-04 | P0 | ✅ |
| 积分 | 积分扣减 | RQ-36-05 | P0 | ✅ |
| 余额 | 余额充值 | RQ-36-06 | P0 | ✅ |
| 余额 | 余额支付 | RQ-36-07 | P0 | ✅ |
| 流水 | 消费记录 | RQ-36-08 | P1 | ✅ |
| 等级 | 会员续费 | RQ-36-09 | P1 | 🔲 (后续) |
| 权益 | 权益展示 | RQ-36-10 | P1 | ✅ (等级配置) |

### 2.3 积分策略

- 积分倍数 = 等级配置中的 `pointsMultiplier`
- 100 积分 = 1 元（抵扣）
- 积分抵扣最低 100 积分起
- 消费时同步计算总消费（`totalSpent`）用于自动升级判定

---

## 3. 技术设计

### 3.1 多租户隔离

```typescript
@Controller('membership')
@UseGuards(TenantGuard)  // 从 x-tenant-id header 提取 tenantId
```

- 所有注册/查询操作限定在 `tenantId` 范围内
- 同手机号跨店（不同租户）允许重复注册

### 3.2 核心类型

```typescript
interface Member {
  id: string
  tenantId: string
  phone: string
  name: string
  level: 'regular' | 'silver' | 'gold' | 'diamond'
  points: number
  balance: number       // 预付余额(分)
  totalSpent: number    // 累计消费(分)
  createdAt: Date
  updatedAt: Date
  expiredAt?: Date
}

interface PointsTransaction {
  id: string
  memberId: string
  type: 'earn' | 'redeem' | 'expire' | 'admin'
  amount: number
  orderId?: string
  remark: string
  createdAt: Date
}

interface BalanceTransaction {
  id: string
  memberId: string
  type: 'recharge' | 'payment' | 'refund' | 'admin'
  amount: number
  orderId?: string
  paymentMethod?: string
  remark: string
  createdAt: Date
}
```

### 3.3 自动升级规则

```typescript
calculateLevel(totalSpent: number): MemberLevel
```

消费时 `earnPoints` 会自动触发 `refreshLevel` 检查。升级阈值：
- 银卡: ≥500元（50000分）
- 金卡: ≥2000元（200000分）
- 钻石: ≥5000元（500000分）

---

## 4. 验收标准 (AC)

| AC-ID | 场景 | 前置 | 预期 |
|:------|:-----|:-----|:-----|
| AC-36-01 | 注册新手机号 | 手机号未注册 | 返回 member，等级=普通，积分=0 |
| AC-36-01b | 重复手机号注册 | 已注册 | 返回错误: "手机号已注册" |
| AC-36-02 | 已注册手机号查会员 | 会员存在 | 返回姓名/等级/积分/余额 |
| AC-36-03 | 未注册手机号查会员 | 无此会员 | 返回 "手机号未注册" |
| AC-36-04 | 普通会员消费100元 | 等级=普通 | 积分+100 (1x) |
| AC-36-05 | 金卡会员消费100元 | 等级=金卡 | 积分+150 (1.5x) |
| AC-36-06 | 使用500积分抵扣 | 积分≥500 | 积分-500，抵扣5元 |
| AC-36-07 | 积分<100无法抵扣 | 积分不足 | 提示"积分不足" |
| AC-36-08 | 充值100元 | 微信支付成功 | 余额+100，流水记录 |
| AC-36-09 | 余额支付成功 | 余额≥应付 | 余额扣减，支付完成 |
| AC-36-10 | 余额不足 | 余额<应付 | 提示"余额不足" |
| AC-36-11 | 消费达标自动升级 | 总消费≥500元 | 等级自动升为银卡 |
| AC-36-12 | 会员按手机号/姓名搜索 | 有会员数据 | 返回过滤结果 |

---

## 5. 测试覆盖

### 5.1 Controller Test (`membership.controller.test.ts`)

覆盖 ≥20 个测试用例，包括：

| 类别 | 用例数 | 涵盖 |
|:----|:------:|:-----|
| 会员注册 | 4 | 成功注册/空名字/重复/跨店 |
| 会员查询 | 4 | 按ID/不存在的ID/按手机号/未注册 |
| 会员更新 | 2 | 成功更新/不存在的会员 |
| 会员删除 | 1 | 删除后验证不存在 |
| 会员列表 | 3 | 全量/按等级/按搜索 |
| 等级管理 | 4 | 等级配置/等级详情/升级进度/刷新升级 |
| 积分管理 | 6 | 累计/金卡倍率/扣减/不足/流水/管理调整 |
| 余额管理 | 4 | 充值/0元充值/支付/余额不足 |
| 统计 | 2 | 有数据/空数据 |

### 5.2 E2E Test (`cross-module-e2e-58-membership.test.ts`)

HTTP 全链路测试，使用 NestJS TestingModule + supertest：

| 序号 | 测试点 | 覆盖 AC |
|:----:|:-------|:-------:|
| 1 | 新手机号注册成功 | AC-36-01 |
| 2 | 重复手机号注册失败 | AC-36-01b |
| 3 | 已注册手机号查询信息 | AC-36-02 |
| 4 | 未注册手机号提示 | AC-36-03 |
| 5 | 普通会员消费得积分 | AC-36-04 |
| 6 | 金卡会员多倍积分 | AC-36-05 |
| 7 | 积分扣减成功 | AC-36-06 |
| 8 | 积分不足失败 | AC-36-07 |
| 9 | 余额充值 | AC-36-08 |
| 10 | 余额支付成功 | AC-36-09 |
| 11 | 余额不足失败 | AC-36-10 |
| 12 | 消费达标升级 | AC-36-11 |
| 13 | 会员列表搜索 | AC-36-12 |
| 14 | 升级进度查询 | — |
| 15 | 积分流水 | — |
| 16 | 余额流水 | — |
| 17 | 统计接口 | — |

---

## 6. 圈梁检查

| # | 箍 | 要求 | 状态 |
|:-:|:--:|:-----|:----:|
| 1 | 🟢 TSC | `npx tsc --noEmit` 零错误 | 🟡 依赖整体项目 |
| 2 | 🟢 测试 | Controller test ≥10个，全部通过 | ✅ 24个用例 |
| 3 | 🟢 审计 | 圈梁表已更新 | ✅ |
| 4 | 🔴 PRD | 本文件 24h 内补完 | ✅ |
| 5 | 🟠 知识 | 知识赋能脚本可用 | 🟡 |
| 6 | 🔴 CI | CI 流程正常 | 🟡 |
| 7 | 🧪 E2E | 18个E2E用例全部通过 | ✅ |

---

## 7. 后续规划

| 里程碑 | 内容 | 计划 |
|:-------|:-----|:----:|
| 🔲 | 会员到期续费 | P36 后续迭代 |
| 🔲 | 生日礼自动发放 | P36 后续迭代 |
| 🔲 | 积分过期策略 | P36 后续迭代 |
| 🔲 | 会员卡券系统联动 | 与 coupon 模块集成 |
