# 🎯 盲盒引擎 P0 修复合规审计清单

> **宪法级·仅追加无删除**
> 创建日期: 2026-07-07
> 审计团队: E36卫审计 + E38沈监管 + E6刘合规 + E2李安全
> 适用: 盲盒引擎源码重构（apps/api/src/modules/blindbox/）

---

## 一、背景

盲盒引擎当前实现存在 **9项合规违规** 和 **7项安全风险**，全部归类为 **P0（致命偏离）**。该清单作为盲盒系统修复必须通过的合规审计门槛。

## 二、合规审计检查项（11项）

### CHK-B1: 概率引擎 Redis Lua 原子操作

| 属性 | 内容 |
|------|------|
| 原始要求 | BS-0267 · ARC-05 · SEC-05 |
| 当前状态 | ❌ 未实现 — 使用 `Math.random()` 内存态计算 |
| 风险等级 | **CRITICAL** |
| 风险说明 | 内存态概率计算重启后丢失; 无法保证并发时概率一致性; 存在概率篡改风险 |
| 验收标准 | Redis Lua 脚本实现: `EVALSHA` 原子执行, 包含概率表校验、pity 计数器、库存扣减 |
| 涉及文件 | `blindbox.service.ts` 中的 `selectTier()` 和 `executeDraw()` |
| 审计人 | E2李安全 + E36卫审计 |

### CHK-B2: 四档概率公示 + 监管校验

| 属性 | 内容 |
|------|------|
| 原始要求 | ARC-05 (70%+20%+8%+2%) · E38洞察1 |
| 当前状态 | ⚠️ 部分实现 — `getProbability公示()` 方法存在但未做概率和值验证 |
| 风险等级 | **HIGH** |
| 风险说明 | 概率和不等于100%时无告警; 概率变更无审批流程; 概率公示未关联监管报告 |
| 验收标准 | 创建/修改计划时强制校验: `sum(tier.probability) === 1`; 概率变更记录审计日志; 自动生成概率公示报表 |
| 涉及文件 | `blindbox.service.ts`, `blindbox.controller.ts` |
| 审计人 | E38沈监管 + E6刘合规 |

### CHK-B3: 端盒12不重 + 必含1隐藏

| 属性 | 内容 |
|------|------|
| 原始要求 | ARC-05 (12不重复 + 必含1隐藏) |
| 当前状态 | ❌ 未实现 — `drawBatch10` 只是循环10次独立抽取, 无去重逻辑 |
| 风险等级 | **HIGH** |
| 风险说明 | 端盒消费者可能抽到12个重复奖品, 违反产品承诺和消费者权益 |
| 验收标准 | 批量抽取时维护已抽prizeId集合, 强制不重复; 端盒中至少含1个稀有/隐藏款; 库存不足时拒绝抽取 |
| 涉及文件 | `blindbox.service.ts` 中的 `drawBatch10()` |
| 审计人 | E36卫审计 + E6刘合规 |

### CHK-B4: 购买限额（单日/月度）

| 属性 | 内容 |
|------|------|
| 原始要求 | SEC-06 (月上限¥2000) · E38洞察1 (单日中级/高级≤20) |
| 当前状态 | ❌ 未实现 — 无任何消费限额检查 |
| 风险等级 | **CRITICAL** |
| 风险说明 | 用户可无限购买, 违反市场监管要求, 月消费超¥2000风险 |
| 验收标准 | Redis 原子计数器: `INCR user:${userId}:daily:${date}` + `INCR user:${userId}:monthly:${month}`; 超出限额时直接拒绝; 限额配置可动态调整 |
| 涉及文件 | `blindbox.service.ts` 的 `drawSingle()` 和 `drawBatch10()` |
| 审计人 | E38沈监管 + E6刘合规 |

### CHK-B5: 冷静期 + 7天退款机制

| 属性 | 内容 |
|------|------|
| 原始要求 | SEC-06 (高价>200元7天退货) · E38洞察1 |
| 当前状态 | ❌ 未实现 — 无退款逻辑 |
| 风险等级 | **HIGH** |
| 风险说明 | 高价盲盒无退款机制违反《盲盒经营行为规范指引》; 未开盒状态下消费者应享7天无理由 |
| 验收标准 | 未开盒盲盒7天无理由退款; 已开盒不退; 退款接口增加 `coolingOffPeriod` 校验; 退款日志记录审计 |
| 涉及文件 | `blindbox.service.ts`, 联动 `finance/payment-gateway` |
| 审计人 | E36卫审计 + E6刘合规 |

