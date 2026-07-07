# 反模式库 v4 · cashier-sse-edge-cases (SSE 长连接边界场景)

> **创建时间**: 2026-06-27 23:58 CST (Phase-35 D2 Retro · T165)
> **分类**: 性能 + 可靠性 · SSE 长连接边界
> **目标读者**: 后端工程师 + 全栈 + SRE
> **实战来源**: Phase-35 T164 SSE 实施 + 8 AC E2E + D2 retro

---

## 0. SSE 三大死亡陷阱

SSE (Server-Sent Events) 是 server push 利器,但有 3 大常见死法:
1. **客户端断网** → 连接半死 → 服务端继续写 → 内存爆
2. **Nginx/Proxy 超时** → 60s 无数据 → 502 → 客户端频繁重连
3. **跨租户数据泄漏** → 错配 subject → 看到别人订单

**反模式库 v4 命中**: residual-pending-state + event-bus-design + security-defense

---

## 1. ❌ 反模式 1: 没有心跳 keepalive

```typescript
// BAD: 30 分钟无数据 = Nginx proxy 主动断开 (proxy_read_timeout)
@Sse('orders/events')
orderEvents() {
  return this.emitter.stream().pipe(map(...))
  // 30 分钟没事件 → 客户端断开 → 用户看到"网络异常"
}
```

**现象**: 空闲连接被中间件超时切断,客户端频繁 502

### ✅ 最佳实践: 25s 心跳 (50s 超时前)

```typescript
// GOOD: 心跳 + 真实事件合并流
@Sse('orders/events')
orderEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
  const tenantId = req.tenantId

  // 真实事件流 (tenant 过滤)
  const realEvents$ = this.emitter.stream().pipe(
    filter((msg) => this.belongsToTenant(msg, tenantId)),
    map((msg) => this.toMessageEvent(msg))
  )

  // 心跳流 (每 25s, 反模式 v4 observability)
  const heartbeat$ = interval(25_000).pipe(
    map((i) => ({
      type: 'heartbeat',
      id: `hb-${Date.now()}-${i}`,
      data: { type: 'heartbeat', tenantId, timestamp: new Date().toISOString() }
    }))
  )

  // 合并 (反模式 v4 caching-strategy · 多源)
  return merge(realEvents$, heartbeat$)
}
```

**关键参数**:
- Nginx `proxy_read_timeout 60s`
- CDN/CloudFront idle timeout 60s
- **心跳间隔 ≤ 25s** (留 50% 余量)

---

## 2. ❌ 反模式 2: 没有 Last-Event-ID 重连

```typescript
// BAD: 客户端断网 → 重连 → 收到重复事件 (重新订阅整个 stream)
// 问题: 已经收到 event-1~5 的客户端,重连后从 event-1 开始 (重复 5 条)
eventSource.addEventListener('order.paid', (e) => {
  // 用户重复看到同一条支付成功
  toast.success('订单已支付')  // ❌ 重复弹 toast
})
```

### ✅ 最佳实践: Last-Event-ID + EventStore replay

```typescript
// GOOD: server side - EventStore (Phase-35 T164 实现)
@Injectable()
export class CashierEventEmitter {
  private readonly store: EventStoreRecord[] = []

  emit(event: CashierEvent): string {
    const eventId = `evt-${Date.now()}-${++this.eventSeq}`
    this.subject.next({ id: eventId, type: event.type, data: event })
    this.store.push({ event, eventId, timestamp: new Date().toISOString() })
    return eventId
  }

  /**
   * Replay: 客户端带 Last-Event-ID 重连时,返回断线期间丢失的事件
   */
  replay(lastEventId: string, tenantId: string): CashierMessageEvent[] {
    const lastIdx = this.store.findIndex((r) => r.eventId === lastEventId)
    const startIdx = lastIdx >= 0 ? lastIdx + 1 : 0

    return this.store.slice(startIdx)
      .filter((r) => r.event.tenantId === tenantId)  // tenant 隔离
      .map((r) => ({ id: r.eventId, type: r.event.type, data: r.event }))
  }
}

// GOOD: server side - SSE controller replay endpoint
@Get('orders/events/replay')
replayOrderEvents(
  @Req() req: TenantRequest,
  @Query('lastEventId') lastEventId: string,
  @Res() res: Response
): void {
  const tenantId = req.tenantId
  if (!lastEventId) {
    res.status(400).json({ error: 'lastEventId required' })
    return
  }
  const replayEvents = this.emitter.replay(lastEventId, tenantId)
  res.status(200).json({ replayed: replayEvents.length, events: replayEvents, tenantId })
}

// GOOD: client side - EventSource 自动发 Last-Event-ID
const es = new EventSource('/api/cashier/orders/events', {
  withCredentials: true  // 带 cookie (tenant guard)
})

// EventSource 自动处理:
// 1. 自动重连 (exponential backoff)
// 2. 自动发送 Last-Event-ID: header (从最近收到的事件)
// 3. 自动处理 retry: 字段 (server 控制的退避时间)
```

