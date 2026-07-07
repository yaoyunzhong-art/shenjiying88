# Event Tracking 反模式 (Phase-43 T173)

> 反模式 v4 = 37 个文件 (36 → 37, +event-tracking-pattern)
> 适用: 事件采集、用户行为埋点、分析前端 SDK
> 防御: 服务端时间戳 + 幂等键 + PII 脱敏 + properties 限制 + 必填字段

---

## 5 大反模式 (Anti-patterns)

### 1. 🔴 重复事件 (Duplicate Events)

**症状**: 同一业务事件被记录多次, 转化率虚高, 漏斗数据污染。

**根因**: 没有幂等键, 客户端重试 / 离线补传导致重复入库。

**错误示例**:
```typescript
// ❌ 没有 eventId 幂等键
collector.collect({
  type: 'PURCHASE',
  memberId: 'm1',
  total: 100
})
```

**正确做法**:
```typescript
// ✅ 业务侧生成 eventId (UUID 或确定性哈希)
const eventId = `evt-${memberId}-${orderId}-${Date.now()}`
collector.collect({
  eventId,  // 业务幂等键
  type: 'PURCHASE',
  memberId: 'm1',
  total: 100
})

// Adapter 端去重
if (this.eventIdIndex.has(event.eventId)) {
  return { accepted: false, reason: `duplicate_event_id: ${event.eventId}` }
}
```

**清单**:
- [ ] 业务事件 100% 携带 eventId (UUID v4 或 业务键+timestamp 哈希)
- [ ] Adapter 维护 eventId 索引 (Map/Set/Redis)
- [ ] 重复入库返回 reason=`duplicate_event_id`
- [ ] ETL 离线补传必须保证 eventId 一致

---

### 2. 🔴 缺失元数据 (Missing 5W1H)

**症状**: 漏斗分析只能看事件数, 无法下钻分析 (哪个渠道? 哪个页面? 谁触发?), 数据"哑巴"。

**根因**: 没有强制 5W1H (Who/When/Where/What/Why/How) 字段。

**错误示例**:
```typescript
// ❌ 只有 type 和 memberId, 后续无法分析
collect({ type: 'CLICK', memberId: 'm1' })
```

**正确做法**:
```typescript
// ✅ 完整 5W1H
collect({
  eventId: '...',
  type: 'CLICK',
  who: 'm1',                  // Who
  when: '2025-06-15T10:30:00Z', // When
  where: {                     // Where
    url: 'https://shop.com/product/123',
    page: 'product-detail',
    channel: 'WECHAT'
  },
  what: { name: 'add_to_cart' }, // What
  why: 'campaign_launch',        // Why (可选)
  how: 'iOS',                    // How (可选)
  properties: { ... }            // 扩展
})
```

**清单**:
- [ ] event 必填 who / what / when
- [ ] where 包含 url + page + channel
- [ ] what 包含 name + category
- [ ] why / how 可选但建议填
- [ ] properties 提供扩展字段

---

### 3. 🔴 时间漂移 (Time Drift)

**症状**: 客户端本地时间不准 (改时间、跨时区), 导致事件顺序错乱、D0/D1 留存计算错误。

**根因**: 直接使用客户端 timestamp, 不信任服务端时间。

**错误示例**:
```typescript
// ❌ 客户端时间
collect({
  type: 'PAGEVIEW',
  timestamp: clientTimestamp  // 客户端的 Date.now()
})
```

**正确做法**:
```typescript
// ✅ 服务端补全时间戳 (优先)
collect({
  eventId: '...',
  type: 'PAGEVIEW'
  // 不传 timestamp, 服务端自动 = new Date().toISOString()
})

// 或: 服务端校正
const event = {
  ...input,
  timestamp: input.timestamp || new Date().toISOString(),  // 服务端 fallback
  when: input.timestamp || new Date().toISOString()        // 双写
}
```

**清单**:
- [ ] 默认不信任客户端 timestamp
- [ ] 服务端 timestamp = `new Date().toISOString()`
- [ ] 离线补传场景: 客户端 ts 写入 properties.clientTs, 服务端 ts 为主
- [ ] 时区统一: 数据库存 UTC ISO 8601
- [ ] D0/D1 留存用服务端时间计算

---

### 4. 🔴 PII 泄露 (PII Leakage)

**症状**: 数据库泄露后, 用户手机号/邮箱/身份证直接曝光, GDPR / 个保法合规风险。

**根因**: 前端 SDK 直接传明文 PII, 后端不做脱敏。

