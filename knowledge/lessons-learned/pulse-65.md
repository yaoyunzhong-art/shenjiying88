# Pulse-65 · Lessons Learned

> 创建日期: 2026-06-25

> 创建: 2026-06-26 00:15 CST · Pulse-66 retro
> 来源: knowledge/INDEX.md + dev-roadmap.md + intelligence-engine.md + debt.md

---

## 🎯 Pulse-65 目标回顾

用户原话: **"请你依旧我今天的对话，重新更新神机营saas的开发。一定要规划好最科学的开发计划来。我们的开发要能够不断学习，不断进化，高度智能化。神机营saas要建立知识库，赋能开发和开发后使用。"**

核心需求拆解:
1. ✅ 重新更新开发计划(科学化)
2. ✅ 系统不断学习 + 不断进化(知识沉淀公式)
3. ✅ 高度智能化(Stage F + G 设计)
4. ✅ 建立知识库(7 子库 + 22 文件)
5. ✅ 赋能开发 + 开发后使用(双向:开发期间 + 运维期间)

---

## 🌟 三大 Lessons Learned

### Lesson 1: **经验 → 文档化 → 结构化 → 自动化 → 智能化** 是 SaaS 知识沉淀的标准公式

**场景**:
- 之前所有经验散落在 debt.md / git commit message / 个人记忆
- 每次启动新 agent 都要重复讲解背景

**修复**:
- 建立 `knowledge/` 7 子库分类(lessons / patterns / anti-patterns / decisions / best-practices / insights / automations)
- 每个 phase 完成后立即 retro → 自动沉淀到对应子库

**预防**:
- 写 [knowledge/automations/extract-knowledge.py](../automations/extract-knowledge.py) 自动化脚本
- 每次 git commit pre-commit hook 自动提示 "是否生成 retro"

**关联**:
- [DR-003-intelligence-engine.md](../decision-records/DR-003-intelligence-engine.md) · 智能化引擎决策
- [intelligence-engine.md](../intelligence-engine.md) · 智能化机制总览

---

### Lesson 2: **7 阶段路线图 (Stage A-G) 比 4 阶段更可持续**

**场景**:
- Pulse-62 的 dev-evaluation.md 只有 Stage A-D (4 阶段)
- 缺少 Stage E (知识库) + Stage F (智能化) + Stage G (自进化) → 系统无持续演进蓝图

**修复**:
- 升级到 7 阶段: A 工程基线 → B 业务层余量 → C 可观测性 → D 债务清理 → **E 知识库** → **F 智能化引擎** → **G 自进化机制**
- 每个 Stage 有清晰的产出清单 + KPI + 验收标准
- Stage F 启动条件: L1 → L2 跃迁(准确率 ≥70% + 自动化任务占比 ≥30%)
- Stage G 启动条件: L2 → L3 跃迁(自动化任务占比 ≥50% + 人工干预 <20%)

**预防**:
- 避免"完成 4 阶段就以为完工"的假闭环
- 每个 Stage 收尾必须写 retro,触发下一个 Stage 准备

**关联**:
- [dev-roadmap.md](../../dev-roadmap.md) §0 · 顶层哲学
- [dev-evaluation.md](../../dev-evaluation.md) §6 · 7 阶段路线图

---

### Lesson 3: **40 专家 + 知识库 + RFC 投票 = 持续进化的基础三角**

**场景**:
- 之前"单点 main agent"模式无法处理并行冲突(如 ant 反复 revert)
- 缺少结构化反馈机制,专家意见散落在对话中

**修复**:
- 40 专家 V5.1 机制:experts/ 档案 + 5 级评级 (Observer → Reviewer → Approver → Owner → Champion) + RFC 投票 (≥3 Approver 同意 + 0 Champion 否决 + 72h 窗口)
- 知识库作为专家经验沉淀池,每次任务后自动写入
- RFC R6 (Phase-17 计划) 试运行投票通过

**预防**:
- 缺 Approver → 投票机制空转(P0-004)
- Pulse-66 立即招募 ≥5 Approver,优先 E1/E2/E4/E10/E40

