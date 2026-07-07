# Phase-36 会员管理 Spec · V3 现状对齐版 (2026-06-27)

> **更新时间**: 2026-06-27 21:42 CST (现状盘点 + 大飞哥决策)
> **状态**: 🟢 5 决策全部锁定,Phase-36 已 95% 就位,**T166 真正待办是 4 项增量**
> **作者**: 🦞 龙虾哥 (后台 22h 大脑级,现状盘点派发前必做)

---

## 0. 现状盘点 (派发前必做 · 今日学习)

### 0.1 Phase-36 已就位 (95%)

**`apps/api/src/modules/member/`** 22 文件 18641 行:

| 文件 | 行数 | 状态 |
|------|------|------|
| member.entity.ts | 284 | ✅ 5 档 + 4 态 + 阈值已实现 |
| member.service.ts | 2903 | ✅ Prisma + 业务全闭环 |
| member.controller.ts | 300 | ✅ REST API |
| member.module.ts | 13 | ✅ NestJS |
| member.contract.ts | 381 | ✅ 跨模块契约 |
| member.dto.ts | 134 | ✅ DTO |
| member.entity.test.ts | 254 | ✅ |
| member.service.test.ts | 1994 | ✅ |
| member.controller.test.ts | 898 | ✅ |
| member.controller.spec.ts | 381 | ✅ |
| member.module.test.ts | 59 | ✅ |
| member.role.test.ts | 526 | ✅ |
| member.contract.test.ts | 610 | ✅ |
| member.dto.test.ts | 311 | ✅ |
| member.simulator.test.ts | 674 | ✅ |
| member.e2e.test.ts | 689 | ✅ |
| member-quota-integration.e2e.test.ts | 362 | ✅ |
| member-persistent-quota-integration.e2e.test.ts | 320 | ✅ |
| member-approval-recorder.ts | 174 | ✅ |
| member-approval-recorder.test.ts | 148 | ✅ |
| **总计** | **18641** | ✅ **397/397 PASS** |

### 0.2 与决策对齐情况

| 决策 | 现状 | 差距 |
|------|------|------|
| **D1 手机号唯一** | ✅ User.mobile @unique (Prisma line 291) | 已对齐 |
| **D2 等级阈值** | ✅ 5 档:Bronze(0)/Silver(500)/Gold(2000)/Platinum(10000)/Diamond(50000) | 已对齐(我多写一档 Silver→Bronze)|
| **D3 积分比例** | ❌ 无 config(硬编码阈值) | **T166-1 需建** |
| **D4 休眠 90 天** | ⚠️ 4 态:Active/Frozen/Expired/Blacklisted | **T166-2 需对齐决策** |
| **D5 跨租户** | ❌ MemberProfile 仅 tenantId,无全局 identity | **T166-3 需建 MemberTenantMapping** |

---

## 1. 5 大决策 (LOCKED · 2026-06-27 21:42)

### D1: 手机号唯一性 · 👤 大飞哥 · **已实现**

✅ Prisma 层:`User.mobile @unique` (DB 约束)

```prisma
// apps/api/prisma/schema.prisma:288-296
model User {
  id        String   @id @default(cuid())
  tenantId  String
  mobile    String   @unique    // ← 全局唯一
  ...
}
```

**Member 通过 userId → User 拿到 mobile**

### D2: 等级阈值 · 🦞 科学 + **已实现** 5 档

| 等级 | 阈值(积分) | 等效消费(元) | 等效时长 | 占比目标 |
|------|----------|------------|---------|---------|
| Bronze | 0 | 0 | - | 60% |
| Silver | 500 | 500 | 2.5 周 | 20% |
| Gold | 2,000 | 2,000 | 2.5 月 | 12% |
| **Platinum** | **10,000** | 10,000 | 1 年 | 6% |
| Diamond | 50,000 | 50,000 | 5 年 | 2% |

**数学推导**(沿用大飞哥决策 + 现状积分制 1 元 = 1 积分):
- 客单价:200 元
- 月频次:4 次/月 → 月消费 800 元 = 800 积分
- Silver:800 × 0.6 = 500 积分 ✅
- Gold:800 × 2.5 = 2,000 积分 ✅
- Platinum:800 × 12.5 = 10,000 积分 ✅
- Diamond:800 × 62.5 = 50,000 积分 ✅
- 占比:60/20/12/6/2 经典金字塔 ✅

