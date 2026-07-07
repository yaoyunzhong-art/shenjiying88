# Pattern · quota-guard (lifecycle + quota 双守卫)

> 创建日期: 2026-06-25

> 来源: Phase-15E registerPersistent
> 验证: 8 个业务 service 全部使用,30+ e2e 测试

## 适用场景
任何多租户环境下的"创建资源"操作,需要防止:
1. lifecycle 处于 paused/suspended 状态的租户创建资源
2. quota 已满的租户创建资源

## 实现模式

```typescript
async registerPersistent(input: Input): Promise<Result> {
  // 头部守卫 (sync 检查)
  assertCanWriteResource(
    this.tenantId,
    this.lifecycleService,
    this.quotaService,
    QuotaResourceKind.Member
  );

  // 业务逻辑 (用 try/catch 包裹)
  let reserveResult: QuotaCheckResult | undefined;
  try {
    // 1. reserve quota (原子占用)
    reserveResult = await this.quotaService.reserve(
      this.tenantId,
      QuotaResourceKind.Member,
      1
    );
    if (!reserveResult.allowed) {
      throw new QuotaExceededException(reserveResult);
    }

    // 2. 真正业务创建
    const entity = await this.memberProfile.create(input);

    // 3. 业务成功,保留 reserve (因为 reserve 已占用)
    return entity;

  } catch (error) {
    // 4. 业务失败,decrement 回滚 reserve
    if (reserveResult?.allowed) {
      await this.quotaService.decrement(this.tenantId, QuotaResourceKind.Member, 1);
    }
    throw error;
  }
}
```

## 关键要点
1. **头部守卫**: 在方法开头同步检查 lifecycle.canWrite + quota.reserve
2. **reserve 模式**: 优先用 reserve (原子占用),不要用 increment + check
3. **decrement 回滚**: 业务失败时必须 decrement
4. **可选依赖**: `@Optional()` 注入避免循环依赖


## 反模式
- ❌ 不要先 increment 再 check (并发漂移)
- ❌ 不要只检查 lifecycle 或 只检查 quota (任一漏检都失败)
- ❌ 不要忘记在 catch 里 decrement

## 关联文档
- Phase-15 retro: [lessons-learned/phase-15.md](../lessons-learned/phase-15.md)
- TenantQuotaService: [apps/api/src/modules/tenant/tenant-quota.service.ts](../../apps/api/src/modules/tenant/tenant-quota.service.ts)
- assertCanWriteResource: 内部 helper (TenantModule 导出)