### CHK-B6: 实名等级校验

| 属性 | 内容 |
|------|------|
| 原始要求 | E38洞察4 (未成年保护) · E38洞察1 |
| 当前状态 | ❌ 未实现 — `drawSingle()` 和 `drawBatch10()` 无实名检查 |
| 风险等级 | **CRITICAL** |
| 风险说明 | 未成年人可随意购买高级盲盒; 未满8岁理论上应禁止消费; 8-16岁单次限额 |
| 验收标准 | 抽取前调用会员实名等级接口; `实名等级 >= 2` 方可购买>¥200盲盒; 未认证用户自动降级为¥50以下 |
| 涉及文件 | `blindbox.service.ts`, 联动 `member` / `auth` 模块 |
| 审计人 | E38沈监管 + E2李安全 |

### CHK-B7: 概率变更审计日志

| 属性 | 内容 |
|------|------|
| 原始要求 | E36洞察2 (API审计) · BS-0178 |
| 当前状态 | ❌ 未实现 — `createPlan()` 无审计日志 |
| 风险等级 | **HIGH** |
| 风险说明 | 概率被篡改后无法追溯操作人和时间; 监管检查时数据不可信 |
| 验收标准 | 每次创建/修改/删除盲盒计划记录AuditLog; 记录包含: `actorId`, `eventType='admin.config_change'`, `resourceType='blindbox_plan'`, `metadata={before, after probabilities}` |
| 涉及文件 | `blindbox.service.ts` → `createPlan()`, 联动 `audit/audit.service.ts` |
| 审计人 | E36卫审计 + E2李安全 |

### CHK-B8: 数据库持久化

| 属性 | 内容 |
|------|------|
| 原始要求 | 所有业务数据必须持久化 |
| 当前状态 | ❌ 未实现 — `private plans: Map<>`、`records: Map<>`、`pityCounters: Map<>` 全部内存存储 |
| 风险等级 | **CRITICAL** |
| 风险说明 | 服务重启后所有盲盒计划/抽取记录/保底计数器全部丢失; 业务数据不可恢复 |
| 验收标准 | Plan数据存入 PostgreSQL `blindbox_plans` 表; DrawRecord存入 `blindbox_draw_records` 表; PityCounter存入Redis; 保证数据库持久化 |
| 涉及文件 | `blindbox.service.ts`, 新增 `blindbox.repository.ts` |
| 审计人 | E36卫审计 |

### CHK-B9: 单元测试覆盖

| 属性 | 内容 |
|------|------|
| 原始要求 | 质量门禁 |
| 当前状态 | ⚠️ 部分覆盖 — 已有 `blindbox.test.ts`, `blindbox.controller.test.ts`, `blindbox.dto.test.ts` |
| 风险等级 | **MEDIUM** |
| 风险说明 | 现有测试未覆盖合规场景: 限额测试/实名测试/端盒测试/概率公示测试 |
| 验收标准 | 新增测试: 限额拒绝场景、实名拒绝场景、端盒保底场景、概率和=1校验; 测试覆盖合规代码路径 ≥ 80% |
| 涉及文件 | `blindbox.test.ts`, `blindbox.role.test.ts` |
| 审计人 | E36卫审计 |

### CHK-B10: API 速率限制 + 防刷

| 属性 | 内容 |
|------|------|
| 原始要求 | SEC-04 (暴力破解5次锁定) · E2洞察1 (积分/券防刷) |
| 当前状态 | ❌ 未实现 — `draw` 接口无速率限制 |
| 风险等级 | **HIGH** |
| 风险说明 | 恶意请求可批量抽空奖池; 无频率限制可滥发API |
| 验收标准 | `/blindbox/:planId/draw` 接口: 同一 user 每秒≤2次、每分钟≤30次; 使用 Redis `INCR` + `EXPIRE`; 超限返回 `429 Too Many Requests` |
| 涉及文件 | `blindbox.controller.ts`, 联动 `gateway/rate-limiter` |
| 审计人 | E2李安全 |

