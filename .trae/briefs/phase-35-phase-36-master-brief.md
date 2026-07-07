# Phase-35 + Phase-36 综合派发 Brief V4 · 2026-06-27

> **派发时间**: 2026-06-27 21:46 CST
> **派发人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **执行人**: 🌲 树哥trae (前台 8h 双手)
> **目标**: Phase-35 收官 + Phase-36 启动 (1.5d)
> **总工作量**: T164 (1d) + T166-1 (0.5d) = 1.5d
> **Champion 督导**: E42 李事业部总经理 + E19 王运营总监

---

## 1. 工作分解 (WBS)

```
D1 (2026-06-28) · T164 SSE 收银台事件流 (1d)
├── Step 1 (1h): cashier.events.ts 11 类事件定义
├── Step 2 (2h): order.service.ts 集成 5 emit 点
├── Step 3 (3h): cashier.sse.ts 3 SSE 端点
└── Step 4 (2h): phase35-e2e-sse.ts 8 断言 E2E

D2 (2026-06-29 上午) · T166-1 Member 可配置中心 (0.5d)
├── Step 1 (2h): member-config.ts 后端
├── Step 2 (1.5h): admin-web 配置界面
└── Step 3 (0.5h): member-config.test.ts 测试

D2 下午 (预备) · T166-2 休眠状态机升级 (0.5d)
├── Step 1 (1.5h): MemberStatus 加 DORMANT (5 态)
├── Step 2 (1h): member-dormancy-cron.ts
└── Step 3 (1.5h): 测试 + retro
```

---

## 2. T164 详细任务 (D1 主线 · 8h)

### T164-1 · cashier.events.ts (1h)

**路径**: `apps/api/src/modules/cashier/cashier.events.ts`

```typescript
import type { OrderStatus } from '@m5/types'

/** 收银台事件基类 */
export interface CashierEventBase {
  eventId: string              // UUID,事件唯一
  tenantId: string             // 租户隔离
  occurredAt: string           // ISO8601
  orderId: string              // 关联订单
}

/** 11 类事件 (Phase-35 完整覆盖) */
export type CashierEvent =
  // 订单生命周期 (5)
  | (CashierEventBase & { type: 'order.created'; totalCents: number })
  | (CashierEventBase & { type: 'order.submitted'; totalCents: number })
  | (CashierEventBase & { type: 'order.paid'; paidCents: number; paymentId: string })
  | (CashierEventBase & { type: 'order.fulfilled' })
  | (CashierEventBase & { type: 'order.cancelled'; reason: string })
  // 部分退款 (2)
  | (CashierEventBase & { type: 'order.partially-refunded'; refundedCents: number; remainingCents: number })
  | (CashierEventBase & { type: 'order.refunded'; refundedCents: number })
  // 支付通道 (2)
  | (CashierEventBase & { type: 'payment.initiated'; paymentId: string; channel: string; amount: number })
  | (CashierEventBase & { type: 'payment.failed'; paymentId: string; reason: string })
  // 退款流水 (1)
  | (CashierEventBase & { type: 'refund.created'; refundId: string; amount: number })
  // 状态变更 (1)
  | (CashierEventBase & { type: 'order.status-changed'; from: OrderStatus; to: OrderStatus })

/** 事件类型字面量 */
export type CashierEventType = CashierEvent['type']

/** SSE 消息事件包装 */
export interface SseMessage<T = CashierEvent> {
  id: string                   // Last-Event-ID
  event: T['type']
  data: T
  retry?: number
}
```

### T164-2 · order.service.ts 集成 5 emit 点 (2h)

**路径**: `apps/api/src/modules/cashier/order.service.ts`

**5 emit 点位置**:

