# 🐜 shenjiying88 · 债务追踪 (debt.md)

> 最后更新: 2026-07-07 03:30 CST · Pulse-Nightly-09
> 当前阶段: **脉冲 #150 · 非api全绿 ✅ · @m5/api 持续 P0-009 🔴**

---

## 🟣 Expert Feedback (V5.1 专家反馈追踪 · Pulse-64 新增)

### EF-001: 40 人专家团尚未产出反馈
- **发现**: Pulse-64 (2026-06-25)
- **状态**: 🟡 启动中
- **预期**: Pulse-67 起,每周至少 3 条专家反馈
- **追踪指标**:
  - 反馈数量 / 周 (目标 ≥3)
  - 采纳率 (目标 ≥50%)
  - 紧急 veto 次数 (期望 0)
- **字段说明**:
  - `expert_id`: E编号 (e.g. E1, E19)
  - `severity`: P0 / P1 / P2 / P3
  - `related_phase`: 关联 phase 编号
  - `status`: open / acknowledged / in-progress / resolved / wont-fix

### EF-002: 待 Phase-17 Kickoff 时收集首批专家反馈
- **状态**: ⏳ Pulse-66 招募 Approver 后启动
- **负责人**: Champion (待 Pulse-66 任命)
- **关联 RFC**: R6 (Phase-17 计划)

### EF-003: L3 跨模块 E2E 从 0 到 9 链（Pulse-Nightly-05 扩展）
- **发现**: 2026-06-27 03:30 凌晨测试 → **✅ Pulse-Nightly-05 扩展至 9链**
- **状态**: ✅ **15 跨模块 E2E 测试链已创建并全通过（137 subtests, 0 fail）**
- **追踪**:
  | 链 | 路径 | subtests | 状态 | 模式 |
  |----|------|:--------:|:----:|------|
  | 01 | Admin→SDK→Domain→展示 | 3 | ✅ | 正向·展示 |
  | 02 | Admin→Domain→Storefront→Miniapp | 3 | ✅ | 治理·状态机 |
  | 03 | C端→Admin→Domain→展示 | 2 | ✅ | 优惠券·反向 |
  | 04 | Admin→API→Miniapp市场引导 | 5 | ✅ | 市场·多语言 |
  | 05 | Admin→API→Campaign→Domain→Loyalty→Analytics | 6 | ✅ | 营销活动 |
  | 06 | App→SDK→API→Domain→Storefront/Admin | 4 | ✅ | 认证·权限 |
  | 07 | Miniapp→SDK→API→Domain 反向 | 9 | ✅ | **反向链路** |
  | 08 | Admin→Domain→Mobile→Storefront订单 | 8 | ✅ | 订单状态机 |
  | 09 | Admin→API→Domain→Tob-Web RBAC | 9 | ✅ | RBAC矩阵 |
  | 10 | **Mobile**→API→Domain→Admin | 13 | ✅ | **反向·C端** |
  | 11 | **Tob-Web**→SDK→API→Domain→Admin | 11 | ✅ | **企业配额** |
  | 12 | **Admin**→API→Domain→Storefront→Analytics | 11 | ✅ | **数据管道** |
  | **13** | **Mobile+Storefront**→API→Domain 并发 | **11** | ✅ | **并发一致性** 🆕 |
  | **14** | **Miniapp**→SDK→API→Domain i18n | **22** | ✅ | **国际化深度** 🆕 |
  | **15** | **Admin**→API→Domain 大数据/幂等 | **18** | ✅ | **大数据+幂等** 🆕 |
  | **总计** | 15 链 | **137 subtests** | **0 fail** | **6 新模式** |
- **下一步**: Pulse-Nightly-08 扩展至 18+ 链，覆盖真实 HTTP 集成、端到端 Playwright E2E、性能基准测试

---

## 🟥 P0 · 阻塞级 (需立即人工关注)

### P0-001: @m5/api 22 测试失败回归 ✅ 已闭环 (Pulse-60)
- **发现**: Pulse-59 (2026-06-24 21:14) → **Pulse-60 全绿 闭环完成** 🔥

