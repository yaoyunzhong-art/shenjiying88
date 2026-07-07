# Pattern · optional-di (避免 NestJS 循环依赖)

> 创建日期: 2026-06-25

> 来源: Phase-15E/16D/E/F 所有 service
> 验证: 8 个 service 全部使用

## 适用场景
NestJS service A 依赖 service B,但 B 也依赖 A(或 B 的某个祖先),形成循环依赖。

## 反模式 (❌ 错误)
```typescript
// member.service.ts
constructor(private quotaService: TenantQuotaService) {}

// tenant-quota.service.ts (反向依赖)
constructor(private memberService: MemberService) {}
// → NestJS 启动失败: "A circular dependency"
```

## 正确模式 (✅)
```typescript
// member.service.ts
import { Optional } from '@nestjs/common';

constructor(
  @Optional() private quotaService?: TenantQuotaService,
  @Optional() private lifecycleService?: TenantLifecycleService
) {}

// 使用时守卫
async registerPersistent(input: Input) {
  if (this.quotaService && this.lifecycleService) {
    // ... 守卫逻辑
  }
}
```

## tsx runtime 注意
如果用 tsx 而非 tsc,需要 module 配置显式 optional:
```typescript
@Module({
  providers: [
    {
      provide: 'SERVICE',
      useFactory: (dep1: Dep1, dep2?: Dep2) => new Service(dep1, dep2),
      inject: [{ token: 'DEP1' }, { token: 'DEP2', optional: true }],
    }
  ]
})
```

## 关键要点
1. **@Optional() 必须**: 没有它,DI 容器尝试解析必然 fail
2. **运行时守卫**: 必须 `if (this.service)` 检查,TypeScript 类型会变 `T | undefined`
3. **测试友好**: optional 依赖可以传 undefined,在测试中减少 mock
4. **避免反向依赖**: 优先考虑让 B 依赖 A 的抽象 (interface),而非具体类

## 关联文档
- Phase-15 retro: [lessons-learned/phase-15.md](../lessons-learned/phase-15.md) Lesson 3