```typescript
// 1) create() 后 → emit 'order.created'
create(input: CreateOrderInput, opts: CreateOrderOptions): Order {
  // ... 现有代码 ...
  this.eventBus.emit({
    type: 'order.created',
    eventId: crypto.randomUUID(),
    tenantId: opts.tenantId,
    occurredAt: now,
    orderId,
    totalCents: totalCents
  })
  return order
}

// 2) submit() 后 → emit 'order.submitted'
submit(id: string, tenantId: string): Order {
  // ... 现有代码 ...
  this.eventBus.emit({
    type: 'order.submitted',
    eventId: crypto.randomUUID(),
    tenantId,
    occurredAt: order.updatedAt,
    orderId: id,
    totalCents: order.totalCents
  })
  return order
}

// 3) markPaid() 后 → emit 'order.paid'
markPaid(id: string, amountCents: number, method: string, tenantId: string): Order {
  // ... 现有代码 ...
  this.eventBus.emit({
    type: 'order.paid',
    eventId: crypto.randomUUID(),
    tenantId,
    occurredAt: order.paidAt!,
    orderId: id,
    paidCents: amountCents,
    paymentId: order.latestPaymentId ?? ''
  })
  return order
}

// 4) fulfill() 后 → emit 'order.fulfilled'
fulfill(id: string, tenantId: string): Order {
  // ... 现有代码 ...
  this.eventBus.emit({
    type: 'order.fulfilled',
    eventId: crypto.randomUUID(),
    tenantId,
    occurredAt: order.closedAt!,
    orderId: id
  })
  return order
}

// 5) applyRefund() 后 → emit 'order.partially-refunded' 或 'order.refunded'
applyRefund(id: string, refundAmountCents: number, tenantId: string): Order {
  // ... 现有代码 ...
  const eventType = order.status === 'REFUNDED' ? 'order.refunded' : 'order.partially-refunded'
  this.eventBus.emit({
    type: eventType,
    eventId: crypto.randomUUID(),
    tenantId,
    occurredAt: order.updatedAt,
    orderId: id,
    refundedCents: refundAmountCents,
    remainingCents: order.totalCents - order.refundedCents
  })
  return order
}
```

### T164-3 · cashier.sse.ts 3 SSE 端点 (3h)

**路径**: `apps/api/src/modules/cashier/cashier.sse.ts`

```typescript
import { Controller, Sse, MessageEvent, Param, Query } from '@nestjs/common'
import { Observable, Subject, filter, map, merge } from 'rxjs'
import { TenantGuard, UseGuards } from '@nestjs/common'
import type { CashierEvent } from './cashier.events'
import { EventBusService } from '../shared/event-bus.service'

@Controller('api/cashier')
@UseGuards(TenantGuard)
export class CashierSseController {
  constructor(private readonly eventBus: EventBusService) {}

  /** SSE 端点 1: 全收银台事件流 (按 tenantId 过滤) */
  @Sse('events')
  events(@Query('lastEventId') lastEventId?: string): Observable<MessageEvent> {
    return this.eventBus.stream$.pipe(
      filter((e: CashierEvent) => e.tenantId === this.tenantId),
      map((e: CashierEvent) => ({
        id: e.eventId,
        event: e.type,
        data: e,
        retry: 3000
      }))
    )
  }

  /** SSE 端点 2: 单订单事件流 (按 orderId 过滤) */
  @Sse('orders/:orderId/events')
  orderEvents(
    @Param('orderId') orderId: string,
    @Query('lastEventId') lastEventId?: string
  ): Observable<MessageEvent> {
    return this.eventBus.stream$.pipe(
      filter((e: CashierEvent) => e.orderId === orderId && e.tenantId === this.tenantId),
      map((e: CashierEvent) => ({
        id: e.eventId,
        event: e.type,
        data: e
      }))
    )
  }

  /** SSE 端点 3: 支付事件流 (仅支付相关事件) */
  @Sse('payments/events')
  paymentEvents(@Query('lastEventId') lastEventId?: string): Observable<MessageEvent> {
    return this.eventBus.stream$.pipe(
      filter((e: CashierEvent) =>
        e.tenantId === this.tenantId &&
        (e.type === 'payment.initiated' || e.type === 'payment.failed' || e.type === 'order.paid')
      ),
      map((e: CashierEvent) => ({
        id: e.eventId,
        event: e.type,
        data: e
      }))
    )
  }
}
```

### T164-4 · phase35-e2e-sse.ts 8 断言 E2E (2h)

**路径**: `apps/api/scripts/phase35-e2e-sse.ts`

