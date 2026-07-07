# 反模式 v4 · Idempotency Key Pattern

> 🦞 **"T168 = Payment + Refund + Idempotency Key = 12-factor API 业务契约"**

## 背景

分布式系统中,**网络重试** + **客户端重复提交** 是常见场景。如果服务端不做幂等保护,会导致:
- 重复扣款 (用户付了 2 次)
- 重复发货 (订单处理 2 次)
- 重复发短信/邮件 (浪费资源 + 用户骚扰)

**反模式**: 不使用幂等键 → 业务事故

**正确模式**: 客户端生成 idempotencyKey → 服务端强制唯一 → 同 key 重复请求返回原结果

---

## 8 个反模式

### 反模式 1: 没有 idempotencyKey

```typescript
// ❌ 反模式
async function createPayment(input) {
  // 没有 idempotencyKey, 客户端重试会创建多个 Payment
  return db.payments.insert(input)
}
```

**问题**:
- 网络抖动 → 客户端重试 → 创建 2 个 Payment → 双重扣款
- 用户点 2 次提交按钮 → 创建 2 个 Payment

**修复**:
```typescript
// ✅ 正确模式
async function createPayment(input: { idempotencyKey: string }) {
  if (!input.idempotencyKey) throw new BadRequest('idempotencyKey required')
  const existing = await this.findByIdempotencyKey(input.idempotencyKey)
  if (existing) return existing  // 复用
  return db.payments.insert(input)
}
```

---

### 反模式 2: idempotencyKey 不强制

```typescript
// ❌ 反模式
async function createPayment(input) {
  // 可选字段, 客户端可能不传
  if (input.idempotencyKey) {
    const existing = await this.findByIdempotencyKey(input.idempotencyKey)
    if (existing) return existing
  }
  return db.payments.insert(input)
}
```

**问题**:
- 客户端忘记传 → 退化为无幂等保护
- 黑客故意不传 → 重复扣款

**修复**:
```typescript
// ✅ 正确模式
async function createPayment(input: { idempotencyKey: string }) {
  if (!input.idempotencyKey || input.idempotencyKey.length < 8) {
    throw new BadRequest('idempotencyKey required (min 8 chars)')
  }
  // ...
}
```

---

### 反模式 3: 幂等键不区分租户

```typescript
// ❌ 反模式
async function createPayment(input) {
  const existing = await db.payments.findOne({ idempotencyKey: input.idempotencyKey })
  // ...
}
```

**问题**:
- 租户 A 用 key="abc123" 创建了 Payment
- 租户 B 用 **相同** key="abc123" 创建 → 错误复用租户 A 的 Payment
- 跨租户数据泄露 (反模式 v4 cross-tenant-data-leak)

**修复**:
```typescript
// ✅ 正确模式
async function createPayment(input) {
  const indexKey = `${input.tenantId}:${input.idempotencyKey}`
  const existing = await this.findByIndex(indexKey)
  if (existing) return existing
  // ...
}
```

---

### 反模式 4: 幂等键复用返回旧数据 (race condition)

```typescript
// ❌ 反模式
async function createPayment(input) {
  // 先 find → 后 insert (TOCTOU race)
  const existing = await this.findByIdempotencyKey(input.tenantId, input.idempotencyKey)
  if (existing) return existing
  // 2 个并发请求都通过了 find, 都执行 insert
  return db.payments.insert(input)
}
```

**问题**:
- 2 个并发请求都通过 find 检查
- 都执行 insert → 数据库 UNIQUE constraint 报错 (500)

**修复**:
```typescript
// ✅ 正确模式 (DB UNIQUE INDEX 兜底)
CREATE UNIQUE INDEX idx_payment_tenant_idempotency
  ON payments (tenant_id, idempotency_key);

// 服务端 INSERT 后捕获 unique violation
async function createPayment(input) {
  try {
    return await db.payments.insert(input)
  } catch (err) {
    if (err.code === 'UNIQUE_VIOLATION') {
      return await this.findByIdempotencyKey(input.tenantId, input.idempotencyKey)
    }
    throw err
  }
}
```

---

### 反模式 5: 幂等键过期时间无限

```typescript
// ❌ 反模式
async function createPayment(input) {
  const existing = await this.findByIdempotencyKey(input.tenantId, input.idempotencyKey)
  if (existing) return existing
  // 永久保留 idempotencyKey → DB 越来越大
}
```

**问题**:
- 幂等键永不删除 → DB 累积 → 性能下降
- 安全审计: 旧 key 仍可被复用 (即使原业务已结束)

**修复**:
```typescript
// ✅ 正确模式 (24h TTL)
async function createPayment(input) {
  const existing = await this.findByIdempotencyKey(input.tenantId, input.idempotencyKey)
  if (existing) {
    // 24h 内的请求复用
    if (Date.now() - existing.createdAt < 24 * 3600 * 1000) {
      return existing
    }
  }
  return db.payments.insert(input)
}

// Cron 每日清理 > 24h 的 idempotencyKey
cron.daily('cleanup-idempotency-keys', () => {
  db.idempotencyKeys.deleteMany({ createdAt: { $lt: Date.now() - 24 * 3600 * 1000 } })
})
```

---

### 反模式 6: 幂等键用于变更操作 (PUT/DELETE)

```typescript
// ❌ 反模式
async function updatePayment(input: { id, idempotencyKey, patch }) {
  // PUT 操作不应该用 idempotencyKey 防御重复 (HTTP PUT 本身幂等)
  // 反模式: 把 idempotencyKey 强加给所有 PUT
  const existing = await this.findByIdempotencyKey(input.idempotencyKey)
  if (existing) return existing  // 错误! PUT 应返回最新状态
  return db.payments.update(input.id, input.patch)
}
```