### P0-002: @m5/app app-journey.test.ts 耗时 66s ✅ 已闭环 (Pulse-63)
- **发现**: Pulse-59 (2026-06-24 21:14)
- **根因** (Pulse-63 真因): 5 处 assertion 写错前缀(`native-` vs `app-`),Node 22.x test runner 在 sync test assert fail 时 hang file-level root test 触发 30s timeout
- **修复**: 5 处 assertion 修复 + 移除 `process.on('beforeExit')` hack
- **结果**: 25/25 pass 123ms ✅

### P0-003: @m5/admin-web TSC 16 errors ✅ 已闭环 (Pulse-62)
- **发现**: Pulse-61 (2026-06-25 21:37)
- **修复**: markets + notifications-data 测试泛型化 + 可选链

### P0-004: 招募 Approver 级专家 (V5.1 关键) 🔴 Pulse-65 新增
- **发现**: Pulse-65 (2026-06-25)
- **问题**: 当前 0/40 专家达到 Approver 级别,RFC 投票机制空转
- **影响**: Phase-17 启动受阻,Champion 无人能 veto
- **修复方向**: **Pulse-66** 招募 ≥5 Approver,优先从已提交 feedback 专家中晋升
- **负责人**: main agent + 用户
- **升级条件**: Pulse-67 仍 0 → 派树哥批量 review 专家档案

### P0-006: @m5/api 测试超时 + TSC 8 errors (新模块引入) 🆕 Pulse-64
- **发现**: Pulse-64 (2026-06-26 02:59)
- **问题**: Phase-19 (Pulse-74) 新模块 (champion/anomaly-detector/AutoRollback/时序指标) 引入 3 类断裂:
  1. @m5/api e2e 测试大量 timeout/hang (anomaly-detector, knowledge, leads, marketing-metrics 等 9+ 文件)
  2. @m5/api TSC 8 errors (champion role test enum 类型 6 + shopOwner undefined 2 + anomaly-detector deviation 属性缺失 1)
  3. @m5/storefront-web 2 fail (vitest/jest 测试与 node --test runner 不兼容)
- **影响**: 验收脉冲无法获取 @m5/api 测试完整结果（测试 hang 超时）
- **修复方向**: 
  - TSC errors: 🐜 树哥 #1 已派修 (champion.role.test.ts enum 类型 + shopOwner 可选链 + anomaly-detector 类型定义)
  - storefront-web 2 fail: 🐜 树哥 #2 已派修 (promotions/stock 测试适配 node --test runner)
- **升级条件**: 下次脉冲仍 fail → 标记 P0-007 并人工介入

### P0-005: 跨门店会员优惠券核销 (E40 杨客户 P0) 🆕 Pulse-66
- **发现**: E40 杨客户反馈 (2026-06-26)
- **问题**: 跨门店优惠券无法核销,影响大型连锁客户
- **影响**: 大客户续约风险,租户增长受阻
- **优先级**: 🔴 P0
- **Phase**: Phase-17 核心交付
- **修复方向**: Phase-17 实现 cross-store coupon service,支持 storeId 范围查询 + 事务一致性
- **验收**: 跨门店核销响应 < 200ms,e2e 测试覆盖 ≥5 场景

### P0-007: @m5/api app-journey timeout 持续 (Pulse-Nightly-03 持续追踪)
- **发现**: Pulse-59 起连续 6+ 脉冲未解决
- **现状**: 2026-06-27 凌晨仍为 @m5/api 唯一失败（超时）
- **根因推测**: Nest TestingModule / test DB / beforeAll 钩子问题，非断言逻辑
- **影响**: 验收脉冲无法获取 @m5/api 完整结果
- **修复方向**: 需人工介入检查 NestJS TestingModule 配置

