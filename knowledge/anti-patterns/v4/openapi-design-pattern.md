# OpenAPI Design 反模式 (Phase-44 T174)

> 反模式 v4 = 39 个文件 (38 → 39, +openapi-design-pattern)
> 适用: 开放 API 网关、API Key 签发、HMAC 签名验证
> 防御: key 格式前缀 + 一次性明文返回 + HMAC-SHA256 + 5min 时间窗口 + nonce 防重放 + scope 隔离

---

## 5 大反模式 (Anti-patterns)

### 1. 🔴 弱鉴权 (Weak Authentication)

**症状**: API Key 仅用静态字符串,无前缀区分环境,泄露后无法快速定位/撤销。

**根因**: 没有环境隔离 (live/test/sandbox), 没有一次性明文返回机制。

**错误示例**:
```typescript
// ❌ 静态 key, 无前缀, 无环境区分
const apiKey = `sk_${randomString(32)}`  // 看起来安全, 实则无法分辨环境
```

**正确做法**:
```typescript
// ✅ 格式: sk_{env}_{keyId}_{secret}, 一次性返回明文
const apiKey = `sk_live_${keyId16}_${secret32}`  // live / test / sandbox
// 存储只保留 keyHash (SHA-256), 明文只返回一次
const keyHash = hashSecret(plaintextSecret)
adapter.save({ keyId, keyHash, environment: 'LIVE', ... })
```

**清单**:
- [ ] API Key 格式 = `sk_{env}_{keyId}_{secret}`
- [ ] 三种环境: `LIVE` (生产) / `TEST` (测试) / `SANDBOX` (沙箱)
- [ ] 明文 secret 只在创建时返回一次
- [ ] 数据库只存 keyHash (djb2/SHA-256), 不存明文
- [ ] 泄露立即 revoke + 全局失效

---

### 2. 🔴 缺少签名 (No Signature)

**症状**: 仅靠 API Key 鉴权,请求 body 可被中间人篡改 (金额、收货地址等关键字段)。

**根因**: 没有请求签名, 只验证身份不验证完整性。

**错误示例**:
```typescript
// ❌ 仅 API Key header, body 可被篡改
fetch('/api/orders', {
  headers: { 'X-API-Key': 'sk_live_xxx' },
  body: JSON.stringify({ amount: 100 })  // 中间人改 amount: 999999
})
```

**正确做法**:
```typescript
// ✅ HMAC-SHA256 签名 (method + url + timestamp + nonce + body)
const canonicalString = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}`
const signature = hmacSha256(secret, canonicalString)

fetch('/api/orders', {
  headers: {
    'X-API-Key': 'sk_live_xxx',
    'X-Timestamp': ts.toString(),
    'X-Nonce': nonce,
    'X-Signature': signature
  },
  body: JSON.stringify({ amount: 100 })
})

// 服务端验证
if (!validate({ secret, request: { method, url, body, timestamp, nonce, signature } })) {
  throw new Error('signature_mismatch')
}
```

**清单**:
- [ ] 必须 timestamp (5min 防重放窗口)
- [ ] 必须 nonce (同时间戳不重复)
- [ ] body 必须原样参与签名 (防 body 篡改)
- [ ] HMAC-SHA256 (生产用 `node:crypto.createHmac`)
- [ ] secret 长度 ≥ 32 chars
- [ ] 签名失败返回 reason=`signature_mismatch`

---

### 3. 🔴 无限重放 (Replay Attack)

**症状**: 攻击者截获一次合法请求,反复重放同一 timestamp+nonce+signature,在 5min 内可调用 N 次。

**根因**: nonce 未去重,服务端无 nonce 索引。

**错误示例**:
```typescript
// ❌ 验证签名后直接放行, 无 nonce 索引
if (signature !== expected) throw new Error('invalid')
// 同一请求被重放 100 次, 后端执行 100 次
```

**正确做法**:
```typescript
// ✅ nonce 索引 (Redis Set 或 in-memory Set)
const nonceKey = `${tenantId}:${apiKeyId}:${nonce}`
if (redis.sismember('used_nonces', nonceKey)) {
  throw new Error('replayed_nonce')
}
redis.sadd('used_nonces', nonceKey)
redis.expire('used_nonces', 5 * 60)  // 5min 后自动清理

