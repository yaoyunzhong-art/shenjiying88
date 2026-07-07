# Phase-25 任务清单

## T105 — 探索现有 sessions 页面结构 + 动态路由模式
**状态**: ✅ 完成

**发现**:
- admin-web 4 个 agent 页面使用 `RSC page.tsx` + `client component` + `view-model loader` 模式
- 动态路由用 `[id]` 文件夹 + `params: { id: string }`
- 现有 ui 组件: `PageShell`, `StatCard`, `DataTable`, `StatusBadge`, `Tabs`, `SearchFilterInput`, `LoadingSkeleton`, `DescriptionList`, `DetailClosureBar`
- SDK 已暴露 `getAgentSession`, `getAgentExecution`, `getSessionEvaluation`, `getAgentConfig` 4 个 GET 端点

## T106 — 设计详情页 layout
**状态**: ✅ 完成

**布局结构**:
```
[Header]  ← 返回列表 + Session ID
[Stats: 4 cards]  执行步数/总耗时/LLM调用/工具调用
[Status 头部]  StatusBadge + userInput + 创建信息 + raw JSON toggle
[Two Columns]
  Left (2fr):
    - 消息时间线 (system/user/assistant/tool filter)
    - MessageBubble (角色图标 + 标签 + 内容 + toolCall 嵌套)
    - 最终输出卡 (若存在)
    - 错误卡 (若存在)
  Right (1fr):
    - Config metadata (使用配置)
    - Session metadata
    - Execution stats
    - Quality Evaluation (6 维度进度条)
```

## T107 — 实现 page.tsx (RSC) + session-detail-client.tsx
**状态**: ✅ 完成 (含 DR-6 协议对齐修复)

**新建文件**:
- `apps/admin-web/app/agents/sessions/[id]/page.tsx` (~85 行)
  - RSC,读取 `params.id`
  - 调用 `loadAgentSessionDetail(id)`,返回 null → `notFound()`
  - 4 个 StatCard + Suspense + client 组件
- `apps/admin-web/app/agents/sessions/[id]/session-detail-client.tsx` (~660 行)
  - `'use client'`,接收 session/execution/evaluation/config/deliveryMode/error 6 个 props
  - 内含 `MessageBubble` / `EvaluationCard` / `ExecutionCard` / `Field` 子组件
  - `useState` 管理 messageFilter (all/system/user/assistant/tool) + showRaw
  - `useMemo` 计算 filteredMessages + messageStats

**关键设计**:
- `MessageBubble` 支持 `toolCalls` 数组嵌套渲染(input/output/durationMs/status/error)
- `EvaluationCard` 6 维度用进度条 + 颜色区分
- `ExecutionCard` 6 字段 grid + error 区
- "原始 JSON" toggle 用于调试展示完整 payload

## T108 — sessions 列表页加 "查看详情" 链接
**状态**: ✅ 完成

**修改**:
- `apps/admin-web/app/agents/sessions/agent-sessions-client.tsx`
- 引入 `import Link from 'next/link'`
- 会话 ID 列从 `<span>` 改为 `<Link href={`/agents/sessions/${item.id}`}>`,样式改为蓝色 + " → "后缀

## T109 — E2E 验证
**状态**: ✅ 完成 (58/58 断言全通)

**脚本**: `scripts/phase25-e2e-session-detail.ts`

**测试维度**:
1. **service 直调** (17 断言):createAndRunSession 返回结构 + session 基础字段
2. **messages 内容完整性** (8 断言):4 角色 + systemPrompt 一致 + userInput 一致 + toolCallId 存在
3. **execution 字段** (10 断言):id 格式 + 关联 + 状态 + steps + durationMs + llmCalls + toolCalls + 时间戳 + tenantId
4. **session.currentStep === execution.steps 同步** (1 断言)
5. **service 二次查询一致性** (4 断言):getSession + getSessionExecution 命中
6. **view-model fallback 路径** (5 断言):用 sess-001 验证 fallback 全字段
7. **真实 sessionId 不在 fallback → 返回 null** (1 断言)
8. **未知 id 返回 null** (1 断言):触发 notFound
9. **sess-001 完整 evaluation** (5 断言):overallScore + 6 维度评分
10. **sess-002 RUNNING 状态** (4 断言):status + 无 execution + 无 evaluation
11. **sess-003 FAILED + 低分** (4 断言):status + error + overallScore < 0.7

**结果**: 58 通过 / 0 失败

## T110 — Retro + 知识沉淀
**状态**: ✅ 完成 (本文档)

## 补全任务

### T-Bonus-1 — 重建 Phase-24 DR-6 协议对齐
**状态**: ✅ 完成

**问题**: Phase-24 闭环后,`packages/types/src/index.ts` 中 agent types 块被 revert 到 Phase-23 老版本(包含 `AgentConfigStatus` / `enabledTools` / `query` / `scores[]` / `passed` 等过期字段)。

**修复**: 完全重写 line 3804-3968 (165 行),对齐 `apps/api/src/modules/agent/agent.entity.ts` 真相源:
- 新增 `AgentMessageRole` / `AgentExecutionStatus` / `AgentToolCallStatus` 字符串字面量 union
- `AgentConfig`: 移除 `description/temperature/maxTokens/enabledTools/knowledgeBaseIds/status/tags`,新增 `enableReflection/allowedTools/timeoutMs/enabled/tenantId`
- `AgentSession`: 移除 `configName/userId/query/totalSteps/finalAnswer/durationMs`,新增 `userInput/currentStep/maxSteps/enableReflection/messages/finalOutput/error/startedAt/completedAt/createdBy/tenantId`
- `AgentExecution`: 重写为后端 service 返回结构(`id/sessionId/configId/status/steps/totalDurationMs/llmCalls/toolCalls/error/startedAt/completedAt/tenantId`)
- `QualityEvaluation`: 6 独立分数字段替换 `scores[]` 数组
- `SessionExecutionResult`: 改为 `{ session, execution, evaluation?, timestamp }`
- `BatchAgentRequest/Response`: items[] + total/succeeded/failed/results[]
- `AgentStats`: 替换为 9 字段 (totalSessions/avgSteps/avgDurationMs/avgLlmCalls/avgQualityScore/...)

**触发重建**: `pnpm --filter @m5/types build && pnpm --filter @m5/sdk build`(sdk 0 错误)

### T-Bonus-2 — 补全 apps/admin-web/app/agents/tools/page.tsx
**状态**: ✅ 完成

**问题**: Phase-24 T101 标注 "已完成"但 `page.tsx` 文件不存在,只有 `agent-tools-client.tsx`。

**修复**: 新建 `page.tsx` (~45 行):
- 4 个 StatCard(总数/高风险/中风险/低风险)
- 调 `loadAgentTools()` → 渲染 `<AgentToolsClient>`

## 总览

| 任务 | 类型 | 行数/文件数 | 状态 |
|------|------|------------|------|
| T105 | 探索 | - | ✅ |
| T106 | 设计 | - | ✅ |
| T107 | 实现 | 2 文件, ~745 行 | ✅ |
| T108 | 导航 | 1 文件, ~10 行 | ✅ |
| T109 | E2E | 1 脚本, 58 断言 | ✅ |
| T110 | Retro | 1 文件 | ✅ |
| T-Bonus-1 | 修复 | 165 行重写 + 2 build | ✅ |
| T-Bonus-2 | 补全 | 1 文件, ~45 行 | ✅ |
| **合计** | **5 新文件 + 2 修改 + 1 spec** | **~900 行** | **8/8 完成** |