### P0-008: @m5/admin-web configuration page.test.ts TSC 40 errors + 32 test fail 🆕 Pulse-88
- **发现**: Pulse-88 (2026-06-27 14:37)
- **来源**: commit `222d35e22 🐜 [portal] [D] controller spec 补全` 引入 `apps/admin-web/app/configuration/page.test.ts`
- **严重程度**: 🔴 P0（TSC 40 errors + 32 test failures，block admin-web 验收）
- **根因分析**: 测试文件的 mock 数据完全与 `@m5/types` 最新类型定义不对齐：
  1. 导入不存在的 `ConfigurationGovernanceClientSnapshot` → 应用 `ConfigurationSnapshotDelivery`
  2. Mock 数据用 `scope: {...}` 但类型用 `scopeType: ConfigurationScopeType + tenantId/brandId...`
  3. Mock 数据含 `description` 但 `ConfigurationConfigEntry/SecretMetadata/CertificateMetadata` 类型无此字段
  4. `ConfigurationOverview.configuration.entries/secrets/certificates/featureFlags` 缺少 `active/namespaces/persisted/rotationDue/expired/enabled/byStrategy/autoRenew/expiringSoon`
  5. `featureFlagStatusLabel(boolean)` 应传 `ConfigurationFeatureFlag`
  6. `ConfigurationScope` 无 `key` 属性，用 `scopeType/tenantId/...`
  7. `ConfigurationGovernanceMetadataEntry` 无 `key/label/total`，有 `operation/rbac/approval`
  8. Mock `MOCK_ENTRY` 缺少 `scopeType`
- **升级条件**: 已在 P0，需人工一次性修复 mock 数据

### P0-009: @m5/api TSC 73 errors (~71持平, 从395大幅下降) 🔴 脉冲#173
- **发现**: Pulse-Morning-09 (2026-07-06 07:12)
- **来源**: 持续累积, 涉及 alliance/blindbox/brand-custom/chain/currency/ops-manual
- **严重程度**: 🔴 P0（block @m5/api typecheck 验收）
- **当前**: **73 errors** ⬇️ 从 395 (🔻 -81.5%)
- **分布**: alliance(~48) + blindbox(18) + brand-custom(4) + chain(1) + currency(1) + ops-manual(1)
- **已完成**: ai-rag(115) + realtime(14) 已清零 ✅
- **根因**: 多个模块的测试因 DTO/类型定义变更导致类型断裂(TS18048/TS2345/TS2322)
- **影响**: 无法通过 @m5/api typecheck
- **修复方向**: 树哥持续分批修复中, 已从395→73
- **建议**: alliance(48) 'result.data possibly undefined' 需加 ? 或非空断言; blindbox(18) mock 缺 BlindboxService 属性需补全

### ✅ @m5/tob-web TSC 2→0 闭环 (脉冲 #149)
- **发现**: 脉冲 #148 (2026-07-06 11:39) — 3 errors (FormPageScaffold initialValues 删除 + error:true)
- **修复**: 🐛 commit `1a9affd77` (2026-07-06 12:49)
  - 删除 page.tsx 中 `initialValues={...}` prop → 改为每个字段的 `initialValue`
  - 向 `FormPageSubmitResult` 接口添加 `error?: boolean` 字段
- **验证**: pnpm --filter @m5/tob-web typecheck → 0 errors ✅
- **状态**: ✅ **闭环** (上次树哥修复未 commit，本次完成提交流程)

---

## 🟡 P1 · 影响级 (Pulse-Nightly-03 新增)

### P1-003: packages/ui 缺少 FormField/ConciergePanel 组件
- **发现**: 2026-06-27 凌晨测试（链01 之外大量 admin-web 测试引用）
- **影响文件**: runtime-governance-panel.test.ts, runtime-governance.test.ts
- **根因**: packages/ui/src/index.tsx re-export 了 ./components/FormField 和 ./components/ConciergePanel 但实际文件不存在
- **影响**: 2 个 admin-web 测试文件 MODULE_NOT_FOUND 崩溃
- **严重程度**: 🟡 P1（影响测试覆盖率完整性）
- **修复方向**: 创建 FormField.tsx 和 ConciergePanel.tsx 基础组件 或 移除 index.tsx 中的 re-export

