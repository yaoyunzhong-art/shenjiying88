# V12 开发计划与流程对齐说明

> 版本: V1.0
> 生效时间: 2026-06-30
> 目的: 将当前开发计划、执行流程、MD 文档与产品需求统一到同一套口径，避免继续混用旧 phase 节奏与过期行动计划。

---

## 1. 对齐目标

当前仓库内同时存在 `dev-roadmap`、`docs/process`、`.trae/specs`、`.trae/execution` 等多套文档。它们都有效，但职责不同。

本说明解决 3 个问题:

1. 当前到底以哪份产品需求为准
2. 当前到底以哪份开发计划为准
3. 日常开发、评审、验收到底按哪条流程执行

---

## 2. 当前生效文档优先级

### P0 · 产品与架构硬约束

1. `DEVELOPMENT_CONSTITUTION.md`
   - 作用: 项目最高开发准则
   - 约束范围: 产品定位、5 端统一、AI 深度赋能、知识库中枢、多租户隔离、工作台闭环、性能与合规红线
   - 结论: 所有 spec、task、代码、测试、发布都不得违反本文件

2. `.trae/specs/v12-master-90day/spec.md`
   - 作用: 当前主产品规格与 90 天主目标
   - 结论: 当前产品需求、业务域优先级、Phase 104-130 范围一律按 V12 总规执行

### P1 · 当前开发计划与执行拆解

3. `.trae/specs/v12-master-90day/sprint-plan.md`
   - 作用: 18 个 Sprint 的节奏与按天拆解
   - 结论: 当前日常排期按 Sprint → Day → Phase 执行

4. `.trae/specs/v12-master-90day/tasks.md`
   - 作用: 原子任务清单
   - 结论: 每次开发必须能追溯到明确的 `Txxx-x` 或 Phase 任务

5. `.trae/specs/v12-master-90day/checklist.md`
   - 作用: 验收清单
   - 结论: 每个功能闭环必须最终回到 checklist 项验证，而不是只看代码是否完成

6. `.trae/execution/v12-implementation-master-plan.md`
   - 作用: V12 执行落地、追溯、适配与结果管理
   - 结论: 负责解释“怎么落地”，不替代产品需求本身

### P2 · 当前执行流程

7. `docs/process/daily-standup.md`
   - 作用: 每日站会
   - 结论: 用于日更、阻塞识别、RFC 状态同步

8. `docs/process/phase-review.md`
   - 作用: Kickoff / Mid / Retro 三阶段评审
   - 结论: 每个 Phase 必须走事前、事中、事后评审

### P3 · 历史背景与参考

9. `dev-roadmap.md`
   - 作用: 历史全局路线图与知识库演进背景
   - 结论: 可作为背景索引，但当前排期不得再直接以 Phase-17~21 章节为唯一执行依据

10. `docs/operations/*.md`
   - 作用: 阶段行动计划、审批清单、短期运营文档
   - 结论: 仅作阶段参考，若日期与 V12 总规冲突，以 V12 文档为准

---

## 3. 产品需求对齐结果

当前开发计划必须同时满足以下产品需求基线:

### 3.1 核心定位

- 系统核心护城河是 `AI 能力 + 知识库体系`
- 所有模块都要能沉淀知识、反哺 AI
- 不允许只做“普通 CRUD”而不考虑 AI 引导与知识沉淀路径

### 3.2 5 端统一

- 新功能必须考虑 PC / H5 / App / Pad / 小程序 5 端
- 如果阶段内只先落某一端，必须明确:
  - 哪些共享能力已完成
  - 哪些端仍在 backlog
  - 为什么不影响当前 Sprint 目标

### 3.3 AI 与知识库闭环

- 每个业务模块都要预留 AI 选择题入口、AI 推荐/匹配/知识查询能力
- 每次开发要回答两个问题:
  - 这项能力如何被 AI 调用或增强
  - 这项能力的规则、经验、异常如何沉淀入知识库

### 3.4 多租户与合规

- 所有新增能力默认必须满足租户隔离、审计追溯、权限边界
- 若为跨租户/跨品牌/跨店能力，需在 spec 和测试中明确隔离策略

### 3.5 工作台闭环

- ToC / ToB / 业务中台 / 管理后台最终都要纳入 AI 驱动闭环
- 当前开发即使只落后台或共享层，也要写明对应工作台入口与后续接线位置

