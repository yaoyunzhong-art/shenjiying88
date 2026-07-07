# Phase-44 开放 API Spec · V1 启动版

> **创建时间**: 2026-06-27 22:10 CST (1h 冲刺)
> **Phase**: P2 智能化 (Phase-41~44, 4 phase)
> **预计**: 1 天

---

## 1. 业务目标

开放 API 是 SaaS 平台生态扩展核心:
- **第三方集成**: 对接钉钉/飞书/企微/微信生态
- **Webhook**: 业务事件主动推送
- **OAuth 2.0**: 第三方应用授权
- **API Marketplace**: 合作伙伴应用商店
- **SDK 多语言**: Node.js/Python/Java/Go SDK

依赖所有 P0 + P1 phase 数据。

---

## 2. 数据模型

### ThirdPartyApp (第三方应用)
```typescript
interface ThirdPartyApp {
  id: string
  tenantId: string
  name: string
  developerEmail: string
  scopes: string[]               // 授权范围
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'
  redirectUris: string[]
  webhookUrl?: string
  rateLimit: number              // 次/分钟
  createdAt: string
}
```

### APIToken (API 令牌)
```typescript
interface APIToken {
  id: string
  tenantId: string
  appId: string
  tokenHash: string              // bcrypt
  scopes: string[]
  expiresAt?: string
  lastUsedAt?: string
  enabled: boolean
}
```

### WebhookEvent (Webhook 事件)
```typescript
interface WebhookEvent {
  id: string
  tenantId: string
  appId: string
  event: string                  // 'order.paid' etc.
  payload: Record<string, unknown>
  deliveryUrl: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRY'
  attempts: number
  maxAttempts: number            // 默认 5
  lastAttemptAt?: string
  responseStatus?: number
}
```

---

## 3. 任务卡 (T174)

| T-NN | 标题 | 估时 |
|------|------|------|
| T174-1 | OAuth 2.0 授权 | 0.5d |
| T174-2 | Webhook 投递 + 重试 | 0.25d |
| T174-3 | Node.js SDK | 0.25d |

**总计**: 1 天

---

## 4. Champion 督导
- E44 周技术总监 (API 设计)
- E43 张区域总监 (合作伙伴)

---

## 5. 关键决策待定
1. **OAuth 流程**: Authorization Code / Client Credentials?
2. **Webhook 重试**: 指数退避策略?
3. **API 版本**: URL 路径 (/v1/) vs Header?
4. **SDK 语言优先级**: Node.js / Python / Go?
5. **Marketplace**: 是否需要审核机制?

---

> 🦞 **"Phase-44 开放 API = P2 智能化第 4 步 = 生态扩张"**---

## V3 Decision Lock · 2026-06-27 22:37 CST

### D1 Auth: API Key + JWT (hybrid)
- API Key: long-lived (server-to-server)
- JWT: short-lived (web/mobile clients)
- OAuth 2.0: optional for 3rd party apps

### D2 Rate Limit: Token bucket per API key
- Bucket: 1000 req/min default (per key)
- Burst: 100 req/sec allowed
- Headers: X-RateLimit-Remaining, X-RateLimit-Reset
- 429 with Retry-After header

### D3 Webhook: HMAC-SHA256 signature
- Signing: HMAC-SHA256(secret, payload)
- Header: X-Signature: sha256=abc123...
- Verification: constant-time compare (timing attack safe)
- Replay protection: idempotency-key + 5min window

### D4 Retry: Exponential backoff + max 5
- Strategy: 1s, 2s, 4s, 8s, 16s (exponential)
- Max: 5 attempts
- Success criteria: 2xx response
- Failure: mark webhook as failed, alert ops

### D5 Sandbox: Isolated tenant with mock data
- Auto-create: sandbox-{tenantId}
- Mock data: pre-seeded products + orders
- Reset: daily cron regenerates mock
- Quota: 100 req/min (lower than prod)

### D6 SDK Generation: OpenAPI 3.0 + auto-gen
- Source: OpenAPI 3.0 spec (TypeScript source)
- Generator: openapi-generator (TS/Java/Python/Go)
- Publish: npm + Maven Central + PyPI
- Version: semver aligned with API version

### D7 API Versioning: URL path + Sunset header
- URL: /api/v1/, /api/v2/, /api/v3/
- Deprecation: Sunset header + 6-month notice
- Support: latest + previous (2 versions)

### D8 Developer Portal: docs + sandbox + status
- Docs: auto-generated from OpenAPI
- Sandbox: same URL with X-Sandbox: true header
- Status: statuspage.io integration
- Forum: Discourse for community Q&A

---

## Current Status

Expected delta:
- New files: 9 (openapi-spec, api-key-manager, rate-limiter, jwt-issuer, webhook-signer, retry-handler, sandbox-isolation, sdk-generator, dev-portal)
- Modified: 4 (Prisma +2 tables, app.module, docs-site, status page)
- Tests: 28+ assertions (HMAC signing, rate limit math, retry exponential, sandbox isolation, version routing)

> Phase-44 = Open API = ecosystem + integration foundation