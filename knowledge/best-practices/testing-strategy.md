# Best Practice · Testing Strategy (测试策略)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🟡 P1 (CI 强制)
> 来源: Vitest + NestJS Testing + Phase-15+ 实战

---

## 1. 🎯 目标

测试金字塔:
```
        /\
       /  \      E2E (10%) - 慢 / 关键路径
      /────\
     /      \    集成 (20%) - 跨模块
    /────────\
   /          \  单元 (70%) - 快 / 覆盖广
  /────────────\
```

---

## 2. 📐 测试类型

### 2.1 单元测试 (vitest)

```typescript
// apps/api/src/modules/coupon/coupon.service.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'

describe('CouponService', () => {
  let service: CouponService
  let mockRepo: MockType<Repository<Coupon>>

  beforeEach(() => {
    mockRepo = createMockRepository()
    service = new CouponService(mockRepo, mockQuotaService, mockEventBus)
  })

  describe('redeem', () => {
    it('正常核销', async () => {
      mockRepo.findOne.mockResolvedValue({ code: 'C1', status: 'active', ... })
      const result = await service.redeem('C1', { tenantId: 'A', memberId: 'M1' })
      expect(result.status).toBe('completed')
    })

    it('已使用抛错', async () => {
      mockRepo.findOne.mockResolvedValue({ code: 'C1', status: 'used', ... })
      await expect(service.redeem('C1', { tenantId: 'A', memberId: 'M1' }))
        .rejects.toThrow(QuotaExceededException)
    })

    it('跨租户访问抛错', async () => {
      mockRepo.findOne.mockResolvedValue(null)  // tenantId 不匹配
      await expect(service.redeem('C1', { tenantId: 'A', memberId: 'M1' }))
        .rejects.toThrow(NotFoundException)
    })
  })
})
```

### 2.2 集成测试 (NestJS TestingModule)

```typescript
// apps/api/src/modules/member/member.integration.spec.ts
describe('MemberService Integration', () => {
  let app: TestingModule
  let service: MemberService
  let repo: Repository<Member>

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ type: 'sqlite', database: ':memory:', entities: [Member] }),
        TypeOrmModule.forFeature([Member]),
        TenantModule,
        QuotaModule,
      ],
      providers: [MemberService],
    }).compile()

    app = moduleRef
    service = moduleRef.get(MemberService)
    repo = moduleRef.get(getRepositoryToken(Member))

    await repo.save([{ tenantId: 'A', email: 'a@x.com' }, { tenantId: 'B', email: 'b@x.com' }])
  })

  it('创建 + 查询', async () => {
    const member = await service.register({ tenantId: 'A', email: 'c@x.com', name: 'C' })
    expect(member.id).toBeDefined()

    const found = await service.findById('A', member.id)
    expect(found.email).toBe('c@x.com')
  })
})
```

### 2.3 E2E 测试 (supertest)

```typescript
// apps/api/test/member.e2e.test.ts
describe('Member API (e2e)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getRepositoryToken(Member)).useValue(inMemoryRepo)
      .compile()
    app = moduleRef.createNestApplication()
    await app.init()
    authToken = await createAuthToken('tenant-A')
  })

  it('POST /api/v1/members 创建', () => {
    return request(app.getHttpServer())
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'new@x.com', name: 'New' })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.id).toBeDefined()
        expect(res.body.data.email).toBe('new@x.com')
      })
  })

  it('GET /api/v1/members 列表', () => {
    return request(app.getHttpServer())
      .get('/api/v1/members?page=1&pageSize=10')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array)
        expect(res.body.pagination).toBeDefined()
      })
  })
})
```

---

## 3. 📐 覆盖率要求

| 模块类型 | 行覆盖 | 分支覆盖 |
|---|---|---|
| 业务核心 (coupon / order / points) | ≥80% | ≥70% |
| 工具类 (util / common) | ≥90% | ≥80% |
| Controller (thin) | ≥50% | ≥40% |
| 整体 (Phase-15E+) | ≥70% | ≥60% |

## 3b. 📐 跨模块 E2E 覆盖要求 (Pulse-Nightly-07 更新)

| 维度 | 标准 |
|------|------|
| 链数量 | ≥15 条 |
| 子测试/链 | ≥3 (positive/negative/boundary) |
| apps 覆盖 | 6/6 全覆盖 |
| 反向链路 | ≥5 条 (非 admin-web 起点) |
| 并发场景 | ≥1 条（多渠道同时操作） |
| 国际化深度 | ≥6 locale |
| 大数据量+幂等 | ≥1 条（万级数据+幂等性验证） |
| 角色覆盖 | ≥10 种 |
| 状态机验证 | ≥2 种业务状态机 |

**每条链必须包含**: `reset*Store()` 清理隔离、唯一 requestId 幂等校验、正例+反例+边界。

---

## 4. 📐 测试命名

```typescript
// ✅ describe + it 中文清晰
describe('CouponService.redeem', () => {
  it('正常核销后状态变为 completed', ...)
  it('已使用抛 QuotaExceededException', ...)
  it('跨租户访问抛 NotFoundException', ...)
})

// ❌ 反例: 命名不清
describe('test', () => {
  it('works', () => {})
})
```

---

## 5. ✅ 必须遵守

- [ ] 每个 Service 有 spec 文件
- [ ] 边界条件覆盖 (null / empty / max)
- [ ] 异常路径覆盖 (mock 抛错)
- [ ] 集成测试用 in-memory SQLite / pg-mem
- [ ] E2E 测试用 supertest + 真实 module
- [ ] CI 覆盖率门禁

---

## 6. ❌ 反模式

- ❌ 只测 happy path
- ❌ mock 所有 (测试等于无)
- ❌ 共享状态 (测试顺序依赖)
- ❌ sleep / setTimeout (改用 vi.useFakeTimers)

---

## 7. 🔗 关联

- [e2e-testing.md](./e2e-testing.md) · E2E 详细
- [code-review-checklist.md](./code-review-checklist.md) · 测试要求
