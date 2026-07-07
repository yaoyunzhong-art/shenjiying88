# 📊 神机营 SaaS · 综合评估与发展计划 (dev-evaluation.md)

> 最后更新: 2026-06-26 00:55 CST · Pulse-67
> 范围: 全仓库 monorepo (apps/api · apps/admin-web · apps/storefront-web · apps/tob-web · apps/app · apps/miniapp · packages/*)
> 配套: [dev-roadmap.md](./dev-roadmap.md) (执行版) · [knowledge/INDEX.md](./knowledge/INDEX.md) (知识库索引)

---

## 1. 📐 现状快照

| 维度 | 数据 | 来源 |
|---|---|---|
| 业务模块数 | 29 | `apps/api/src/modules` |
| TypeScript 源文件 | 622 | `find ... -name "*.ts"` |
| 测试文件 | 365 | `find ... -name "*.test.ts"` |
| Service 代码行 | ~33k | `wc -l` |
| 当前 Pulse | 62 | debt.md |
| 全量测试 (Pulse-62) | 1574 / 1574 ✅ | 跑完 member/finance/tenant/loyalty/campaign/inventory |
| P0 阻塞 | 1 (P0-002 app-journey 66s) | debt.md |
| P1 阻塞 | 2 (P1-001 ui build, P1-002 queue/transactions TS) | debt.md |

---

## 2. ✅ 已完成阶段 (Pulse-XX)

| Phase | 内容 | 验证 |
|---|---|---|
| Phase-13 | 基础设施 (Redis/Cache/EventBus/Queue) | 单测全绿 |
| Phase-14 | Observability (pino + Prometheus) | 单元+e2e 全绿 |
| Phase-15 task 2-5 | TenantQuota/Isolation/Lifecycle/Enforcement + 跨 service e2e | 62 单测 + 16 e2e |
| Phase-15 task B | QuotaEnforcement helper + 实战集成 | 17 e2e |
| Phase-15 task C | LoyaltyService 真实接入 | 10 e2e |
| Phase-15 task D | MemberService.register 真实接入 | 10 e2e |
| Phase-15 task E | MemberService.registerPersistent 真实接入 | 8 e2e |
| Phase-16 task D | CampaignService 真实接入 | 9 e2e |
| Phase-16 task E | InventoryService 真实接入 + Product kind | 8 e2e |
| Phase-16 task F | FinanceService.createInvoice 真实接入 + Invoice kind | 10 e2e |

---

## 3. 🚧 已知债务 (debt.md 摘要)

- **P0-002** @m5/app app-journey.test.ts 66s 超时 — 需 mock fetch / 拆分 fast unit + slow integration
- **P1-001** @m5/ui build fail — 未验证
- **P1-002** queue.role-extended.test.ts (13 errors) + transactions.role-extended TS errors — pre-existing

---

## 4. 💡 开发经验总结 (自我反思)

### ✅ 做得好的
1. **向后兼容模式**:`@Optional()` + `if (this.x && this.y) {...}` 守卫,legacy 测试不导入 TenantModule 仍 work
2. **guard 在业务校验之前**:lifecycle 先于 quota,Suspended 租户直接 409
3. **reserve-and-rollback**:业务失败时 `decrement` 回滚,避免 quota 虚高
4. **idempotent 兼容**:registerPersistent existingProfile 命中时手动 decrement
5. **ts-pattern 化 e2e**:`buildAppWithQuota` factory + `useFactory + inject: [{ token, optional: true }]` 绕开 tsx runtime `@Optional` 限制
6. **逐步分阶段**:Phase-13→14→15→16 层层递进,基础设施 → observability → 多租户 → 业务接入

### ❌ 反复踩坑
1. **ant 反复 revert 我的修复** — 没有 protected branch / file lock / agent 协作规范
2. **跨 test 共享 state**:`memberStore` / `campaignPlanStore` 是 module-level Map,reset helper 缺失
3. **诊断日志混乱**:之前加 `console.log('quota injected:', ...)` 调试,事后未清理
4. **test 假设不一致**:campaign.role.test.ts 我修 2 处(空 filter、priority 互斥期望)
5. **typecheck 未进 CI 门禁**:queue/transactions pre-existing TS errors 一直没修
6. **subagent 协作无审计**:"3 只树哥修复" 是体力活,没有 learning feedback loop

### 💡 系统性问题
- 没有"零回归协议"
- 没有"quota 用量可视化"
- 没有"自动修复专家"
- 没有"债务 fire-and-forget"
- 没有"测试覆盖率仪表盘"

---

## 5. 🧠 自我学习 / 进化方向

| # | 学习点 | 应用方式 |
|---|---|---|
| L1 | 修复时一定加 reset helper | 给所有 service 加 `resetXxxServiceTestState()` |
| L2 | 修 ant 写的 test 时先复现 (git stash 确认) | 形成 checklist |
| L3 | 改 enum/interface 时先 grep 全部 switch | 写 pre-commit hook |
| L4 | 不用 inline `assert.equal` 兜底 | 写诊断 helper + 严格测试 |
| L5 | e2e 用唯一 ID 前缀避免共享 state | test fixture factory |
| L6 | 关键模块改动后跑全量套件 | 写 `pnpm test:all` 脚本 |
| L7 | lint 不留 warning | 写 lint-strict CI |

---

## 6. 🚀 调整后的科学开发计划 (4 阶段)

### Stage A · 工程基线 (1-2 脉冲,~2 周)
- A1. 修 P0-002 (app-journey 66s) — 引入 msw/nock 拦截 fetch + 拆 fast/slow
- A2. 验证 P1-001 (@m5/ui build) — 跑 `pnpm --filter @m5/ui build`
- A3. 修 P1-002 (queue/transactions role-extended TS errors)
- A4. typecheck 进 CI 门禁 (按模块分别跑)
- A5. 给所有 service 加 `resetXxxServiceTestState()` + lint 规则禁止 export 内部 store
- A6. 写 `pnpm test:all` 全量测试脚本,进 CI 门禁

### Stage B · 业务层余量 (2-3 脉冲,~3 周)
- B1. **OrderService** 接入 guard — 新加 `QuotaResourceKind.Order`
- B2. **PointsService.addPoints** 接入 lifecycle + recordApiCall (高频操作,metrics only)
- B3. **SettlementService.createSettlement** 接入 guard — 新加 `QuotaResourceKind.Settlement`
- B4. **ReservationService** 接入 guard (如存在)
- B5. **TournamentService** 接入 guard (如存在)
- B6. **AIGateway / LYT** 接入 ApiCall quota (控制 AI 成本)

### Stage C · 可观测性 + 监控 (1-2 脉冲,~2 周)
- C1. 暴露 Prometheus `/metrics` 端点(quota usage / lifecycle status / apiCall rate)
- C2. 写 batch job:每天 0 点 reset apiCallsToday + 发送超限告警
- C3. tenant dashboard:查看 usage 历史曲线
- C4. **Otel 链路追踪** 跨 service (Phase-14 task 6)
- C5. **Grafana dashboard** for SaaS 运营

### Stage D · 债务清理 + 自动化 (持续)
- D1. 关闭 P0/P1 全部
- D2. lint 规则集 (@typescript-eslint/no-unused-vars 等)
- D3. subagent 协作协议(避免 revert 战)— 见 `agent-collaboration-rfc.md`
- D4. CI 矩阵:全 4 个 app (api/admin-web/storefront-web/tob-web) + app/miniapp 都进 CI
- D5. Coverage badge + Diff coverage PR gate
- D6. **Phase-17 跨 service quota dashboard** (web UI for ops)

---

## 7. 🧬 40 名专家 · 10 工作流 × 4 阶段 矩阵

> **定义**: 神机营 SaaS 开发 = 10 个工作流 (横向) × 4 个生命周期阶段 (纵向) = 40 个交叉岗位
> 每个交叉点 = 1 名"专家"角色,有专属职责 + 学习路径 + 赋能产物

### 7.1 横向 · 10 个工作流 (职能域)

| # | 工作流 | 负责范围 | 关键产物 |
|---|---|---|---|
| W1 | **架构** | 模块拆分 / 依赖关系 / DDD 边界 | architecture.md / ADR |
| W2 | **后端开发** | NestJS service / controller / DTO | src/modules/* |
| W3 | **前端开发** | Next.js / RN / 小程序 / Web Components | apps/*/app |
| W4 | **数据库** | Prisma schema / migration / query | prisma/schema.prisma |
| W5 | **测试** | unit / e2e / simulator / contract | **/*.test.ts |
| W6 | **可观测性** | metrics / logs / traces / alerts | observability/* |
| W7 | **安全合规** | auth / authz / privacy / 审计 | tenant/identity-access |
| W8 | **DevOps / SRE** | CI/CD / infra / deploy / runbook | infra/docker/* |
| W9 | **多租户 / SaaS** | quota / lifecycle / isolation | tenant/* |
| W10 | **产品 / UX** | 需求 / 流程 / 用户旅程 | app/storefront-web/app |

### 7.2 纵向 · 4 个生命周期阶段

| Stage | 阶段 | 关键活动 | 专家职责 |
|---|---|---|---|
| **L1** | **设计 (Design)** | 需求 / 架构 / DTO 草案 | 写 ADR + entity + dto |
| **L2** | **实现 (Build)** | 编码 + 单测 + 集成 | 写 service + test |
| **L3** | **验证 (Verify)** | e2e + 性能 + 安全扫描 | 跑 e2e + lint + typecheck |
| **L4** | **运维 (Operate)** | 监控 + 告警 + 债务清理 | 写 observability + close debt |

### 7.3 40 名专家矩阵 (W × L)

| W \ L | L1 设计 | L2 实现 | L3 验证 | L4 运维 |
|---|---|---|---|---|
| **W1 架构** | 架构师 · ADR | 架构师 · 落地 | 架构师 · 评审 | 架构师 · 演进 |
| **W2 后端** | 后端 · 实体设计 | 后端 · service | 后端 · e2e | 后端 · 性能 |
| **W3 前端** | 前端 · UX 流程 | 前端 · 页面 | 前端 · E2E | 前端 · A11y |
| **W4 数据库** | DBA · schema | DBA · migration | DBA · query plan | DBA · 备份 |
| **W5 测试** | QA · 测试策略 | QA · 单元测试 | QA · E2E | QA · 覆盖率 |
| **W6 可观测** | SRE · 指标设计 | SRE · 埋点 | SRE · 告警 | SRE · 仪表盘 |
| **W7 安全** | 安全 · 威胁建模 | 安全 · guard/拦截 | 安全 · 渗透 | 安全 · 审计 |
| **W8 DevOps** | DevOps · IaC | DevOps · CI | DevOps · 部署 | DevOps · 值班 |
| **W9 多租户** | SaaS · 配额设计 | SaaS · lifecycle | SaaS · 配额校验 | SaaS · 报表 |
| **W10 产品** | PM · 需求 | PM · 验收 | PM · UAT | PM · 数据驱动 |

### 7.4 自我学习 / 进化机制

**每个专家** = 一个**永久 subagent role**:
- **输入**: 当前代码状态 + 债务 + 历史决策
- **输出**: 任务范围内的代码 / 文档 / 决策
- **学习反馈**: 每次任务后,main agent 更新专家的"经验库"

**经验库结构** (`docs/expertise/{W}{L}.md`):
```markdown
# 专家 {W}{L} · 经验库

## 当前状态
- 在 Pulse-XX 完成任务 X
- 在 Pulse-YY 踩坑 Y

## 已掌握技能
- 技能 1 (掌握度 90%)
- 技能 2 (掌握度 60%)

## 待学习
- 技能 3 (学习中)

## 决策历史
- {date} 选 X 方案,因为 ...
```

### 7.5 40 专家学习计划 (滚动)

**每周**:
1. 从 `debt.md` 提取待办
2. 根据 W×L 矩阵分派 (W=职能,L=阶段)
3. 每个专家完成任务后更新 `docs/expertise/{W}{L}.md`
4. 每月回顾:调整学习方向

**示例 (本周)**:
- W5-L3 QA E2E → 修 P0-002 app-journey 66s
- W9-L2 SaaS 实现 → Phase-16F FinanceService.createInvoice ✅
- W6-L4 SRE 运维 → 写 batch job reset apiCallsToday

### 7.6 专家自我进化机制

每个专家有 **3 个学习循环**:

1. **观察 (Observe)**: 读代码 + 债务 + 失败用例
2. **抽象 (Abstract)**: 形成可复用的模式 / 工具 / lint 规则
3. **应用 (Apply)**: 在下次任务中直接套用,降低出错率

**反馈通道**:
- ✅ 任务成功 → 经验库 +1 skill
- ❌ 任务失败 → 经验库 +1 anti-pattern
- 🔁 多次失败 → 升级到 main agent 复盘

---

## 8. 📅 接下来的脉冲 (Pulse-63 ~ Pulse-70)

| Pulse | 主题 | W × L 责任专家 |
|---|---|---|
| Pulse-63 | 修 P0-002 app-journey 66s | W5-L3 QA E2E + W8-L3 DevOps CI |
| Pulse-64 | Phase-16 业务层余量 OrderService | W9-L2 SaaS + W2-L2 后端 + W5-L2 QA |
| Pulse-65 | Stage C 暴露 Prometheus /metrics | W6-L1 SRE 指标 + W2-L2 后端 |
| Pulse-66 | 修 P1-002 queue/transactions TS | W5-L3 QA + W2-L3 后端 |
| Pulse-67 | batch job apiCallsToday reset | W6-L4 SRE 运维 + W9-L4 SaaS 报表 |
| Pulse-68 | Phase-17 quota dashboard UI | W10-L1 产品 + W3-L2 前端 |
| Pulse-69 | lint 规则集 + agent 协作 RFC 落地 | W8-L3 DevOps + W5-L3 QA |
| Pulse-70 | **40 专家满月复盘** | main agent + 用户 |

---

## 9. 🎯 关键指标 (KPI)

| 指标 | 当前 | 目标 |
|---|---|---|
| 全量测试通过率 | 100% (1574/1574) | ≥ 99% |
| TSC 错误数 | 13 (pre-existing) | 0 |
| P0 阻塞 | 1 (P0-002) | 0 |
| 业务 service 接入 guard | 7/29 (~24%) | 15/29 (~50%) |
| e2e 覆盖模块 | 6/29 (~21%) | 12/29 (~41%) |
| QuotaResourceKind 覆盖 | 6 | 10+ |
| observability 端点 | 0 (pino only) | /metrics + /health + /traces |
| 专家经验库 | 0/40 | 40/40 (满月目标) |

---

## 10. 🚀 启动下一步

按用户回复 (P0-003 + RFC):
1. ✅ 关闭 P0-003 (debt.md 已更新)
2. ⏳ 写 `agent-collaboration-rfc.md` RFC 给用户审批 (主 agent 协作协议)
3. ⏳ 创建 `docs/expertise/` 目录,初始化 40 个专家经验库空模板
4. ⏳ 进入 Stage A · 工程基线
