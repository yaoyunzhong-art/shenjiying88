# Phase-24 — 前端联调 (Agent & Knowledge V2)

**周期**: 2026-06-26
**承接**: Phase-23 (后端 Agent 模块 13 service 方法)
**目标**: 把后端 Agent 能力完整接入 admin-web,作为操作员日常使用的工作台。

---

## 1. 范围

| 模块 | 后端 service | 前端 SDK | 前端页面 | 状态 |
|------|-------------|---------|---------|------|
| Configs CRUD | `getConfigs / getConfig / createConfig / updateConfig / deleteConfig` | `listAgentConfigs / getAgentConfig / createAgentConfig / updateAgentConfig / deleteAgentConfig` | `/agents/configs` | ✅ |
| Sessions Run/Batch | `createAndRunSession / batchExecute` | `runAgentSession / batchRunAgent` | `/agents/sessions` (只读) | ✅ |
| Sessions List/Get | `getSessions / getSession` | `listAgentSessions / getAgentSession` | `/agents/sessions` | ✅ |
| Execution Trace | `getSessionExecution` | `getAgentExecution` | (详情页留作 Phase-25) | ⚠️ |
| Evaluation | `getEvaluation / getEvaluations` | `getSessionEvaluation / listQualityEvaluations` | `/agents/evaluations` | ✅ |
| Stats | `getStats` | `getAgentStats` | `/agents/sessions` (顶部统计) | ✅ |
| Tools Registry | `getTools` | `listAgentTools` | `/agents/tools` | ✅ |

合计: **13 个后端 service 方法** ⇄ **13 个 SDK 方法** ⇄ **4 个前端页面** (含 fallback)

> 注:`submitEvaluation` 虽存在于 service,但 controller 未注册 POST `/agent/evaluations` 端点(由 service 在 session.run 内部触发),故 SDK 不暴露此方法。

---

## 2. 架构原则

1. **类型先于实现**: 任何 SDK 方法都先在 `@m5/types` 定义 interface,然后 `@m5/sdk` 消费,前端组件 import type。
2. **复用现有 ApiClient**: 不引入新的子命名空间 (`apiClient.agent.configs.list()`),保持方法平铺,降低心智负担。
3. **Fallback-first**: 所有 load 函数都包装 try/catch,后端不可达时返回 fallback demo 数据 + deliveryMode='fallback',前端 banner 提示。
4. **后端 entity 为真相源**: SDK 类型与 [apps/api/src/modules/agent/agent.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/agent.entity.ts) 字段 1:1 对齐 (`id`, `name`, `systemPrompt`, `model`, `maxSteps`, `enableReflection`, `allowedTools`, `timeoutMs`, `enabled`, `tenantId` 等)。
5. **字符串字面量 union**: Status / Role 等全部用字符串字面量 union (后端用 'PENDING'/'RUNNING'/'COMPLETED'/'FAILED'/'CANCELLED' 大写),无需 enum import。
6. **后端为只读 in-memory**: Phase-23 决定了 agent 模块是 in-memory storage,前端所有写操作(create/update/delete/run)在重启后端后会丢失 — 接受为约束,留待 Phase-25 接入持久层。

---

## 3. 关键决策 (DR)

### DR-1: SDK 方法命名采用"资源+动作"而非"动作+资源"
- ✅ `listAgentConfigs` (名词列表式)
- ❌ `getAgentConfigList` (动词前缀式)
- **理由**: 与 admin-web 现有 `listAuditTrail`/`listFoundationAlerts` 一致,降低学习成本。

### DR-2: Agent 页面统一托管在 `/agents/{resource}` 而非按业务域拆分
- ✅ `/agents/configs` `/agents/sessions` `/agents/tools` `/agents/evaluations`
- ❌ `/ai-studio/configs` `/customer-service/agents` `/ops/agent-runs`
- **理由**: 单一入口便于在导航中聚合,后续 Phase-25 可加 `/agents` 总览页串联。

