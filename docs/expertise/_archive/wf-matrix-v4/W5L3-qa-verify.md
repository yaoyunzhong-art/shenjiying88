# 专家 W5L3 · 测试/QA / verify

## 元数据
- **W (工作流)**: W5 - 测试/QA
- **L (阶段)**: L3 - 验证阶段:e2e + 性能 + 安全扫描
- **创建**: 2026-06-25 · Pulse-62
- **状态**: ✅ **已激活** (Pulse-63)

---

## 当前技能 (Skills)
- ✅ Skill 1: Node test runner 行为诊断 (掌握度 85%) — sync/async test, `--test-name-pattern` regex, describe 嵌套 skip 行为, file-level root test lifecycle
- ✅ Skill 2: assertion debugging by reverse-engineer (掌握度 80%) — 当 test 行为不符预期,从源 (market-bootstrap.ts) 反向定位正确 expected value
- ✅ Skill 3: Node 22.x test runner timeout 模式识别 (掌握度 75%) — 区分 "活跃句柄泄漏" vs "assertion 失败导致 hang file-level root"
- ⏳ Skill 4: bisect by describe-block (学习中) — 用 `--test-name-pattern` 配合多 pattern 拆解哪一块卡住

---

## 决策历史 (Decision History)
| 日期 | Pulse | 任务 | 决策 | 理由 |
|---|---|---|---|---|
| 2026-06-25 | Pulse-63 | P0-002 app-journey 66s | 修正 5 处 assertion 前缀 (`native-`→`app-` / `NATIVE-`→`APP-`) | 真正根因不是活跃句柄,而是 assertion fail 导致 file-level hang |
| 2026-06-25 | Pulse-63 | P0-002 调试方法 | bisect by describe (单跑 / 2 describe / 5 describe) | 比 bisect by single test 更快定位 boundary cases describe 是元凶 |
| 2026-06-25 | Pulse-63 | hack 移除 | 删除 `process.on('beforeExit')` exit hook | 真 fix 后不再需要,留下会掩盖未来真问题 |
| 2026-06-25 | Pulse-63 | miniapp/app 前缀一致性 | miniapp `x-m5-ticket-code`/`x-m5-idempotency-key` 是正确签名头,app-journey 写成 `x-m5-nonce`/`x-m5-timestamp` 是孤立错误 | 跨 app 对齐测试 assertion |

---

## Anti-patterns (踩过的坑)
- ❌ **AP-1**: 看到 `test timed out after 30000ms` 就认为是活跃句柄泄漏。**真实情况**:Node 22.x test runner 在 sync test body 内 `assert.ok(false)` 抛出 AssertionError 时,file-level root test 的 `done()` callback 不被调用,触发 default 30s timeout。**修正方法**: 先单跑该 describe 内的 sync test 看是否 fail,而非加 `process.exit(0)` hack
- ❌ **AP-2**: 在 Node test runner 顶层加 `process.on('beforeExit', () => process.exit(0))` 强制退出。**危害**: 掩盖未来真问题 (e.g. async cleanup leak),应作为临时调试手段,真 fix 后立即移除
- ❌ **AP-3**: `--test-name-pattern='^test_name$'` 严格匹配 + describe 嵌套。**陷阱**: describe 内其他 test 被 skip,造成 file-level root test 状态不一致,可能误判 timeout。**推荐**: 使用 substring match 或 `--test-skip-pattern` 排除
- ❌ **AP-4**: 写 test 时凭印象写前缀 (e.g. `native-` vs `app-`),不看源函数返回。**修正**: 写新 test 前先 Read 源函数确认返回字符串格式

---

## 关联 RFC
- RFC DRAFT `agent-collaboration-rfc.md` 待审批: 5 项 (R1-R5),含 W5L3 验证流程标准化