// 简化版: in-memory (生产用 Redis)
const usedNonces = new Set<string>()
if (usedNonces.has(nonce)) throw new Error('replayed_nonce')
usedNonces.add(nonce)
```

**清单**:
- [ ] 验证签名后立即检查 nonce 是否已用
- [ ] 重复 nonce 返回 reason=`replayed_nonce`
- [ ] nonce 索引 TTL = 5min (与时间窗口一致)
- [ ] Redis 用 Set + EXPIRE (生产)
- [ ] in-memory Set 用于单实例/测试

---

### 4. 🔴 时间窗口过宽/无窗口 (Wide Window / No Window)

**症状**: timestamp 未校验或窗口过宽 (e.g. 24h), 攻击者可在窗口内任意重放。

**根因**: 时间窗口逻辑缺失,或阈值设置过大。

**错误示例**:
```typescript
// ❌ 无时间窗口检查, 或窗口 = 1 天
const skew = Math.abs(now - req.timestamp)
if (skew > 86400000) throw new Error('expired')  // 1 天太宽!
```

**正确做法**:
```typescript
// ✅ 5 分钟窗口 (行业标准)
const REPLAY_WINDOW_MS = 5 * 60 * 1000
const skew = Math.abs(now - req.timestamp)
if (skew > REPLAY_WINDOW_MS) {
  return { valid: false, reason: 'timestamp_out_of_window' }
}
```

**清单**:
- [ ] replay window = 5 分钟 (300000 ms)
- [ ] 超出窗口返回 reason=`timestamp_out_of_window`
- [ ] 客户端时钟漂移容忍 ±30s
- [ ] 服务端时间用 NTP 同步 (生产)
- [ ] 测试: 用 6min 前的 timestamp 应被拒

---

### 5. 🟡 Scope 失控 (Scope Creep)

**症状**: API Key 创建时 scope = `[{ resource: '*', actions: ['*'] }]`,全权限一把钥匙, 撤销影响所有功能。

**根因**: scope 检查不强制, 或默认 `*` 通配。

**错误示例**:
```typescript
// ❌ scope 默认 *, 永远校验通过
const apiKey = { scopes: [{ resource: '*', actions: ['*'] }] }
hasScope(apiKey, 'orders', 'delete')  // 永远 true
```

**正确做法**:
```typescript
// ✅ 按 资源 + 操作 精细控制
const apiKey = {
  scopes: [
    { resource: 'orders', actions: ['read', 'write'] },     // 订单读写
    { resource: 'members', actions: ['read'] }                // 会员只读
  ]
}

// 校验函数
function hasScope(apiKey: APIKey, resource: string, action: string): boolean {
  for (const scope of apiKey.scopes) {
    if (scope.resource === '*' || scope.resource === resource) {
      if (scope.actions.includes('*') || scope.actions.includes(action)) {
        return true
      }
    }
  }
  return false
}
```

**清单**:
- [ ] scope 必填 (最少 1 个, 不能空)
- [ ] 创建 API Key 时强制指定 resource + action
- [ ] 默认禁止 `[{ resource: '*', actions: ['*'] }]`, 需明确 opt-in
- [ ] 校验函数: resource + action 双匹配
- [ ] scope 不匹配返回 reason=`scope_mismatch`
- [ ] revoke 不影响其他 scope 的 key

---

## OpenAPI 3.1 字段约束

```yaml
openapi: 3.1.0
info:
  title: M5 OpenAPI
  version: 1.0.0
  description: 开放 API 网关
servers:
  - url: https://api.m5.example.com/v1
paths:
  /openapi/key/create:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [tenantId, environment, name, scopes]
              properties:
                tenantId: { type: string }
                environment: { enum: [LIVE, TEST, SANDBOX] }
                name: { type: string, minLength: 1 }
                scopes:
                  type: array
                  minItems: 1
                  items:
                    type: object
                    required: [resource, actions]
                    properties:
                      resource: { type: string, minLength: 1 }
                      actions:
                        type: array
                        minItems: 1
                        items: { type: string }
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    HmacSignature:
      type: apiKey
      in: header
      name: X-Signature
```

---

## 反模式检测 (Heuristics)

| 检测项 | 阈值 | 工具 |
|--------|------|------|
| 弱鉴权 key | 无环境前缀 | lint rule |
| 缺签名 | 无 X-Signature header | 网关拦截 |
| nonce 重放 | ≥ 1 次/分钟 | gateway.replayDetector() |
| 时间窗口过宽 | > 10min | signValidator.getReplayWindowMs() |
| scope 通配 | scope = `*` 占比 | apiKeySvc.scopeWildcardRate() |

---

## 神机营实施

- `apps/api/src/modules/openapi/key-generator.ts` (130 行): `sk_{env}_{keyId16}_{secret32}` + djb2 hash
- `apps/api/src/modules/openapi/sign-validator.ts` (130 行): HMAC-SHA256 + 5min 时间窗口 + 字段完整性
- `apps/api/src/modules/openapi/services/api-key.service.ts` (130 行): 一次性明文返回 + scope 校验 + 撤销
- 单测: `key-generator.test.ts` 19 + `sign-validator.test.ts` 11 = 30 PASS
- E2E: `scripts/phase44-e2e-openapi.ts` 35 PASS (含 AC-1 + AC-2 全场景)

---

> **"开放 API = 强鉴权 + 强签名 + 防重放 + 严 scope = 0 弱口令 + 0 篡改 + 0 重放 + 0 越权"**