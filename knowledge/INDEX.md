# 知识库索引 (knowledge/INDEX.md)

> 创建: Pulse-65 (2026-06-25)
> 最后更新: 2026-07-01 (Pulse-Nightly-07)
> 目标: **结构化沉淀所有 phase 经验 + 专家洞察 + 决策记录,赋能后续开发**
> 详细路线: [dev-roadmap.md](../dev-roadmap.md)

## 📊 知识库快照 (Pulse-Nightly-07)

| 子库 | 条目数 | 最新更新 |
|------|:------:|---------|
| lessons-learned | **17** | pulse-nightly-07.md (今日凌晨) |
| patterns | 18 | e2e-pattern.md +3模式 (Pulse-Nightly-07) |
| anti-patterns | 49 | v4 体系持续 |
| expert-insights | **11** (E1~E26) | insight-2026-07-01.md (今日凌晨) |
| decision-records | 8 (DR-001~DR-008) | — |
| best-practices | **20** | e2e-pattern.md (+3 模式: 并发/国际化/大数据) |
| automations | README | — |

---

## 📚 7 个子库

### 1. [lessons-learned/](lessons-learned/) · 经验教训
每个 phase 完成的 retro 中产出的关键教训,按 phase 组织。
- 格式: `phase-XX.md`
- 内容: 3-5 条 lessons learned,关联到对应 `experts/E*.md` 反馈日志

### 2. [patterns/](patterns/) · 设计模式
经过 phase 实施验证的优秀设计模式,可复用。
- 格式: `pattern-name.md`
- 内容: 适用场景 + 实现示例 + 注意事项 + 关联 phase

### 3. [anti-patterns/](anti-patterns/) · 反模式
踩过的坑,作为反面教材,避免重复犯错。
- 格式: `anti-pattern-name.md`
- 内容: 错误表现 + 根因 + 正确做法 + 关联 phase

### 4. [expert-insights/](expert-insights/) · 专家洞察
40 人专家团 standup / Weekly Memo / Emergency Veto 反馈整合。
- 格式: `insight-YYYY-MM-DD.md`
- 内容: 业务关切 + 技术影响 + 处理方案

### 5. [decision-records/](decision-records/) · 决策记录 (ADR)
重大架构决策,包括 RFC 投票结果。
- 格式: `DR-NNN-title.md`
- 内容: 背景 + 决策 + 理由 + 后果

### 6. [best-practices/](best-practices/) · 最佳实践
编码规范、测试规范、提交规范等。
- 格式: `topic-name.md`
- 内容: 规则 + 示例 + 反例

### 7. [automations/](automations/) · 自动化脚本
重复任务的脚本化 (生成/检测/修复)。
- 格式: `script-name.{py,sh,ts}`
- 内容: 脚本本身 + README.md 说明

---

## 🔄 自动化机制

每个 phase 完成后,自动执行以下提取:

1. **lessons-learned**: 提取 retro 中 lessons learned → `phase-XX.md`
2. **anti-patterns**: 提取修复过程中的根因 → `anti-pattern-XXX.md`
3. **decision-records**: 重大决策 → `DR-NNN.md`
4. **expert-insights**: standup 专家发言 → `insight-YYYY-MM-DD.md`
5. **patterns**: 重复出现的成功设计 → `pattern-name.md`

详见 [automations/extract-knowledge.py](automations/extract-knowledge.py) (Pulse-65 创建)

---

## 📊 当前内容 (Pulse-65 启动)

| 子库 | 文件数 | 内容 |
|---|---|---|
| lessons-learned | 3 | Phase-15, Phase-16, Pulse-63 |
| patterns | 3 | quota-guard, lifecycle-guard, reserve-rollback |
| anti-patterns | 4 | native-vs-app-prefix, mock-fetch-leak, test-name-strict-match, exit-hook-hack |
| expert-insights | 1 | Pulse-64 standup |
| decision-records | 3 | DR-001 多租户守卫, DR-002 V5.1 专家团, DR-003 Phase-19 智能化 |
| best-practices | 3 | testing, commit, e2e-pattern |
| automations | 2 | extract-knowledge.py, knowledge-stats.py |

---

## 🔗 关联文档

- [dev-roadmap.md](../dev-roadmap.md) · 总路线图
- [dev-evaluation.md](../dev-evaluation.md) · 综合评估
- [experts/INDEX.md](../experts/INDEX.md) · 40 专家档案
- [debt.md](../debt.md) · 债务追踪