**EventSource 协议**:
```
event: order.paid
id: evt-1234567890-5
data: {"type":"order.paid","tenantId":"t1","orderId":"o1","paidAt":"..."}

:heartbeat                          ← 注释行 (服务端心跳)
retry: 30000                        ← 客户端重试间隔 (ms)

(blank line to end event)
```

---

## 3. ❌ 反模式 3: 客户端没有断线检测

```typescript
// BAD: 网络断 5 分钟,客户端完全不知道
const es = new EventSource('/api/cashier/orders/events')
// 浏览器无感 → 用户看到"假在线" → 关键订单状态变更丢失
```

### ✅ 最佳实践: readyState 检测 + 自定义重连 + UI 提示

```typescript
// GOOD: 客户端状态机 (反模式 v4 event-bus-design)
class CashierSseClient {
  private es: EventSource | null = null
  private status: 'connecting' | 'open' | 'closed' = 'closed'
  private missedHeartbeats = 0
  private readonly HEARTBEAT_TIMEOUT = 60_000  // 60s 无心跳 = 断线

  connect(url: string) {
    this.es = new EventSource(url, { withCredentials: true })

    this.es.onopen = () => {
      this.status = 'open'
      this.missedHeartbeats = 0
      console.log('SSE connected')
    }

    this.es.onerror = (e) => {
      this.status = 'closed'
      console.error('SSE error:', e)
      // EventSource 默认会自动重连,无需手动
      // 但要通知 UI
      this.notify('connection_lost')
    }

    // 心跳超时检测 (60s 无心跳)
    this.es.addEventListener('heartbeat', () => {
      this.missedHeartbeats = 0
    })
  }

  // 定时检查心跳超时
  startWatchdog() {
    setInterval(() => {
      this.missedHeartbeats++
      if (this.missedHeartbeats * 25_000 > this.HEARTBEAT_TIMEOUT) {
        console.warn('SSE heartbeat timeout, reconnecting...')
        this.es?.close()
        this.connect(this.currentUrl)
      }
    }, 25_000)
  }

  disconnect() {
    this.es?.close()
    this.status = 'closed'
  }
}
```

---

## 4. ❌ 反模式 4: 无 tenant 隔离 (跨租户数据泄漏)

```typescript
// BAD: 直接转发,不过滤
@Sse('orders/events')
orderEvents() {
  return this.emitter.stream()  // ❌ 所有 tenant 的事件都返回
  // tenant-A 的客户端能看到 tenant-B 的 order.paid 事件!
}
```

### ✅ 最佳实践: 三重 tenant 防御

```typescript
// GOOD: 三重防御
// 1. TenantGuard (NestJS)
@Controller('api/cashier')
@UseGuards(TenantGuard)
export class CashierSseController {
  // 2. belongsToTenant filter (controller 内)
  @Sse('orders/events')
  orderEvents(@Req() req: TenantRequest) {
    const tenantId = req.tenantId
    return this.emitter.stream().pipe(
      filter((msg) => this.belongsToTenant(msg, tenantId)),  // 二次过滤
      map((msg) => this.toMessageEvent(msg))
    )
  }

  // 3. EventStore 内部 tenant 过滤 (即使 controller 错配, store 也安全)
  // CashierEventEmitter.replay(lastEventId, tenantId) 强制 tenant 参数
  // CashierEventEmitter.store.push() 时 record.tenantId 持久化
}
```

**为什么 3 重**:
- TenantGuard 防外层攻击 (绕过 controller)
- belongsToTenant 防代码 bug (忘加 guard)
- EventStore 防 replay endpoint bug (绕过 filter)

---

## 5. ❌ 反模式 5: Subject 单订阅 (错过中间订阅者)

