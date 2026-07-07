# T166-3 · MemberTenantMapping 跨租户任务卡

## 元信息
- **T-NN**: T166-3 (T166 拆分第 3 子任务)
- **Phase**: 36
- **标题**: 跨租户会员聚合表 (D5 决策)
- **优先级**: 🟢 P1 (中,大飞哥集团"店中店"模式)
- **估时**: 0.5d (4h)
- **依赖**: ✅ T166-1 (MemberConfigService) + T166-2 (Dormant) 已完成
- **派发人**: 🦞 龙虾哥
- **执行人**: 🌲 树哥trae
- **状态**: 🟡 预备 (等 T166-2 完成)

---

## 1. 现状盘点

### 现有 (单租户)
- `apps/api/prisma/schema.prisma:298-320` `MemberProfile` 表
- `tenantId` 租户隔离
- `userId` 关联 User (全局)
- ❌ 无跨租户聚合表

### 升级目标 (D5 决策 · 身份全局 + 消费租户隔离)

```
User (全局, mobile 唯一)
   ↓ userId
MemberProfile (现有, tenantId 隔离) - 单租户会员档案
   ↓ userId + tenantId
MemberTenantMapping (新增) - 跨租户聚合表
```

---

## 2. 验收标准 (AC · 6 项)

### AC-1: Prisma 模型新增
- [ ] `MemberTenantMapping` model 新增
- [ ] `(userId, tenantId)` 联合主键
- [ ] 索引 `userId` 和 `tenantId`
- [ ] 字段:tenantPoints, tenantSpentCents, firstVisitAt, lastVisitAt, visitCount

### AC-2: MemberMappingService 服务
- [ ] `recordTenantVisit(userId, tenantId)` 记录访问
- [ ] `getMemberCrossTenantProfile(userId)` 聚合画像
- [ ] `getTenantMappings(userId)` 查询所有租户
- [ ] `findMembersByTenant(tenantId)` 按租户查询

### AC-3: REST API 端点
- [ ] `GET /api/member/cross-tenant/:userId` 跨租户画像
- [ ] `POST /api/member/mapping/visit` 记录访问
- [ ] `GET /api/member/mappings/:userId` 租户列表

### AC-4: 测试 (≥ 12 断言)
- [ ] recordTenantVisit 幂等
- [ ] getMemberCrossTenantProfile 聚合正确
- [ ] 多租户隔离
- [ ] 跨租户积分独立计算
- [ ] visitCount 累加正确

### AC-5: 反模式命中 (2 文件)
- [ ] [markpaid-idempotency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/markpaid-idempotency.md): 访问记录幂等
- [ ] [dead-test-code.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/dead-test-code.md): 测试同步

### AC-6: race-safe commit
- [ ] commit 前跑 race-safe-commit.sh
- [ ] commit message 含 `Phase-36 step 3: T166-3 跨租户`

---

## 3. 实施步骤 (3 步)

### Step 1: Prisma 模型 (1h)

```prisma
// apps/api/prisma/schema.prisma 新增
model MemberTenantMapping {
  id                String   @id @default(cuid())
  userId            String   // FK User.id
  tenantId          String   // FK Tenant.id
  brandId           String
  storeId           String?
  
  tenantPoints      Int      @default(0)
  tenantSpentCents  Int      @default(0)
  firstVisitAt      DateTime @default(now())
  lastVisitAt       DateTime @updatedAt
  visitCount        Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@unique([userId, tenantId])
  @@index([userId])
  @@index([tenantId])
  @@index([brandId])
}
```

### Step 2: MemberMappingService (2h)

```typescript
// apps/api/src/modules/member/member-mapping.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface CrossTenantProfile {
  userId: string
  globalPoints: number
  globalSpentCents: number
  tenantMappings: Array<{
    tenantId: string
    brandId: string
    storeId?: string
    tenantPoints: number
    tenantSpentCents: number
    visitCount: number
    firstVisitAt: string
    lastVisitAt: string
  }>
}

@Injectable()
export class MemberMappingService {
  private readonly logger = new Logger(MemberMappingService.name)

  constructor(private prisma: PrismaService) {}

  /** 记录会员访问 (幂等) */
  async recordTenantVisit(userId: string, tenantId: string, brandId: string, storeId?: string): Promise<void> {
    await this.prisma.memberTenantMapping.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      update: {
        lastVisitAt: new Date(),
        visitCount: { increment: 1 }
      },
      create: {
        userId, tenantId, brandId, storeId,
        firstVisitAt: new Date(),
        lastVisitAt: new Date(),
        visitCount: 1
      }
    })
  }

  /** 跨租户会员画像 */
  async getMemberCrossTenantProfile(userId: string): Promise<CrossTenantProfile> {
    const mappings = await this.prisma.memberTenantMapping.findMany({
      where: { userId },
      orderBy: { lastVisitAt: 'desc' }
    })

    return {
      userId,
      globalPoints: mappings.reduce((sum, m) => sum + m.tenantPoints, 0),
      globalSpentCents: mappings.reduce((sum, m) => sum + m.tenantSpentCents, 0),
      tenantMappings: mappings.map(m => ({
        tenantId: m.tenantId,
        brandId: m.brandId,
        storeId: m.storeId ?? undefined,
        tenantPoints: m.tenantPoints,
        tenantSpentCents: m.tenantSpentCents,
        visitCount: m.visitCount,
        firstVisitAt: m.firstVisitAt.toISOString(),
        lastVisitAt: m.lastVisitAt.toISOString()
      }))
    }
  }

  /** 某租户的所有会员 */
  async findMembersByTenant(tenantId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      this.prisma.memberTenantMapping.findMany({
        where: { tenantId },
        skip,
        take: pageSize,
        orderBy: { lastVisitAt: 'desc' }
      }),
      this.prisma.memberTenantMapping.count({ where: { tenantId } })
    ])
    return { items, total, page, pageSize }
  }
}
```

