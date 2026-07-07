# Pattern · Observer (观察者模式)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 事件监听 / 状态变更通知 / 解耦
> 来源: Phase-15+ EventEmitter + NestJS @OnEvent + Saga

---

## 1. 🎯 问题

业务模块间需要响应式通信:
- ❌ 服务 A 直接调用 B → 耦合
- ❌ 修改 B 必须知道所有调用方
- ❌ 不利于扩展 (新增 C 必须改 A)

Observer = **发布者 + 订阅者**,发布者不知道订阅者存在。

---

## 2. ✅ NestJS 实现

```typescript
// apps/api/src/modules/member/member.service.ts (发布者)
@Injectable()
export class MemberService {
  constructor(private readonly eventBus: EventBus2) {}

  async register(dto: RegisterDto) {
    const member = await this.memberRepo.save(dto)
    // 发布事件 (不关心谁订阅)
    await this.eventBus.emit('member.registered', new MemberRegisteredEvent(member))
    return member
  }
}

// apps/api/src/modules/coupon/coupon.listener.ts (订阅者)
@Injectable()
export class CouponListener {
  @OnEvent('member.registered')
  async handleMemberRegistered(event: MemberRegisteredEvent) {
    // 发新人优惠券
    await this.couponService.grantNewUserCoupon(event.memberId)
  }
}

// apps/api/src/modules/points/points.listener.ts (订阅者)
@Injectable()
export class PointsListener {
  @OnEvent('member.registered')
  async handleMemberRegistered(event: MemberRegisteredEvent) {
    // 加积分
    await this.pointsService.award(event.memberId, 100, 'register')
  }
}
```

---

## 3. ✅ 必须遵守

- [ ] 事件必须不可变
- [ ] 处理函数必须幂等
- [ ] 失败必须隔离 (try-catch 每个 handler)
- [ ] 异步优于同步 (BullMQ 异步处理)

---

## 4. 🔗 关联

- [event-driven-architecture.md](./event-driven-architecture.md) · 事件驱动
- [saga-pattern.md](./saga-pattern.md) · Saga 基于 Observer
