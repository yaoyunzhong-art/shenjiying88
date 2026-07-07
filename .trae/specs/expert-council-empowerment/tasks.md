# Tasks: 40 人专家团赋能开发机制 (V5.1)

## Task 0: 决策依赖问题 (Blocker)
- [ ] Task 0.1: 跟用户确认 4 个 Open Questions (standup 时间 / 投票窗口 / 租户专属 phase / 激励机制)
  - 依赖: 用户回复

---

## Phase A: 专家团基础架构 (Day 1-2)

### Task 1: 创建 `experts/` 目录结构
- [ ] SubTask 1.1: 创建 `experts/` 目录 + `experts/INDEX.md` + `experts/templates/` 子目录
- [ ] SubTask 1.2: 创建模板 `experts/templates/expert-profile.md` (含基本信息/关注域/反馈日志/投票记录)
- [ ] SubTask 1.3: 用 Python 脚本批量生成 40 个 E1-E40 档案初稿 (从 V5.1 编制表)
- 验证: `ls experts/` 应有 40 个 .md 文件 + INDEX.md

### Task 2: 迁移 W-L 模板到归档
- [ ] SubTask 2.1: 创建 `docs/expertise/_archive/` 目录
- [ ] SubTask 2.2: 移动 `docs/expertise/W*.md` (40 文件) 到 `_archive/wf-matrix-v4/`
- [ ] SubTask 2.3: 在 `docs/expertise/_archive/README.md` 记录 V4→V5.1 迁移原因
- 验证: `git status` 显示 W*.md 已移动

### Task 3: 更新 INDEX.md (从 W-L 矩阵改为 E1-E40)
- [ ] SubTask 3.1: 删除 `docs/expertise/INDEX.md` 旧内容 (W-L 矩阵)
- [ ] SubTask 3.2: 改为 E1-E40 索引,按领域分组(架构/安全/营销/数据/法律/体验 等)
- 验证: 索引按 8 大领域分组,共 40 个专家链接

---

## Phase B: 协作流程文档化 (Day 2-3)

### Task 4: 写 Daily Standup Protocol
- [ ] SubTask 4.1: 创建 `docs/process/daily-standup.md` (15 min 流程 + 角色 + 输出)
- [ ] SubTask 4.2: 创建 `docs/process/standup-template.md` (每次会议产出 1 份)
- 验证: 流程包含 3 步骤 + 时间盒

### Task 5: 写 Three-Phase Review 流程
- [ ] SubTask 5.1: 创建 `docs/process/phase-review.md` (kickoff/mid/retro 三阶段)
- [ ] SubTask 5.2: 创建 3 个子模板 `kickoff-template.md` / `mid-review-template.md` / `retro-template.md`
- 验证: 每个 phase 都有对应 checklist

### Task 6: 写 Expert Rating System
- [ ] SubTask 6.1: 创建 `docs/process/expert-rating.md` (5 级定义 + 升级规则)
- [ ] SubTask 6.2: 创建评分脚本 `scripts/rate-experts.py` (统计过去 30 天活动)
- 验证: 脚本能基于 `experts/E*.md` 输出当前评级分布

---

## Phase C: RFC 机制改造 (Day 3-4)

### Task 7: 修改 agent-collaboration-rfc.md
- [ ] SubTask 7.1: R1-R5 决策改为 "≥3 Approver 投票" 而非用户单人
- [ ] SubTask 7.2: 增加 Expert Veto 章节 (Champion + 2 Owner 联合 veto)
- [ ] SubTask 7.3: 增加 72h 投票窗口机制
- 验证: RFC 包含 "投票" / "veto" / "时间盒" 关键词

### Task 8: 改造 RFC 投票跟踪
- [ ] SubTask 8.1: 创建 `rfcs/voting/` 子目录 (每个 RFC 一个 .md 投票记录)
- [ ] SubTask 8.2: 创建模板 `rfcs/voting/template.md` (含投票人/级别/意见/时间)
- [ ] SubTask 8.3: 把已存在的 agent-collaboration-rfc.md 投票记录迁移
- 验证: 模板可复用于未来 R6+

---

## Phase D: 反馈与债务改造 (Day 4-5)

### Task 9: 修改 debt.md 增加 Expert Feedback 分类
- [ ] SubTask 9.1: 在 P0/P1/P2/P3 之外增加 "🟣 Expert Feedback" 分类
- [ ] SubTask 9.2: 定义 Expert Feedback 字段: expert_id / severity / related_phase / status
- 验证: 分类清晰,便于未来统计专家影响力

### Task 10: 修改 dev-evaluation.md
- [ ] SubTask 10.1: 增加第 11 章 "专家团影响力评估" (含采纳率/响应时间/反馈质量)
- [ ] SubTask 10.2: 增加附录 "E1-E40 关注矩阵" (每个 phase 对应哪几个专家)
- 验证: 第 11 章包含量化指标

---

## Phase E: 试运行 (Day 5-6)

### Task 11: 试运行 1 次 Daily Standup
- [ ] SubTask 11.1: 模拟 Phase-17 kickoff,模拟 3 个 Owner + 2 个 Approver 发言
- [ ] SubTask 11.2: 产出 `docs/process/standup-2026-06-26.md` 实际记录
- 验证: 记录符合模板

### Task 12: 试运行 1 次 RFC 投票
- [ ] SubTask 12.1: 提交新 RFC R6 "Phase-17 计划"
- [ ] SubTask 12.2: 模拟 3 Approver 同意 + 0 Champion 否决
- [ ] SubTask 12.3: 产出 `rfcs/voting/R6-phase-17.md` 实际投票记录
- 验证: 投票记录通过,自动产生 tasks.md

---

## Task Dependencies
- Task 1 → Task 3 (需要先有专家档案才能更新 INDEX)
- Task 2 → Task 3 (先归档旧模板)
- Task 4 → Task 11 (先有流程才能试运行)
- Task 5 → Task 11 (先有 review 流程)
- Task 6 → Task 11 (先有评级才能参与 standup)
- Task 7 → Task 12 (先有 RFC 机制才能投票)
- Task 8 → Task 12
- Task 9 → Task 12 (feedback 分类需要先有)
- Task 10 → Task 12
- Task 11 跟 Task 12 并行 (不同流程)

## Critical Path
Task 0.1 (用户决策) → Task 1 → Task 3 → Task 4 → Task 11 → Phase F (未来)