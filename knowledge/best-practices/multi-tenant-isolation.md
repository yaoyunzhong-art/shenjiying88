# Best Practice · Multi-Tenant Isolation (多租户隔离规范)

> 创建: 2026-06-26 · Pulse-68 Day 2 后台
> 强制: 🔴 P0 (合规 + 安全)
> 来源: phase-15e registerPersistent + phase-16 inventory + DR-001 multi-tenant

---

## 1. 🎯 目标

确保 SaaS 多租户隔离 100% 可靠:
- ✅ **数据隔离**:租户 A 永远看不到租户 B 的数据
- ✅ **配额隔离**:租户 A 的配额不影响租户 B
- ✅ **性能隔离**:租户 A 的慢查询不影响租户 B
- ✅ **审计追溯**:每个操作可追溯到具体租户

---

## 2. 🚨 必须避免的血案 (P0 反模式)

### 2.1 反例 1: 跨租户数据泄漏

```typescript
// ❌ 反例: findById 没有 tenantId 校验
async findById(id: string): Promise<Member | null> {
  return this.memberRepo.findOne({ where: { id } })  // 🚨 任意租户可访问!
}

// ❌ 反例: tenantId 仅在 WHERE 中,不在 token 校验中
async list(tenantId: string): Promise<Member[]> {
  return this.memberRepo.find({ where: { tenantId } })  // 🚨 tenantId 来自用户输入,未校验
}

// ✅ 正确: token.tenantId + database where 双重校验
async list(auth: RequestAuth): Promise<Member[]> {
  // 1. token 必须包含 tenantId
  const tenantId = auth.tenantId
  if (!tenantId) throw new UnauthorizedException('missing tenant context')

  // 2. 查询时强制 tenantId (TypeORM 自动注入)
  return this.memberRepo.find({ where: { tenantId } })
}
```

### 2.2 反例 2: 配额未隔离

```typescript
// ❌ 反例: 全局配额 (所有租户共享)
async createCoupon() {
  if (this.totalCoupons >= 1_000_000) throw new Error('quota exceeded')
  // 🚨 租户 A 用完,租户 B 也无法创建!
}

// ✅ 正确: 按 tenantId 隔离配额
async createCoupon(tenantId: string) {
  await this.quotaService.assertCanWriteResource(tenantId, QuotaResourceKind.Coupon)
  // tenantId 维度隔离
}
```

### 2.3 反例 3: 缓存 key 未隔离

```typescript
// ❌ 反例: 缓存 key 缺 tenantId
const cacheKey = `member:${memberId}`  // 🚨 跨租户数据冲突

// ✅ 正确: cacheKey 含 tenantId
const cacheKey = `tenant:${tenantId}:member:${memberId}`
```

### 2.4 反例 4: 异步任务 tenantId 传递丢失

```typescript
// ❌ 反例: BullMQ job 缺 tenantId
@Process('member-events')
async onMemberRegistered(job: Job) {
  // job.data 没 tenantId → 下游 service 无法识别租户
  await this.couponService.grantNewUserCoupon(job.data.memberId)
}

// ✅ 正确: job.data 必须含 tenantId
@Process('member-events')
async onMemberRegistered(job: Job<MemberRegisteredEvent>) {
  await this.couponService.grantNewUserCoupon(job.data.tenantId, job.data.memberId)
}
```

---

## 3. 📐 4 层防护

### 3.1 Layer 1: 身份认证 (Authentication)

```typescript
// JWT 必须包含 tenantId
interface JWTPayload {
  sub: string       // userId
  tenantId: string  // 租户 ID (强制)
  roles: string[]
  exp: number
}

// ✅ Guard 校验 tenantId 存在
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    if (!req.user?.tenantId) {
      throw new UnauthorizedException('JWT missing tenantId')
    }
    return super.canActivate(context)
  }
}
```

### 3.2 Layer 2: 业务入口守卫 (Service Entry Guard)

```typescript
// ✅ 每个 service 入口校验
async registerPersistent(auth: RequestAuth, dto: RegisterDto) {
  // 1. tenantId 一致性 (URL/query/body/header 必须匹配 JWT)
  if (dto.tenantId !== auth.tenantId) {
    throw new ForbiddenException(`tenantId mismatch: token=${auth.tenantId} dto=${dto.tenantId}`)
  }

  // 2. lifecycle 检查 (P0-004 阶段补全)
  await this.lifecycle.assertCanWrite(auth.tenantId, 'member')

  // 3. quota 守卫
  await this.quotaService.assertCanWriteResource(auth.tenantId, QuotaResourceKind.Member)

  // ... 业务逻辑
}
```

### 3.3 Layer 3: 数据库 WHERE (Query-level Isolation)

```typescript
// ✅ TypeORM 自定义 Repository,自动注入 tenantId
@Injectable()
export class MemberScopedRepository {
  constructor(
    @InjectRepository(Member)
    private readonly repo: Repository<Member>,
    private readonly tenantContext: TenantContextService
  ) {}

  async findById(id: string): Promise<Member | null> {
    const tenantId = this.tenantContext.required()  // 从 context 强制获取
    return this.repo.findOne({ where: { id, tenantId } })
  }

  async findAll(options: FindManyOptions<Member> = {}): Promise<Member[]> {
    const tenantId = this.tenantContext.required()
    return this.repo.find({ ...options, where: { ...options.where, tenantId } })
  }
}

// ✅ 或使用 TypeORM Custom DataSource 拦截器
@EventSubscriber()
export class TenantIsolationSubscriber implements EntitySubscriberInterface {
  async beforeInsert(event: InsertEvent<any>): Promise<void> {
    if (event.entity.tenantId === undefined) {
      throw new Error('entity missing tenantId')
    }
  }
}
```