### DR-3: Fallback 数据保留在 `agent-view-model.ts` 而非 mock 目录
- ✅ 同文件 export `FALLBACK_AGENT_CONFIGS` 等常量
- ❌ 单独 `apps/admin-web/app/agents/__fixtures__/`
- **理由**: 现阶段 mock 数据只服务前端 demo,后续替换为真实 API 后可整文件删除。

### DR-4: `dynamic = 'force-dynamic'` 应用于所有 agent 页面
- **理由**: page.tsx 在 RSC 中调用 `loadAgentConfigs` 走 fetch,需禁用 SSG 避免构建时硬编码 fallback。

### DR-5: 写操作 (createAgentConfig / runAgentSession) 暂不接 UI
- **理由**: Phase-24 范围限定为"联调+可视化",写操作涉及表单/校验/审批流,留作 Phase-25 Agent Studio 子项目。

### DR-6: **协议对齐后端** (Phase-24 复盘最大发现)
- **教训**: 之前我基于"Phase-23 总结"定义了 types,但总结里没有覆盖 agent.entity.ts 的真实字段命名 (`userInput` vs `query`、`allowedTools` vs `enabledTools`、`maxSteps` required vs optional、status 大写 vs 小写、`finalOutput` vs `finalAnswer`、`relevanceScore`/`accuracyScore`/... 独立字段 vs `scores[]` 数组 等)。最终以 [agent.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/agent.entity.ts) 为真相源重写 `@m5/types` 与 `@m5/sdk`。
- **流程改进**: Phase-25 开始,任何后端模块集成前,先 grep `apps/api/src/modules/X/X.entity.ts` 与 `X.dto.ts` 作为字段约定源,**不依赖对话总结**。

---

## 4. 验收清单 (Acceptance Checklist)

- [x] `@m5/types` 导出 12 个 agent 接口 (字段完全 mirror [agent.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/agent.entity.ts))
- [x] `@m5/sdk` 暴露 13 个 ApiClient 方法 (与后端 13 个可调用 service 方法对应)
- [x] admin-web 4 个 agent 页面 (`configs/sessions/tools/evaluations`) 渲染 stats + table + tabs + search
- [x] Fallback 数据 + deliveryMode 提示 (前端可在后端不可达时仍可演示)
- [x] `pnpm build` types + sdk 成功
- [x] **T103 E2E 验证**: scripts/phase24-e2e-agent.ts 跑通 25/25 断言 (configs CRUD + sessions run/batch + session detail + evaluations list + stats + tools + delete)
- [x] **修复后端启动阻塞**: `coupon.entity.ts` + `coupon-redemption-log.entity.ts` 加显式 column type → 解决 TypeORM `ColumnTypeUndefinedError`
- [x] **创建临时 `.env`**: 绕过 JWT_SECRET 缺失,AgentModule 成功在 Nest InstanceLoader 初始化
- [ ] 后端 agent 模块 HTTP 端到端 curl 验证 (需 PostgreSQL + Redis 真实启动,非 Phase-24 阻塞项)
- [ ] 详情页 (`/agents/sessions/[id]`) 展示 execution trace + evaluation (Phase-25)

---

## 5. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 后端 agent 模块为 in-memory storage | 重启后数据丢失 | Fallback demo 数据 + deliveryMode='fallback' |
| Phase-25 才会有执行详情页 | 用户看不到 trace | 列表中展示 currentStep / maxSteps / finalOutput 兜底 |
| Quality dimensions 6 个,UI 容易拥挤 | 信息密度低 | 维度标签缩写 (前 2 字)+ tooltip 完整分数 |
| Tool riskLevel 'high' 缺少运行时熔断 | 高风险工具误调用 | Phase-25 agent runtime 应加入 risk gating |
| 前后端字段命名差异 (Phase-24 复盘发现) | 协议 drift | DR-6 — Phase-25 起以 entity 文件为真相源 |