```typescript
/**
 * Phase-35 T164 E2E: 8 断言 SSE 端到端
 */
import test, { describe } from 'node:test'
import assert from 'node:assert/strict'

const BASE = 'http://localhost:3000'
const TENANT = 'tenant-test'

describe('Phase-35 T164 SSE E2E', () => {
  test('1) order.created 事件可订阅', async () => {
    const res = await fetch(`${BASE}/api/cashier/events`, {
      headers: { 'X-Tenant-Id': TENANT },
      // SSE 长连接,等待首个事件
    })
    assert.ok(res.headers.get('content-type')?.includes('text/event-stream'))
  })

  test('2) order.submitted 事件可订阅', async () => { /* ... */ })

  test('3) order.paid 事件触发后,Last-Event-ID 正确', async () => { /* ... */ })

  test('4) order.fulfilled 事件可订阅', async () => { /* ... */ })

  test('5) order.cancelled 事件可订阅', async () => { /* ... */ })

  test('6) order.partially-refunded 事件可订阅', async () => { /* ... */ })

  test('7) payment.initiated + payment.failed 事件可订阅', async () => { /* ... */ })

  test('8) cross-tenant 隔离 (不同 tenantId 看不到对方事件)', async () => {
    // 跨租户 SSE 验证
  })
})
```

---

## 3. T166-1 详细任务 (D2 上午 · 4h)

### T166-1-1 · member-config.ts (2h)

**路径**: `apps/api/src/modules/member/member-config.ts`

```typescript
import { Injectable } from '@nestjs/common'
import { MemberLevel } from './member.entity'

export interface MemberConfig {
  points: {
    earnRate: number          // D3 默认 1
    redeemRate: number        // D3 默认 100
    enabled: boolean
    expiryDays: number
  }
  levels: {
    thresholds: {
      BRONZE: number
      SILVER: number          // D2 默认 500
      GOLD: number            // D2 默认 2000
      PLATINUM: number        // D2 默认 10000
      DIAMOND: number         // D2 默认 50000
    }
  }
  lifecycle: {
    dormantDays: number       // D4 默认 90
    churnedDays: number
  }
  phoneUniqueScope: 'global' // D1
  crossTenantEnabled: boolean // D5
}

export const DEFAULT_MEMBER_CONFIG: MemberConfig = {
  points: { earnRate: 1, redeemRate: 100, enabled: true, expiryDays: 365 },
  levels: {
    thresholds: {
      BRONZE: 0,
      SILVER: 500,
      GOLD: 2000,
      PLATINUM: 10000,
      DIAMOND: 50000
    }
  },
  lifecycle: { dormantDays: 90, churnedDays: 180 },
  phoneUniqueScope: 'global',
  crossTenantEnabled: true
}

@Injectable()
export class MemberConfigService {
  private current: MemberConfig = JSON.parse(JSON.stringify(DEFAULT_MEMBER_CONFIG))

  getConfig(): MemberConfig {
    return this.current
  }

  updateConfig(patch: Partial<MemberConfig>): MemberConfig {
    this.current = { ...this.current, ...patch }
    return this.current
  }

  getThreshold(level: MemberLevel): number {
    return this.current.levels.thresholds[level]
  }

  getPointsRate(): { earn: number; redeem: number } {
    return {
      earn: this.current.points.earnRate,
      redeem: this.current.points.redeemRate
    }
  }

  /** admin-web 配置变更后写回 */
  async saveConfig(): Promise<void> {
    // 持久化到 DB / config store
    // 简化: 内存实现,后续接 config-typescript
  }
}
```

### T166-1-2 · admin-web 配置界面 (1.5h)

