# 反模式库 v4 · observability (可观测性)

> **创建时间**: 2026-06-27 22:25 CST (1h 冲刺 Part 4)
> **分类**: 运维 · 可观测性
> **目标读者**: 全栈工程师 (后端 / 前端 / DevOps)

---

## 1. 三大支柱: Metrics / Logs / Traces

### ❌ 反模式 1: 只打 console.log 算日志

```typescript
// BAD: 无结构、无级别、无上下文
async function processOrder(orderId: string) {
  console.log('processing order', orderId)
  try {
    const order = await db.orders.findUnique({ where: { id: orderId } })
    console.log('got order', order)
    return order
  } catch (e) {
    console.log('error', e)
  }
}
```

**问题**:
- 无法 grep 出特定 order 的处理日志
- 错误堆栈丢失
- 没有 trace ID 串联请求

### ✅ 最佳实践: 结构化日志 (Pino)

```typescript
// GOOD: 结构化 + trace ID + 级别
import { pino } from 'pino'

const logger = pino({
  name: 'cashier',
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  base: { service: 'cashier', env: process.env.NODE_ENV }
})

async function processOrder(orderId: string, traceId: string) {
  logger.info({ orderId, traceId, action: 'fetch' }, 'processing order')
  try {
    const order = await db.orders.findUnique({ where: { id: orderId } })
    logger.info({ orderId, traceId, amount: order.amount, action: 'fetched' }, 'got order')
    return order
  } catch (e) {
    logger.error({ orderId, traceId, err: e, action: 'fetch' }, 'order fetch failed')
    throw e
  }
}
```

---

## 2. Metrics: 4 类黄金指标 (Google SRE)

### ❌ 反模式 2: 只看 CPU/内存

```typescript
// BAD: 只暴露基础设施层 metric
app.get('/metrics', (req, res) => {
  res.send(`
    process_cpu_usage ${process.cpuUsage()}
    process_memory_rss ${process.memoryUsage().rss}
  `)
})
```

**问题**: 业务层 (订单成功率、支付延迟) 完全不可见

### ✅ 最佳实践: RED + USE 双向

```typescript
// GOOD: RED (Rate/Errors/Duration) + USE (Utilization/Saturation/Errors)
import { Counter, Histogram } from 'prom-client'

const orderCounter = new Counter({
  name: 'cashier_orders_total',
  help: 'Total orders processed',
  labelNames: ['status', 'payment_method'] // status: success/failed, payment: wechat/alipay
})

const orderDuration = new Histogram({
  name: 'cashier_order_duration_seconds',
  help: 'Order processing duration',
  labelNames: ['status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5] // SLO 目标: P99 < 1s
})

async function processOrder(order: Order) {
  const timer = orderDuration.startTimer()
  try {
    const result = await doProcess(order)
    orderCounter.inc({ status: 'success', payment_method: order.method })
    timer({ status: 'success' })
    return result
  } catch (e) {
    orderCounter.inc({ status: 'failed', payment_method: order.method })
    timer({ status: 'failed' })
    throw e
  }
}
```

**业务 SLO 模板**:
- 订单创建: P99 < 500ms, 错误率 < 0.1%
- 支付回调: P99 < 1s, 错误率 < 0.01%
- SSE 推送: P99 < 100ms, 成功率 > 99.9%

---

## 3. Traces: 分布式追踪 (OpenTelemetry)

### ❌ 反模式 3: 没有 trace ID 串联

```typescript
// BAD: API → Service → DB 完全独立
app.post('/api/orders', async (req, res) => {
  const order = await orderService.create(req.body)
  res.json(order)
})

// service
async function create(data) {
  const order = await db.orders.create({ data })
  await paymentService.charge(order) // 不知道来自哪个 HTTP 请求
  return order
}
```

**问题**: 慢查询在哪? 失败发生在哪一层? 完全黑盒

### ✅ 最佳实践: 全链路 trace 注入

