# 🧠 专家午后简报 · 2026-07-11 (周六)

> 生成: 14:07 · 基于晨间简报 + 知识库 + L2审查

---

## G5 数据/AI

### L2 代码审查 — 持续性问题：自动生成测试的 TSC/类型不一致

**审查依据**: evolution-log (pulse#256/#163/#150), expert-insights (E16/E17/E18/AI-RAG)

**L2 审查结论**: ⚠️ 中度关注

**审查发现**:
1. **AI 模块类型断裂模式固化**: @m5/api 的 ai-rag 角色测试大量 `result is of type 'unknown'` (TS18046)，根本原因是 Service 方法返回类型为泛型 `Promise<unknown>` 而非显式 `ApiResponse<T>`。持续 60+ 脉冲未修复，已从「技术债」升级为「基建阻塞」。
   - 建议: 为 allen-ai-rag 模块 Service 层添加统一 `ApiResponse<T>` 返回类型标注，而非泛型 `unknown`。
2. **DataDriftMonitorPanel AI 前端组件测试已通过验收**: pulse#260 产出，storefront-web 测试量 +36 至 4540，无回归。数据漂移监控面板的前端覆盖已就位。
3. **自动生成代码的 TSC 模式**【E18 已验证】: `DataTableColumn.width: number` (应为 `string`)、`StatusBadge children→label` 等 prop 类型不匹配在 auto-gen 代码中高频出现。树哥/蚂蚁在生成新代码前未读取目标组件接口定义。

**K2 意见**:
- 建议本周末启动「AI 模块类型基建」专项: 为 allen-ai-rag 模块所有 Service 方法添加 `Promise<ApiResponse<X>>` 显式返回类型，解决 60+ 脉冲的 `unknown` 类型问题
- 自动生成代码流程增加「组件接口预读」步骤: 生产前先读目标组件的 `.tsx` 接口文件，确保 prop 类型对齐——参考 E18 教训

### M2 抽查 — @m5/api 测试 hang 状态

| 项目 | 状态 |
|:----|:----:|
| P0-001 (测试 hang) | 🔴 持续 22天+ 未解 |
| 新增 untracked payment-gateway 测试 | ⚠️ 3 文件未提交 |
| TSC (@m5/api) | ✅ 0 error (7/10 pulse#254 清零) |
| 非api 15模块连续全绿 | 🔥 15+ 脉冲稳定 |

**抽查结论**: @m5/api 的测试 hang 已成为唯一系统性阻塞。TSC 清零是重大胜利，但 hang 问题持续 22 天说明不是简单配置遗漏——可能涉及 DB 连接池耗尽、全局钩子死锁或 NestJS TestModule 初始化配置。周六建议安排 1 路树哥尝试 vitest CLI 迁移 + 二分法隔离首个 hang 文件。

---

## G6 财务/审计/投资

### L2 审查意见 — 审计链与金融模块健康度

**审查依据**: morning-expert-brief (G2 审计链建议), expert-insights (E50-E54 xu-audit-chain), daily-brief

**L2 审查结论**: 🟡 注意

**审查发现**:
1. **新增 E54 xu-audit-chain 审计链专家已就位**: 7/10 pulse#254 新增的 5 个专家文件中包含审计链专家。建议本周末产出首个审计规则文件，为 8/1 开业提供审计能力基线。
2. **充值详情页 (7/10 pulse#260 产出) 缺乏压力测试**: 充值作为核心交易链路，需确保高并发场景下不丢单。当前没有针对充值链路的并发压力场景测试。
3. **Redis 无密码 (JWT 过期策略未审查) 持续中危**: 自 5/25 标记至今未修复。财务数据经 Redis 缓存（如 quota 配额缓存），若 Redis 被侵入则财务数据可被篡改。
4. **Finance-quota-integration e2e 测试**: 当前主模块 e2e 全部 hang 中，财务配额集成测试无法运行。需要先解决 P0-001 基础架构 hang 问题才能恢复金融模块的 e2e 覆盖。

**K2 审查意见**:
- 建议本周末完成 `xu-audit-chain` 的首个审计规则文件，覆盖: (a) 充值交易审计 (b) 商户配额变更审计 (c) 权限变更审计
- 充值压力测试需纳入 P-35 收尾的检查清单
- Redis 密码问题建议列入 8/1 开业前强制修复清单

---

## G7 体验/设计/客户

### L2 体验评估 — 前端组件稳定性与一致性

**审查依据**: expert-insights (E14/E15/E18), evolution-log (pulse#155/#163/#256), morning-review

**L2 体验评估结论**: 🟡 基本健康，存在细微组件接口脱节

**评估发现**:
1. **商家端前端功能完备性 → 22 天倒计时**: 当前 storefront-web 4540 测试 / admin-web 4205 测试，全部 0 fail。前端测试覆盖已达标，但重点是**功能完备性**而非测试数量。
   - 收银主流程: ✅ P-35 已补全 (storefront-web +99)
   - 会员管理: ✅ P-36 已补全 (admin-web +54)
   - 开放 API: ✅ P-44 已补全
2. **组件 API 版本脱节模式**【E15 已验证】: `FormPageScaffold` 删除 `initialValues` 改为 `per-field initialValue`、`FormSubmitFeedback` 从 `variant/message/onClose` 迁移到 `state/error/success`、`DetailShell` 无 `.Section`/`.InfoRow` 复合子组件。这些变更在晨间未被消费方跟随更新。
   - 影响: 前端页面可能渲染异常或缺失功能
   - 建议: 周末做一次全量 walkthrough 验证核心商户路径 (登录→收银→会员管理→报表→设置) 的渲染正确性
3. **前置条件式测试的有效性**【E14 已验证】: CoachDashboard `does not render profile when no coach info` 测试捕获了条件渲染不一致问题。这种模式值得推广到其他「空状态/无数据」场景测试。

**K2 体验建议**:
- 本周日(7/12)安排 **全流程 walkthrough**: admin-web 商家端功能 (收银+会员+营销+门店管理) 的逐级页面验证
- 新增「空状态测试覆盖」: 对核心数据表格/列表页面（商品、会员、订单）增加「无数据时显示占位状态」的前置条件测试
- `FormPageScaffold`/`FormSubmitFeedback`/`DetailShell` 三个组件的前端页面适配情况需做一次全面 audit

---

## G8 多租户

### L2 隔离审查 — 租户隔离机制完整性

**审查依据**: expert-insights (E7/E9/E11/E16 E5王测试 tenant-isolation), morning-expert-brief (G2 安全), security debt 追踪

**L2 隔离审查结论**: ⚠️ 中等隔离风险

**审查发现**:
1. **TenantQuotaService 跨模块可见性问题**【E7 已验证】: `TenantModule` 的 `exports` 中未包含 `TenantQuotaService`，导致 finance-quota-integration e2e 测试中 `moduleRef.get(TenantQuotaService)` 失败。这是生产级的 provider 不可见问题——如果生产构建中同样未导出，金融模块将无法访问租户配额服务。
2. **tenant-isolation.e2e 测试全部 hang 中**: 自 P0-001 以来，tenant-isolation 模块的 e2e 测试从未通过验收。多租户隔离机制缺少端到端验证。
3. **角色测试中的 tenantContext 缺失**【E16 已验证】: auto-generated role test (如 open-api.role.test.ts) 直接在 `tenantContext.run()` 外调用 `handleSync/sendCommand`，导致 `getBearerFromCtx()` 抛 `Missing tenant context`。多租户上下文模拟在自动生成测试中普遍缺失。
4. **店A (8/1开业) 多租户准备**: 新商户入驻时，租户隔离的验证流程尚未文档化。开业前需要:
   - 验证新租户创建后的数据隔离
   - 验证租户 A 的数据不能被租户 B 访问
   - 验证配额/费率按租户独立生效
   - 验证审计日志按 tenantId 索引

**K2 隔离审查意见**:
- **必须**在 8/1 开业前修复 @m5/api 的 provider exports (TenantQuotaService)，否则多商户场景下 quota 隔离会静默失效
- 角色测试模板应增加 `runWithTenant()` 包裹步骤，防止自动生成的角色测试直接裸调用——参考 E16 修复模式
- 开业前检查清单 (新增项):
  - [ ] tenant-isolation.e2e 测试通过
  - [ ] 跨租户数据泄漏验证 (手动 + 自动化)
  - [ ] 租户配额隔离: 修改 Tenant A 配额不影响 Tenant B
  - [ ] 审计日志 tenantId 索引验证
  - [ ] 为新商户创建 API 测试 seed

---

## 📊 综合健康度

| 检查项 | G5 数据/AI | G6 财务/审计 | G7 体验/设计 | G8 多租户 |
|:-------|:----------:|:------------:|:-----------:|:---------:|
| L2 结论 | ⚠️ | 🟡 | 🟡 | ⚠️ |
| 极端风险 | ai-rag `unknown` 类型断裂 | 审计规则文件缺失 | 组件 API 脱节 | tenant-isolation e2e 全 hang |
| 开业影响 | 低（AI非核心业务） | 中（充值+配额+审计） | 高（商户前端体验） | **高**（多租户隔离基本要求） |
| 建议优先级 | P2 周末专项 | P1 开业前审计 | **P1** 全链路 walkthrough | **P1** tenant provider 修复 |

### 🔴 顶部3开业前必做事

1. **G8**: 修复 @m5/api TenantQuotaService exports + tenant-isolation e2e — 多商户开业的基本前提
2. **G7**: 全流程 walkthrough 验证商家端功能 — 店A商户使用的核心路径
3. **G6**: 产出 xu-audit-chain 首个审计规则文件 — 合规基线
