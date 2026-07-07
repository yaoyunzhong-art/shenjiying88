# Phase-17 Lessons Learned · 营销 + 社群 + 跨门店优惠券

> Pulse-68 闭环 · 2026-06-26 · E4 张营销 + E16 社群 + E15 内容

## 成功之处 (What Went Well)

### 1. reserve-and-rollback 守卫模式
- lifecycle.assertWriteAllowed + quota.check 双守卫,失败时 increment 不挂账
- 关键决策:用 `check()` 替代 `reserve()`,避免业务成功时双重 increment
- 测试 E2E-4 暴露了这个 bug (从 3 fail 修到 7/7 PASS),值得作为 V2 默认模式

### 2. 数据模型扩展一致性
- QuotaResourceKind.Coupon 加 1 个 enum 值 + DEFAULT_TIER_QUOTAS 加 1 字段
- tenant-quota.entity.ts 252 行,完整覆盖 6 类资源
- quotaLimitFor / usageValueFor / applyDelta 三个 switch 必须同步加 case

### 3. 三级裂变链递归构建
- ancestor chain 必须查 **parent** 而非 child (child 没记录)
- 限深 3: A→B→C→D 时,D 的 chain = [C,B,A]
- T9 测试驱动出这个 bug

### 4. EventBus 5 事件订阅
- CampaignTriggerService onModuleInit 统一订阅,onModuleDestroy 清理
- 频次控制:Map<userId:eventName:dateKey, count> 简单有效

### 5. T10 满月复盘自动化
- Python 脚本扫 docs/ + .trae/ 目录,自动生成报告
- 月底 cron 自动跑,给 Champion 提供决策依据

## 痛点 (Pain Points)

### 1. Edit/Write 工具不稳定
- 多次 Edit 工具显示成功但实际未写入 (IDE cache 问题)
- 解决:用 Python 脚本写文件 + cat 验证 — 这套流程变可靠
- **建议 V2**: 优先用 Python 脚本 + heredoc 写多行内容,Edit 只用于小改动

### 2. stub 测试构造函数签名变化传播
- CouponService 加 dataSource 参数 → 4 个 stub 测试全报错
- 修复: 在测试构造里插入 mock dataSource 占位
- **建议**: V2 抽象 TestFixtureBuilder,集中管理 stub

### 3. NotificationChannelType enum 不全
- 缺 WeChat / SMS (实际是 Sms),代码用 Wechat 报错
- **建议**: V2 补全 channel enum (Wechat / Sms / Push / Email / InApp / Webhook)

### 4. 后台 agent 自动 commit
- 多次 commit 在我的代码还没落地时就被自动 commit
- 应对: 关键 commit 用 Python + git add 显式文件 + git commit -F 立即执行

## 数据指标 (Phase-17 完整)

| 指标 | 实际 | 目标 |
|---|---|---|
| 测试通过 | 30/30 | 100% |
| TS errors | 0 | 0 |
| 新增文件 | 15 | n/a |
| 新增模块 | 5 (coupon/trigger/referral/leads/marketing-metrics) | n/a |
| 提交 commits | 4 | n/a |
| 总代码量 | ~3500 行 | n/a |

## Phase-18 行动项 (推荐)

### P0 (立即做)
1. **TenantLifecycle.assertCanWriteResource** - 当前 lifecycle 只有 assertWriteAllowed,资源级守卫缺失
2. **QuotaResourceKind 月切逻辑** - 当前 maybeResetApiCalls 只有日切,couponRedemptionsThisMonth 跨月不清零
3. **NotificationChannelType 补全** - WeChat/SMS/Email/Push 全集

### P1 (1-2 周)
4. **AI Code Reviewer** - 用 lessons 自动检测 anti-patterns (如 quota 双重 increment)
5. **Prometheus 接入生产** - 当前 metrics 是内存 counter,生产应接 Prom client
6. **RAG 索引器** - 知识库 64 文件,但还没结构化索引

### P2 (1 月+)
7. **Phase-19 Champion Dashboard** - Champion 任命后的可视化
8. **跨租户数据隔离加固** - 当前依赖 code review,应加 lint 规则

## 知识沉淀

### Patterns
- [cross-store-transaction.md](../patterns/cross-store-transaction.md) · 跨门店事务模式
- [reserve-and-rollback-guard.md](../patterns/reserve-and-rollback-guard.md) · 守卫模式
- [three-level-referral-chain.md](../patterns/three-level-referral-chain.md) · 三级裂变算法

### Decision Records
- [DR-004-cross-store-coupon.md](../decision-records/DR-004-cross-store-coupon.md) · 跨门店优惠券设计决策
- [DR-005-marketing-trigger-event-bus.md](../decision-records/DR-005-marketing-trigger-event-bus.md) · 营销触发器事件总线

### Anti-Patterns
- [quota-double-increment.md](../anti-patterns/quota-double-increment.md) · reserve + 业务成功 双重 increment
- [stub-test-constructor-fragility.md](../anti-patterns/stub-test-constructor-fragility.md) · stub 测试构造脆弱性

---

> 由 Pulse-68 主 agent 生成 · 2026-06-26 02:15 CST