**路径**: `apps/admin-web/app/member/config/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'

interface MemberConfig {
  points: { earnRate: number; redeemRate: number; enabled: boolean; expiryDays: number }
  levels: { thresholds: { BRONZE: number; SILVER: number; GOLD: number; PLATINUM: number; DIAMOND: number } }
  lifecycle: { dormantDays: number; churnedDays: number }
}

export default function MemberConfigPage() {
  const [config, setConfig] = useState<MemberConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/member/config').then(r => r.json()).then(setConfig)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/member/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    setSaving(false)
    if (res.ok) setMessage('✅ 保存成功')
    else setMessage('❌ 保存失败')
  }

  if (!config) return <div>Loading...</div>

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">会员配置中心</h1>

      <fieldset className="border p-4 mb-4">
        <legend className="font-bold">📊 积分比例 (D3)</legend>
        <div className="grid grid-cols-2 gap-4">
          <label>
            <span>赚积分 (1 元 = N 积分)</span>
            <input type="number" value={config.points.earnRate}
              onChange={e => setConfig({...config, points: {...config.points, earnRate: +e.target.value}})}
              className="border p-2 w-full" />
          </label>
          <label>
            <span>抵积分 (N 积分 = 1 元)</span>
            <input type="number" value={config.points.redeemRate}
              onChange={e => setConfig({...config, points: {...config.points, redeemRate: +e.target.value}})}
              className="border p-2 w-full" />
          </label>
        </div>
      </fieldset>

      <fieldset className="border p-4 mb-4">
        <legend className="font-bold">🏆 等级阈值 (D2 · 积分)</legend>
        <div className="grid grid-cols-5 gap-2">
          {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const).map(lv => (
            <label key={lv}>
              <span>{lv}</span>
              <input type="number" value={config.levels.thresholds[lv]}
                onChange={e => setConfig({...config, levels: {thresholds: {...config.levels.thresholds, [lv]: +e.target.value}}}})
                className="border p-2 w-full" />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border p-4 mb-4">
        <legend className="font-bold">⏰ 休眠判定 (D4)</legend>
        <label>
          <span>未访问天数 → DORMANT</span>
          <input type="number" value={config.lifecycle.dormantDays}
            onChange={e => setConfig({...config, lifecycle: {...config.lifecycle, dormantDays: +e.target.value}})}
            className="border p-2 w-full" />
        </label>
      </fieldset>

      <button onClick={handleSave} disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded">
        {saving ? '保存中...' : '保存配置'}
      </button>

      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
```

### T166-1-3 · member-config.test.ts (0.5h)

```typescript
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { MemberConfigService, DEFAULT_MEMBER_CONFIG } from './member-config'

describe('MemberConfigService', () => {
  test('默认配置 8 字段全', () => {
    const svc = new MemberConfigService()
    const cfg = svc.getConfig()

    assert.equal(cfg.points.earnRate, 1)
    assert.equal(cfg.points.redeemRate, 100)
    assert.equal(cfg.points.enabled, true)
    assert.equal(cfg.points.expiryDays, 365)
    assert.equal(cfg.levels.thresholds.SILVER, 500)
    assert.equal(cfg.levels.thresholds.GOLD, 2000)
    assert.equal(cfg.levels.thresholds.PLATINUM, 10000)
    assert.equal(cfg.levels.thresholds.DIAMOND, 50000)
    assert.equal(cfg.lifecycle.dormantDays, 90)
    assert.equal(cfg.phoneUniqueScope, 'global')
    assert.equal(cfg.crossTenantEnabled, true)
  })

  test('updateConfig 部分更新', () => {
    const svc = new MemberConfigService()
    svc.updateConfig({ points: { ...DEFAULT_MEMBER_CONFIG.points, earnRate: 2 } })
    assert.equal(svc.getConfig().points.earnRate, 2)
    assert.equal(svc.getConfig().points.redeemRate, 100)
  })

  test('getThreshold 5 档', () => {
    const svc = new MemberConfigService()
    assert.equal(svc.getThreshold('BRONZE'), 0)
    assert.equal(svc.getThreshold('SILVER'), 500)
    assert.equal(svc.getThreshold('GOLD'), 2000)
    assert.equal(svc.getThreshold('PLATINUM'), 10000)
    assert.equal(svc.getThreshold('DIAMOND'), 50000)
  })

  test('getPointsRate 比例查询', () => {
    const svc = new MemberConfigService()
    const rate = svc.getPointsRate()
    assert.equal(rate.earn, 1)
    assert.equal(rate.redeem, 100)
  })

  test('updateConfig 后立即生效', () => {
    const svc = new MemberConfigService()
    svc.updateConfig({ lifecycle: { dormantDays: 60, churnedDays: 180 } })
    assert.equal(svc.getConfig().lifecycle.dormantDays, 60)
  })
})
```

