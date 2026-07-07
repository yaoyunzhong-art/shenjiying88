# Phase-26 Agent Studio 写表单 — Spec

## 范围

实现 Agent Studio 写操作面板 `/agents/studio`,作为 Phase-25 Session 详情页的"反向"配套:
- Phase-25: **看** 会话(只读: messages / execution / evaluation)
- Phase-26: **写** 会话(创建配置 / 运行会话 / 批量运行 / 删除配置)

补齐 SDK 暴露的 4 个写方法在 UI 中的端到端调用闭环。

## 架构原则

### AP-1: 写操作无 fallback
Phase-25 view-model 的 read fallback (FALLBACK_*) 适用于只读场景(展示历史/快照)。
写操作 (create/run/delete) **没有 fallback** —— 后端不可达时直接抛错,用户需修复后端后重试。
Studio 通过 `deliveryMode === 'fallback'` 显示警告条。

### AP-2: useFormSubmit 作为写操作唯一入口
所有 4 个表单统一使用 `@m5/ui` 的 `useFormSubmit` hook:
- 自动管理 submitting/error/success 状态
- successMessage 支持函数形式,可动态展示结果
- 与 `FormSubmitFeedback` 组件配合实现统一反馈

### AP-3: 危险操作需二次确认
删除 Config 是不可逆操作,要求用户输入 Config ID 字符串作为确认凭证。
这一步在前端拦截误操作,后端 service 不再校验(信任前端确认)。

## 任务清单 (5)

- T1: 探索后端写接口 + admin-web 现有表单组件 ✅
- T2: 设计 3 Tab 布局 ✅
- T3: 实现 page.tsx (RSC) + studio-client.tsx (3 表单) ✅
- T4: E2E 验证 (48/48 断言全通) ✅
- T5: Retro + 知识沉淀 (本文档) ✅

## 验收清单

- [x] `/agents/studio` RSC 页面可访问,加载 configs 数据
- [x] fallback 模式下显示警告条
- [x] Tab 1 创建 Config: name/systemPrompt/model/maxSteps/enableReflection/allowedTools/timeoutMs/enabled/tenantId
- [x] Tab 1 表单验证: name 必填 + 长度,systemPrompt 必填 + 至少 10 字符
- [x] Tab 1 成功消息: "创建成功: {id}"
- [x] Tab 2 单次运行: configId(下拉) + userInput(必填) + maxSteps(可选覆盖) + enableReflection(可选覆盖) + createdBy + tenantId
- [x] Tab 2 批量运行: 动态增删 userInput 行
- [x] Tab 2 成功消息: 单次 "会话 {id} 已执行完成 (N 步, Nms)", 批量 "批量执行完成: succeeded/total 成功"
- [x] Tab 3 删除 Config: configId(下拉) + 二次确认(必须输入 ID) + 红色 danger 按钮
- [x] 所有表单使用 useFormSubmit + FormSubmitFeedback
- [x] Tab 切换使用 Tabs (variant=pills) + 单/批切换使用自定义 button 组
- [x] types/sdk/view-model 0 个 TypeScript 错误(studio-client.tsx 0 错误)
- [x] E2E 48/48 断言通过
- [x] Phase-25 E2E 仍 58/58 通过(无回归)

## 风险

### R-1: 后端不可达时写操作直接抛错
Studio 不提供写操作的 fallback 兜底。需在前端明确告知用户"先修后端"。

### R-2: 没有速率限制
频繁点击"运行会话"可能触发后端 429。生产环境需要在 SDK 层加重试 + 限流。

### R-3: 误删风险
即使有二次确认,删除 Config 仍会丢失所有引用此 Config 的会话历史(虽然 in-memory 不持久化,生产 TypeORM 化后需更复杂策略)。

## 已知未覆盖

- HTTP 端到端 curl(需 PostgreSQL + Redis)
- SSE 实时流推送(Phase-27 预告)
- 工具调用审批(Phase-28 预告)
- 持久层改造(Phase-29 预告)