### P1-004: admin-web 测试文件缺失 
- **发现**: 2026-06-27 凌晨测试
- **影响文件**: workbench-data.test.ts, tenants/page.test.ts
- **根因**: admin-web/test runner find 到这些 .test.ts 文件但磁盘上不存在（可能被误删或 renami 后残留引用）
- **影响**: 4 个测试文件 ERR_MODULE_NOT_FOUND
- **修复方向**: 清理残留引用 或 创建空桩文件

### P1-005: packages/ui 测试文件缺失
- **发现**: 2026-06-27 凌晨测试
- **影响文件**: PageShell.test.tsx, PaginatedDataTableCard.test.tsx
- **根因**: packages/ui/src/components/ 下无此文件但被 test runner 引用
- **修复方向**: 创建缺失测试文件或清理引用

### P1-006: 跨模块 E2E 覆盖不足 ✅ 进展中
- **发现**: 2026-06-27 凌晨测试
- **Pulse-Nightly-05 进展**: ✅ **6→9链, 26→51 subtests** (全部 0 fail, +25 subtests)
  - 新增链07: Miniapp→SDK→API→Domain 反向链路 (9 subtests ✅ 首条反向链)
  - 新增链08: Admin订单→Domain状态机→Mobile展示→Storefront履约 (7 subtests ✅ 首覆 mobile)
  - 新增链09: Admin权限→API→Domain角色→Tob-Web企业端展示 (9 subtests ✅ 首覆 tob-web)
- **覆盖情景**: 反向链路、订单状态机(8状态)、RBAC矩阵(6角色×9模块)、租户隔离
- **严重程度**: 🟡 P1 → 🟢 进展中（覆盖率大幅提升但仍有缺口）
- **目标**: Pulse-Nightly-06 扩展至 12+ 链, 增加 mobile→api、tob-web→api 反向链

## 🟡 P1 · 阻塞级 (已知持续问题)

### P1-001: @m5/ui build fail (Pulse-59 标记)
- **注意**: Pulse-60/Pulse-61/Pulse-65/Pulse-Nightly-03 均未再次触发构建,状态待验证
- **状态**: ⏳ 待后续脉冲验证

### P1-002: queue.role-extended.test.ts + transactions.role-extended TS errors ✅ 已闭环 (Pulse-63)
- **状态**: ✅ 已验证闭环

---

## 🟢 P2 · 智能化阶段新债务 (Pulse-65 新增 · Stage F 前置)

### TD-001: LLM API 成本控制 (Phase-19 前置)
- **类型**: 成本风险
- **发现**: Pulse-65 (2026-06-25)
- **风险**: AI Code Reviewer + Auto E2E Generator 调用 LLM,无预算上限可能爆成本
- **缓解**:
  - 设置月度预算上限 ($1000/月 初始)
  - 常用 prompt 缓存 (命中率 ≥60%)
  - 简化模型 fallback (便宜模型优先)
- **负责人**: W6-L4 SRE + Champion
- **优先级**: 高 (Phase-19 Kickoff 前必须解决)
- **进度**: 🟡 Pulse-66 后台调研中 (LLM 模型对比 + 成本估算)

### TD-002: AI Review 准确率阈值 (Phase-19 验收)
- **类型**: 质量门禁
- **发现**: Pulse-65 (2026-06-25)
- **风险**: AI Review 准确率 < 70% 会引入大量 false positive,降低团队信任
- **缓解**:
  - 上线前必须有 ≥100 个 PR 训练集测试
  - 准确率 < 70% 自动回滚到人工 review
  - 持续监控 false positive rate
- **负责人**: W5-L3 QA + W6-L3 SRE
- **优先级**: 高

### TD-003: 知识库格式 CI 检查 (Stage E 收尾)
- **类型**: 流程债务
- **发现**: Pulse-65 (2026-06-25)
- **问题**: `knowledge/` 22 文件暂无统一格式检查,文件命名/链接可能漂移
- **缓解**:
  - Pulse-67 写 `lint-knowledge.py` 脚本
  - pre-commit hook 检查命名规范 (kebab-case.md, DR-NNN-*.md 等)
  - CI 检查内部链接有效性
- **负责人**: W8-L3 DevOps
- **优先级**: 中
- **进度**: 🟡 Pulse-66 后台研发中