```typescript
// BAD: 用 EventEmitter (Node.js) 替代 RxJS Subject
const EventEmitter = require('events')
const bus = new EventEmitter()

bus.on('order.paid', handler1)
bus.on('order.paid', handler2)  // ✅ OK, 多个监听

// 问题: 如果 handler1 throw, handler2 不会执行 (EventEmitter 单进程同步)
// SSE 推送时,如果 controller throw → Subject 不会推进下一个订阅者
```

### ✅ 最佳实践: RxJS Subject + error handler 隔离

```typescript
// GOOD: RxJS Subject 天然多订阅 + 错误隔离
@Injectable()
export class CashierEventEmitter {
  private readonly subject = new Subject<CashierMessageEvent>()

  stream(): Observable<CashierMessageEvent> {
    return this.subject.asObservable().pipe(
      // 单个订阅者 throw 不影响其他订阅者 (RxJS 设计)
      catchError(() => EMPTY)
    )
  }

  emit(event: CashierEvent): string {
    // 不在 emit 中 throw - 失败静默
    try {
      const messageEvent = this.toMessageEvent(event)
      this.subject.next(messageEvent)  // 广播给所有订阅者
    } catch (err) {
      this.logger.error(`emit failed: ${(err as Error).message}`)
      // 不 throw - 反模式 v4 async-try-catch
    }
    return eventId
  }
}
```

---

## 6. ❌ 反模式 6: EventStore 无限增长

```typescript
// BAD: EventStore 永远 append
this.store.push(record)
// 1 年后 store = 100 万条 → 内存爆 (10 MB → 5 GB)
```

### ✅ 最佳实践: LRU 10000 + 持久化到 Redis/PG

```typescript
// GOOD: LRU 10000 内存 + 真实持久化 (Phase-46 启用)
private readonly HISTORY_LIMIT = 10000

emit(event: CashierEvent): string {
  this.store.push({ event, eventId, timestamp })
  if (this.store.length > this.HISTORY_LIMIT) {
    this.store.shift()  // ringbuffer 简单 LRU
  }

  // Phase-46: 真实持久化
  // await this.pg.query(
  //   'INSERT INTO cashier_events (id, type, data, tenant_id, created_at) VALUES ($1,$2,$3,$4,$5)',
  //   [eventId, event.type, JSON.stringify(event), event.tenantId, new Date()]
  // )
  return eventId
}
```

**Phase-46 实装**:
- in-memory LRU 10000 (快路径)
- PostgreSQL event_outbox 表 (慢路径, replay 用)
- Redis Stream (跨实例订阅)

---

## 7. ❌ 反模式 7: 没限流 (DoS 攻击)

```typescript
// BAD: 攻击者 1 万并发连接
for (let i = 0; i < 10000; i++) {
  new EventSource('/api/cashier/orders/events')
}
// 服务端 1 万长连接 → 文件描述符爆 → 服务挂
```

### ✅ 最佳实践: per-tenant 连接数限流 + IP 限流

```typescript
// GOOD: 多层限流
@Injectable()
export class SseConnectionTracker {
  private connectionsByTenant = new Map<string, number>()
  private connectionsByIp = new Map<string, number>()
  private readonly MAX_PER_TENANT = 100
  private readonly MAX_PER_IP = 10

  canConnect(tenantId: string, ip: string): boolean {
    const tenantCount = this.connectionsByTenant.get(tenantId) ?? 0
    const ipCount = this.connectionsByIp.get(ip) ?? 0
    return tenantCount < this.MAX_PER_TENANT && ipCount < this.MAX_PER_IP
  }

  track(tenantId: string, ip: string) {
    this.connectionsByTenant.set(tenantId, (this.connectionsByTenant.get(tenantId) ?? 0) + 1)
    this.connectionsByIp.set(ip, (this.connectionsByIp.get(ip) ?? 0) + 1)
  }

  untrack(tenantId: string, ip: string) {
    // 连接关闭时调用
  }
}

// Controller 内
@Sse('orders/events')
orderEvents(@Req() req: TenantRequest, @Ip() ip: string) {
  if (!this.tracker.canConnect(req.tenantId, ip)) {
    throw new HttpException('too many connections', 429)
  }
  this.tracker.track(req.tenantId, ip)

  return this.emitter.stream().pipe(
    filter(...),
    finalize(() => this.tracker.untrack(req.tenantId, ip))  // 关闭时清理
  )
}
```

---

## 8. ❌ 反模式 8: NestJS @Sse 必须用 Observable (不能用 Promise)

