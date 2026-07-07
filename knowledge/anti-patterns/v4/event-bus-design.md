# 事件总线设计反模式 v4

## 元信息
- **编号**: AP-W12 (Anti-Pattern Watch #12)
- **分类**: 事件驱动 / 架构
- **发现**: 2026-06-27 Phase-35 T164 SSE 事件流设计
- **影响**: 事件丢失 / 顺序错乱 / 重复消费
- **修复耗时**: Phase-35 11 类事件 + Subject + EventBusService

---

## 现象描述

SaaS 平台引入事件驱动后,容易出现:

1. **事件丢失**: Subject 没人订阅时 emit 丢失
2. **顺序错乱**: 异步处理导致后发生的事件先到达
3. **重复消费**: 多个 SSE 订阅者都收到同一事件
4. **租户串号**: 不同租户的事件被混在一起发送

---

## 根因分析

### 1. 内存 Subject 无持久化

```typescript
// ❌ 反例
const subject$ = new Subject<Event>()

// 客户端连接时
subject$.subscribe(event => send(event))

// 问题: 客户端断开期间发生的事件全部丢失
```

### 2. 单 Subject 无分区

```typescript
// ❌ 反例: 单一 Subject 服务全租户
const globalSubject$ = new Subject<Event>()

// 问题: 大量事件导致 Subject 阻塞,租户 A 的事件被租户 B 看到
```

### 3. 事件 ID 重复

```typescript
// ❌ 反例: 用时间戳当事件 ID
const eventId = Date.now().toString()
// 同一毫秒并发事件 ID 重复,Last-Event-ID 失效
```

### 4. 无错误隔离

```typescript
// ❌ 反例: 一个订阅者抛错影响全部
subject$.subscribe(event => {
  if (event.type === 'payment') {
    throw new Error('payment handler failed')
  }
})
// 后续事件全部不发送
```

---

## 数学证明 · 事件丢失率

设:
- `t_disconnect` = 客户端断连时间 (秒)
- `λ` = 事件发生率 (次/秒)
- `T` = 总观察时间

```
P(事件丢失) = 1 - e^(-λ × t_disconnect)
```

若 λ = 1/30 (30 秒一次事件), t_disconnect = 60s:
```
P = 1 - e^(-2) ≈ 86% 丢失率
```

---

## 修复方案 (Phase-35 T164 实战)

### 方案 1: 事件类型 + EventBusService (✅ 采用)

```typescript
// ✅ 推荐
@Injectable()
export class EventBusService {
  private subject$ = new Subject<CashierEvent>()
  
  emit(event: CashierEvent): void {
    this.subject$.next(event)
  }
  
  stream$: Observable<CashierEvent> = this.subject$.asObservable()
}
```

### 方案 2: 租户分区 Subject

```typescript
// ✅ 多租户隔离
class TenantEventBus {
  private subjects = new Map<string, Subject<CashierEvent>>()
  
  emit(event: CashierEvent): void {
    const subject = this.subjects.get(event.tenantId) ?? this.createTenant(event.tenantId)
    subject.next(event)
  }
  
  subscribe(tenantId: string): Observable<CashierEvent> {
    const subject = this.subjects.get(tenantId) ?? this.createTenant(tenantId)
    return subject.asObservable()
  }
}
```

### 方案 3: EventStore 持久化 + Last-Event-ID

```typescript
// ✅ Phase-33 EventStore 集成
interface CashierEvent extends EventBase {
  eventId: string              // UUID,绝对唯一
  tenantId: string
  occurredAt: string
  orderId: string
}

// SSE 重连时
@sse('events')
events(@Query('lastEventId') lastEventId?: string): Observable<MessageEvent> {
  return this.eventBus.stream$.pipe(
    filter(e => e.tenantId === this.tenantId),
    map(e => ({
      id: e.eventId,
      event: e.type,
      data: e,
      retry: 3000
    }))
  )
}
```

### 方案 4: 错误隔离 catchError

```typescript
// ✅ 推荐: rxjs catchError 隔离
subject$.pipe(
  filter(e => e.tenantId === tenantId),
  map(e => transform(e)),
  catchError(err => {
    logger.error('handler failed', err)
    return EMPTY  // 不中断流
  })
)
```

---

## 事件类型设计 (Phase-35 11 类)

```typescript
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
```

---

## 预防机制 (R-07 V2)

### 1. 事件必须有 eventId (UUID)

```typescript
const eventId = crypto.randomUUID()  // 不是 Date.now()
```

### 2. 必须有 tenantId (隔离)

```typescript
interface CashierEventBase {
  tenantId: string  // 必有
}
```

### 3. 必须有 occurredAt (ISO8601)

```typescript
const occurredAt = new Date().toISOString()
```

### 4. 错误隔离

```typescript
stream$.pipe(
  catchError(err => {
    logger.error(err)
    return EMPTY  // 不影响其他订阅者
  })
)
```

### 5. SSE 必须 Last-Event-ID

```typescript
// 客户端
const evtSource = new EventSource(url, { withCredentials: true })
// 重连时浏览器自动发 Last-Event-ID header
```

---

## 经验教训

> 🦞 **"事件总线是 SaaS 的神经系统,设计不好 = 神经紊乱"**

1. **单一 Subject 不够**: 多租户必须分区
2. **内存无持久**: SSE 重连靠 EventStore
3. **UUID 唯一**: 不用时间戳
4. **错误隔离**: catchError + EMPTY
5. **租户隔离**: 每条事件必带 tenantId

---

## 相关反模式

- [markpaid-idempotency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/markpaid-idempotency.md): 幂等消费
- [concurrency-safety.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/concurrency-safety.md): 并发安全
- [tsx-decorator-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/tsx-decorator-pitfall.md): SSE 装饰器

---

> 🦞 **"事件 = 神经信号,丢失 = 瘫痪"**