### TD-004: 专家自评分机制 (Stage G 前置)
- **类型**: 机制债务
- **发现**: Pulse-65 (2026-06-25)
- **问题**: 40 专家评级目前靠 main agent 手动调整,扩展性差
- **缓解**:
  - Pulse-70 满月时启动自评分机制
  - 每个专家每周自动总结产出 + 同伴评分
  - 评级调整需 ≥2 Champion 确认
- **负责人**: main agent + Champion
- **优先级**: 中

---

## 🚦 双线并行债务追踪 (Pulse-66 新增)

### 双线 A: Phase-17 业务主线
- **Owner**: E4 张营销 + E16 社群 + E15 内容
- **核心**: 跨门店优惠券 (E40 P0) + 营销触发 + 社群裂变 + 渠道招商
- **时间**: Pulse-68 Kickoff → Pulse-70 收尾
- **债务来源**: RFC R6 (已通过)

### 双线 B: Phase-19 智能化后台线
- **Owner**: E5 赵数据 + E9 吴AI + W6-L4 SRE
- **核心**: AI Code Reviewer + RAG + LLM 成本控制 + 知识库 CI
- **时间**: Pulse-66 后台准备 → Phase-19 Kickoff (2026-07-09)
- **债务来源**: TD-001 ~ TD-004

### 同步债务
- **P0-004**: Approver 招募 (Pulse-66 前台)
- **Pulse-66 后台调研**: 4 任务 (LLM 选型 / RAG 设计 / extract-knowledge 增强 / lint-knowledge 创建)

---

## 📊 脉冲 #146 (2026-07-06 03:07) 新增发现

### P0-009: @m5/storefront-web ai-decisions 页面 TSC 27 errors 🆕
- **发现**: 脉冲 #146 (2026-07-06 03:07)
- **来源**: @m5/ui AiDecisionPanel 类型重构后，storefront-web ai-decisions 页面仍使用旧废弃类型 (`RuleExecutionResult`/`RuleExecutionSummary`)
- **问题**: 2 个文件 `apps/storefront-web/app/ai-decisions/page.tsx` 和 `apps/storefront-web/app/ai-decisions/[id]/page.tsx` 共 27 处 TSC error
  - `DecisionRuleResult` 不再有 `id`/`name`/`status`/`matchedCount`，改为 `ruleId`/`ruleName`/`triggered`/`confidence`/`detail`
  - `AiDecisionPanelProps` 改为 `{ variant, config }` 而非 `{ rules, summary }`
- **状态**: 🐜 树哥 #1 已派修
- **升级条件**: 下个脉冲仍 >0 error → 人工关注

## 📊 Pulse-Nightly-07 (2026-07-01 03:30) 新增发现

### P1-015: 国际化深度测试覆盖 6 locale 尚缺 kn-IN/bn-BD/locale
- **发现**: Pulse-Nightly-07 链14 编写时发现
- **问题**: 链14 仅覆盖 6 种 locale（zh-CN/en-US/ja-JP/ko-KR/th-TH/vi-VN），未覆盖印度(kn-IN)、孟加拉(bn-BD)等南亚区域
- **严重程度**: 🟡 P3
- **修复方向**: 后续链扩展至 8+ locale

### P1-016: 大数据量测试使用模拟估算而非真实性能采集
- **发现**: Pulse-Nightly-07 链15 编写
- **问题**: 链15 的性能估算（`domainEstimateProcessing`）使用模拟的 2ms/item 和 256 bytes/item，非真实压测数据
- **影响**: 性能基准仅为理论值，无法反映生产环境实际表现
- **严重程度**: 🟡 P3
- **修复方向**: 引入真实性能指标采集或 Playwright performance API

### P1-017: 幂等性测试仅 in-memory 无外部存储模拟
- **发现**: Pulse-Nightly-07 链13/15 编写
- **问题**: 幂等性验证完全基于 in-memory Map，未模拟 Redis/DB 层的原子性和持久性
- **影响**: 幂等性仅验证逻辑层面，无法发现基础设施层问题
- **严重程度**: 🟡 P2
- **修复方向**: Pulse-Nightly-10 引入带有模拟 Redis/DB 的幂等性测试