```typescript
// BAD: 返回 Promise (不 stream)
@Sse('orders/events')
async orderEvents() {
  return this.emitter.events  // ❌ 返回一次性数据, 不 stream
  // 客户端只收到 1 个事件就 close
}
```

### ✅ 最佳实践: 返回 Observable<MessageEvent>

```typescript
// GOOD: 必须 Observable
import { Observable, merge, interval } from 'rxjs'
import { map, filter } from 'rxjs/operators'

@Sse('orders/events')
orderEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
  const tenantId = req.tenantId
  return this.emitter.stream().pipe(
    filter((msg) => this.belongsToTenant(msg, tenantId)),
    map((msg) => this.toMessageEvent(msg))
  )
}

// NestJS @Sse 装饰器要求:
// 1. 返回 Observable<MessageEvent>
// 2. MessageEvent 必须有 type / id / data 字段
// 3. 不能 throw (会 close connection)
```

---

## 9. ❌ 反模式 9: 反向代理缓冲

```nginx
# BAD: Nginx 默认开启 buffering, SSE 不会实时推送
location /api/cashier/ {
  proxy_pass http://api:3000;
  # 默认 proxy_buffering on → SSE 客户端收到的是批量数据 (延迟 1-5s)
}
```

### ✅ 最佳实践: Nginx SSE 配置

```nginx
# GOOD: SSE 友好配置
location /api/cashier/ {
  proxy_pass http://api:3000;
  proxy_http_version 1.1;
  proxy_set_header Connection '';
  proxy_buffering off;              # 关键: 关闭缓冲
  proxy_cache off;                  # 关键: 不缓存
  proxy_read_timeout 60s;           # 60s 超时 (配合 25s 心跳)
  proxy_set_header X-Accel-Buffering no;  # 额外保险
  add_header Cache-Control no-cache;     # 客户端不缓存
  add_header X-Accel-Buffering no;       # 同上
}
```

**K8s Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-buffering: "off"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
spec:
  rules:
    - host: api.shenjiying88.cn
      http:
        paths:
          - path: /api/cashier
            backend:
              service:
                name: api
                port:
                  number: 3000
```

---

## 10. ❌ 反模式 10: 缺 metrics (黑盒运维)

```typescript
// BAD: 不知道多少连接 / 多少事件 / 多少错误
// 出问题只能猜
```

### ✅ 最佳实践: Prometheus 4 黄金指标

```typescript
// GOOD: Prometheus 埋点
import { Counter, Gauge, Histogram } from 'prom-client'

const sseConnectionsGauge = new Gauge({
  name: 'sse_connections_active',
  labelNames: ['endpoint', 'tenant_id'],
  help: 'Active SSE connections'
})

const sseEventsCounter = new Counter({
  name: 'sse_events_total',
  labelNames: ['endpoint', 'event_type', 'tenant_id'],
  help: 'SSE events emitted'
})

const sseErrorsCounter = new Counter({
  name: 'sse_errors_total',
  labelNames: ['endpoint', 'error_type'],
  help: 'SSE errors'
})

const sseLatencyHistogram = new Histogram({
  name: 'sse_event_delivery_seconds',
  labelNames: ['endpoint'],
  buckets: [0.001, 0.01, 0.1, 1, 5]
})

// Controller 埋点
@Sse('orders/events')
orderEvents(@Req() req: TenantRequest): Observable<MessageEvent> {
  sseConnectionsGauge.inc({ endpoint: 'orders/events', tenant_id: req.tenantId })

  return this.emitter.stream().pipe(
    tap(msg => {
      sseEventsCounter.inc({
        endpoint: 'orders/events',
        event_type: msg.type,
        tenant_id: req.tenantId
      })
    }),
    filter(msg => this.belongsToTenant(msg, req.tenantId)),
    map(msg => this.toMessageEvent(msg)),
    finalize(() => {
      sseConnectionsGauge.dec({ endpoint: 'orders/events', tenant_id: req.tenantId })
    })
  )
}
```

**Grafana 4 黄金指标**:
- 连接数: `sse_connections_active{endpoint="orders/events"}`
- 事件吞吐: `rate(sse_events_total[5m])`
- 错误率: `rate(sse_errors_total[5m]) / rate(sse_events_total[5m])`
- 延迟 P99: `histogram_quantile(0.99, rate(sse_event_delivery_seconds_bucket[5m]))`

---

## 11. Phase-35 T164 SSE 实战对照

| 反模式 | T164 处理 | 测试 AC |
|--------|----------:|---------|
| ❌ 没有心跳 | ✅ 留 hook (本文件 §1) | 待 P1 启用 |
| ✅ Last-Event-ID | ✅ replay endpoint | AC-7 PASS |
| ❌ 客户端断线检测 | ✅ EventSource 自动重连 | E2E 浏览器层 |
| ✅ tenant 隔离 | ✅ 三重防御 | AC-6 + AC-8 PASS |
| ✅ Subject 多订阅 | ✅ RxJS | E2E |
| ✅ EventStore LRU | ✅ 10000 | AC-4 PASS |
| ⚠️ 连接限流 | 🟡 Phase-36 启用 | 待 P0-007 |
| ✅ Observable @Sse | ✅ type-safe | 编译期 |
| ⚠️ Nginx 配置 | 🟡 Phase-46 部署 | k8s-manifest 待 |
| ⚠️ Prometheus | 🟡 Phase-41 启用 | observability 待 |

---

## 12. 神机营 SaaS v4.0 SSE 架构目标

```
┌────────────────────────────────────────────────┐
│  Browser (admin-web/storefront-web)             │
│  EventSource + 心跳 watchdog + Last-Event-ID    │
└──────────────────┬─────────────────────────────┘
                   ↓
