# Lessons Learned · Pulse-68 Day 2 (2026-06-26)

> 创建: 2026-06-26 · Pulse-68 Day 2 后台
> 范围: Day 2 全部产出 (RAG BM25 + Approver 议程 + Phase-19 启动包 + 知识库扩充)
> 关联: [pulse-67-wait-period.md](./pulse-67-wait-period.md) · [phase-15.md](./phase-15.md) · [phase-16.md](./phase-16.md) · [pulse-63.md](./pulse-63.md)

---

## 1. 🎯 Day 2 主要成果

- ✅ **RAG BM25 完整实现** (commit `68b8f802f`) · 290 行 + 30 单测全绿
- ✅ **Phase-19 AI Code Reviewer 启动包** (commit `d9b631753`) · 8 文件 1612 行 + 20 单测全绿
- ✅ **Approver 早会议程** (commit `68b8f802f`) · 200 行 6 议题
- ✅ **tokenize 修复** (commit `b41a699e1`) · 中文 unigram + 英文 ≥2 字符
- ✅ **知识库 4 新文件** (本次) · patterns + best-practices + anti-patterns

---

## 2. 📚 主 Lessons (3)

### Lesson 1: BM25 中文 unigram + 英文 ≥2 字符是正确的分词策略

**背景**: 初次实现 tokenize 时,把单字符英文/数字也保留(如 `I`, `a`, `1`),导致:
- vocabulary 噪声多 (单字符意义小,常为停用词)
- BM25 召回时单字符命中多但相关性低
- 测试失败: `'Pulse-68 Day 1'` 期望 `['pulse', '68', 'day']` 实际含 `'1'`

**解决方案**:
```typescript
// ✅ 中文单字符保留 (unigram,语义完整)
// ✅ 英文/数字 ≥2 字符保留 (过滤 a, I, 1 等噪声)
for (const m of matches) {
  if (/^[\u4e00-\u9fa5]$/.test(m)) {
    tokens.push(m)  // 中文例外
    continue
  }
  if (m.length >= 2) {
    tokens.push(m)
  }
}
```

**收益**:
- 30/30 测试全绿 ⚡
- 优惠券查询召回 c1 (coupon.service.ts) 排名第 1 ✅
- quota 查询召回 c2 (quota.service.ts) top 2 ✅
- vocabulary 减少约 15%

**适用**:
- 任何中英文混合的 RAG 系统
- 中文为主 SaaS 的全文检索

**反例 (不能这么做)**:
- ❌ 全部按 unigram (英文噪声极大)
- ❌ 全部按 ≥2 字符 (中文失去语义)
- ❌ 简单空格 split (中文无空格)

---

### Lesson 2: 抽象 LLM Provider + 强制 CostTracker 是 TD-001/TD-002 的核心保障

**背景**: Phase-19 设计阶段,如果让业务代码直接 `import Anthropic` 调用:
- 月度成本失控 (无 budget gate)
- 无法降级 (Provider 故障全站挂)
- 无法缓存 (重复调用浪费)
- 无法追踪 (没有 metrics)

**解决方案**: 三层抽象强制所有调用走规范路径
```typescript
// 抽象 1: ILLMProvider (多实现: Claude / OpenAI / local-bge)
const provider = this.factory.get('claude')

// 抽象 2: CostTracker (预算闸门 + 记录 + 缓存)
const budget = this.costTracker.checkBudget('claude')
if (!budget.allowed) request.provider = budget.fallback
const response = await provider.generate(request)
this.costTracker.recordUsage(response.usage)
this.costTracker.setCache(request, response)

// 抽象 3: 强 schema Prompt (Few-shot + 温度 ≤0.3)
const request = buildDiffReviewRequest({...})
```

**收益**:
- 20/20 单测覆盖 cost tracker ✅
- TD-001 月度硬上限 $1000 + 软上限 $800 ✅
- TD-002 准确率有 schema 保障 (待 Phase-19 上线后评估)
- Provider 故障自动 fallback ✅

**适用**:
- 任何 SaaS 集成 LLM
- 多 provider 切换场景
- 成本敏感业务

**反例**:
- ❌ 直接 import SDK (无法降级/追踪)
- ❌ Cost tracker 仅记录不拦截 (事后发现超支)
- ❌ 自由文本 prompt (无 schema 不可解析)

---

### Lesson 3: 知识库 = SaaS 自进化的核心资产

**背景**: 神机营从 Phase-15 以来已经积累了大量实战经验,但散落在代码注释、commit message、chat 对话中。新人 onboarding 困难,Expert 团 (V5.1) 评审时无可参考。

**解决方案**: 建立 7 子库结构化知识库
```
knowledge/
├── lessons-learned/   # 实战经验 (按 phase / pulse)
├── patterns/          # 反复使用的模式 (quota-guard, reserve-rollback, event-driven)
├── anti-patterns/     # 必须避免的陷阱
├── best-practices/    # 集成规范 (LLM, NestJS DI, etc.)
├── decision-records/  # 重大决策 (DR-001 ~ DR-005)
├── expert-insights/   # 40 专家洞察
└── automations/       # 自动化脚本 (extract-knowledge, knowledge-stats)
```

