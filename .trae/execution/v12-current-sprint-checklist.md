# V12 当前 Sprint 实施清单

> 版本: V1.0
> 基准日期: 2026-06-30
> 当前周期: Sprint 1 (2026-06-28 → 2026-07-02)
> 目的: 把“现在到底应该做什么”从总规划落到可执行清单,并区分主任务、底座阻塞项、插入型任务。

---

## 1. 当前 Sprint 定位

当前处于 V12 `Sprint 1`:

- 主题: `业务基础 · 会员体系 + 盲盒引擎`
- 目标: 完成 Phase 104 与 Phase 105 的后端、前端与整合
- 测试目标: `125 PASS`
- HEARTBEAT: `part-55`

本 Sprint 不是开放式“什么都能做”，而是围绕会员与盲盒闭环推进。

---

## 2. 当前生效任务映射

### 2.1 Sprint 1 主任务

| Day | Task | Phase | 类型 | 当前口径 |
|---|---|---|---|---|
| 49 | `T104-1` | 104-A | 后台 | 会员等级体系 |
| 50 | `T104-2` | 104-B | 后台 | SVIP 订阅 + 会员休眠 |
| 51 | `T105-1` | 105-A | 后台 | BlindBox 引擎 |
| 52 | `T104-3` | 104-U | 前台 | MemberCenter |
| 53 | `T105-2` | 105-U | 前台/整合 | BlindBoxShowcase + HEARTBEAT-55 |

### 2.2 当前日期对应重点

按 `2026-06-30` 计算,当前应优先聚焦:

1. `T105-1 / Phase 105-A`
   - BlindBox 引擎后端
   - 四级奖池、概率公示、端盒保底
   - Redis Lua 原子能力

2. `T104-1 / T104-2` 未闭环项复核
   - 若会员等级体系与 SVIP 仍未形成完整验收链,优先补齐验证

3. `T104-3` 前置共享能力
   - 只允许补 MemberCenter 直接依赖的共享组件、hooks、contracts、tests

---

## 3. 当前 Sprint 允许做的事

### A. 直接主线任务

- Member 领域后端
- SVIP 与休眠策略
- BlindBox 引擎后端
- MemberCenter 与 BlindBoxShowcase 前台
- 直接服务于上述任务的 contract、DTO、测试、UI 共享组件

### B. 可接受的 cross-cutting enablement

仅当它直接阻塞 Sprint 1 主任务时，才允许插入:

- 共享组件补齐
- 前后端 contract 对齐
- HTTP / E2E / node:test 测试基座修补
- admin-web 与 packages/ui 中直接复用到当前 Sprint 的通用组件
- 多租户、鉴权、运行时治理的 P0 风险修复

### C. 不应抢占 Sprint 1 的事项

- 与会员/盲盒无直接关系的独立专题开发
- 仅为了“顺手”补齐的历史模块长尾
- 与当前 Sprint 无关的漂亮化、重构化、广域测试扩写

---

## 4. 当前仓库中已出现的插入型任务归类

以下任务不是 Sprint 1 主目标，但可按“底座或阻塞项”管理，不得冒充主线:

### 4.1 `reports` 链路回归

- 归类: `历史主线收口 / 质量治理`
- 是否属于 Sprint 1 主任务: `否`
- 允许条件:
  - 属于 P0 风险
  - 阻塞当前主应用健康度
  - 需要在切回 V12 业务开发前先清零

### 4.2 `multimedia` contract / hook / interaction 回归

- 归类: `cross-cutting enablement`
- 是否属于 Sprint 1 主任务: `否`
- 允许条件:
  - 作为共享前端/运行时能力的稳定性加固
  - 不得长期替代会员/盲盒主线

### 4.3 `admin-web/app/agents/tools/*`

- 归类: `admin-web 测试补强 / runtime governance 支撑`
- 是否属于 Sprint 1 主任务: `否`
- 当前处理结论:
  - 本轮作为插入型测试补充纳入
  - 仅视作治理底座增强
  - 不改变 Sprint 1 主线仍然是 `104 + 105`

---

## 5. 当前 Sprint 的 Definition of Done

本 Sprint 完成必须同时满足:

### 5.1 产品闭环

- 会员等级体系可完整运行
- SVIP 订阅与休眠策略可验证
- BlindBox 引擎具备四级奖池、概率公示、端盒保底
- 至少一个会员前台与一个盲盒前台入口完成接线

### 5.2 测试闭环

- 单测 / 模块测试补齐
- 至少一条关键 HTTP 或集成回归
- 前台读面/交互关键路径有回归
- Sprint 1 累计测试目标向 `125 PASS` 对齐

### 5.3 文档闭环

- 对应任务可追溯到 `T104-x / T105-x`
- 对应 checklist 项能找到映射
- 关键决策、风险、插入型任务归类要记录

### 5.4 Git 闭环

- 本地提交已完成
- 若远端权限允许则推送
- 若权限阻塞,需明确记录阻塞不是代码问题

---

## 6. 当前执行清单

### P0 · 每次开始前

- [ ] 标注当前工作属于 `T104-x / T105-x / cross-cutting enablement / P0 风险修复`
- [ ] 检查是否违反 Constitution 的 5 端、AI、知识库、多租户要求
- [ ] 检查是否抢占 Sprint 1 主线

### P1 · 每次开发中

- [ ] 代码改动能追溯到任务
- [ ] 测试改动能追溯到验收项
- [ ] 若是插入型任务,明确阻塞关系
- [ ] 若触碰共享层,说明对 MemberCenter / BlindBoxShowcase 的帮助

### P2 · 每次开发后

- [ ] 跑专项验证
- [ ] 检查诊断
- [ ] 更新文档或追溯说明
- [ ] 本地提交
- [ ] 尝试推送

---

## 7. 本轮 admin-web 文件纳入说明

本轮额外纳入以下文件:

- `apps/admin-web/app/agents/tools/agent-tools-client.tsx`
- `apps/admin-web/app/agents/tools/client.test.tsx`
- `apps/admin-web/app/agents/tools/page.test.ts`

处理原则:

- 它们不重定义当前 Sprint 主线
- 它们被视作治理/测试底座增强
- 本轮已按专项测试验证通过后纳入收口

---

## 8. 一句话执行要求

从现在开始:

`Sprint 1 只允许 104/105 主线优先推进，其他任务只能以“阻塞项 / 底座增强 / P0 风险修复”身份插入，且必须可追溯。`
