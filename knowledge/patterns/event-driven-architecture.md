# Pattern · Event-Driven Architecture (事件驱动架构)

> 创建: 2026-06-26 · Pulse-68 Day 2 后台
> 适用: Phase-15+ 业务模块、Phase-17 Coupon、Phase-19 AI Reviewer
> 来源: phase-15e registerPersistent + phase-17 coupon + phase-19 ai-review 综合

---

## 1. 🎯 适用场景

当业务逻辑涉及以下情形时,应采用事件驱动:

- ✅ **多模块联动**:一个操作触发 ≥3 个下游副作用(如创建订单 → quota 扣减 + 积分奖励 + 营销触发)
- ✅ **异步可接受**:调用方不需等待全部副作用完成(如发券后推送通知可延迟)
- ✅ **可重试**:失败后能通过重放事件恢复(如 BullMQ Bull Queue 消费)
- ✅ **可观测**:需要追踪副作用链路(如 eventId + parentEventId)
- ✅ **解耦**:下游模块不应该知道上游的存在

**不适用场景**(避免过度设计):
- ❌ 简单 CRUD,无副作用
- ❌ 强一致性需求(资金扣减,需同步事务)
- ❌ 高频短链路(< 3 个下游)

---

## 2. 🏗️ 架构骨架

```
┌─────────────────────────────────────────────────────────────┐
│  Controller (HTTP)                                          │
│    ↓ sync                                                  │
│  Service.registerPersistent() [Phase-15E 模式]              │
│    ├─ assertTenantContext(tenantId)                          │
│    ├─ assertCanWriteResource(tenantId, Member) [quota guard]│
│    ├─ entity.save()                                         │
│    ├─ quotaService.increment(tenantId, Member)              │
│    └─ eventBus.emit('member.registered', { tenantId, ... }) │
└─────────────────────────────────────────────────────────────┘
                          ↓ async
┌─────────────────────────────────────────────────────────────┐
│  BullMQ Worker (异步消费)                                   │
│    - couponGrant.on('member.registered') → 发券              │
│    - pointsAward.on('member.registered') → 加积分            │
│    - notification.on('member.registered') → 推送             │
│    - auditLog.on('member.registered') → 审计                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 📐 核心模式 (3 阶段)

### 3.1 Header: 同步守卫 + 实体保存

```typescript
// apps/api/src/modules/member/member.service.ts (Phase-15E 模式)
@Injectable()
export class MemberService {
  async registerPersistent(dto: RegisterDto): Promise<Member> {
    // 1. 头部守卫 (同步)
    await this.tenantContext.assertTenantContext(dto.tenantId)
    await this.quotaService.assertCanWriteResource(dto.tenantId, QuotaResourceKind.Member)

    // 2. 业务实体保存 (同步)
    const member = await this.memberRepo.save(this.memberRepo.create(dto))

    // 3. 配额扣减 (同步)
    await this.quotaService.increment(dto.tenantId, QuotaResourceKind.Member)

    // 4. 事件发布 (异步)
    await this.eventBus.emit('member.registered', {
      tenantId: dto.tenantId,
      memberId: member.id,
      source: 'registerPersistent',
      timestamp: new Date().toISOString(),
    } as MemberRegisteredEvent)

    return member
  }
}
```

### 3.2 Worker: 异步消费者 (按 eventType 分发)

```typescript
// apps/api/src/workers/member-registered.worker.ts
@Processor('member-events')
export class MemberRegisteredWorker {
  @OnQueueActive()
  async onMemberRegistered(job: Job<MemberRegisteredEvent>) {
    const event = job.data

    // 1. 发新人优惠券 (Phase-17 触发)
    await this.couponService.grantNewUserCoupon(event.tenantId, event.memberId)

    // 2. 加积分 (W3-积分)
    await this.pointsService.award(event.tenantId, event.memberId, 100, 'register')

    // 3. 推送通知 (Phase-17 内容运营)
    await this.notificationService.push(event.tenantId, event.memberId, 'welcome')

    // 4. 审计日志 (W7-合规)
    await this.auditLog.record('member.registered', event)
  }
}
```

### 3.3 Retry: 失败重试 + 死信队列

```typescript
// BullMQ retry 配置 (失败后指数退避,最多 5 次)
@Processor('member-events', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 100,
    removeOnFail: 50, // 保留最近 50 个失败用于排查
  },
})
```

---

## 4. ✅ 必须遵守的原则

### 4.1 事件不可变 + 可重放
```typescript
// ✅ 正确: 事件是不可变快照
interface MemberRegisteredEvent {
  eventId: string       // uuid, 用于幂等
  eventType: 'member.registered'
  occurredAt: string    // ISO timestamp
  tenantId: string
  payload: { memberId: string; ... }
}

