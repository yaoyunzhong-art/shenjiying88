# 反模式库 v4 · feature-flags (功能开关)

> **创建时间**: 2026-06-27 22:25 CST (1h 冲刺 Part 4)
> **分类**: 工程效率 · 渐进式发布
> **目标读者**: 全栈工程师 + 产品经理

---

## 1. 为什么需要 Feature Flags

### 传统发布 vs FF 发布

**传统 (高风险)**:
1. 合并代码到 main → 全量上线 → 出问题 → 回滚 → 紧急修复

**FF 发布 (零风险)**:
1. 合并代码到 main → FF 默认 OFF → 选择性灰度 5% → 监控指标 → 10% → 50% → 100%
2. 出问题 → FF 一秒回滚 → 用户无感知
3. 同样代码可以在多个环境共存 (生产 + 灰度 + 测试)

---

## 2. ❌ 反模式 1: 硬编码 IF 判断

```typescript
// BAD: 硬编码布尔值,无法远程控制
const ENABLE_NEW_CHECKOUT = true  // 改一次要重新部署

async function checkout(order: Order) {
  if (ENABLE_NEW_CHECKOUT) {
    return newCheckoutFlow(order)
  }
  return legacyCheckoutFlow(order)
}
```

**问题**:
- 改一次 FF 状态要重新部署
- 不能按租户/用户/地区差异化开启
- 没有审计日志 (谁开/谁关)

### ✅ 最佳实践: FeatureFlagService

```typescript
// GOOD: 集中管理 + 远程配置 + 审计
@Injectable()
export class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map()

  isEnabled(flag: string, context?: FlagContext): boolean {
    const flagConfig = this.flags.get(flag)
    if (!flagConfig) return false
    return this.evaluate(flagConfig, context)
  }

  private evaluate(flag: FeatureFlag, ctx?: FlagContext): boolean {
    switch (flag.rolloutStrategy) {
      case 'ALL':
        return true
      case 'PERCENTAGE':
        return this.hashUserId(ctx?.userId) % 100 < flag.percentage
      case 'ALLOW_LIST':
        return flag.allowList?.includes(ctx?.userId) ?? false
      case 'SCOPE_MATCH':
        return this.matchScope(flag.scope, ctx)
      default:
        return false
    }
  }
}
```

---

## 3. ❌ 反模式 2: 没有清理策略

```typescript
// BAD: FF 上线 3 年后还在代码里
async function checkout(order: Order) {
  if (featureFlag.isEnabled('use-new-checkout-v2', ...)) {  // 3 年前的 FF
    return newCheckoutFlow(order)
  }
  return legacyCheckoutFlow(order)
}
```

**问题**:
- 技术债务累积
- 新人不知道 legacy 路径是否还在使用
- 增加代码复杂度

### ✅ 最佳实践: FF 生命周期管理

```typescript
// GOOD: FF + 过期时间 + 自动化清理
interface FeatureFlag {
  key: string
  rolloutStrategy: RolloutStrategy
  percentage?: number
  allowList?: string[]
  scope?: FlagScope
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  expiresAt: string  // 必填,例如 "2026-12-31"
  owner: string  // 负责人
  createdAt: string
  updatedAt: string
}

// cron 每周扫描
async function cleanupExpiredFlags() {
  const expired = await db.featureFlag.findMany({
    where: {
      expiresAt: { lt: new Date() },
      status: { not: 'ARCHIVED' }
    }
  })
  for (const flag of expired) {
    logger.warn({ flag: flag.key }, 'FF expired, auto-archive')
    await db.featureFlag.update({
      where: { id: flag.id },
      data: { status: 'ARCHIVED' }
    })
    await notifyOwner(flag.owner, `FF ${flag.key} 已过期自动归档`)
  }
}
```

---

## 4. 4 类发布策略

### ALL (全量发布)
```typescript
// 用于: 已稳定的核心功能
{ key: 'cashier-v2', rolloutStrategy: 'ALL' }
```

### PERCENTAGE (百分比灰度)
```typescript
// 用于: 新功能首次发布
{ key: 'ai-cs-v3', rolloutStrategy: 'PERCENTAGE', percentage: 5 }  // 5% 灰度

// 用户分桶: hash(userId) % 100,确保同一用户始终在同一桶
```

### ALLOW_LIST (白名单)
```typescript
// 用于: VIP 客户优先体验
{ key: 'new-dashboard',
  rolloutStrategy: 'ALLOW_LIST',
  allowList: ['tenant_001', 'tenant_002']  // 指定租户
}
```

### SCOPE_MATCH (范围匹配)
```typescript
// 用于: 按租户/品牌/地区/会员等级开启
{ key: 'platinum-features',
  rolloutStrategy: 'SCOPE_MATCH',
  scope: {
    tenantIds: ['t_1', 't_2'],
    memberLevels: ['PLATINUM', 'DIAMOND'],
    regions: ['CN-North']
  }
}
```

---

## 5. FF 数据模型

