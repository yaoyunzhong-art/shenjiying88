# Phase-24 Retro (Frontend Integration — Agent)

**日期**: 2026-06-26
**范围**: 4 个 admin-web agent 页面 + 12 个 types + 13 个 SDK 方法 + E2E 25/25 验证
**结果**: ✅ 8/8 完成 (含协议对齐修复)

---

## 6 个 Drivers (DR)

### DR-1: 前端集成是"端点 mirror"而非"业务编排"
**观察**: Phase-23 后端提供了 13 个 agent service 方法,但前端整合其实是机械映射,不需要新设计 — types 接口 mirror entity,SDK 方法 mirror service,UI 表格 mirror 字段。
**教训**: 当后端已经做完业务建模,前端集成阶段的最大价值是**严格保持一致性**,而非"优化"或"重新抽象"。任何"我觉得这里可以更好"的诱惑都要拒绝,否则会引入跨端 drift。

### DR-2: Fallback 数据 ≠ Mock 服务
**观察**: 我把所有 fallback 数据放在 `agent-view-model.ts` 顶部 export 常量,而不是建独立的 `__fixtures__` 目录或 mock service worker。
**教训**: Fallback 的目的是**演示 + 兜底**,不是替代测试体系。放在 view-model 旁边让"删了它就能彻底切到真后端"成为一句 PR 描述,而不是文件搜索任务。

### DR-3: 动态 force-dynamic 是 RSC + fetch 的正确选择
**观察**: 4 个 agent page.tsx 都加了 `export const dynamic = 'force-dynamic'`,否则构建时会执行 `loadAgentConfigs` 然后把结果静态化。
**教训**: Next.js 15 App Router 的 RSC 在 build 时也会执行 page 顶层 await。如果 fetch 走真实后端,必须 force-dynamic 否则会硬编码一个空结果。`{ cache: 'no-store' }` 不够,因为 build 阶段不调用 runtime cache。

### DR-4: SDK 类型 union 用字符串字面量而非 enum
**观察**: `AgentSessionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'` 是字符串字面量 union,不是 TypeScript enum。
**理由**:
1. 后端 entity 用字符串 ('PENDING' 等),union 与之一致可避免 `Status['PENDING']` 这种 enum 索引语义。
2. JSON 序列化无需 enum-to-string 转换。
3. 删除字段不会触发 tree-shaking 失效。
**教训**: 当后端用字符串时,前端不要用 enum,否则会在 cross-module 边界制造类型翻译层。

### DR-5: 写操作 (createAgentConfig / runAgentSession) 暂不接 UI
**观察**: 4 个页面都是只读 (list/get)。create/update/delete 通过 SDK 暴露但 UI 不调用。
**理由**: Phase-24 是"集成+可视化",写操作涉及表单 schema、字段校验、审批流、与现有 modal 组件的复用,工程量远超可视化,且与"先看见再操作"的认知顺序不符。
**教训**: **先 readout 再 write** — 用户对未见过的事物无法构造写操作意图。Phase-25 才上"Agent Studio"写面板。

### DR-6: **协议对齐必须以 entity 文件为真相源** (本轮最大教训)
**观察**: 第一次基于"Phase-23 总结"定义 types,字段命名与后端 `agent.entity.ts` 不符:
- `query` vs 后端 `userInput`
- `enabledTools` vs 后端 `allowedTools`
- `status: 'active'` vs 后端 `status: 'ACTIVE'` 大写
- `finalAnswer` vs 后端 `finalOutput`
- `scores: QualityScore[]` vs 后端 6 个独立 `relevanceScore`/`accuracyScore`/...
- `enabled` vs 后端 `enabled: boolean`
- 缺少 `tenantId` / `maxSteps` required / `enableReflection` / `timeoutMs` / `createdBy` / `messages[]` 等关键字段

**根因**: 对话总结是把 entity "翻译"成中文/简化版的过程,翻译不可避免丢失精度。任何**间接来源**都不应作为类型定义依据。

**修复**: 直接 grep `apps/api/src/modules/agent/agent.entity.ts` 全部 interface 字段,逐字段重写 types/sdk/admin-web。

**流程改进** (Phase-25 起):
1. **任何后端模块集成,第一步**: `cat apps/api/src/modules/X/X.entity.ts` + `X.dto.ts` 全文
2. **第二步**: 用 [agent.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/agent/agent.entity.ts) 作为字段源头,**不读对话总结**
3. **第三步**: 在 `@m5/types` 加 interface 时,字段名/类型/可选性 100% mirror
4. **第四步**: 写一个 e2e 脚本验证 service 方法 (`scripts/phase24-e2e-agent.ts`),任何不一致立即暴露

**教训**: 跨 phase 的总结适合做"决策记录",不适合做"实现依据"。

---

## 3 个 Patterns (P)