### CHK-B11: P0-P3 推送分级联动

| 属性 | 内容 |
|------|------|
| 原始要求 | CX-02 (P0-P3四级推送) |
| 当前状态 | ❌ 未实现 — push.service.ts 只有 `high/normal` 两档 |
| 风险等级 | **HIGH** |
| 风险说明 | 盲盒开盒结果推送无法归入P2-P3级; 高频推送违反疲劳度保护规则 |
| 验收标准 | 盲盒抽取结果推送必须标记为P3级; 推送前检查疲劳度; 每日P2+P3推送≤1条 |
| 涉及文件 | `blindbox.service.ts`, `push/push.entity.ts`, `push/push.service.ts` |
| 审计人 | E6刘合规 |

---

## 三、检查结果模板

每个PR提交前, 开发人必须填写以下通过状态:

```markdown
## 盲盒引擎合规审计 - 自检表

| 检查项 | 状态 | 备注 |
|:------:|:----:|------|
| CHK-B1 | ❌/🔄/✅ | Redis Lua实现概率原子操作 |
| CHK-B2 | ❌/🔄/✅ | 概率公示+和值校验+审计日志 |
| CHK-B3 | ❌/🔄/✅ | 端盒12不重+1隐藏 |
| CHK-B4 | ❌/🔄/✅ | 单日/月度限额 |
| CHK-B5 | ❌/🔄/✅ | 冷静期7天退款 |
| CHK-B6 | ❌/🔄/✅ | 实名等级校验 |
| CHK-B7 | ❌/🔄/✅ | 概率变更审计日志 |
| CHK-B8 | ❌/🔄/✅ | 数据库持久化 |
| CHK-B9 | ❌/🔄/✅ | 合规测试覆盖 |
| CHK-B10 | ❌/🔄/✅ | API速率限制防刷 |
| CHK-B11 | ❌/🔄/✅ | P3推送分级+疲劳度 |
```

**通过条件**: 11项全部 ✅ 方可合并

---

## 四、执行路线

| 优先级 | 检查项 | 建议 | 期望工时 |
|:------:|:------:|------|:--------:|
| P0-紧急 | CHK-B8 数据库持久化 | 数据库先行, 否则Plan/记录全丢失 | 4h |
| P0-紧急 | CHK-B4 购买限额 | 跨请求安全, 否则违法规 | 2h |
| P0-紧急 | CHK-B6 实名校验 | 保护未成年人, 否则违法 | 3h |
| P0-紧急 | CHK-B1 Redis Lua | 概率一致性, 否则AB测试不可信 | 4h |
| P1-重要 | CHK-B3 端盒保底 | 产品承诺, 否则用户体验差 | 3h |
| P1-重要 | CHK-B7 审计日志 | 追溯能力, 否则监管检查无数据 | 2h |
| P1-重要 | CHK-B10 速率限制 | 防滥用, 否则被刷 | 1h |
| P2-常规 | CHK-B2 概率和校验 | 数据质量 | 1h |
| P2-常规 | CHK-B5 退款机制 | 消费者权益 | 3h |
| P2-常规 | CHK-B9 测试覆盖 | 质量门禁 | 2h |
| P2-常规 | CHK-B11 推送分级 | 用户体验 | 2h |

---

## 五、关联

- [R17 前置准入清单](../docs/operations/r17-pre-access-checklist.md)
- [R19 Compliance报告机制](../docs/operations/r19-compliance-report-mechanism.md)
- [反模式库 AM-001~AM-016](../docs/knowledge/patterns-anti-patterns.md)
- [BS编号体系](../.trae/compliance/bs-catalog.json) — BS-0038/BS-0267/BS-0138
- [盲盒源码](../apps/api/src/modules/blindbox/)
- [推源码](../apps/api/src/modules/push/)
- [审计源码](../apps/api/src/modules/audit/)

## 六、修改记录

| 日期 | 修改人 | 内容 |
|:----:|:------:|------|
| 2026-07-07 | 监督组(E36+E38+E6+E2) | 初版 — 基于盲盒引擎源码审查的11项合规审计清单 |
