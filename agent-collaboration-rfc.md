# 🐜 Agent 协作协议 RFC (agent-collaboration-rfc.md)

> 状态: **DRAFT - 待审批**
> 作者: main agent
> 最后更新: 2026-06-25 22:15 CST · Pulse-62
> 目标: 解决 "ant 反复 revert 修复" + 树哥批量作业的规范化

---

## 1. 🎯 背景

### 1.1 问题
在 Pulse-59/60/61 中,出现反复 revert 修复的情况:
- `health.service.ts` 多次被还原
- `notification.service.ts` 多次被还原
- `member.service.ts` 多次被还原

### 1.2 根因分析 (鱼骨图)
- **技术层**: 多个 background agent (ant, 树哥) 并行作业,无文件锁
- **流程层**: 没有 PR / branch review 流程
- **协作层**: 没有"谁负责什么文件"的所有权声明
- **可观测层**: 没有"谁在什么时候改了什么"的审计

### 1.3 损失
- 浪费时间重做已完成的修复
- 引入新 bug (如 registerPersistent 改动后 ant 改回)
- 测试 flaky,降低团队信心

---

## 2. 📋 RFC 提议

### 2.1 文件所有权声明 (FILE_OWNERSHIP.md)

新建 `docs/FILE_OWNERSHIP.md`,定义每个文件 / 目录的所有者 agent:

```markdown
# 文件所有权声明

## 格式
`<PATH> = <AGENT_ROLE>` 

## Agent 角色
- `main`: 主 agent (用户对话窗口)
- `ant`: background agent (lint / format 修复)
- `tree-{n}`: 树哥 #n (批量任务, e.g. tree-1, tree-2)
- `mavis`: subagent 搜索/调研
- `arch`: 架构 subagent
- `qa`: 测试 subagent

## 所有权表

| 路径 | 所有者 | 备注 |
|---|---|---|
| `apps/api/src/modules/tenant/*` | main | 多租户核心,高敏感 |
| `apps/api/src/modules/member/*` | main | 业务核心 |
| `apps/api/src/modules/finance/*` | main | 财务数据 |
| `apps/api/src/modules/inventory/*` | main | 库存 |
| `apps/api/src/modules/campaign/*` | main | 营销 |
| `apps/api/src/modules/loyalty/*` | main | 积分 |
| `apps/api/src/modules/foundation/*` | main | 基础设施 |
| `apps/api/src/modules/queue/*` | ant | 允许 ant 修复 |
| `apps/api/src/modules/transactions/*` | ant | 允许 ant 修复 |
| `debt.md` | main | 债务追踪 |
| `dev-evaluation.md` | main | 评估计划 |
| `agent-collaboration-rfc.md` | main | RFC 协议 |
| `docs/expertise/*` | main | 专家经验库 |
| `*.ts` (其他) | main | 通用 |
| `*.test.ts` (其他) | ant | 测试 lint |
```

### 2.2 修改前检查 (PRE_WRITE_CHECK)

每个 agent 修改文件前,**必须** 先:

1. **Read** 文件:确认当前内容
2. **Check ownership**:`FILE_OWNERSHIP.md` 中是否归本 agent 所有
3. **If NOT owner**:
   - main agent: 可直接修改(主 agent 有最高优先级)
   - 其他 agent (ant/tree-*/mavis/arch/qa): **必须**先询问 main agent

### 2.3 改动审计 (AUDIT_LOG.md)

新建 `docs/AUDIT_LOG.md`,记录所有改动:

```markdown
# 改动审计日志

| 时间 | Agent | 文件 | 类型 | 原因 |
|---|---|---|---|---|
| 2026-06-25 22:15 | main | apps/api/src/modules/finance/finance.service.ts | feature | Phase-16F: createInvoice 接入 guard |
| 2026-06-25 22:15 | main | debt.md | docs | Pulse-62: 关闭 P0-003 |
| 2026-06-25 22:00 | ant | apps/api/src/modules/queue/queue.role-extended.test.ts | fix-lint | lint 自动修复 |
```

**main agent 任务**:
- 每次 commit 前自动 append 一行 (via pre-commit hook)

**ant 任务**:
- 修改 `ant:OWNED` 文件前,先在 AUDIT_LOG 添加"计划改动"
- 改完后,更新为"已改动"

### 2.4 Revert 协议 (REVERT_POLICY)

**禁止** 在以下情况 revert:
- ❌ main agent 过去 1 小时内的改动 (无明确理由)
- ❌ 涉及 e2e 测试的改动 (需要 main agent 评估)
- ❌ 涉及 `tenant/*` 的改动 (高敏感)

**允许** revert:
- ✅ ant 改的 ant:OWNED 文件被覆盖时 (恢复 ant 自己的版本)
- ✅ main agent 明确要求 revert

**Revert 前必须**:
1. 在 AUDIT_LOG.md 写明 revert 原因
2. 通知 main agent (in 协作通道)

### 2.5 协作通道 (CHANNELS)

由于 main agent 是单线程,其他 agent 通过:

1. **TODO 注入**:`docs/TODO.md` 由 main agent 维护,其他 agent 读 + 标记"doing"
2. **询问 main agent**:不确定时,先问 main agent (而不是凭直觉)
3. **Plan mode**:复杂改动必须进 plan mode,等用户审批

### 2.6 实施步骤 (阶梯式)

#### Phase 1: 文档化 (本脉冲)
- ✅ 创建 `FILE_OWNERSHIP.md`
- ✅ 创建 `AUDIT_LOG.md`
- ✅ 创建 `CHANNELS.md`(TBD)
- ✅ 创建 `REVERT_POLICY.md`(TBD)

