# 🤖 智能化引擎与自我进化机制 (intelligence-engine.md)

> 创建: Pulse-65 (2026-06-25)
> 目标: **让 SaaS 系统不断学习 + 不断进化 + 高度智能化**
> 详细路线: [dev-roadmap.md](../dev-roadmap.md) · 决策记录: [DR-003](./decision-records/DR-003-intelligence-engine.md)

---

## 0. 🎯 三大目标

1. **开发能力可复制**: 40 人专家团 + 知识库,让团队任何成员都能复用累积经验
2. **系统自我进化**: 每个 phase 完成后,系统自动内化教训,下个 phase 自动应用
3. **业务 + 技术双轮驱动**: 专家团投票 + RFC 评审,避免纯技术自嗨

---

## 1. 📊 智能化分级 (L1 / L2 / L3)

| 等级 | 名称 | 能力 | 阶段 |
|---|---|---|---|
| **L1** | **辅助型** | AI 辅助代码生成/补全/单测 | 当前已达 (Copilot-like) |
| **L2** | **自动化型** | AI 自动 code review/漏洞检测/性能优化 | **Phase-19 目标** |
| **L3** | **自进化型** | 系统根据专家反馈自动调整架构/优先级/范式 | **Phase-25+ 远期** |

### 1.1 L1 → L2 → L3 跃迁条件

- **L1 → L2**: 当 ≥70% 工程师习惯使用 AI 辅助 + 准确率 ≥70%
- **L2 → L3**: 当 L2 自动化任务占比 ≥50% + 人工干预 < 20%

---

## 2. 🧬 知识沉淀公式

```
经验 (Experience) → 文档化 (Document) → 结构化 (Structure) → 自动化 (Automate) → 智能化 (Intelligent)
```

### 2.1 五个阶段详解

| 阶段 | 活动 | 工具 | 产物 |
|---|---|---|---|
| **1. 经验** | 工程师踩坑、修复、反思 | 经验笔记 | 原始记忆 |
| **2. 文档化** | 写 retro、postmortem | `debt.md` / `phase-*.md` | Markdown |
| **3. 结构化** | 提取模式 / 反模式 / 决策 | 人工 + 模板 | `knowledge/patterns/...` |
| **4. 自动化** | 写脚本检测 / 修复 | `extract-knowledge.py` | `automations/...` |
| **5. 智能化** | AI 自动推荐 / 决策 | LLM + RAG | API + 仪表板 |

---

## 3. 🔁 自我进化机制 (Self-Evolution Loop)

```
         ┌────────────────────────────────────────┐
         ↓                                        │
   [Phase 启动]                                   │
       ↓                                          │
   [Kickoff 评审] (Owner + Champion + ≥2 Approver) │
       ↓                                          │
   [实施] + 每日 standup (15 min)                  │
       ↓                                          │
   [Mid-Phase 评审] (Reviewer + Approver)          │
       ↓                                          │
   [完成] + Phase Retro (Champion 主导)            │
       ↓                                          │
   [自动提取 lessons] → knowledge/lessons-learned/ │
       ↓                                          │
   [同步到 experts/E*.md 反馈日志]                 │
       ↓                                          │
   [统计 → 更新评级 → 升级 Approver/Owner]         │
       ↓                                          │
   [下个 Phase 自动应用 lessons] ─────────────────┘
       ↓
   [Phase 启动] (回到顶部)
```

### 3.1 关键反馈节点

| 节点 | 频率 | 负责 | 工具 |
|---|---|---|---|
| **Standup** | 每日 15 min | Owner + 团队 | `docs/process/daily-standup.md` |
| **Mid-Phase Review** | Phase 中点 | Reviewer + Approver | RFC 模板 |
| **Phase Retro** | Phase 结束 | Champion | `phase-XX-retro.md` |
| **Weekly Memo** | 每周五 | Champion + Owner | `insight-YYYY-MM-DD.md` |
| **Monthly Retro** | 每月 | main agent + 用户 | `dev-evaluation.md` 更新 |

---

## 4. 🤖 Phase-19 智能化引擎 (5 大子系统)

### 4.1 AI Code Reviewer
- **输入**: PR diff + 上下文 (RAG 检索本仓库代码)
- **输出**: 风险点 + 改进建议
- **技术**: LLM (Claude/GPT) + 向量数据库 + 知识库 RAG
- **准确率目标**: ≥70%, false positive ≤20%