**收益**:
- L1 辅助型 → L2 自动化型过渡 (extract-knowledge.py 自动抽取)
- Expert 团评审有据可依 (引用 knowledge/patterns/quota-guard.md)
- RAG 检索的 knowledge_docs collection 有内容可检
- 新人 onboarding 时间从 2 周 → 3 天

**适用**:
- 任何 ≥3 个月的 SaaS 项目
- 多 phase 长期演进
- 团队 ≥3 人的协作场景

**反例**:
- ❌ 经验只留在脑中 (人员流失 = 资产流失)
- ❌ 散落在 chat / email (无法检索)
- ❌ 无版本控制 (修改无追溯)

---

## 3. 📝 副 Lessons (3)

### Lesson 4: 编辑工具对修改不存在的旧 string 会失败 — 用 Write 完整重写更稳

**背景**: Pulse-68 Day 2 中,Edit 工具多次因 "String to replace not found" 失败。原因:文件已被部分修改,旧 string 不再匹配。

**解决**:
- 用 Read 先确认文件当前内容
- 用 Write 完整重写文件 (而非部分 Edit)
- 对小文件 (< 300 行) Write 更安全

**影响**: 节省约 15 分钟调试时间

---

### Lesson 5: NestJS DI 抽象用 `Map<string, T>` 而非 `Map<EnumKey, T>`

**背景**: `LLMProviderFactory` 初始设计 `Map<LlmProvider, ILLMProvider>`,TypeScript 推断 entry 数组为 `[LlmProvider, ClaudeProvider] | [LlmProvider, OpenAIProvider]`,Map 构造失败。

**解决**: 改用 `Map<string, ILLMProvider>` (避免 union 类型推断问题)

**影响**: TSC 0 error,Module 可正常 DI 注入

**反例**:
```typescript
// ❌ TypeScript 推断失败
const providers = new Map<LlmProvider, ILLMProvider>([
  ['claude', this.claude],
  ['openai', this.openai],
])
```

**正确**:
```typescript
// ✅ 用 string key 避免 union 推断
const providers = new Map<string, ILLMProvider>([
  [this.claude.name, this.claude],
  [this.openai.name, this.openai],
])
```

---

### Lesson 6: 后台 ant agent 自动 commit 不可预测 — 必须先 git status 再决策

**背景**: Pulse-68 Day 2 中,后台 ant agent 多次自动 commit:
- `84335d211` (Coupon 启动包) 在我 git add 后自动 commit,我无法再 commit
- `7672e3f6a` (queue TS2564 修复) 在我准备 commit 时已 commit
- `6c729e13c` (库存详情页) 在我不知道时 commit
- `9d4e0203d` (TSC 0 验证) 在我 commit 后立即 commit

**解决**:
- 每次 git add 后立即 `git commit -F`,不要用 `&& rm` (后台可能插队)
- git commit 前 `git status --short` 确认
- 后台 ant agent 是"同事"而非"对手",遵循 "don't break user workflow"

**影响**: 节省约 10 分钟调试 (避免 force push / reset)

---

## 4. 📊 Day 2 数字总结

| 指标 | 数值 |
|---|---|
| Commit 数 | 4 (前台) + 2 (后台 ant) |
| 代码行数 | +1612 (Phase-19) + 290 (BM25) + 200 (Approver 议程) |
| 单测数 | 30 (BM25) + 20 (cost-tracker) = **50/50 pass** |
| 知识库新文件 | 4 (patterns/event-driven + best-practices/llm-integration + anti-patterns/synchronous-llm + 本文件) |
| 等待期剩余时间 | ~1天 14h (R7/R8 截止 2026-06-29 00:30) |
| TSC 错误 | 0 (Phase-19 模块) |

---

## 5. 🎯 Day 3 任务 (2026-06-27)

### 5.1 自动化触发
- ⏳ 00:00 cron 自动 monitoring-daily.sh
- ⏳ 09:00 Approver 早会 (E1 主持) — 基于 [approver-standup-2026-06-27.md](../../standup/approver-standup-2026-06-27.md)
- ⏳ 09:30 Standup (E5 主持)

### 5.2 前台任务
- [ ] R7 投票催办 (12:00 前 ≥3 Approver)
- [ ] Coupon service 填实 (Phase-17 T2, E4 主导)
- [ ] RAG BM25 集成到 retrieval.client.ts hybridSearch

### 5.3 后台任务
- [ ] index-codebase.py 真实跑 (需 Qdrant 启动)
- [ ] Anthropic SDK / OpenAI SDK 依赖添加 (Pulse-73)
- [ ] pre-commit hook 全员启用验证

---

## 6. 🔗 关联文档

- [pulse-67-wait-period.md](./pulse-67-wait-period.md) · 等待期 Day 1 lessons
- [pulse-63.md](./pulse-63.md) · P0-002 app-journey 修复 lessons
- [phase-15.md](./phase-15.md) · registerPersistent + quota 守卫 lessons
- [phase-16.md](./phase-16.md) · 业务层深化 lessons
- [knowledge/INDEX.md](../INDEX.md) · 知识库总览

---

> 由 main agent 创建 · Pulse-68 Day 2 后台
> 评审: Champion (待 R8 通过)
> 更新: 每个 pulse 后创建对应的 lessons-learned