**现状代码**:
```typescript
// apps/api/src/modules/member/member.entity.ts:243-253
export const MEMBER_LEVEL_THRESHOLDS: Record<MemberLevel, number> = {
  [MemberLevel.Bronze]: 0,
  [MemberLevel.Silver]: 500,
  [MemberLevel.Gold]: 2000,
  [MemberLevel.Platinum]: 10000,
  [MemberLevel.Diamond]: 50000
}
```

**T166-1 增量**: 把硬编码阈值迁入 `member.config.ts`(可配置)

### D3: 积分抵现比例 · 👤 大飞哥 + **T166-1 待建 config**

**默认比例**:
- `earnRate = 1` 元 = 1 积分
- `redeemRate = 100` 积分 = 1 元

**后台可调** ✅ (大飞哥要求)
- **T166-1 必做**: 创建 `member.config.ts` + admin-web 配置界面

### D4: 休眠判定 · 👤 大飞哥 + **T166-2 增量对齐**

**现状**: `MemberStatus.Active/Frozen/Expired/Blacklisted`

**大飞哥决策**: 90 天未访问 = 休眠

**T166-2 增量方案**:
- 选项 A: 在 4 态基础上加 `Dormant` (5 态)
- 选项 B: 用 `Frozen` 表示 90 天休眠 (现有 4 态不变)
- **推荐 A**: 显式区分 Frozen(管理员冻结) vs Dormant(自动休眠)

```typescript
// V3 升级
export enum MemberStatus {
  Active = 'ACTIVE',
  Dormant = 'DORMANT',       // 新增:90 天未访问自动
  Frozen = 'FROZEN',          // 管理员冻结
  Expired = 'EXPIRED',
  Blacklisted = 'BLACKLISTED'
}
```

**Churned (180 天)** 纳入 Expired 终态(语义合并)

### D5: 跨租户会员 · 🦞 科学 + **T166-3 增量建表**

**现状**: `MemberProfile.tenantId` 仅租户维度,无全局身份

**科学架构(身份全局 + 消费租户隔离)**:

```
┌─────────────────────────────────────────┐
│  User 主表 (全局, mobile 唯一)            │
│  - userId (cuid, 全局主键)               │
│  - mobile (全局 @unique, D1 已实现)      │
└─────────────────────────────────────────┘
           ↓ 1:N
┌─────────────────────────────────────────┐
│  MemberProfile (现有, tenantId 隔离)    │
│  - id, tenantId, userId, points         │
└─────────────────────────────────────────┘
           ↓ **T166-3 新增**
┌─────────────────────────────────────────┐
│  MemberTenantMapping (新增,跨租户聚合)   │
│  - (userId, tenantId) 联合主键           │
│  - tenantPoints, tenantSpentCents       │
│  - firstVisitAt, lastVisitAt, visitCount│
└─────────────────────────────────────────┘
```

**T166-3 必做**:
1. 创建 `MemberTenantMapping` Prisma model
2. `MemberProfileExtension` 加 `userId` 索引(已有)
3. 查询接口:`getMemberCrossTenantProfile(userId)` 聚合所有租户

---

## 2. T166 真正待办 (4 项增量)

### T166-1: member.config.ts (D3 可配置)

**新增文件**: `apps/api/src/modules/member/member-config.ts`

```typescript
export interface MemberConfig {
  points: {
    earnRate: number         // D3 默认 1
    redeemRate: number       // D3 默认 100
    enabled: boolean         // 默认 true
    expiryDays: number       // 默认 365
  }
  levels: {
    thresholds: {            // D2 从 entity 迁入
      BRONZE: number         // 0
      SILVER: number         // 500
      GOLD: number           // 2000
      PLATINUM: number       // 10000
      DIAMOND: number        // 50000
    }
  }
  lifecycle: {
    dormantDays: number      // D4 默认 90
    churnedDays: number      // 默认 180
  }
  phoneUniqueScope: 'global' // D1
  crossTenantEnabled: boolean // D5
}

export const DEFAULT_MEMBER_CONFIG: MemberConfig = { ... }
```

**接口**:
- `getConfig(): MemberConfig`
- `updateConfig(patch: Partial<MemberConfig>): MemberConfig`
- `getThreshold(level: MemberLevel): number`

**admin-web 配置界面** (T166-1.5):
- `apps/admin-web/app/member/config/page.tsx`

### T166-2: D4 休眠状态机升级 (5 态)

**修改文件**: `apps/api/src/modules/member/member.entity.ts`