// ❌ 错误: 事件含可变引用
interface BadEvent {
  member: Member  // 引用,可能在事件队列中变化
}
```

### 4.2 事件处理幂等
```typescript
// ✅ 正确: 使用 eventId 幂等检查
async onMemberRegistered(job) {
  const event = job.data
  if (await this.processedEvents.has(event.eventId)) {
    return // 已处理,跳过
  }
  await this.doWork(event)
  await this.processedEvents.add(event.eventId)
}
```

### 4.3 失败隔离 (一个 worker 失败不影响其他)
```typescript
// ✅ 正确: try-catch 每个副作用独立
async onMemberRegistered(job) {
  const event = job.data

  try { await this.couponService.grantNewUserCoupon(...) } catch (e) {
    this.logger.error('coupon grant failed', e)
    // 不抛出,继续处理其他副作用
  }

  try { await this.pointsService.award(...) } catch (e) {
    this.logger.error('points award failed', e)
  }

  // 关键副作用: 抛出以触发 retry
  try { await this.auditLog.record(...) } catch (e) {
    throw e  // 审计失败必须 retry
  }
}
```

### 4.4 Tenant 隔离必须传递
```typescript
// ✅ 正确: tenantId 必须在事件 payload 顶层
interface MemberRegisteredEvent {
  tenantId: string  // 顶层,所有下游都可见
  payload: { memberId: string }
}

// ❌ 错误: tenantId 埋在 payload 深处
interface BadEvent {
  payload: { tenantId: string; memberId: string }
}
```

---

## 5. 🧪 测试策略

### 5.1 单元测试 (同步部分)
```typescript
// mock eventBus,验证 emit 被调用 + payload 正确
const eventBus = { emit: jest.fn() }
await service.registerPersistent(dto)
expect(eventBus.emit).toHaveBeenCalledWith(
  'member.registered',
  expect.objectContaining({ tenantId: dto.tenantId, memberId: expect.any(String) })
)
```

### 5.2 集成测试 (异步部分)
```typescript
// 真实 BullMQ + 内存 redis,验证 worker 处理
const queue = new Queue('member-events', { redis: { host: 'localhost' } })
const worker = new MemberRegisteredWorker(...)

await service.registerPersistent(dto)
await new Promise(r => setTimeout(r, 500)) // 等待 worker

expect(couponService.grantNewUserCoupon).toHaveBeenCalled()
expect(pointsService.award).toHaveBeenCalled()
```

### 5.3 端到端测试 (e2e)
```typescript
// 完整链路: HTTP → 服务 → 事件 → Worker → 副作用
const res = await request(app).post('/members/register').send(dto)
expect(res.status).toBe(201)

// 等待 worker 处理
await waitFor(() => couponRepo.countBy({ memberId: dto.memberId }), { timeout: 5000 })
expect(couponRepo.countBy({ memberId: dto.memberId })).resolves.toBeGreaterThan(0)
```

---

## 6. 🔗 关联文档

- [knowledge/patterns/quota-guard.md](./quota-guard.md) · Quota 守卫 (event 头部)
- [knowledge/patterns/reserve-rollback.md](./reserve-rollback.md) · Reserve-and-Rollback (event 前置)
- [knowledge/lessons-learned/phase-15.md](../lessons-learned/phase-15.md) · Phase-15 registerPersistent 实现
- [knowledge/lessons-learned/pulse-68-day2.md](../lessons-learned/pulse-68-day2.md) · Pulse-68 Day 2 lessons

---

> 由 main agent 创建 · Pulse-68 Day 2 后台
> 评审: Champion (待 R8 通过) · Phase-19 Kickoff 复用
> 更新: 每个 phase 引入新事件时同步更新