### 3.4 Layer 4: 审计日志 (Audit Trail)

```typescript
// ✅ 所有跨租户操作必须审计
async registerPersistent(auth: RequestAuth, dto: RegisterDto) {
  await this.auditLog.record({
    action: 'member.register',
    tenantId: auth.tenantId,
    actor: auth.userId,
    target: dto.email,
    timestamp: new Date().toISOString(),
    requestId: this.requestContext.getRequestId(),
  })

  // ... 业务逻辑
}
```

---

## 4. 📊 配额隔离 (QuotaResourceKind)

```typescript
// 8 种资源 (Phase-15E 扩展)
export enum QuotaResourceKind {
  Brand = 'brand',
  Store = 'store',
  Member = 'member',
  Campaign = 'campaign',
  Product = 'product',
  Invoice = 'invoice',
  ApiCall = 'api_call',
  Coupon = 'coupon',
}

// 每个 tenant 独立配额 (PlanTier: Starter / Pro / Enterprise)
const QUOTA_PLAN: Record<PlanTier, Record<QuotaResourceKind, number>> = {
  Starter: {
    [QuotaResourceKind.Brand]: 1,
    [QuotaResourceKind.Store]: 5,
    [QuotaResourceKind.Member]: 1000,
    [QuotaResourceKind.Campaign]: 10,
    [QuotaResourceKind.Product]: 100,
    [QuotaResourceKind.Invoice]: 500,
    [QuotaResourceKind.ApiCall]: 10_000,
    [QuotaResourceKind.Coupon]: 100,
  },
  // ... Pro / Enterprise
}
```

---

## 5. 🔍 测试策略

### 5.1 跨租户访问拒绝测试

```typescript
it('租户 A 无法访问租户 B 的资源', async () => {
  // 1. 租户 B 创建资源
  const tenantBToken = await createTenantBToken()
  const memberB = await request(app)
    .post('/members')
    .set('Authorization', `Bearer ${tenantBToken}`)
    .send({ name: 'B-member', ... })
    .expect(201)

  // 2. 租户 A 尝试访问
  const tenantAToken = await createTenantAToken()
  await request(app)
    .get(`/members/${memberB.body.id}`)
    .set('Authorization', `Bearer ${tenantAToken}`)
    .expect(404)  // ✅ 应该返回 404,不是 403 (避免泄露存在性)
})
```

### 5.2 配额独立测试

```typescript
it('租户 A 配额耗尽不影响租户 B', async () => {
  // 租户 A 用完全部 1000 配额
  for (let i = 0; i < 1000; i++) {
    await memberService.register(tenantA, { ... })
  }
  await expect(memberService.register(tenantA, { ... })).rejects.toThrow(QuotaExceededError)

  // 租户 B 仍可创建
  await memberService.register(tenantB, { ... })  // ✅ OK
})
```

### 5.3 缓存隔离测试

```typescript
it('缓存 key 含 tenantId,跨租户不串数据', async () => {
  await cache.set(`tenant:A:member:${idA}`, memberA)
  expect(await cache.get(`tenant:B:member:${idA}`)).toBeNull()
})
```

---

## 6. 🔒 Checklist 上线前必查

- [ ] 所有 Service 入口校验 `auth.tenantId`
- [ ] 所有数据库查询 WHERE 含 `tenantId`
- [ ] 所有缓存 key 含 `tenant:${tenantId}:` 前缀
- [ ] 所有 BullMQ job.data 含 `tenantId`
- [ ] 所有事件 payload 顶层含 `tenantId`
- [ ] 所有跨租户操作有审计日志
- [ ] 所有 service 通过 `lifecycle.assertCanWrite(tenantId, ...)`
- [ ] 所有 service 通过 `quotaService.assertCanWriteResource(tenantId, ...)`
- [ ] 单元测试覆盖跨租户访问拒绝 (404 而非 403)
- [ ] 集成测试覆盖配额独立
- [ ] 监控告警: 跨租户访问尝试 (P0)

---

## 7. 📊 监控指标

```typescript
// 必须监控
metrics.counter('tenant.access.denied', { reason: 'mismatch', tenant: auth.tenantId })
metrics.counter('tenant.quota.exceeded', { resource: 'member', tenant: auth.tenantId })
metrics.histogram('tenant.query.duration_ms', { tenant: auth.tenantId, isolation: 'scoped' })

// 告警
// - 跨租户访问尝试 > 0 → P0 告警 (可能是攻击)
// - 某租户配额耗尽率 > 50% → P2 告警 (建议升级 Plan)
// - 某租户查询 P95 > 1s → P3 告警 (性能问题)
```

---

## 8. 🔗 关联文档

- [knowledge/decision-records/DR-001-multi-tenant-guard.md](../decision-records/DR-001-multi-tenant-guard.md) · 多租户决策
- [knowledge/patterns/quota-guard.md](../patterns/quota-guard.md) · Quota 守卫
- [knowledge/patterns/event-driven-architecture.md](../patterns/event-driven-architecture.md) · 事件 tenant 传递
- [debt.md P0-004](../../debt.md) · 多租户债务

---

> 由 main agent 创建 · Pulse-68 Day 2 后台
> 强制: 🔴 P0 所有服务必须遵守 (Phase-15E 起强制)
> 评审: Champion (待 R8 通过)