## 📊 Pulse-Nightly-09 (2026-07-07 03:30) 新增发现

### P1-018: 测试链共享数据隔离不足
- **发现**: Pulse-Nightly-09 链16 调试
- **问题**: 跨模块 E2E 链共享 in-memory 仓储, 前序 test 的副作用(库存扣减/状态变化)传播到后续 test, 导致后置断言预期值错位
- **影响**: 测试链顺序耦合, 修改前序 test 可能波及后续 test
- **严重程度**: 🟡 P2
- **修复方向**: Pulse-Nightly-10 为链01-15 引入 resetStore() 或每个独立场景使用独立数据实体

### P1-019: 测试执行时间未追踪
- **发现**: Pulse-Nightly-09 复盘
- **问题**: 18 链(207 subtests) 总执行时间~3-4ms, 但复杂链(链14:22/链15:18/链18:26 subtests)无性能退化基线
- **影响**: 新增复杂链时无法感知执行时间退化
- **严重程度**: 🟢 P3
- **修复方向**: Pulse-Nightly-10 加入每链执行时间日志, 建立基线

### P1-020: 缺少故障注入场景
- **发现**: Pulse-Nightly-09 复盘
- **问题**: 18 链均使用函数级 mock, 未覆盖外部依赖故障(DB down/网络中断/超时)
- **影响**: 系统韧性未验证
- **严重程度**: 🟡 P2
- **修复方向**: Pulse-Nightly-10 新增链19 故障注入测试

### Pulse-Nightly-09 存档
- **状态**: ✅ L3 跨模块 E2E 扩展 15→18 链 ✅ 复盘改进 ✅ 进化赋能
- **新增链**: 链16 Admin→Storefront→Mobile→API→Domain→SDK (SKU生命周期·23subtests)、链17 Miniapp→Domain→Admin→Tob-Web (消息推送+通知治理·21subtests)、链18 Mobile→API→Domain→API→Storefront (退款全流程+极限场景·26subtests)
- **总测试数**: **18 链, 207 subtests, 0 fail** ✅ (+70 subtests, +3 chains)
- **新增模式**: SKU全链路+缓存一致性、消息推送+通知治理、退款全流程状态机+极限场景
- **知识库更新**: expert-insights/ E27+E28、e2e-pattern.md (3种新模式+共享状态新注意事项)、lessons-learned/pulse-nightly-09.md
- **新债务**: P1-018(共享数据隔离)、P1-019(执行时间追踪)、P1-020(故障注入)
- **闭环债务**: 0 (未闭环既有债务)

## 📊 Pulse-Nightly-06 (2026-06-30 05:30) 新增发现 — 已存档

### P1-012: 共享状态测试隔离不足 ⚡ Pulse-Nightly-07 部分解决
- **发现**: Pulse-Nightly-06
- **严重程度**: 🟡 P2 → 🔄 进展中
- **Pulse-Nightly-07 解决**: 链13 引入 resetConcurrentStore()
- **下一步**: 为链01-12 逐一引入 reset*Store() 清理

### P1-013: 数据管道链缺少性能基准 ✅ Pulse-Nightly-07 解决
- **发现**: Pulse-Nightly-06
- **Pulse-Nightly-07 解决**: ✅ 链15 大数据量 18 subtests
- **状态**: ✅ **已解决**

### P1-014: 缺少多渠道并发一致性场景 ✅ Pulse-Nightly-07 解决
- **发现**: Pulse-Nightly-06
- **Pulse-Nightly-07 解决**: ✅ 链13 并发 11 subtests
- **状态**: ✅ **已解决**

---

## 📊 Pulse-Nightly-05 (2026-06-29 05:30) 新增发现

### P1-009: Mobile/Tob-Web 零单元测试覆盖
- **发现**: Pulse-Nightly-05 复盘分析
- **问题**: mobile (Expo) 和 tob-web (Next.js) 虽有 E2E 跨模块测试链(链08/09)，但底层没有任何 `.test.ts` 单元/集成测试文件
- **影响**: 底层逻辑无法通过脉冲快速验证，bug 逃逸风险高
- **严重程度**: 🟡 P1
- **修复方向**: Pulse-Nightly-06 为 mobile/tob-web 创建首条单元测试链