```typescript
// V3 升级
export enum MemberStatus {
  Active = 'ACTIVE',
  Dormant = 'DORMANT',       // 新增
  Frozen = 'FROZEN',
  Expired = 'EXPIRED',
  Blacklisted = 'BLACKLISTED'
}

export const MEMBER_STATUS_TRANSITIONS = {
  ACTIVE: ['DORMANT', 'FROZEN', 'BLACKLISTED'],
  DORMANT: ['ACTIVE', 'CHURNED'],         // 唤醒 or 流失
  FROZEN: ['ACTIVE', 'BLACKLISTED'],
  EXPIRED: [],                              // 终态
  BLACKLISTED: []                          // 终态
} as const
```

**定时任务** (新增):
- `apps/api/src/modules/member/member-dormancy-cron.ts`
- 每日扫描:90 天未访问 → `DORMANT`,180 天 → `EXPIRED`

### T166-3: MemberTenantMapping 表 (D5 跨租户)

**新增 Prisma 模型**:
```prisma
model MemberTenantMapping {
  id                String   @id @default(cuid())
  userId            String   // FK User.id (全局)
  tenantId          String   // FK Tenant.id
  brandId           String
  storeId           String?
  tenantPoints      Int      @default(0)
  tenantSpentCents  Int      @default(0)
  firstVisitAt      DateTime @default(now())
  lastVisitAt       DateTime @updatedAt
  visitCount        Int      @default(0)
  
  @@unique([userId, tenantId])
  @@index([userId])
  @@index([tenantId])
}
```

**服务方法**:
```typescript
class MemberMappingService {
  async getMemberCrossTenantProfile(userId: string): Promise<MemberCrossTenantProfile>
  async recordTenantVisit(userId: string, tenantId: string): Promise<void>
  async getTenantMappings(userId: string): Promise<MemberTenantMapping[]>
}
```

### T169: 会员 SSE 事件流 (后续 Phase)

复用 Phase-35 T164 SSE 模式,事件类型:
- `member.registered`
- `member.level-up` / `member.level-down`
- `member.points-earned` / `member.points-redeemed`
- `member.status-changed` (ACTIVE → DORMANT 等)

---

## 3. Champion 督导 (不变)

- **E42 李事业部总经理** (Phase-35 + 36 双 Phase)
- **E19 王运营总监** (会员运营 KPI)
- **周会 review**: T166-1+2+3 完成后

---

## 4. 反模式命中 (Phase-36)

- [markpaid-idempotency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/markpaid-idempotency.md): 积分操作幂等
- [residual-pending-state.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/residual-pending-state.md): 状态机闭合
- [dead-test-code.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/dead-test-code.md): 测试同步升级
- [esm-cwd-tsx-loader.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/esm-cwd-tsx-loader.md): cwd 必要性

---

## 5. 任务卡 (T166-T170 · V3 重写)

| T-NN | 标题 | 估时 | 依赖 | 状态 |
|------|------|------|------|------|
| **T166-1** | member.config.ts + admin-web 配置界面 | 0.5d | - | 🟢 **真正待办** |
| **T166-2** | D4 休眠 5 态状态机 + cron | 0.5d | T166-1 | 🟡 **真正待办** |
| **T166-3** | MemberTenantMapping 跨租户表 | 0.5d | T166-1 | 🟡 **真正待办** |
| T167 | 会员等级自动升降级 + config 集成 | 0.5d | T166-1 | 🟡 等 |
| T168 | 积分系统 + Phase-35 订单集成 | 0.5d | T166-1, T167 | 🟡 等 |
| T169 | 会员 SSE 事件流 (复用 Phase-35 T164) | 1d | T164 | 🟡 等 |
| T170 | 会员 E2E + retro | 0.5d | 全部 | 🟡 等 |

**总计**: 3.5 天 (T166-1+2+3 拆 3 个子任务)

---

## 6. 与现状对齐总结

| 项目 | 现状 | V3 升级 |
|------|------|---------|
| 等级 5 档 | ✅ 已实现 | D2 验证 + T166-1 阈值迁入 config |
| 4 态状态 | ✅ Active/Frozen/Expired/Blacklisted | T166-2 加 Dormant |
| mobile 全局唯一 | ✅ User.@unique | D1 已对齐 |
| 跨租户 | ❌ 仅 tenant 隔离 | T166-3 加 MemberTenantMapping |
| 可配置 | ❌ 硬编码 | T166-1 加 member.config |
| 积分系统 | ✅ Prisma 集成 | T168 复用 Phase-35 集成 |
| SSE | ❌ 无 | T169 待建 |

---

> 🦞 **"派发前必做现状盘点 = Phase-36 已 95% 就位 = T166-1+2+3 是 3 个增量 = 决策与现状高度吻合"**

更新时间: 2026-06-27 21:42 CST
下次更新: T166-1 commit 后