---

## 4. 开发计划对齐结果

### 4.1 当前主计划

当前主计划统一为 `V12 Master 90 天总规`:

- 周期: Day 49-138
- 节奏: 18 Sprint × 5 天
- 目标: 完成 Phase 104-130 与 45 条 V5.1 优化措施

### 4.2 当前排期口径

后续排期统一使用以下层级:

`Constitution → V12 spec → sprint-plan → tasks → checklist → code/test/commit`

不再允许出现以下失配:

- 只按 `dev-roadmap` 的旧 Phase 顺序排任务
- 只按临时对话指令开发，无法追溯到 V12 任务
- 只做模块功能，不补验收与测试追溯

### 4.3 当前执行窗口

当前开发应优先围绕 V12 当前 Sprint 的目标推进。若出现临时插入任务，只允许属于以下 3 类:

1. 当前 Sprint 的直接任务
2. 当前 Sprint 的共享底座/测试/契约阻塞项
3. P0 缺陷、合规风险、租户隔离风险

其他任务统一进入 backlog 或标注为 `cross-cutting enablement`，并说明它阻塞了哪个 Sprint 任务。

---

## 5. 执行流程对齐结果

### 5.1 标准执行主链路

统一按以下流程执行:

1. `Spec 对齐`
   - 先确认需求归属的 V12 Phase / Sprint / Task
   - 若没有归属，先补 planning 说明，再开发

2. `Kickoff`
   - 依据 `docs/process/phase-review.md`
   - 明确范围、验收标准、风险、影响端

3. `开发与测试`
   - 代码、类型、单测、HTTP 回归、跨端读面/交互回归按需补齐
   - 所有改动必须能回写到对应任务或 checklist

4. `Mid Review`
   - 进度到 50% 时检查是否偏离产品需求、性能、合规、客户体验

5. `验收`
   - 对照 `checklist.md`
   - 对照 `Constitution` 的 5 端、AI、知识库、多租户、性能与合规红线

6. `提交与沉淀`
   - 本地提交
   - 尝试推送
   - 将关键经验沉淀到文档或知识库

### 5.2 每日节奏

统一沿用:

- 09:00-09:15 `daily standup`
- 白天按 Sprint/Day 任务推进
- Phase 级任务按 `Kickoff → Mid → Retro` 管理

### 5.3 交付物要求

每次功能开发至少要对应 4 类产物中的 3 类:

1. 代码实现
2. 测试或验证
3. 文档/追溯更新
4. Git 提交记录

---

## 6. 旧文档处理原则

### 6.1 继续有效但降级为参考

- `dev-roadmap.md`
- 历史 `phase-*` spec
- `docs/operations/72h-action-plan.md`
- `docs/operations/phase-17-kickoff-checklist.md`
- `docs/operations/r7-r8-approval-checklist.md`

这些文档仍保留历史价值，但不再作为当前一线执行口径。

### 6.2 允许继续复用的内容

- 流程模板
- 评审模板
- 经验沉淀
- 风险控制方法

### 6.3 不允许继续直接复用的内容

- 已过期日期窗口
- 与 V12 冲突的阶段顺序
- 与 Constitution 冲突的单端交付或弱化 AI/知识库的方案

---

## 7. 从今天开始的执行要求

自本说明生效后，后续开发统一执行以下规则:

1. 每个任务先标明对应 `Sprint / Day / Phase / Txxx-x`
2. 每次设计先检查是否满足 Constitution 的 5 端、AI、知识库、多租户、合规要求
3. 每次开发完成后，至少回写:
   - 对应测试
   - 对应验收项
   - 对应提交记录
4. 临时插入任务必须说明它属于:
   - 当前 Sprint 主任务
   - cross-cutting enablement
   - P0 风险修复
5. 后续若更新总计划，优先更新:
   - `v12-master-90day/spec.md`
   - `sprint-plan.md`
   - `tasks.md`
   - 本对齐说明

---

## 8. 一句话结论

当前项目的统一执行口径已经确定为:

`DEVELOPMENT_CONSTITUTION + V12 90 天 spec/sprint/tasks/checklist + process 流程文档`

其余历史路线图和短期行动文档继续保留，但全部降级为参考背景，不再单独驱动当前开发排期。
