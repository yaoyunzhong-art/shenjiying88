# Webhook Retry 反模式 (Phase-44 T174)

> 反模式 v4 = 40 个文件 (39 → 40, +webhook-retry-pattern)
> 适用: Webhook 投递、异步事件回调、第三方系统对接
> 防御: 状态机 PENDING/SUCCESS/FAILED/DEAD_LETTER + 指数退避 1s/5s/30s/5m/30m + 幂等 eventId + 死信队列 + 上限 5 次

---

## 5 大反模式 (Anti-patterns)

### 1. 🔴 无限重试 (Infinite Retry)

**症状**: 失败一直重试, 几天后仍在重试同一失败请求, 资源浪费 + 雪崩。

**根因**: 没有 maxAttempts 限制, 或没有死信队列 (DLQ)。

**错误示例**:
```typescript
// ❌ while true, 永远重试
while (!success) {
  await fetch(webhookUrl, payload)
}
```

**正确做法**:
```typescript
// ✅ maxAttempts = 5, 失败入死信 (DLQ)
const MAX_ATTEMPTS = 5
if (delivery.attempts >= MAX_ATTEMPTS) {
  delivery.status = 'DEAD_LETTER'
  await dlq.push(delivery)  // 运维手动介入
} else {
  delivery.status = 'FAILED'
  delivery.nextRetryAt = Date.now() + getNextRetryDelay(delivery.attempts)
}
```

**清单**:
- [ ] maxAttempts = 5 (行业标准)
- [ ] 达到上限入死信 (status = DEAD_LETTER)
- [ ] 死信队列独立存储 (可手动重试)
- [ ] 监控: deadLetter 数 > 阈值告警
- [ ] 恢复 API: `recoverFromDeadLetter(deliveryId)`

---

### 2. 🔴 固定间隔重试 (Fixed Interval Retry)

**症状**: 所有失败请求都按 1s/1s/1s/1s... 重试, 在下游故障时雪崩。

**根因**: 没有指数退避, 大量请求在同一时间点重试, 进一步压垮下游。

**错误示例**:
```typescript
// ❌ 固定 1s 重试
setTimeout(retry, 1000)
setTimeout(retry, 1000)  // 1000 个失败请求都在同一秒重试
```

**正确做法**:
```typescript
// ✅ 指数退避 1s → 5s → 30s → 5min → 30min
const RETRY_DELAYS_MS = [1000, 5000, 30000, 300000, 1800000]
function getNextRetryDelay(attempts: number): number {
  return RETRY_DELAYS_MS[attempts] || -1
}

// + jitter (防雪崩)
const jitter = Math.random() * 1000  // 0~1s 抖动
const delay = baseDelay + jitter
```

**清单**:
- [ ] 退避序列: 1s / 5s / 30s / 5min / 30min
- [ ] 第 N 次重试前, 加 jitter (随机 0~1s)
- [ ] 不同请求的 retry 时间错开
- [ ] maxAttempts = 5 后不再重试
- [ ] 监控 retry 间隔分布

---

### 3. 🔴 缺少幂等 (No Idempotency)

**症状**: 同一事件被投递多次 (网络重试 + 业务重试), 下游重复处理。

**根因**: 没有 eventId 去重, 投递端无幂等索引。

**错误示例**:
```typescript
// ❌ 每次投递都创建新 delivery, 无幂等
for (let i = 0; i < 3; i++) {
  await dispatch(subscription, event)  // 3 次都投递, 下游处理 3 次
}
```

**正确做法**:
```typescript
// ✅ eventId 幂等索引
const eventId = payload.id || `${eventType}_${timestamp}`
const idempKey = `${tenantId}:${subscriptionId}:${eventId}`
if (adapter.isAlreadyDelivered(tenantId, subscriptionId, eventId)) {
  throw new Error('duplicate_delivery')
}

// 索引: {tenantId}:{subscriptionId}:{eventId} → deliveryId
adapter.saveDelivery({
  ...delivery,
  payload: { ...payload, id: eventId }
})
```

**清单**:
- [ ] 投递前检查 eventId 是否已存在
- [ ] 重复返回 reason=`duplicate_delivery`
- [ ] 索引: tenantId + subscriptionId + eventId 三元组
- [ ] payload 必须有 id 字段 (业务方生成)
- [ ] 离线补传/重试场景 100% 幂等

---

### 4. 🔴 投递未签名 (No Payload Signature)

**症状**: 中间人可篡改 webhook payload, 下游无法识别合法性。

**根因**: 没有 HMAC 签名, 下游无法验证消息来源 + 完整性。

**错误示例**:
```typescript
// ❌ 直接 POST, 无签名
await fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify(payload)
  // 中间人可改 amount: 100 → amount: 99999
})
```