### P1-010: 反向链路 E2E 不足
- **发现**: Pulse-Nightly-05 复盘
- **问题**: 9 条跨模块 E2E 链中仅 1 条(链07)不以 admin-web 为起点
- **影响**: admin-web→其他模块的链路已验证充分，但其他模块→admin-web/API 的反向链路覆盖不足
- **严重程度**: 🟡 P1
- **修复方向**: Pulse-Nightly-06 增加 mobile→api→domain 和 tob-web→api→domain 反向链

### P1-011: 测试命名规范不统一
- **发现**: Pulse-Nightly-05 编写跨模块测试时发现
- **问题**: admin-web 现有测试中命名格式不一致——部分用 `describe('中文描述')`，部分用 `describe('[L3-E2E] 中文')`，部分用英文
- **影响**: 测试报告可读性和检索性降低
- **严重程度**: 🟡 P1
- **修复方向**: 建立 lint 规则统一使用 `describe('[L3-E2E] 模块: 场景描述')` 格式

---

## 📦 Pulse-Nightly-04 (2026-06-28 03:32) 存档

### P1-007: 跨模块 E2E 角色权限场景薄弱 ✅ Pulse-Nightly-05 解决
- **发现**: Pulse-Nightly-04 链06 构建
- **Pulse-Nightly-05 解决**: 
  - 链09 新增 6 种角色 (super_admin/tenant_admin/store_manager/finance_viewer/report_viewer/operator) × 9 模块 RBAC 矩阵
  - **已覆盖角色**: consumer/merchant/admin/finance/operator/super_admin/tenant_admin/store_manager/finance_viewer/report_viewer = **10 种角色**
- **状态**: ✅ 已解决（Pulse-Nightly-05 闭环）

### P1-008: 市场引导缺少多租户国际化深度测试
- **发现**: Pulse-Nightly-04 链04 构建
- **问题**: 市场引导仅覆盖 zh-CN/en-US/ja-JP/es-US，缺少更多 locale (ko-KR/th-TH/vi-VN 等东南亚市场)
- **影响**: 亚洲多国扩展时可能出现国际化缺失
- **严重程度**: 🟡 P1
- **修复方向**: 链04 扩展语言覆盖至 8+ locale

### P2-005: 跨模块测试文档未同步到 knowledge 测试知识库
- **发现**: Pulse-Nightly-04
- **问题**: 链04-06 编写模式延续链01-03 但未更新到 knowledge/best-practices/e2e-pattern.md
- **修复方向**: ✅ Pulse-Nightly-04 已同步更新

## 存档

### Pulse-Nightly-07 (2026-07-01 03:30)
- **状态**: ✅ L3 跨模块 E2E 扩展 12→15 链 ✅ 复盘改进 ✅ 进化赋能 ✅ 并发+大数据+国际化
- **新增链**: 链13 Mobile+Storefront→API→Domain（并发·11 subtests）、链14 Miniapp→SDK→API→Domain（国际化·22 subtests）、链15 Admin→API→Domain（大数据+幂等·18 subtests）
- **总测试数**: **15 链, 137 subtests, 0 fail** ✅ (+51 subtests, +3 chains)
- **新增模式**: 多渠道并发一致性、国际化深度(6 locale)、大数据量性能基准、幂等性深度
- **知识库更新**: expert-insights/ E25+E26、e2e-pattern.md（3 种新链模式）、lessons-learned/pulse-nightly-07.md
- **闭环债务**: P1-013（✅ 大数据性能基准）、P1-014（✅ 并发一致性）、P1-012（🔄 部分进展）
- **新债务**: P1-015（国际化扩展至 kn-IN/bn-BD）、P1-016（大数据量非真实性能）、P1-017（幂等性外部存储）