┌────────────────────────────────────────────────┐
│  Nginx (Phase-46 部署)                          │
│  proxy_buffering off + proxy_read_timeout 60s   │
└──────────────────┬─────────────────────────────┘
                   ↓
┌────────────────────────────────────────────────┐
│  NestJS BFF (apps/api)                          │
│  CashierSseController (3 SSE 端点)               │
│  + 心跳 25s                                     │
│  + TenantGuard 3 重防御                          │
│  + 连接限流 (100/tenant, 10/IP)                 │
│  + Prometheus 4 黄金指标                         │
└──────────────────┬─────────────────────────────┘
                   ↓
┌────────────────────────────────────────────────┐
│  CashierEventEmitter (RxJS Subject)             │
│  + EventStore LRU 10000                         │
│  + EventStore PG 持久化 (Phase-46)              │
│  + EventStore Redis Stream 跨实例 (Phase-46)    │
└──────────────────┬─────────────────────────────┘
                   ↓
┌────────────────────────────────────────────────┐
│  PostgreSQL event_outbox (Phase-46)              │
│  - id / type / data / tenant_id / created_at    │
│  - INDEX (tenant_id, id) for fast replay        │
└────────────────────────────────────────────────┘
```

---

## 13. 与其他反模式关联

| 反模式 | 关系 |
|--------|------|
| [event-bus-design.md](./event-bus-design.md) | SSE = EventBus 的一种 transport |
| [concurrency-safety.md](./concurrency-safety.md) | 多连接并发读 EventStore = Read-Your-Writes |
| [caching-strategy.md](./caching-strategy.md) | EventStore LRU = 缓存模式应用 |
| [observability.md](./observability.md) | 4 黄金指标 + Prometheus 必备 |
| [security-defense.md](./security-defense.md) | tenant 隔离 = 多租户第一原则 |
| [performance-optimization.md](./performance-optimization.md) | 心跳 25s = proxy 60s 超时优化 |
| [error-handling.md](./error-handling.md) | SSE 错误隔离 = RxJS catchError |
| [k8s-manifest.md](./k8s-manifest.md) | Nginx Ingress SSE 友好配置 |

---

## 14. 总结: SSE 银弹 10 条

```
✅ 25s 心跳 (proxy 60s 超时前)
✅ Last-Event-ID 重连 + EventStore replay
✅ 客户端 readyState 检测 + watchdog
✅ 三重 tenant 隔离 (Guard + filter + store)
✅ RxJS Subject (而非 EventEmitter)
✅ EventStore LRU 10000 + Phase-46 PG 持久化
✅ per-tenant 连接限流 (100/tenant, 10/IP)
✅ Observable<MessageEvent> 返回类型
✅ Nginx proxy_buffering off + 60s timeout
✅ Prometheus 4 黄金指标 (连接/事件/错误/延迟)
```

**神机营 v4.0 Phase-35 T164 实战**: 8/8 AC PASS + 12 事件 + 3 SSE 端点 + EventStore LRU

---

> 📅 创建: 2026-06-27 23:58 CST · 反模式库 v4 · Part 14 · cashier-sse-edge-cases
> 🦞🐜 龙虾哥 + 树哥trae 联合维护
> 🏁 Phase-35 T165 retro 触发 · Phase-35 100% 收官