**错误示例**:
```typescript
// ❌ 前端传明文 PII
collect({
  properties: {
    email: 'user@example.com',
    phone: '13800001111',
    idCard: '110101199001011234'
  }
})
```

**正确做法**:
```typescript
// ✅ 服务端自动脱敏
const PII_KEYS = ['email', 'phone', 'idCard', 'password', 'token']

function maskPII(key: string, value: any): any {
  if (PII_KEYS.includes(key)) return '***MASKED***'
  return value
}

// who 字段也脱敏 (邮箱/手机号)
function sanitizeWho(who: string): string {
  if (who.includes('@')) return who.split('@')[0] + '@***'
  if (/^1[3-9]\d{9}$/.test(who)) return who.slice(0, 3) + '****' + who.slice(-4)
  return who
}
```

**清单**:
- [ ] 敏感字段 (email/phone/idCard/password/token) 默认脱敏 = `***MASKED***`
- [ ] who 字段识别邮箱/手机号自动脱敏
- [ ] GDPR / 个保法 合规: 关键 PII 不入库
- [ ] 业务需要明文时, 单独存加密字段 (AES-256), 不走事件流
- [ ] 数据库查询日志脱敏

---

### 5. 🟡 过度采集 (Over-collecting)

**症状**: properties 字段无限增长 (几十上百个 key), 单事件几 KB, 存储成本飙升, 查询慢。

**根因**: 没有 properties 数量限制, 前端随便塞。

**错误示例**:
```typescript
// ❌ properties 无限
collect({
  properties: {
    a: 1, b: 2, c: 3, ..., z100: 100  // 100+ keys
  }
})
```

**正确做法**:
```typescript
const MAX_PROPERTIES_KEYS = 50

// Adapter 端校验
if (Object.keys(event.properties || {}).length > MAX_PROPERTIES_KEYS) {
  return { accepted: false, reason: `too_many_properties` }
}

// 或: 截断保留前 N 个
function sanitizeProperties(props: Record<string, any>): Record<string, any> {
  if (Object.keys(props).length > MAX_PROPERTIES) {
    const limited: Record<string, any> = {}
    Object.keys(props).slice(0, MAX_PROPERTIES).forEach(k => {
      limited[k] = this.maskPII(k, props[k])
    })
    return limited
  }
  // ... 正常脱敏
}
```

**清单**:
- [ ] MAX_PROPERTIES = 50 keys 默认
- [ ] 超出截断 + 报警 (业务方应拆分事件)
- [ ] 单事件 size ≤ 4KB (含 properties)
- [ ] properties value 字符串 ≤ 256 字符
- [ ] 定期清理 >30 天的低频 properties

---

## 反模式检测 (Heuristics)

| 检测项 | 阈值 | 工具 |
|--------|------|------|
| 重复 eventId | ≥ 0.1% | adapter.duplicateEventRate() |
| 缺失 5W1H | ≥ 5% | collector.missingFieldRate() |
| 客户端时间偏移 | > 5min | collector.timeSkewDetector() |
| PII 字段明文 | ≥ 1 | lint rule |
| properties keys | > 50 | isOverCollecting() |

---

## ClickHouse 列存设计建议

```sql
CREATE TABLE events (
  tenant_id       String,
  event_id        String,
  event_type      LowCardinality(String),
  member_id       String,
  session_id      String,
  timestamp       DateTime CODEC(DoubleDelta, ZSTD),
  who             String,
  where_url       String,
  where_channel   LowCardinality(String),
  where_page      LowCardinality(String),
  what_name       LowCardinality(String),
  properties      String,           -- JSON 序列化
  revenue_cents   UInt64,
  -- 索引
  INDEX idx_member (member_id) TYPE bloom_filter() GRANULARITY 3,
  INDEX idx_type_time (event_type, timestamp) TYPE minmax() GRANULARITY 3
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, event_type, timestamp)
```

---

## 神机营实施

- `apps/api/src/modules/analytics-v2/event-collector.ts` (95 行): 5W1H + 服务端 ts + PII 脱敏
- `apps/api/src/modules/analytics-v2/datasources/event.adapter.ts` (90 行): eventId 幂等 + properties ≤ 50
- 单测: `event-collector.test.ts` 17 PASS (覆盖 5 反模式)
- E2E: `scripts/phase43-e2e-analytics.ts` 31 PASS (含 PII 脱敏 + 幂等场景)

---

> **"事件采集 = 服务端时间 + 幂等键 + 5W1H + PII 脱敏 + properties 限额 = 0 重复 + 0 泄露 + 0 哑巴"**