```typescript
// GOOD: OpenTelemetry SDK + middleware
import { trace, context } from '@opentelemetry/api'
import { SpanStatusCode } from '@opentelemetry/api'

const tracer = trace.getTracer('cashier')

// HTTP middleware: 自动注入 traceparent header
app.use((req, res, next) => {
  const span = tracer.startSpan(`HTTP ${req.method} ${req.path}`)
  ;(req as any).traceId = span.spanContext().traceId
  res.on('finish', () => span.end())
  next()
})

// service: 创建 child span
async function create(data, traceId: string) {
  return tracer.startActiveSpan('OrderService.create', async (span) => {
    try {
      span.setAttribute('order.amount', data.amount)
      const order = await db.orders.create({ data })
      span.setAttribute('order.id', order.id)
      await tracer.startActiveSpan('PaymentService.charge', async (chargeSpan) => {
        await paymentService.charge(order, span.spanContext().traceId)
        chargeSpan.end()
      })
      span.setStatus({ code: SpanStatusCode.OK })
      return order
    } catch (e) {
      span.recordException(e)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw e
    } finally {
      span.end()
    }
  })
}
```

**Trace UI (Jaeger/Tempo)**:
- 一键看到 HTTP → Service → DB → Payment → 第三方 API 全链路
- 每个 span 的耗时 + 属性 + 事件一目了然

---

## 4. 告警: 基于 SLO 而非指标

### ❌ 反模式 4: 阈值告警 (容易误报)

```yaml
# BAD: 固定阈值告警
- alert: HighCPU
  expr: process_cpu_usage > 80%
  for: 5m
```

**问题**: 大促期间 CPU 100% 是正常的

### ✅ 最佳实践: SLO Burn Rate 告警

```yaml
# GOOD: 基于错误预算 (Error Budget)
- alert: OrderErrorBudgetBurn
  expr: |
    (
      sum(rate(cashier_orders_total{status="failed"}[1h]))
      /
      sum(rate(cashier_orders_total[1h]))
    ) > (14.4 * 0.001)  # SLO 0.1%, 1h 内消耗完月度预算
  for: 2m
  annotations:
    summary: "订单错误预算消耗过快"
    description: "1h 错误率 {{ $value | humanizePercentage }} 超过 SLO 14.4 倍"
```

**Google SRE Workbook**:
- 快速燃烧 (1h 警告): 14.4 倍 SLO → 2m 内发现
- 慢速燃烧 (6h 警告): 6 倍 SLO → 30m 内发现
- 月度预算: 100% - 99.9% = 0.1% 可用错误率

---

## 5. 仪表盘: Grafana 4 级

### 级别 1: 业务总览 (Executive)
- 今日订单数 / GMV / 支付成功率
- 会员增长 / 复购率
- 异常事件 (退款激增 / 投诉增加)

### 级别 2: 服务 SLO (Service Owner)
- 4 类黄金指标 (流量/错误/延迟/饱和度)
- SLO 燃烧率
- Top N 慢请求

### 级别 3: 链路详情 (Developer)
- Trace 详情 (火焰图)
- 数据库慢查询
- 第三方 API 延迟

### 级别 4: 基础设施 (DevOps)
- CPU / 内存 / 磁盘 / 网络
- Pod 副本数 / 滚动更新状态
- K8s 事件

---

## 6. 实战检查清单

部署前必查:

- [ ] 结构化日志 (Pino / Winston / Zerolog)
- [ ] trace ID 注入 HTTP middleware
- [ ] 4 类黄金指标 (Counter + Histogram)
- [ ] 业务 SLO 定义 (P99 延迟 + 错误率)
- [ ] 告警基于 SLO 燃烧率
- [ ] Grafana 仪表盘 4 级分层
- [ ] OpenTelemetry SDK 集成
- [ ] 日志保留周期 (30d 热 / 90d 冷)
- [ ] PII 脱敏 (mobile/email/身份证)
- [ ] oncall 轮值 + 升级路径

---

## 7. 神机营落地工具栈

- **Logs**: Pino + Loki + Grafana
- **Metrics**: prom-client + Prometheus + Grafana
- **Traces**: OpenTelemetry SDK + Tempo + Grafana
- **Alert**: Alertmanager + PagerDuty/钉钉
- **SLO**: sloth (SLO generator)

---

## 8. 关联反模式

- [async-try-catch-pattern.md](async-try-catch-pattern.md): 日志 + 异常处理
- [event-bus-design.md](event-bus-design.md): 事件 trace ID 传递
- [performance-optimization.md](performance-optimization.md): 性能监控

---

> 🦞 **"没有可观测性 = 盲人摸象 = 故障时只能靠猜"**
> **"日志看细节 / 指标看趋势 / Trace 看链路 / 告警看 SLO"**