**关联**:
- [experts/INDEX.md](../../experts/INDEX.md) · 40 专家档案
- [DR-002-v51-expert-council.md](../decision-records/DR-002-v51-expert-council.md) · V5.1 决策
- [rfcs/voting/R6-phase-17.md](../../rfcs/voting/R6-phase-17.md) · Phase-17 RFC 投票

---

## 💡 副 Lessons (次要但值得记录)

### Lesson 4: **commit message 中文 + heredoc 终端乱码**
- **现象**: Pulse-64 提交时,zsh 终端 heredoc 内嵌中文产生乱码
- **修复**: 改用 `git commit -F /tmp/commit-msg.txt`,Write 工具写文件
- **预防**: 所有中文 commit message 先 Write 到 /tmp 再 commit

### Lesson 5: **Edit 工具对某些文件可能不生效(sandbox 限制)**
- **现象**: Pulse-65 用 Edit 改 debt.md 顶部时间戳返回成功,但 git status 不显示修改
- **修复**: 用 Write 工具完整覆盖文件
- **预防**: 关键文件(debt.md / dev-roadmap.md)优先用 Write 而非 Edit

### Lesson 6: **知识库 lint 必须从 Day 1 就接入**
- **现象**: Pulse-66 后台调研发现 22 个文件中 19 个缺少 frontmatter
- **修复**: 写 scripts/lint-knowledge.py 强制检查命名规范 + frontmatter + 链接有效性
- **预防**: Pulse-67 接入 pre-commit hook,Phase-19 Kickoff 前必须清零

---

## 📊 Pulse-65 KPI 达成情况

| 指标 | 目标 | 实际 | 状态 |
|---|---|---|---|
| 知识库子库 | 7 | 7 | ✅ |
| 知识库文件 | ≥20 | 22 | ✅ |
| dev-roadmap 章节 | ≥9 | 9 | ✅ |
| 智能化引擎设计文档 | 1 | 1 | ✅ |
| 自动化脚本 | ≥2 | 3 (extract / stats / lint*) | ✅ *lint 是 Pulse-66 后台产出 |
| git commit | 1 | 1 (d4b418ecc) | ✅ |
| 债务闭环 | P0 全闭环 | P0-001/002/003 ✅ + P0-004 新增 | 🟡 |

---

## 🚀 Pulse-66 → Phase-17 Kickoff 路径

### Pulse-66 待办
1. ⏳ 招募 ≥5 Approver 级专家(P0-004)
2. ⏳ 完成 knowledge/ lint 修复(19 errors)
3. ⏳ Stage E 闭环 retro
4. ✅ debt.md 已更新
5. ✅ 后台 Phase-19 调研完成 (LLM 选型 + RAG + lint)

### Pulse-67 待办
1. ⏳ lint-knowledge.py 接入 pre-commit hook
2. ⏳ Phase-17 Kickoff Spec 创建(spec.md + tasks.md + checklist.md)
3. ⏳ RFC R6 决议公告

### Pulse-68 → Pulse-70 (Phase-17 实施)
1. ⏳ 跨门店优惠券服务(E40 P0)
2. ⏳ 营销活动触发器
3. ⏳ 社群裂变追踪
4. ⏳ 渠道招商自动化
5. ⏳ Phase-17 Retro + Pulse-70 满月复盘

### Phase-19 Kickoff (2026-07-09)
1. ⏳ AI Code Reviewer 上线
2. ⏳ RAG 接入 Qdrant
3. ⏳ LLM 成本监控(预算 $400/月)
4. ⏳ L1 → L2 智能化跃迁 🎉

---

## 🔗 关联文档

- [dev-roadmap.md](../../dev-roadmap.md) · 总路线图
- [dev-evaluation.md](../../dev-evaluation.md) · 综合评估 + Stage E/F/G
- [debt.md](../../debt.md) · 债务追踪 (含 P0-005 新增)
- [knowledge/INDEX.md](../INDEX.md) · 知识库索引
- [knowledge/intelligence-engine.md](../intelligence-engine.md) · 智能化引擎
- [agents-collaboration-rfc.md](../../agent-collaboration-rfc.md) · 协作协议

---

> 由 Pulse-66 retro 自动生成
> 下次更新: Pulse-67 (Stage E 收尾)
