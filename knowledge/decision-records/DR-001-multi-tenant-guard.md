# Decision Record · DR-001 多租户守卫架构

> 创建日期: 2026-06-25
> 来源: extract-knowledge.py 自动补全

> 决策日期: 2026-06-22
> 决策者: E1 陈架构 + E2 李安全
> 关联 Phase: Phase-13/14/15

## 背景
多租户 SaaS 必须防止:
1. lifecycle 处于 paused/suspended 的租户创建资源
2. quota 已满的租户创建资源
3. 跨租户数据泄漏

## 决策
采用 **lifecycle + quota 双守卫 + reserve-rollback** 模式:

1. **TenantLifecycleService**: 管理租户生命周期 (active/paused/suspended/closed)
2. **TenantQuotaService**: 管理资源计数 + reserve/decrement 操作
3. **assertCanWriteResource**: 头部守卫 helper,检查 lifecycle + reserve quota
4. **业务失败回滚**: catch 中 decrement

## 理由
1. **头部检查**: 同步 fail-fast,避免无效业务执行
2. **reserve 原子**: 避免并发场景下计数漂移
3. **decrement 回滚**: 业务失败不消耗 quota
4. **可选依赖**: `@Optional()` 注入避免循环依赖,@ts-expect-error 友好

## 后果
- 8 个业务 service 全部使用此模式 (Phase-15/16 完成)
- 30+ e2e 测试覆盖各种边界
- 未来 Phase-19 智能化引擎可基于 quota 数据做异常检测

## 备选方案 (否决)
1. **increment + check**: ❌ 并发漂移
2. **DB transaction 包裹**: ⚠️ 性能成本高
3. **乐观锁 version 字段**: ⚠️ 业务侵入大

## 关联文档
- [lessons-learned/phase-15.md](../lessons-learned/phase-15.md)
- [patterns/quota-guard.md](../patterns/quota-guard.md)
- [patterns/reserve-rollback.md](../patterns/reserve-rollback.md)
- [anti-patterns/quota-increment-then-check.md](../anti-patterns/quota-increment-then-check.md)