### Pulse-Nightly-06 (2026-06-30 05:30)
- **状态**: ✅ L3 跨模块 E2E 扩展 9→12 链 ✅ 复盘改进 ✅ 进化赋能
- **新增链**: 链10 Mobile→API→Domain→Admin（反向·13 subtests）、链11 Tob-Web→SDK→API→Domain→Admin（配额·11 subtests）、链12 Admin→API→Domain→Storefront→Analytics（数据管道·11 subtests）
- **总测试数**: 12 链, 86 subtests, 0 fail ✅
- **新增模式**: Mobile反向链路、企业配额+SDK事件、数据管道+多维聚合
- **知识库更新**: expert-insights/ E23+E24、e2e-pattern.md（3 种新链模式）、lessons-learned/pulse-nightly-06.md
- **新债务**: P1-012（共享状态隔离不足）、P1-013（无性能基准）、P1-014（无并发场景）
- **闭环债务**: P1-009 部分完成（E2E 穿透）、P1-010 完成（反向链路 1→3）、P1-011 统一命名

### Pulse-Nightly-05 (2026-06-29 05:30)
- **状态**: ✅ L3 跨模块 E2E 扩展 6→9 链 ✅ 复盘改进 ✅ 进化赋能
- **新增链**: 链07 Miniapp→SDK→API→Domain, 链08 Admin→Domain→Mobile→Storefront, 链09 Admin→API→Domain→Tob-Web
- **总测试数**: 9 链, 51 subtests, 0 fail ✅
- **模块覆盖**: 4/6→6/6 apps全覆盖 ✅
- **知识库更新**: expert-insights/ E21/E22 + e2e-pattern.md 3种新模式
- **新债务**: P1-009（Mobile/Tob-Web零单元测试）、P1-010（反向链路不足）、P1-011（命名规范不统一）
- **闭环债务**: P1-007（角色权限场景）、P1-006（进展中）

### Pulse-Nightly-04 (2026-06-28 03:32)
- **状态**: ✅ L3 跨模块 E2E 扩展 3→6 链 ✅ 复盘改进 ✅ 进化赋能
- **新增链**: 链04 市场引导, 链05 营销活动, 链06 认证授权
- **总测试数**: 6 链, 26 subtests, 0 fail ✅
- **知识库更新**: expert-insights/ + best-practices/e2e-pattern.md
- **新债务**: P1-007（角色权限不足）、P1-008（国际化深度不足）、P2-005 resolved

### Pulse-66 (2026-06-26)
- **状态**: 🟡 进行中 (双线并行)
- **前台**: Stage E 收尾 (debt.md + retro + 招募 Approver)
- **后台**: Phase-19 调研中 (4 子任务)
- **新债务**: P0-005 (E40 P0 跨门店优惠券)

### Pulse-65 (2026-06-25)
- **状态**: ✅ Stage E 启动 + commit d4b418ecc
- **闭环**: 7 子库 + 22 文件 + dev-roadmap.md + intelligence-engine.md
- **新债务**: P0-004 (招募 Approver) + TD-001~004 (智能化阶段)

### Pulse-64 (2026-06-25)
- **状态**: ✅ **0 fail + TSC 0 error** + V5.1 40 专家团
- **闭环**: experts/ + docs/process/ + rfcs/voting/

### Pulse-63 (2026-06-25)
- **状态**: ✅ P0-002 闭环 (5 处 assertion 修复)
- **闭环**: app-journey 25/25 pass 123ms

### Pulse-60 (2026-06-25 00:07)
- **状态**: ✅ **0 fail + TSC 0 error** (全绿)
- **闭环**: Pulse-59 22 fail → 全绿 ✅ / queue TS2339 → 修复
- **P0-001 关闭**: 22 fail 回归已全部修复闭环

### Pulse-59 (2026-06-24 21:14)
- **发现回归**: 22 fail 大范围回归 + TSC 10 error
- **修复**: 3只树哥 + 1次手动修复 → Pulse-60 全绿

### Pulse-58 (2026-06-24 08:37)
- **状态**: ✅ **0 fail** (全量 11224 tests 全绿) + TSC 全绿

### Pulse-57 (2026-06-23 19:58)
- tournament simulator 2 fails → 已修复并闭环 ✅