**问题**:
- HTTP PUT 本身幂等 (同 patch 多次执行结果一致)
- 强制 idempotencyKey → 增加复杂度, 无业务价值

**修复**:
```typescript
// ✅ 正确模式 (idempotencyKey 仅用于创建)
async function updatePayment(input: { id, version, patch }) {
  // 用 version 乐观锁 (反模式 v4 optimistic-lock-pattern)
  if (input.version !== current.version) throw new ConflictException('version mismatch')
  return db.payments.update(input.id, input.patch)
}
```

---

### 反模式 7: 幂等键不写入审计

```typescript
// ❌ 反模式
async function createPayment(input) {
  const existing = await this.findByIdempotencyKey(input.tenantId, input.idempotencyKey)
  if (existing) {
    return existing
    // 缺少审计: 不知道有重复请求被抑制
  }
  return db.payments.insert(input)
}
```

**问题**:
- 业务事故排查: 不知道为何同一 key 出现 2 次
- 安全审计: 无法识别异常请求模式 (DDos? 黑客?)

**修复**:
```typescript
// ✅ 正确模式
async function createPayment(input) {
  const existing = await this.findByIdempotencyKey(input.tenantId, input.idempotencyKey)
  if (existing) {
    // 写审计: 标记 IDEMPOTENT_REUSE
    this.writeAudit(existing.id, input.tenantId, 'IDEMPOTENT_REUSE', existing.status, existing.status, 'system', `reuse key ${input.idempotencyKey}`)
    return existing
  }
  return db.payments.insert(input)
}
```

---

### 反模式 8: 幂等键客户端不安全生成

```typescript
// ❌ 反模式 (前端)
const idempotencyKey = `${Date.now()}-${Math.random()}`  // 可预测

// 后端
async function createPayment(input) {
  // 黑客可猜测 key → 复用别人的 Payment
}
```

**问题**:
- `Date.now()` 可预测 → 黑客可猜测
- `Math.random()` 不够随机
- 黑客可构造重复请求复用合法 Payment

**修复**:
```typescript
// ✅ 正确模式 (前端)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
const idempotencyKey = generateUUID()  // UUID v4 (128-bit 随机)

// ✅ 正确模式 (后端)
// 服务端可选用更安全的 crypto.randomUUID() (Node 14.17+)
const idempotencyKey = crypto.randomUUID()
```

---

## 8 个实施清单

### ✅ 清单 1: 服务端强制 idempotencyKey
- [ ] DTO 字段标 `@IsNotEmpty()` + `@MinLength(8)`
- [ ] 缺失/过短 → 抛 BadRequestException

### ✅ 清单 2: (tenantId, idempotencyKey) 联合唯一索引
- [ ] DB: `CREATE UNIQUE INDEX idx_payment_tenant_idempotency ON payments (tenant_id, idempotency_key)`
- [ ] 服务端: try/catch UNIQUE_VIOLATION → findByIdempotencyKey 兜底

### ✅ 清单 3: 客户端生成 UUID (不依赖服务端)
- [ ] 前端: `crypto.randomUUID()` 或 UUID v4 库
- [ ] 失败重试使用**相同** key (不要重新生成)

### ✅ 清单 4: 跨租户隔离
- [ ] index key 包含 tenantId: `${tenantId}:${idempotencyKey}`
- [ ] 反模式 v4 cross-tenant-data-leak 防御

### ✅ 清单 5: TTL 过期清理
- [ ] 24h TTL (业务标准)
- [ ] Cron 每日清理 > 24h 的 idempotencyKey 索引

### ✅ 清单 6: 审计 IDEMPOTENT_REUSE
- [ ] 复用时写入 audit log (action='IDEMPOTENT_REUSE')
- [ ] 用于事故排查 + 异常检测

### ✅ 清单 7: 仅用于创建操作 (POST)
- [ ] POST /payments 用 idempotencyKey
- [ ] PUT /payments/:id 用 version (乐观锁, 不是 idempotencyKey)
- [ ] DELETE 不需要 (本身幂等)

### ✅ 清单 8: 文档化客户端 retry 策略
- [ ] README 写明: "客户端 retry 时**保持 idempotencyKey 不变**"
- [ ] 防止前端每次 retry 重新生成 key (退化为无幂等)

---

## T168 应用

```typescript
// ✅ T168 FinancePaymentService.create()
create(input: CreatePaymentInput): Payment {
  if (!input.idempotencyKey || input.idempotencyKey.length < 8) {
    throw new BadRequestException('idempotencyKey required (min 8 chars)')
  }
  const indexKey = `${input.tenantId}:${input.idempotencyKey}`
  const existingId = this.idempotencyIndex.get(indexKey)
  if (existingId) {
    const existing = this.payments.get(existingId)!
    this.writePaymentAudit(existingId, input.tenantId, 'IDEMPOTENT_REUSE', existing.status, existing.status, 'system', `reuse key ${input.idempotencyKey}`)
    return { ...existing }
  }
  // ...
}
```

## 测试覆盖

- IDEM-1: 同 (tenantId, idempotencyKey) 重复创建 → 返回原 Payment ✅
- IDEM-2: 不同 idempotencyKey 创建独立 Payment ✅
- IDEM-3: 幂等键长度 < 8 抛 BadRequestException ✅

## 参考

- [Stripe API · Idempotent Requests](https://stripe.com/docs/api/idempotent_requests)
- [12-Factor App · API 契约](https://12factor.net/)
- 反模式库 v4: idempotency-key-pattern.md

---

> 🏆 **"幂等键 = 12-factor API 的基石 = 防止重复扣款的唯一武器"**