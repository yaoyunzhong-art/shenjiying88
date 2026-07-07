# Phase-15 · 多租户架构经验 (lessons-learned/phase-15.md)

> 创建日期: 2026-06-25
> 来源: extract-knowledge.py 自动补全

> 周期: 2026-06-22 ~ 24
> Owner: E1 陈架构

## Lesson 1: 多租户守卫必须 lifecycle + quota 双检查
- **背景**: 最初只检查 quota,某些 lifecycle 处于 paused/suspended 状态的租户仍能创建资源
- **影响**: 资源在已暂停租户中累积,激活时数据混乱
- **改进**: registerPersistent 头部 `lifecycle.canWrite()` + `quota.reserve()` 双守卫
- **关联专家**: E1(架构), E2(安全)

## Lesson 2: reserve + decrement 回滚模式优于 increment + check
- **背景**: 早期用"先 increment,失败再 decrement",并发场景下计数漂移
- **影响**: quota 计数超过实际资源数
- **改进**: 改用 `reserve` (成功后占用,失败抛异常) + 业务失败 `decrement` 回滚
- **关联专家**: E1(架构)

## Lesson 3: @Optional() + @Inject 显式注入避免循环依赖
- **背景**: Member/Campaign/Inventory/Finance service 都依赖 TenantQuotaService,但反向引用会循环
- **影响**: tsx runtime 启动失败
- **改进**: 用 `@Optional() quotaService` + `if (this.quotaService && this.lifecycleService)` 守卫
- **关联专家**: E1, E39(ISV)

## 完整交付物
- 8 个业务 service 接入守卫 (Brand/Store/Member/Campaign/Product/Invoice/ApiCall)
- ~30 个 e2e 测试全绿
- TenantQuota + TenantLifecycle + TenantIsolation + QuotaEnforcement 4 模块协同

## 后续应用
- Phase-16 业务深化直接复用守卫模式
- Phase-19 智能化引擎可以基于 quota 数据做异常检测