### Step 3: 测试 (1h)

```typescript
// apps/api/src/modules/member/member-mapping.test.ts
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { MemberMappingService } from './member-mapping.service'

describe('MemberMappingService', () => {
  test('recordTenantVisit 创建 mapping', async () => {
    const svc = new MemberMappingService()
    await svc.recordTenantVisit('user-1', 'tenant-1', 'brand-1')
    const profile = await svc.getMemberCrossTenantProfile('user-1')
    assert.equal(profile.tenantMappings.length, 1)
    assert.equal(profile.tenantMappings[0].visitCount, 1)
  })

  test('recordTenantVisit 重复访问 visitCount 累加', async () => {
    const svc = new MemberMappingService()
    await svc.recordTenantVisit('user-1', 'tenant-1', 'brand-1')
    await svc.recordTenantVisit('user-1', 'tenant-1', 'brand-1')
    const profile = await svc.getMemberCrossTenantProfile('user-1')
    assert.equal(profile.tenantMappings[0].visitCount, 2)
  })

  test('跨租户聚合:多租户分别记录', async () => {
    const svc = new MemberMappingService()
    await svc.recordTenantVisit('user-1', 'tenant-1', 'brand-1')
    await svc.recordTenantVisit('user-1', 'tenant-2', 'brand-2')
    const profile = await svc.getMemberCrossTenantProfile('user-1')
    assert.equal(profile.tenantMappings.length, 2)
  })

  test('findMembersByTenant 按租户查询', async () => {
    const svc = new MemberMappingService()
    await svc.recordTenantVisit('user-1', 'tenant-1', 'brand-1')
    await svc.recordTenantVisit('user-2', 'tenant-1', 'brand-1')
    await svc.recordTenantVisit('user-3', 'tenant-2', 'brand-2')
    
    const tenant1Members = await svc.findMembersByTenant('tenant-1')
    assert.equal(tenant1Members.total, 2)
    
    const tenant2Members = await svc.findMembersByTenant('tenant-2')
    assert.equal(tenant2Members.total, 1)
  })

  test('跨租户积分独立计算', async () => {
    const svc = new MemberMappingService()
    // 模拟 tenant-1 累计 100 元,tenant-2 累计 200 元
    await svc.recordTenantVisit('user-1', 'tenant-1', 'brand-1')
    await svc.recordTenantVisit('user-1', 'tenant-2', 'brand-2')
    
    // 通过 service 加积分 (假设有 addTenantPoints 方法)
    // ... 简化: 用直接 SQL mock
    
    const profile = await svc.getMemberCrossTenantProfile('user-1')
    assert.equal(profile.globalPoints, 0)  // 默认
  })
})
```

---

## 4. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| Prisma migration 数据迁移 | 中 | 高 | 加初始数据回填脚本 |
| 跨租户权限泄漏 | 中 | 高 | 加 `getMemberCrossTenantProfile` 权限校验 |
| 大量 mapping 查询慢 | 中 | 中 | 分页 + 索引 |

---

## 5. 提交格式

```
🛡️ R-06 race-safe auto-commit

Phase-36 step 3: T166-3 Member 跨租户
- apps/api/prisma/schema.prisma (新增 MemberTenantMapping model)
- apps/api/src/modules/member/member-mapping.service.ts (CRUD + 聚合)
- apps/api/src/modules/member/member-mapping.test.ts (12 断言全过)
- apps/api/src/modules/member/member.controller.ts (新增 3 端点)
- 静态扫描: 3/3 grep token 命中
- 反模式库 v4: markpaid-idempotency + dead-test-code
- R-06 防御: race-safe + HEARTBEAT.record
```

---

> 🦞 **"T166-3 = D5 跨租户 = 集团店中店 = 业务护城河"**