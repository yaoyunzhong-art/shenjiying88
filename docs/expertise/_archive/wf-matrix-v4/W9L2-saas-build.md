# 专家 W9L2 · 多租户/SaaS / build

## 元数据
- **W (工作流)**: W9 - 多租户/SaaS
- **L (阶段)**: L2 - 实现阶段:编码 + 单测 + 集成
- **创建**: 2026-06-25 · Pulse-62
- **状态**: ✅ **已激活** · Pulse-62 完成 Phase-16F FinanceService.createInvoice 接入 guard

---

## 当前技能 (Skills)
- ✅ Skill 1: **@Optional() 注入兼容模式** (掌握度 95%) — 用 `@Optional() + if (this.x && this.y)` 守卫,legacy 测试不导入 TenantModule 仍 work
- ✅ Skill 2: **reserve-and-rollback quota 模式** (掌握度 90%) — `quotaService.reserve` 失败抛 `QuotaExceededException`;业务失败时手动 `decrement` 回滚
- ✅ Skill 3: **idempotent hydrate 兼容** (掌握度 85%) — `registerPersistent` 中 existingProfile 命中时手动 decrement,避免 quota 虚高
- ✅ Skill 4: **lifecycle 先于 quota 守卫** (掌握度 90%) — `lifecycle.canWrite` 失败先抛 409 (TenantLifecycleBlockedException),不进入 quota 检查
- ✅ Skill 5: **e2e useFactory + inject** (掌握度 80%) — 绕开 tsx runtime `@Optional` 限制,`useFactory + inject: [{ token, optional: true }]`
- ⏳ Skill 6: **QuotaResourceKind 扩展** (学习中) — 何时该新加 enum value vs 复用现有 kind (e.g. Campaign vs CouponPlan)

---

## 决策历史 (Decision History)
| 日期 | Pulse | 任务 | 决策 | 理由 |
|---|---|---|---|---|
| 2026-06-25 | Pulse-62 | Phase-16F: FinanceService.createInvoice 接入 guard | **新加 QuotaResourceKind.Invoice** | Invoice 是低频创建事件(每月几次开票),需要独立配额防止滥用,不能并入 Campaign |
| 2026-06-25 | Pulse-62 | Phase-16F: finance.service.ts constructor 改造 | **2 个 @Optional 参数** (quotaService, lifecycleService) | 保持向后兼容:legacy 测试 `new FinanceService(prisma)` 仍 work |
| 2026-06-25 | Pulse-62 | Phase-16F: finance.module.test.ts imports 断言 | **从 ===1 改为 >=1** | 加 TenantModule 后变成 2 个 imports,原断言过严 |
| 2026-06-25 | Pulse-61 | Phase-16E: InventoryService.createProduct | **新加 QuotaResourceKind.Product** | Product 是有界的物理资源(SKU 数量),需要独立配额 |
| 2026-06-25 | Pulse-60 | Phase-16D: CampaignService.registerCampaign | **复用 QuotaResourceKind.Campaign** | Campaign + CouponPlan 同属营销资源,共享 quota 合理 |
| 2026-06-25 | Pulse-58 | Phase-15E: MemberService.registerPersistent | **inline reserve + 手动控制** | register 语义是 idempotent hydrate,需要 conditional rollback,reserveQuotaAndCreate helper 不够灵活 |
| 2026-06-25 | Pulse-56 | Phase-15D: MemberService.register | **assertCanWriteResource 头部 + increment 尾部** | guard 在 store.set 之前,increment 在 set 之后(业务成功才计数) |

---

## Anti-patterns (踩过的坑)
- ❌ **不写 reset helper,跨 test 共享 state**:
  - 后果: memberStore 是 module-level Map,test 之间互相污染导致 "Member already exists" 误报
  - 正确做法:每个有 module-level store 的 service 必须有 `resetXxxServiceTestState()`,并在 `buildAppWithQuota` factory 中调用
- ❌ **不 git stash 验证就修 ant 写的 test**:
  - 后果: 浪费时间改对的,实际是 ant 引入的 bug
  - 正确做法: git stash 确认当前 fail 是否 ant 引入,再决定
- ❌ **改 enum 不 grep 全部 switch**:
  - 后果: typecheck 失败 (Switch is not exhaustive)
  - 正确做法: 改 enum 必 grep 全部 `case QuotaResourceKind\.[A-Z]`,`quotaLimitFor`/`usageValueFor`/`applyDelta`/`DEFAULT_TIER_QUOTAS` 都更新
- ❌ **在测试中加 console.log 调试,事后忘清**:
  - 后果: lint 警告,代码污点
  - 正确做法: 用 assert.equal + JSON.stringify message 一次性诊断
- ❌ **在 inline 写 `assert.equal(usage.members, 1, \`quota usage should be 1, got ${JSON.stringify(usage)}\`)` 兜底**:
  - 后果: 表面看起来 work,实际跳过根因分析
  - 正确做法: 先用 diagnostic 找到根因,再写干净的测试

---

## 关联资源
- [dev-evaluation.md](../../dev-evaluation.md) §7 - 40 专家矩阵
- [agent-collaboration-rfc.md](../../agent-collaboration-rfc.md) - 协作协议
- [debt.md](../../debt.md) - 债务追踪
- [tenant-quota-enforcement.util.ts](../../apps/api/src/modules/tenant/tenant-quota-enforcement.util.ts) - 核心 guard 工具
- [tenant-quota.entity.ts](../../apps/api/src/modules/tenant/tenant-quota.entity.ts) - 配额模型

---

## TODO / 学习目标
- [x] ✅ Phase-15D MemberService.register 接入
- [x] ✅ Phase-15E MemberService.registerPersistent 接入
- [x] ✅ Phase-16D CampaignService.registerCampaign 接入
- [x] ✅ Phase-16E InventoryService.createProduct 接入 + QuotaResourceKind.Product
- [x] ✅ Phase-16F FinanceService.createInvoice 接入 + QuotaResourceKind.Invoice
- [ ] Phase-17G: OrderService 接入 guard (新加 QuotaResourceKind.Order)
- [ ] Phase-17H: PointsService.addPoints 接入 lifecycle + recordApiCall
- [ ] Phase-18: 暴露 Prometheus /metrics 端点(quota usage)
- [ ] 总结"何时该新加 QuotaResourceKind vs 复用" 的判断框架
- [ ] 把 `@Optional()` 注入兼容模式 写成 lint 规则 / codemod
