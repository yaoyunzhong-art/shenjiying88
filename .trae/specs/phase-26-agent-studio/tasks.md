# Phase-26 任务清单

## T1 — 探索后端写接口 + admin-web 现有表单组件
**状态**: ✅ 完成

**发现**:
- 后端 AgentService 已实现 13 个方法,其中 5 个写操作:
  - `createConfig(config: AgentConfig): AgentConfig`
  - `updateConfig(id: string, updates: Partial<AgentConfig>): AgentConfig | undefined`
  - `deleteConfig(id: string): boolean`
  - `createAndRunSession(request: CreateSessionRequest): SessionExecutionResult`
  - `batchExecute(request: BatchAgentRequest): BatchAgentResponse`
- view-model.ts 已导出对应的异步包装函数:
  - `submitAgentConfig(body: AgentConfig): Promise<AgentConfig>` (line 379)
  - `runAgentSession(body: CreateSessionRequest): Promise<SessionExecutionResult>` (line 383)
  - `batchRunAgent(body: BatchAgentRequest): Promise<BatchAgentResponse>` (line 387)
  - `deleteAgentConfig(id: string): Promise<{ deleted: boolean }>` (line 391)
- `@m5/ui` 表单组件齐全:
  - `FormField` (label + input + error + helper + required)
  - `Input` (extends InputHTMLAttributes)
  - `InputNumber` (number 类型 + min/max/step)
  - `Select` (onChange: (value: string) => void)
  - `MultiSelect` (value/onChange: string[])
  - `Tabs` (variant: pills)
  - `useFormSubmit<T>` ({ onSubmit, successMessage, defaultErrorMessage }) → { state, submit, submitting, error, success }
  - `FormSubmitFeedback` ({ submitting, error, success } | { state })
  - `SubmitButton` ({ onClick, disabled, loading, label, loadingLabel, variant: danger })

## T2 — 设计 3 Tab 布局
**状态**: ✅ 完成

**布局结构**:
```
[Header] Agent Studio · 写操作面板
[Warning] (fallback 模式时显示)
[Tabs pills]
  ① 创建 Config   [count = 现有 config 数]
  ② 运行会话
  ③ 批量运行
  ④ 删除 Config

[Active Tab Form]
  Tab 1: 8 个 FormField (name/systemPrompt/model/tenantId/maxSteps/timeoutMs/enableReflection/allowedTools/enabled) + SubmitButton
  Tab 2 / 3: 内部 [单次/批量] button 切换 + 共享 RunSessionForm
    - configId(Select) + userInput(textarea) 或 batchInputs(动态数组)
    - maxSteps(InputNumber) + enableReflection(Select default/true/false)
    - createdBy(Input) + tenantId(Input)
  Tab 4: DeleteConfigForm (configId + confirmText + danger SubmitButton)
```

## T3 — 实现 page.tsx (RSC) + studio-client.tsx
**状态**: ✅ 完成

**新建文件**:
- `apps/admin-web/app/agents/studio/page.tsx` (~25 行)
  - RSC,加载 configs
  - Suspense fallback + AgentStudioClient
- `apps/admin-web/app/agents/studio/studio-client.tsx` (~570 行)
  - `'use client'`,接收 configs + deliveryMode 2 个 props
  - 内含 3 子组件: `CreateConfigForm` / `RunSessionForm` (single/batch 二合一) / `DeleteConfigForm`
  - 使用 `useFormSubmit<T>` 管理每个表单的提交状态
  - 单/批切换用内部 button state
  - 验证: name 必填 + systemPrompt 至少 10 字符
  - 删除需 confirmText === configId

**关键设计决策**:
- **无 textarea 组件**:`@m5/ui` 未导出 `Textarea`,用原生 `<textarea>` 加 inline style
- **`useFormSubmit` 异步回调**:`onSubmit` 返回 Promise<T>,successMessage 支持函数形式动态生成
- **联合类型 result**:`SessionExecutionResult | BatchAgentResponse`,在 successMessage 函数中用 type narrowing
- **批量 inputs 动态数组**:useState<string[]>,支持增删行(最少 1 行)
- **enableReflection 三态**:`undefined | true | false` 三选项 Select("用配置默认"/"强制启用"/"强制关闭")

## T4 — E2E 验证
**状态**: ✅ 完成 (48/48 断言全通)

**脚本**: `scripts/phase26-e2e-agent-studio.ts`

**测试维度**:
1. **submitAgentConfig (8 断言)**: createConfig 返回字段完整性 + 二次查询命中
2. **runAgentSession (12 断言)**: session + execution 全字段 + maxSteps/enableReflection 覆盖
3. **batchRunAgent (10 断言)**: total/succeeded/failed + per-item maxSteps 覆盖 + createdBy/tenantId 传递
4. **deleteAgentConfig (7 断言)**: 返回 true + 数量 -1 + getConfig undefined + 重复删除 false + ghost id false
5. **不存在 config 抛错 (2 断言)**: createAndRunSession throw + 错误信息含 "not found"
6. **禁用 config 抛错 (2 断言)**: createAndRunSession throw + 错误信息含 "disabled"
7. **updateConfig (4 断言)**: name + enabled 字段更新 + id 不变
8. **getStats (3 断言)**: tenantId 正确 + totalSessions >= 4 + avgSteps > 0

**结果**: 48 通过 / 0 失败

**Phase-25 E2E 回归测试**: 58/58 仍通过 ✅

## T5 — Retro + 知识沉淀
**状态**: ✅ 完成 (本文档 + retrospective.md)

## 总览

| 任务 | 类型 | 行数 | 状态 |
|------|------|------|------|
| T1 | 探索 | - | ✅ |
| T2 | 设计 | - | ✅ |
| T3 | 实现 | 2 文件, ~595 行 | ✅ |
| T4 | E2E | 1 脚本, 48 断言 | ✅ |
| T5 | Retro | 2 文件 | ✅ |
| **合计** | **2 新页面 + 1 脚本 + 2 spec** | **~595 行 + ~600 行 spec** | **5/5 完成** |