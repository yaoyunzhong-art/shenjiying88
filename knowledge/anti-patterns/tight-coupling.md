# Anti-Pattern · Tight Coupling (紧耦合)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 严重度: 🟠 P1
> 来源: Phase-15+ 模块依赖监控

---

## 1. 🚨 反模式

模块间高度耦合:
- ❌ 直接 import 另一个模块的内部类
- ❌ 模块间相互调用链 > 3
- ❌ 修改模块 A 必须修改 B / C / D
- ❌ 单元测试需 mock 大量依赖

---

## 2. ❌ 反例

```typescript
// ❌ 反例 1: 直接访问另一个模块内部
@Injectable()
export class CouponService {
  async redeem(code: string) {
    // 直接 import Member 内部 Entity!
    const member = await this.memberRepo.findOne(...)  // ⚠️ 耦合!
    // 直接调用 Member 内部方法
    const points = await this.memberService.calculatePoints(...)
  }
}

// ❌ 反例 2: 模块循环依赖
// coupon.module.ts imports member.module.ts
// member.module.ts imports coupon.module.ts  // ⚠️ 循环!
```

---

## 3. ✅ 正确做法: 解耦

### 3.1 方案 1: 事件驱动 (推荐)

```typescript
// ✅ Service 只发事件,不知道谁订阅
@Injectable()
export class CouponService {
  async redeem(code: string) {
    const redemption = await this.redemptionRepo.save(...)
    // 发布事件,其他模块自己订阅
    await this.eventBus.emit('coupon.redeemed', { tenantId, couponCode, memberId })
    return redemption
  }
}

// Member 模块订阅
@OnEvent('coupon.redeemed')
async handleCouponRedeemed(event) {
  // 加积分
  await this.pointsService.award(...)
}
```

### 3.2 方案 2: 接口抽象

```typescript
// ✅ Coupon 模块只依赖接口
export interface MemberLookupPort {
  findById(tenantId: string, memberId: string): Promise<Member | null>
}

@Injectable()
export class CouponService {
  constructor(
    @Inject('MemberLookupPort') private readonly memberLookup: MemberLookupPort,  // ✅ 接口
  ) {}
}

// Member 模块实现 Port
@Injectable()
export class MemberModuleAdapter implements MemberLookupPort {
  async findById(tenantId: string, memberId: string) {
    return this.memberRepo.findOne({ where: { id: memberId, tenantId } })
  }
}
```

### 3.3 方案 3: 共享 Kernel

```typescript
// ✅ 共享 kernel (Domain Types / Errors / Events)
// packages/kernel/src/types.ts
export interface MemberRedeemedEvent {
  eventId: string
  tenantId: string
  memberId: string
  couponCode: string
  discountAmount: number
}
```

---

## 4. 📐 依赖方向

```
        Controller
            ↓
        Service (本模块)
            ↓
  ┌──── Repository ────┐
  ↓         ↓         ↓
DB      EventBus    Interface Port
  ↑                              ↑
  └── Adapter (其他模块实现) ─────┘
```

**禁止**:
- ❌ Service 直接依赖其他模块的 Repository
- ❌ Service 直接 import 其他模块的内部类
- ❌ 模块间循环依赖

---

## 5. ✅ 必须遵守

- [ ] 模块间通过事件 / Port 接口通信
- [ ] 共享代码放 `packages/`
- [ ] 无循环依赖
- [ ] 单测可独立 mock (无需启动其他模块)

---

## 6. 🔗 关联

- [event-driven-architecture.md](../patterns/event-driven-architecture.md) · 解耦
- [saga-pattern.md](../patterns/saga-pattern.md) · Saga 编排
