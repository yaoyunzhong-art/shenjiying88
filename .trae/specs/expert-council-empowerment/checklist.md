# Checklist: 40 人专家团赋能开发机制 (V5.1)

## Phase A: 专家团基础架构

### Task 1: `experts/` 目录结构
- [ ] `experts/` 目录创建成功
- [ ] `experts/INDEX.md` 含 40 个 E1-E40 链接
- [ ] `experts/templates/expert-profile.md` 模板含 4 个必填章节(基本信息/关注域/反馈日志/投票记录)
- [ ] Python 脚本 `scripts/gen-experts.py` 已生成 40 个档案初稿
- [ ] 每个专家档案含:编号/姓名/领域/初始级别 Observer

### Task 2: 迁移 W-L 模板到归档
- [ ] `docs/expertise/_archive/` 创建成功
- [ ] 40 个 `W*.md` 文件已移动到 `_archive/wf-matrix-v4/`
- [ ] `_archive/README.md` 记录 V4→V5.1 迁移原因 + 日期

### Task 3: 更新 INDEX.md
- [ ] 旧 W-L 矩阵内容已删除
- [ ] 新 E1-E40 索引按 8 大领域分组
- [ ] 每个领域有 sub-heading + 包含专家列表

---

## Phase B: 协作流程文档化

### Task 4: Daily Standup Protocol
- [ ] `docs/process/daily-standup.md` 存在
- [ ] 文档含 3 步骤 (Phase Owner 汇报 / 专家关切 / RFC 通过识别)
- [ ] 时间盒: 15 分钟总时长
- [ ] `docs/process/standup-template.md` 可复用

### Task 5: Three-Phase Review 流程
- [ ] `docs/process/phase-review.md` 存在
- [ ] 3 个子模板存在:`kickoff-template.md` / `mid-review-template.md` / `retro-template.md`
- [ ] 每个模板含 fields: phase_name / date / participants / decisions / lessons

### Task 6: Expert Rating System
- [ ] `docs/process/expert-rating.md` 存在
- [ ] 5 级定义清晰: Observer / Reviewer / Approver / Owner / Champion
- [ ] 升级规则量化: 连续 7 天 + 采纳率 ≥50%
- [ ] `scripts/rate-experts.py` 可运行并输出评级分布

---

## Phase C: RFC 机制改造

### Task 7: 修改 agent-collaboration-rfc.md
- [ ] R1-R5 决策流程改为 "≥3 Approver 投票"
- [ ] 文档含 "Expert Veto" 章节
- [ ] 72h 投票窗口机制明确
- [ ] 0 Champion 否决通过条件明确

### Task 8: RFC 投票跟踪
- [ ] `rfcs/voting/` 子目录创建
- [ ] 模板 `rfcs/voting/template.md` 存在
- [ ] 已有 RFC 投票记录迁移成功

---

## Phase D: 反馈与债务改造

### Task 9: 修改 debt.md
- [ ] 新增 "🟣 Expert Feedback" 分类
- [ ] Expert Feedback 字段: expert_id / severity / related_phase / status
- [ ] 至少 1 条示例 feedback 记录

### Task 10: 修改 dev-evaluation.md
- [ ] 新增第 11 章 "专家团影响力评估"
- [ ] 第 11 章含 3 个量化指标: 采纳率 / 响应时间 / 反馈质量
- [ ] 附录 "E1-E40 关注矩阵" 存在

---

## Phase E: 试运行

### Task 11: 试运行 1 次 Daily Standup
- [ ] `docs/process/standup-2026-06-26.md` 存在
- [ ] 含模拟的 3 个 Owner + 2 个 Approver 发言
- [ ] 含 RFC 通过识别记录

### Task 12: 试运行 1 次 RFC 投票
- [ ] 新 RFC R6 "Phase-17 计划" 提交
- [ ] `rfcs/voting/R6-phase-17.md` 投票记录存在
- [ ] 投票结果: ≥3 Approver 同意 + 0 Champion 否决
- [ ] 自动产生 `tasks.md` 跟 checklist.md

---

## 跨 Phase 验证

### 文档完整性
- [ ] 所有新文件 (>= 12) 都提交到 git
- [ ] `git status` 干净
- [ ] 每个新文件有 ≥1 条 commit message

### 专家档案质量
- [ ] 40 个专家档案全部含 V5.1 编制表所有字段
- [ ] 至少 5 个专家档案含 "已激活" 状态(基于之前 Phase-15/16/63 经验)
- [ ] INDEX.md 跟档案 1:1 对应(无 missing)

### RFC 投票完整性
- [ ] 试运行 RFC R6 通过
- [ ] 投票记录跟模板一致
- [ ] 通过的 RFC 自动产生后续 spec 流程

### 反馈循环
- [ ] debt.md 至少 1 条 Expert Feedback 记录
- [ ] 该 feedback 跟某个 P0-P3 有关联
- [ ] 反馈 status: acknowledged / in-progress / resolved 之一