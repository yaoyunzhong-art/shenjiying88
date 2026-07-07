# Phase-16 · 业务深化经验 (lessons-learned/phase-16.md)

> 创建日期: 2026-06-25
> 来源: extract-knowledge.py 自动补全

> 周期: 2026-06-24 ~ 25
> Owner: E10 郑财务 + E11 钱店长 + E12 孙导购

## Lesson 1: QuotaResourceKind 枚举扩展必须同步 DEFAULT_TIER_QUOTAS
- **背景**: 添加 Product/Invoice 时只改了 enum,忘记 DEFAULT_TIER_QUOTAS
- **影响**: 新租户初始化时新资源计数为 undefined,reserve 时报错
- **改进**: 扩展 enum + DEFAULT_TIER_QUOTAS + applyDelta switch 3 处必须同步
- **关联专家**: E1(架构), E10(财务)

## Lesson 2: 反向耦合业务 service 不应直接抛 QuotaExceededException
- **背景**: CampaignService 一开始直接 `throw new QuotaExceededException`
- **影响**: 上层 controller 不知道具体原因
- **改进**: service 内部 try/catch 包裹业务逻辑,失败时 decrement 回滚 + 重新抛
- **关联专家**: E11(店长)

## Lesson 3: e2e 测试要 mock 整个 tenant context,不只 partial
- **背景**: CampaignService 测试只 mock quotaService,没 mock lifecycleService
- **影响**: 部分测试通过真实 TenantLifecycleService,执行慢 + 不稳定
- **改进**: 每个 e2e 测试都 stub 两个 service
- **关联专家**: E12(导购)

## 完整交付物
- 3 个新 service (CampaignService/InventoryService/FinanceService)
- QuotaResourceKind 扩展 2 个 (Product/Invoice)
- 27 个新 e2e 测试 (9+8+10) 全绿
- DEFAULT_TIER_QUOTAS 扩展 6 个新字段 (maxProducts/products/maxInvoices/invoices × 3 tiers)

## 后续应用
- Phase-17 营销活动也需 quota 接入,模式已就绪
- Phase-19 智能化引擎可以从 reserve 失败率中识别异常租户