### 4.2 Auto E2E Generator
- **输入**: OpenAPI spec / DTO 定义
- **输出**: e2e 测试用例骨架
- **技术**: OpenAPI parser + 模板引擎
- **覆盖率目标**: ≥50% (auto-generated / total)

### 4.3 Business Anomaly Detector
- **输入**: 业务 metrics stream (Prometheus)
- **输出**: 异常告警 + 自动 rollback 建议
- **技术**: 时序分析 + 阈值动态调整
- **准确率目标**: ≥80%

### 4.4 Smart RFC Drafter
- **输入**: 业务需求描述 (1-2 段)
- **输出**: RFC 草案 (基于历史 RFC 模式)
- **技术**: LLM + RAG (RFC 库)
- **人工编辑时间节省**: ≥40%

### 4.5 Auto Lesson Applicator
- **输入**: 下一个 Phase 任务
- **输出**: 自动套用 `lessons-learned/` 中的相关教训
- **技术**: 任务语义匹配 + LLM 总结
- **效果**: 减少重复踩坑 ≥50%

---

## 5. 🧠 L3 自进化能力 (Phase-25+, 远期)

### 5.1 Auto-Architecture
- **能力**: 根据专家反馈 + usage pattern,自动建议模块拆分
- **触发**: 季度 review
- **风险**: 必须有 Champion 审批

### 5.2 Auto-Prioritize
- **能力**: 根据 RFC 采纳率 + 业务影响,自动调整 phase 优先级
- **触发**: 月度 review
- **风险**: 避免纯数据驱动,需保留人工决策

### 5.3 Auto-Doc
- **能力**: 自动生成 / 更新文档,基于代码 diff
- **触发**: 每次 commit
- **风险**: 需保持人工 review

---

## 6. 📈 度量指标 (KPIs)

### 6.1 智能化程度
- **AI Review 准确率**: ≥70% (Phase-19 目标)
- **自动 e2e 覆盖率**: ≥50%
- **异常检测准确率**: ≥80%
- **RFC 起草时间节省**: ≥40%

### 6.2 知识库活力
- **每周新增 lessons**: ≥3 条
- **每周 RFC 投票**: ≥1 个
- **专家团周活跃率**: ≥30% (≥12/40 专家)
- **每月新增 patterns/anti-patterns**: 各 ≥1 个

### 6.3 自我进化效果
- **重复踩坑率**: ≤10% (Phase-15 baseline 30% → 目标 10%)
- **P0 闭环时间**: ≤2 个 pulse
- **Phase 完成率**: ≥80%

---

## 7. 🛡️ 风险与缓解

| 风险 | 缓解措施 |
|---|---|
| **AI 误判** | 人类审批 + 双重确认 |
| **LLM 成本** | 预算上限 + 缓存常用 prompt |
| **数据隐私** | 敏感数据脱敏后再送 LLM |
| **过度依赖** | 保留"非 AI" fallback 路径 |
| **专家反馈稀释** | 5 级评级 + Champion veto 机制 |

---

## 8. 📅 演进时间线

| 阶段 | 时间 | 目标 |
|---|---|---|
| **L1 巩固** | 当前-2026-07 | 普及 AI 辅助 (Copilot 全员化) |
| **L2 启动** | Phase-19 (2026-07-09) | 5 大子系统第一个上线 (AI Code Reviewer) |
| **L2 深化** | Phase-20-22 (2026-07-20) | Auto E2E + Anomaly Detector |
| **L3 试点** | Phase-25+ (2026-10+) | Auto-Architecture / Auto-Prioritize 试点 |
| **L3 普及** | 2027+ | 全面 L3 自进化 |

---

## 9. 🔗 关联文档

- [dev-roadmap.md](../dev-roadmap.md) · 总路线图 (Stage F + G 详情)
- [DR-003-intelligence-engine.md](./decision-records/DR-003-intelligence-engine.md) · 决策记录
- [dev-evaluation.md](../dev-evaluation.md) · 综合评估
- [experts/INDEX.md](../experts/INDEX.md) · 40 专家档案
- [automations/](./automations/) · 自动化脚本

---

> 由 main agent 维护,任何智能化进展请同步更新
> 下次审查: Phase-19 Kickoff 时