---

## 4. T166-2 预备 (D2 下午 · 4h,可选)

### T166-2 · MemberStatus 5 态 + DORMANT cron

**新增**:
- `MemberStatus.Dormant` 5 态升级
- `member-dormancy-cron.ts` 每日扫描

```typescript
// member.entity.ts 修改
export enum MemberStatus {
  Active = 'ACTIVE',
  Dormant = 'DORMANT',       // T166-2 新增
  Frozen = 'FROZEN',
  Expired = 'EXPIRED',
  Blacklisted = 'BLACKLISTED'
}

export const MEMBER_STATUS_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  ACTIVE: ['DORMANT', 'FROZEN', 'BLACKLISTED'],
  DORMANT: ['ACTIVE', 'EXPIRED'],     // 唤醒 or 流失
  FROZEN: ['ACTIVE', 'BLACKLISTED'],
  EXPIRED: [],
  BLACKLISTED: []
}
```

```typescript
// member-dormancy-cron.ts
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MemberConfigService } from './member-config'
import { MemberStatus } from './member.entity'
import { MemberService } from './member.service'

@Injectable()
export class MemberDormancyCron {
  constructor(
    private config: MemberConfigService,
    private memberService: MemberService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkDormancy() {
    const dormantDays = this.config.getConfig().lifecycle.dormantDays
    const cutoff = Date.now() - dormantDays * 24 * 60 * 60 * 1000
    const members = await this.memberService.findInactiveSince(cutoff)
    for (const m of members) {
      if (m.status === MemberStatus.Active) {
        await this.memberService.updateStatus(m.id, MemberStatus.Dormant)
      }
    }
  }
}
```

---

## 5. 验收清单 (🦞 验收)

### T164 验收
- [ ] cashier.events.ts (11 类事件类型)
- [ ] order.service.ts 集成 5 emit 点
- [ ] cashier.sse.ts (3 SSE 端点)
- [ ] phase35-e2e-sse.ts (8 断言全过)
- [ ] atomic commit 含 `Phase-35 step X: T164 SSE`
- [ ] race-safe-commit.sh 已跑
- [ ] HEARTBEAT.md 无新增 Wipe

### T166-1 验收
- [ ] member-config.ts (8 字段 + service)
- [ ] admin-web/member/config/page.tsx
- [ ] member-config.test.ts (≥5 断言全过)
- [ ] atomic commit 含 `Phase-36 step 1: T166-1`
- [ ] race-safe-commit.sh 已跑

---

## 6. 红线纪律 (R-06 V2)

- ❌ `git reset --hard` 禁止 (Phase-34 灾难)
- ❌ `git commit --amend` 禁止
- ✅ 任何 commit 前必跑 `scripts/race-safe-commit.sh`
- ✅ 看到 `*.tmp` (0B) 立即删除
- ✅ R-06 cron 60min 已激活
- ✅ 任何 30 分钟卡住 → 立即升级 L2 → 🦞 处理

---

## 7. 通信协议

### 🌲 → 🦞 提交格式 (每次 commit 后)

```
🛡️ R-06 race-safe auto-commit

Phase-XX step Y: TNNN 任务标题
- 改动文件列表
- 测试断言数
- 静态扫描结果
- 反模式库 v4 命中
- R-06 防御: race-safe + HEARTBEAT.record
```

### 🚨 阻塞升级
任何 ≥30 分钟卡住立即升级 L2。

---

## 8. 任务依赖图

```
D1: T164 (SSE) ──→ D1 收官
                   ↓
D2: T166-1 (Config) ──→ T166-2 (Dormant) ──→ T166-3 (Mapping)
```

D2 完成后,P1 业务深耕 36% 完成(2/6 phase)。

---

> 🦞 **"综合派发 V4 = 1.5 天 = T164 + T166-1 + 预备 T166-2 = 业务深耕双线推进"**

派发完成:2026-06-27 21:46 CST
执行启动:🌲 树哥trae 接收后立即开始 T164-1