#### Phase 2: 工具化 (下脉冲)
- 写 pre-commit hook 强制检查 ownership
- 写 lint 规则禁止"无主修改"
- 写 CI 检查 "main agent 1 小时内改动" 是否被覆盖

#### Phase 3: 文化化 (持续)
- 每个 subagent prompt 包含"读取 FILE_OWNERSHIP.md"
- 每次 commit 自动 append AUDIT_LOG
- 每周复盘"谁在什么时候做了无用功"

---

## 3. 🧬 自我进化 (Expert Self-Improvement)

### 3.1 40 专家学习闭环

每个专家(W × L)有 3 个学习循环:

```
  Observe → Abstract → Apply
    ↑                   ↓
    └─── Feedback ←─────┘
```

#### Observe
- 读最新代码 + 债务 + 失败用例
- 读其他专家的经验库 (`docs/expertise/{W}{L}.md`)

#### Abstract
- 提取可复用模式 (e.g. "@Optional() 注入兼容模式")
- 提取 anti-pattern (e.g. "不要 inline 写 assert.equal 兜底")
- 形成 lint 规则 / 测试 fixture / helper

#### Apply
- 下次任务直接套用抽象
- 减少重复造轮子

### 3.2 经验库结构

`docs/expertise/{W}{L}.md` 格式:

```markdown
# 专家 {W}{L} · 经验库

## 元数据
- W (工作流): W1-架构 / W2-后端 / ...
- L (阶段): L1-设计 / L2-实现 / L3-验证 / L4-运维
- 创建: 2026-06-25
- 最后更新: 2026-06-25

## 当前技能 (Skills)
- ✅ Skill 1: 多租户 guard 集成 (掌握 95%)
- ✅ Skill 2: e2e 写测试 (掌握 80%)
- ⏳ Skill 3: 性能 profiling (学习中)

## 决策历史
| 日期 | 任务 | 决策 | 理由 |
|---|---|---|---|
| 2026-06-25 | Phase-16F | 新加 QuotaResourceKind.Invoice | Invoice 是低频创建,适合 quota |
| 2026-06-25 | Phase-15E | registerPersistent 集成 reserve-and-rollback | idempotent hydrate 时手动 decrement |

## Anti-patterns (踩过的坑)
- ❌ 改 enum 时没 grep 所有 switch → typecheck error
- ❌ 加 console.log 调试 → 忘清理 → lint warning
- ❌ 测试不重置 module-level store → flaky test

## TODO / 学习目标
- [ ] 学习 Prometheus 客户端 SDK
- [ ] 学习 OTel trace API
- [ ] 学习 React Server Components
```

### 3.3 学习节奏

| 频率 | 活动 |
|---|---|
| **每日** | 完成 1-2 个任务,更新当前任务的经验库 |
| **每周** | 复盘本周,提炼 1-2 个 skill 或 anti-pattern |
| **每月** | 与用户复盘 40 专家矩阵,调整学习方向 |

### 3.4 知识传承

- 经验库 commit 到 git,形成版本化知识
- 每次换 main agent / session,新 agent 读 `docs/expertise/` 恢复知识
- **关键**: 经验库不能塞 "obsolete info",必须**有 timestamp + 状态**

---

## 4. ⚖️ 取舍 (Trade-offs)

### 4.1 引入的开销
- **每次改动要查 ownership** (5 秒)
- **每次改动要 append AUDIT_LOG** (10 秒)
- **复杂改动必须进 plan mode** (1-3 分钟)

### 4.2 收益
- **避免 revert 修复** (节省 30-60 分钟/次)
- **避免引入新 bug** (节省调试时间)
- **知识沉淀** (下次启动有知识基础)
- **决策可追溯** (出问题能查回滚)

### 4.3 风险
- ⚠️ ownership 文件可能过时
- ⚠️ AUDIT_LOG 可能膨胀
- ⚠️ 过于严格可能拖慢进度

### 4.4 缓解
- ownership 文件每月审一次
- AUDIT_LOG 季度归档
- 严格性分阶段启用 (Phase 1 软,Phase 2 硬)

---

## 5. ✅ 审批项

请用户审批:

- [ ] **R1**: 是否同意本 RFC 的总体方向
- [ ] **R2**: 阶段 1 (文档化) 是否本脉冲完成
- [ ] **R3**: 阶段 2 (工具化) 是否下脉冲完成
- [ ] **R4**: 是否在 40 专家中,先建一个空 `docs/expertise/` 目录(空模板),由 main agent 启动 1-2 个专家先试用
- [ ] **R5**: 是否同意 main agent 在 1 小时内改动的文件,ant 不得 revert (除非用户/我明确要求)

---

## 6. 📚 附录

### 6.1 相关文档
- [dev-evaluation.md](./dev-evaluation.md) — 综合评估与发展计划
- [debt.md](./debt.md) — 债务追踪
- [foundation-architecture.md](./apps/api/src/modules/foundation/foundation-architecture.md) — 基础架构说明
- [national-venue-database.md](./national-venue-database.md) — 全国场地数据

### 6.2 计划
- **本脉冲 (Pulse-62)**:
  - ✅ 关闭 P0-003
  - ✅ 写 dev-evaluation.md
  - ✅ 写 agent-collaboration-rfc.md
  - ⏳ 等用户审批
- **下脉冲 (Pulse-63)**:
  - 实施 RFC 阶段 1 文档化 (FILE_OWNERSHIP.md / AUDIT_LOG.md)
  - 创建 docs/expertise/ 空模板
  - 修 P0-002 app-journey 66s
- **未来**:
  - Pulse-70: 40 专家满月复盘
  - Pulse-100+: 全面实现 RFC 阶段 2-3

### 6.3 反馈
如对 RFC 有修改意见,请直接编辑本文件并在 commits 中标注 `[RFC-EDIT]`。