```prisma
model FeatureFlag {
  id              String           @id @default(cuid())
  key             String           @unique
  description     String?
  rolloutStrategy RolloutStrategy
  percentage      Int?
  allowList       String[]
  scope           Json?
  status          FeatureFlagStatus @default(DRAFT)
  expiresAt       DateTime
  owner           String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([status, expiresAt])
}

// 审计日志
model FeatureFlagAudit {
  id        String   @id @default(cuid())
  flagKey   String
  action    String   // 'enabled' / 'disabled' / 'percentage-changed' / 'allow-list-added'
  operatorId String
  beforeValue Json?
  afterValue  Json?
  reason     String?
  createdAt  DateTime @default(now())

  @@index([flagKey, createdAt])
}
```

---

## 6. API 设计

### 客户端 SDK (前端)

```typescript
// apps/admin-web/lib/feature-flags.ts
import { useFeatureFlag } from '@m5/feature-flags-sdk'

export function CheckoutButton() {
  const newCheckout = useFeatureFlag('checkout-v2', {
    tenantId: useTenant().id,
    userId: useUser().id
  })

  return newCheckout ? <NewCheckout /> : <LegacyCheckout />
}
```

### 服务端 (NestJS)

```typescript
// apps/api/src/feature-flag.guard.ts
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private flags: FeatureFlagService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest()
    const flag = req.routeData?.featureFlag
    if (!flag) return true

    const tenantCtx = req.tenantContext
    return this.flags.isEnabled(flag, {
      tenantId: tenantCtx.tenantId,
      userId: req.user?.id
    })
  }
}

// 使用
@Controller('api/v2/cashier')
@UseGuards(TenantGuard, FeatureFlagGuard)
export class CashierV2Controller {
  @Get('checkout')
  @FeatureFlag('checkout-v2')  // FF key 装饰器
  async checkout() { ... }
}
```

---

## 7. 灰度发布 SOP

### 阶段 1: DRAFT (内部测试)
- FF status = DRAFT
- 仅 owner + 内部租户可访问
- 时长: 1-2 天

### 阶段 2: ACTIVE 5% 灰度
- 监控指标:
  - 错误率 (失败/总数)
  - P99 延迟
  - 用户反馈 (NPS / 投诉)
- 时长: 24h
- 通过标准: 错误率 < 0.1%, P99 < 1s, 投诉 < 5 起

### 阶段 3: ACTIVE 25% → 50% → 100%
- 每阶段 24h 观察
- 任何指标异常 → 立即回滚 (FF OFF)

### 阶段 4: 全量后清理
- 7 天稳定后,移除代码中的 IF 分支
- 删除 FeatureFlag 配置
- 关闭 expiresAt 提醒

---

## 8. ❌ 反模式 3: FF 当 AB Test 用

```typescript
// BAD: 用 FF 做 AB Test,没有统计显著性
{ key: 'red-button',
  rolloutStrategy: 'PERCENTAGE',
  percentage: 50
}
```

**问题**: FF 是灰度发布工具,不是 AB Test!
- FF 没有对照组 (对照组 = OFF 路径)
- AB Test 需要 A/B/A 回流 (排除新奇效应)

### ✅ 区分场景

| 场景 | 工具 | 周期 |
|------|------|------|
| 新功能灰度 | Feature Flag | 7-30 天 |
| 转化率优化 | AB Test | 14-30 天 |
| 算法对比 | 多臂老虎机 (Bandit) | 持续 |
| 实验管理 | GrowthBook / Optimizely | 持续 |

---

## 9. 实战检查清单

新 FF 上线前:

- [ ] key 命名规范 (模块-功能-版本,例如 `cashier-checkout-v2`)
- [ ] 描述文档 (用途 / 负责人 / 灰度计划)
- [ ] expiresAt 必填 (建议 90 天)
- [ ] owner 必填 (DevOps 告警通知)
- [ ] 至少 2 种 rolloutStrategy (ALL 是 fallback)
- [ ] 客户端 SDK + 服务端 Guard
- [ ] 审计日志 (谁开/谁关/何时)
- [ ] 监控埋点 (开启率/转化率)
- [ ] 清理 SOP (过期自动归档)

---

## 10. 神机营落地

**工具选型**:
- 自研 (轻量级,适合 < 50 FF)
- Unleash (开源,适合中大型)
- LaunchDarkly (SaaS,功能丰富)

**集成点**:
- Prisma FeatureFlag + FeatureFlagAudit 表
- FeatureFlagService (服务端)
- FeatureFlagGuard (NestJS)
- useFeatureFlag React Hook (前端)
- 每周 cron 自动清理过期 FF

---

## 11. 关联反模式

- [event-bus-design.md](event-bus-design.md): FF 状态变更事件
- [observability.md](observability.md): FF 命中率指标
- [performance-optimization.md](performance-optimization.md): FF 评估开销

---

> 🦞 **"Feature Flag = 渐进式发布的银弹 = 让生产事故成为过去式"**
> **"没有 FF = 没有后悔药 = 每次发布都是赌博"**