**正确做法**:
```typescript
// ✅ HMAC 签名 (secret per subscription)
const signature = signValidator.sign({
  secret: subscription.secret,
  method: 'POST',
  url: subscription.url,
  timestamp: Date.now(),
  nonce: eventId,
  body: JSON.stringify(payload)
})

await fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'X-Webhook-Signature': signature,
    'X-Webhook-Event': eventType,
    'X-Webhook-Delivery-Id': delivery.id
  },
  body: JSON.stringify(payload)
})

// 下游验证 (在订阅方文档中说明)
// const valid = hmacSha256(subscriptionSecret, `${method}\n${url}\n${ts}\n${nonce}\n${body}`) === signature
```

**清单**:
- [ ] 每个订阅独立 secret (32 chars)
- [ ] 签名包含 method + url + timestamp + nonce + body
- [ ] header: `X-Webhook-Signature`
- [ ] 下游文档说明验证方法
- [ ] 测试: 修改 body 后 signature 不匹配

---

### 5. 🟡 状态丢失 (Lost Delivery State)

**症状**: 服务重启后, PENDING/FAILED 的 delivery 全部丢失, 永远不会重试。

**根因**: 状态存内存, 无持久化, 进程崩溃后数据蒸发。

**错误示例**:
```typescript
// ❌ 状态全在内存
const pendingDeliveries = new Map<string, Delivery>()  // 重启清零
```

**正确做法**:
```typescript
// ✅ 状态持久化 (DB / Redis)
interface WebhookDelivery {
  id: string
  tenantId: string
  subscriptionId: string
  eventType: string
  payload: any
  attempts: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DEAD_LETTER'
  lastAttemptAt?: string
  nextRetryAt?: string
  responseStatus?: number
  errorMessage?: string
  signature: string
  createdAt: string
  deliveredAt?: string
}

// 每次 attempt 后立即 save
adapter.saveDelivery(delivery)
```

**清单**:
- [ ] 状态机: PENDING → SUCCESS / FAILED / DEAD_LETTER
- [ ] 每次状态变更立即持久化
- [ ] 服务重启后扫描 FAILED + nextRetryAt < now 重试
- [ ] 投递日志保留 30 天 (合规)
- [ ] 死信保留 90 天 (人工介入)

---

## 指数退避算法

```
attempt 1: 失败 → 等 1s (1s + jitter)
attempt 2: 失败 → 等 5s (5s + jitter)
attempt 3: 失败 → 等 30s (30s + jitter)
attempt 4: 失败 → 等 5min (300s + jitter)
attempt 5: 失败 → 等 30min (1800s + jitter) → 仍失败 → DEAD_LETTER

总等待: 1+5+30+300+1800 = 2136s ≈ 35.6min
总耗时: 投递 + 退避 + 重试 = ~36min

jitter = Math.random() * 1000  // 0~1s 抖动 (防雪崩)
```

---

## 投递状态机

```
   PENDING ──→ SUCCESS (200)
     │
     ├──→ FAILED (4xx/5xx/network) ──→ 重试 (attempts < 5)
     │                                    │
     │                                    ↓
     │                                  FAILED (attempts = 5)
     │                                    │
     │                                    ↓
     └──→ DEAD_LETTER (运维介入)
              │
              ↓
         recoverFromDeadLetter (手动重置 attempts=0)
              │
              ↓
         FAILED → ... → SUCCESS / DEAD_LETTER
```

---

## 反模式检测 (Heuristics)

| 检测项 | 阈值 | 工具 |
|--------|------|------|
| 无限重试 | attempts > 5 | dispatcher.isMaxAttemptsReached() |
| 固定间隔 | delay 标准差 = 0 | dispatcher.delayVariance() |
| 缺幂等 | duplicate rate ≥ 1% | adapter.duplicateRate() |
| 未签名 | 无 X-Signature header | 网关拦截 |
| 状态丢失 | 重启后 PENDING 残留 | monitor.pendingAfterRestart() |

---

## 神机营实施

- `apps/api/src/modules/openapi/webhook-dispatcher.ts` (180 行): 状态机 + 指数退避 1s/5s/30s/5m/30m + 幂等索引 + HMAC 签名
- `apps/api/src/modules/openapi/datasources/webhook.adapter.ts` (120 行): 订阅/投递/死信存储 + 幂等索引 `tenantId:subId:eventId`
- `apps/api/src/modules/openapi/services/webhook.service.ts` (160 行): 订阅 CRUD + 暂停 + 投递包装 + 重试 + 恢复
- 单测: `webhook-dispatcher.test.ts` 17 PASS (含重试 5 次入死信 + 幂等 + 签名)
- E2E: `scripts/phase44-e2e-openapi.ts` 35 PASS (含 AC-3 全场景)

---

> **"Webhook = 状态机 + 指数退避 + 幂等 eventId + HMAC 签名 + 死信 DLQ = 0 无限重试 + 0 雪崩 + 0 重复 + 0 篡改 + 0 丢失"**