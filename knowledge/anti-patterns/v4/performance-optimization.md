# 性能优化反模式 v4

## 元信息
- **编号**: AP-W14 (Anti-Pattern Watch #14)
- **分类**: 性能 / 可扩展性
- **发现**: 2026-06-27 Phase-35~50 全栈设计
- **影响**: 慢响应 / OOM / DB 慢查询
- **修复耗时**: 持续优化

---

## 现象描述

SaaS 平台常见性能问题:

1. **N+1 查询**: 1 次查 N 条,触发 N 次额外查询
2. **大对象序列化**: JSON.stringify 大数据 > 1MB
3. **同步阻塞**: CPU 密集任务阻塞 Event Loop
4. **内存泄漏**: Map/Set 无限增长,从不清理
5. **DB 缺索引**: 100 万行表的全表扫描

---

## 根因分析

### 1. N+1 查询

```typescript
// ❌ 反例
const orders = await prisma.order.findMany()  // 1 次
for (const order of orders) {
  const member = await prisma.member.findUnique({  // N 次!
    where: { id: order.memberId }
  })
  order.member = member
}

// ✅ 修复: include 一次查询
const orders = await prisma.order.findMany({
  include: { member: true }
})
```

### 2. 大对象序列化

```typescript
// ❌ 反例
app.get('/api/export', async (req, res) => {
  const orders = await prisma.order.findMany()  // 10000 条
  res.json(orders)  // JSON.stringify 慢 + 内存爆
})

// ✅ 修复: 分页流式
app.get('/api/export', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv')
  const cursor = prisma.order.findMany().cursor()
  for await (const order of cursor) {
    res.write(`${order.id},${order.amount}\n`)
  }
  res.end()
})
```

### 3. 同步阻塞

```typescript
// ❌ 反例: CPU 密集阻塞
function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

app.get('/api/fib', (req, res) => {
  res.json({ value: fibonacci(40) })  // 阻塞 1s+,整个 Event Loop 卡死
})

// ✅ 修复: Worker Threads
import { Worker } from 'worker_threads'

app.get('/api/fib', (req, res) => {
  const worker = new Worker('./fib-worker.js', { workerData: { n: 40 } })
  worker.on('message', value => res.json({ value }))
})
```

---

## 数学证明 · 性能损失

### N+1 查询时间

设:
- `T_query` = 单次查询耗时 (10ms)
- `N` = 数据条数 (1000)

```
T_total = T_query × N = 10ms × 1000 = 10s
```

vs include 一次:
```
T_include = 50ms (固定)
```

性能差异:
```
T_total / T_include = 10000ms / 50ms = 200x 慢
```

### 内存泄漏

设:
- `λ` = 内存增长速率 (1MB/请求)
- `T` = 持续时间 (小时)
- `M_max` = Node.js 堆内存上限 (1.5GB)

```
T_oom = M_max / (λ × QPS)
```

λ=1MB, QPS=100:
```
T_oom = 1500 / 100 = 15s 崩溃
```

---

## 修复方案 (Phase-35~50 实战)

### 1. DB 索引强制

```prisma
model Order {
  id        String   @id @default(cuid())
  tenantId  String
  memberId  String?
  status    OrderStatus
  createdAt DateTime @default(now())
  
  @@index([tenantId])
  @@index([tenantId, status])        // 复合索引
  @@index([tenantId, createdAt])      // 排序索引
  @@index([memberId])
}
```

### 2. 游标分页代替 OFFSET

```typescript
// ❌ 反例: OFFSET 慢
const orders = await prisma.order.findMany({
  skip: 10000,
  take: 20
})
// 扫描 10020 行

// ✅ 推荐: cursor 分页
const orders = await prisma.order.findMany({
  take: 20,
  cursor: { id: lastId },
  skip: 1
})
// 扫描 20 行
```

### 3. 缓存层

```typescript
// ✅ Redis 缓存热点数据
const cacheKey = `member:${userId}:profile`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const profile = await prisma.member.findUnique({ where: { id: userId } })
await redis.set(cacheKey, JSON.stringify(profile), 'EX', 300)  // 5 min
```

### 4. 流式响应

```typescript
// ✅ SSE 流式推送 (Phase-35 T164)
@Get('events')
async events(@Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream')
  for await (const event of this.eventBus.stream$) {
    res.write(`event: ${event.type}\n`)
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }
}
```

### 5. 内存监控

```typescript
// ✅ 定期检查堆
setInterval(() => {
  const { heapUsed, heapTotal } = process.memoryUsage()
  if (heapUsed / heapTotal > 0.85) {
    logger.warn(`Memory high: ${heapUsed / 1024 / 1024}MB`)
    if (global.gc) global.gc()  // 需 --expose-gc
  }
}, 30000)
```

---

## 预防机制 (R-07 V2)

### 1. 慢查询监控

```typescript
// Prisma 中间件
prisma.$use(async (params, next) => {
  const start = Date.now()
  const result = await next(params)
  const duration = Date.now() - start
  if (duration > 200) {
    logger.warn(`Slow query: ${params.model}.${params.action} ${duration}ms`)
  }
  return result
})
```

### 2. pprof + Clinic.js

```bash
# 火焰图
clinic flame -- node dist/main.js
clinic doctor -- node dist/main.js
```

### 3. APM 集成

- Prometheus + Grafana
- DataDog APM
- Elastic APM

### 4. Load Testing

```bash
# k6
k6 run --vus 100 --duration 30s load-test.js

# Artillery
artillery quick --count 100 --num 10 http://localhost:3000
```

---

## 经验教训

> 🦞 **"性能不是后期优化,是设计期就考虑"**

1. **DB 索引先行**: schema 定义时同步加索引
2. **避免 N+1**: 一开始就用 include
3. **缓存热点**: Redis 多级缓存
4. **流式大于批量**: SSE > 全量返回
5. **监控先于优化**: 没监控就优化 = 盲人摸象

---

## 相关反模式

- [concurrency-safety.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/concurrency-safety.md): 并发请求
- [event-bus-design.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/event-bus-design.md): 事件流性能

---

> 🦞 **"性能 = 用户体验 = 留存"**