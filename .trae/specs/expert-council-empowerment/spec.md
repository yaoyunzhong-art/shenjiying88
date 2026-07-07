# 40 人专家团赋能开发机制 (V5.1) Spec

## Why
神机营 SaaS 已完成核心多租户架构(Phase-15/16 完成 quota+lifecycle 守卫),但缺乏业务专家深度赋能机制。40 人专家团既是用 户/产品设计者/产品经理,需要在开发的事前-事中-事后深度参与,科学持续地赋能开发团队,避免"技术自嗨"导致偏离业务价值。

## What Changes
- **NEW**: 建立 40 人专家团 daily morning standup(15 min) 流程文档
- **NEW**: 建立 phase kickoff / mid-review / retro 三阶段评审机制
- **NEW**: 建立专家评级体系(5 级: Observer/Reviewer/Approver/Owner/Champion)
- **NEW**: 建立 RFC 评审机制(专家团对 RFC 投票,≥3 Approver 同意才能进入实施)
- **NEW**: 建立 `experts/` 目录(40 个 E1-E40 个人档案 + 反馈日志 + 决议追踪)
- **NEW**: 在 `dev-evaluation.md` 增加专家团影响力评估章节
- **MODIFIED**: `agent-collaboration-rfc.md` 整合专家团审批 (R1-R5 由 40 人投票,不再由单个开发代理决定)
- **MODIFIED**: `debt.md` 增加"专家反馈"分类(P0-P3 来自专家团的反馈单独追踪)

## Impact
- Affected specs: 暂无(spec 初始化)
- Affected code:
  - `dev-evaluation.md` (新增 第 11 章 专家团影响力)
  - `agent-collaboration-rfc.md` (R1-R5 改为专家投票)
  - `debt.md` (新增 Expert Feedback 分类)
  - `docs/expertise/INDEX.md` (从 W-L 矩阵升级为 E1-E40 专家档案)
  - `experts/` (新增 40 个 .md 档案)

## ADDED Requirements

### Requirement: Expert Council Directory
系统 SHALL 提供 40 个专家个人档案目录,每个档案包含:
1. 基本信息(姓名/编号/领域/级别/联系方式)
2. 关注的产品域(frontend/backend/data/ops/legal 等)
3. 历史反馈日志(日期+反馈内容+采纳状态)
4. 投票记录(RFC 编号 + 投票结果 + 理由)

#### Scenario: 新专家入职
- **WHEN** 添加新专家 (E41+)
- **THEN** 自动生成 `experts/E{N}-{name}.md` 模板,初始级别 Observer
- **AND** 同步更新 `experts/INDEX.md`

### Requirement: Daily Standup Protocol
系统 SHALL 每天 09:00 CST 召开 15 分钟 standup,流程:
1. 每个 Phase Owner (W{L}) 用 2 分钟汇报昨日进度
2. 每个活跃专家 (级别 ≥ Reviewer) 用 1 分钟提出业务关切
3. 识别昨日 RFC 投票中 ≥3 Approver 同意的项,立即进入实施队列

#### Scenario: 评审 RFC R6
- **WHEN** 新 RFC 提交且 ≥3 Approver 投票同意
- **THEN** RFC 进入 `approved/` 子目录,自动创建对应的 tasks.md + checklist.md
- **AND** 通知所有 Owner 级专家

### Requirement: Three-Phase Review
每个开发 phase 强制经过三个评审点:
- **Phase Kickoff** (事前): Owner + Champion 评审 RFC,确认 scope/验收标准
- **Mid-phase Review** (事中): 50% 完成时,Reviewer + Approver 评审 PR,反馈业务偏差
- **Phase Retro** (事后): Champion 主导 retro,记录教训到 `docs/expertise/W{L}-{stage}.md`

#### Scenario: Phase-17 Retro
- **WHEN** Phase-17 完成
- **THEN** Champion 自动发起 retro,产出 3-5 条 lessons learned
- **AND** 这些 lessons 自动合并到对应专家的 `experts/E{N}-{name}.md` 反馈日志

### Requirement: Expert Rating System
5 级评级,基于过去 30 天活动:
- **Observer**: 仅阅读,可发言无投票权
- **Reviewer**: 投票否决权(veto)
- **Approver**: RFC 通过所需的 3 票之一
- **Owner**: 负责 1 个 phase 完整生命周期
- **Champion**: 跨 phase 战略决策 + 1 月任命一次

#### Scenario: 升级评级
- **WHEN** 专家连续 7 天提交有效反馈且被采纳率 ≥50%
- **THEN** 自动从 Observer 升级到 Reviewer
- **AND** 在 `experts/E{N}-{name}.md` 记录升级事件

### Requirement: Expert Feedback Channel
专家团通过 3 个固定渠道提交反馈:
1. **Morning Voice** (standup 期间口头)
2. **Weekly Memo** (每周五提交,doc 形式追加到对应专家档案)
3. **Emergency Veto** (任意时刻,对生产事故或合规风险有 veto 权)

#### Scenario: 紧急 veto
- **WHEN** Champion + ≥2 Owner 联合 veto 当前正在实施的 RFC
- **THEN** 立即暂停实施,48 小时内召开紧急评审
- **AND** veto 内容追加到 `debt.md` Expert Feedback 分类

## MODIFIED Requirements

### Requirement: RFC Approval Workflow (原 RFC 单代理决策改为专家团投票)
**原**: 单个开发代理决定 RFC 通过
**改为**: ≥3 Approver 级专家投票同意才能通过

#### Scenario: RFC R6 提交
- **WHEN** 提交新 RFC
- **THEN** 自动通知所有 Approver+ 级别专家
- **AND** 72 小时投票窗口,≥3 Approver 同意 + 0 Champion 否决 → 通过

### Requirement: Agent Collaboration (原 5 项 RFC 决议整合专家投票)
**原**: R1-R5 由用户单人审批
**改为**: R1-R5 由 ≥3 Approver 投票通过

## REMOVED Requirements

### Requirement: 40 专家空模板 (之前 Pulse-63 批量生成的 W1-W10 × L1-L4 模板)
**Reason**: 之前的 40 模板是 W-L 工作流矩阵,与本次 E1-E40 业务专家团冲突,需要重新对齐
**Migration**: W-L 模板归档到 `docs/expertise/_archive/`,新建 E1-E40 专家档案取代

---

## Open Questions (待用户确认)
1. **每日 standup 时间**: 09:00 CST 是否合适?(考虑 Champion 跨时区)
2. **投票窗口**: 72 小时是否够?(考虑 Approver 分布)
3. **Expert 编号 E26-E29**: 大/中/小租户,需要为他们建立专属 phase 还是与 E1-E25 共享?
4. **是否引入专家团激励?** (e.g. 提交有效反馈可获得 SaaS 平台 credits)