### P-1: view-model.ts 是 RSC ↔ Client 的接口层
**结构**:
```
agent-view-model.ts  ←  RSC 中调用 (server)
   ↓ props
*-client.tsx          ←  'use client' 组件
```
view-model 包含:
- `createAgentClient()` 工厂 (tenantId 等固定)
- `FALLBACK_*` 演示数据
- `loadAgent*()` 包装 (try/catch + deliveryMode)
- 写操作 (`submitAgentConfig`, `deleteAgentConfig`) — 即使无 fallback 也保留 SDK 直调

**优点**:
- RSC 中 await 一次,client 只接 props,无需 useEffect/useState 初始化
- fallback 集中在 view-model,client 只需关心 UI 渲染
- 写操作也走 SDK,保持前后端协议单一

### P-2: Stats 卡片顶部 + Tabs + Search + Table 的四段式布局
每个 agent 页面都遵循:
1. PageShell (title/subtitle)
2. 4 个 StatCard (总数/激活/异常/趋势)
3. Tabs (状态分组 + count)
4. SearchFilterInput (模糊搜索)
5. DataTable (排序 + 自定义 render)

**优点**: 用户无需学习成本,跨页面跳转零认知负担。
**复用组件**: `@m5/ui` 的 `PageShell` / `StatCard` / `Tabs` / `SearchFilterInput` / `DataTable` / `StatusBadge` — 全部来自 shared UI package。

### P-3: 后端启动问题分层处理
**观察**: 本轮遇到 3 个后端启动障碍,逐层解:
1. TypeORM `ColumnTypeUndefinedError` → 给所有 `@Column()` 加显式 `type`
2. Nest `Missing required env: JWT_SECRET` → 创建临时 `.env`
3. DataSource 不可达 (无 PostgreSQL) → E2E 改用 service 直调,绕开 HTTP/Nest

**教训**: 当后端服务无法全栈启动时,**降到下一层 (service 直调) 验证业务逻辑**,而不是阻塞在基础设施层。

---

## 3 个 Anti-Patterns (AP)

### AP-1: ❌ 在 page.tsx (RSC) 中直接 import '@m5/sdk' 的 ApiClient
**原因**: page.tsx 在 build 时执行,如果 fetch 失败 (后端不在),会抛错导致整个 build 失败。
**正确做法**: view-model 包装 try/catch + fallback,即使后端挂掉,build 也能产出含 fallback 数据的 HTML。

### AP-2: ❌ 把 SDK 方法的 `RequestInit` 参数暴露给前端 props
**原因**: 前端组件应该只关心业务参数 (configId, userInput),不应透传 HTTP 概念。
**正确做法**: SDK 方法签名是 `(body: CreateSessionRequest, init?: RequestInit)`,前端 view-model 调用时把 `init` 固定为 `{ cache: 'no-store' }` 或省略。

### AP-3: ❌ 用对话总结代替代码文件作为类型定义依据
**原因**: 总结是翻译版本,会丢失字段命名、可选性、大小写等细节。
**正确做法**: 直接 cat `.entity.ts`/`.dto.ts` 文件,逐字段定义 types。

---

## Lessons Learned (横向迁移)

1. **类型-接口-SDK-页面** 这个 4 层漏斗在每次新模块集成时都是同构的,可提炼为 checklist:
   ```
   □ cat apps/api/src/modules/X/X.entity.ts (字段源头)
   □ cat apps/api/src/modules/X/X.dto.ts (请求体源头)
   □ @m5/types 加 interface (字段 mirror)
   □ @m5/sdk 加 ApiClient 方法 (endpoint mirror)
   □ admin-web 加 page.tsx + *-client.tsx + view-model
   □ scripts/X-e2e.ts 验证 service 直调
   ```

2. **fallback 数据** 是 admin-web demo 的生命线,后端 in-memory storage 重启即丢,但 demo 演示不能中断。

3. **详情页** (Phase-25) 一定要先于 **写操作** — 用户先看见 execution trace 再决定是否要 rerun / edit config。

4. **写操作集中化** — 把 create/update/delete 放在 view-model 而非 page.tsx,这样未来加 modal 时,view-model 自然提供 hook。

5. **后端启动遇到 TypeORM/env 问题时**:
   - TypeORM `ColumnTypeUndefinedError` → 大概率是 tsx 装饰器元数据丢失,显式给 `type`
   - `Missing required env: X` → 检查 `env.validation.ts`,创建临时 `.env` 最小集
   - DataSource 不可达 → 不阻塞业务验证,降到 service 层直调

---

## Phase-25 预告

- `/agents/sessions/[id]` 详情页:展示 execution trace (步骤/工具调用/观察/中间答案)+ evaluation 评分卡
- Agent Studio (`/agents/studio`):create/update config 表单 + tool 选择器 + 实时预览
- Tool risk gating:执行高风险工具前需 runtime governance 审批 (复用 Phase-22 的 runtime-governance 模式)
- 实时执行:SSE/WebSocket 推送步骤进度,前端流式渲染 finalOutput
- 持久层:把 in-memory storage 替换为 TypeORM entity (承接 Phase-26)