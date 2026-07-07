# Phase-26 复盘 (Agent Studio 写表单)

## 完成情况

✅ **全部完成**: 5/5 主任务
✅ **E2E**: 48/48 断言全通
✅ **无回归**: Phase-25 E2E 仍 58/58 通过
✅ **静态检查**: studio-client.tsx 0 个 TypeScript 错误(IDE 缓存延迟问题已规避)

## Decision Records

### DR-10: 写操作无 fallback
**背景**: Phase-25 view-model 的 read fallback (FALLBACK_*) 适用于只读场景。
**决策**: 写操作 (create/run/delete) **不提供 fallback**,后端不可达时直接抛错。
**理由**:
- 写操作需要真实持久化,fallback 写入内存等于误导用户
- 用户应被明确告知"先修后端",而不是看到虚假的成功
**实施**:
- Studio 顶部在 `deliveryMode === 'fallback'` 时显示警告条
- `useFormSubmit` 的 onSubmit 抛错后,FormSubmitFeedback 自动展示错误

### DR-11: useFormSubmit 作为唯一写操作入口
**背景**: 4 个表单都需要 submitting/error/success 状态管理。
**决策**: 统一使用 `@m5/ui` 的 `useFormSubmit<T>` hook,不允许自定义 state。
**理由**:
- 减少重复代码 (4 个表单共节省约 80 行 state 管理代码)
- 保证 UI 反馈模式一致 (spinner + success/error message)
- 易于后续接入 React Query 或 SWR 做 mutation 缓存

### DR-12: 危险操作二次确认
**背景**: 删除 Config 不可逆,误操作风险高。
**决策**: 删除按钮必须输入 Config ID 字符串作为确认凭证。
**理由**:
- 比"是否确认"对话框更强(防止手滑)
- 用户必须真正读过 Config ID 才完成操作
**未做**: 后端 service 不校验,信任前端确认(生产环境可加 service 层 soft-delete)

## Problems

### P-1: `useFormSubmit` API 与假设不同
**现象**: 最初代码 `submit.run(...)` `submit.loading` `submit.data` `submit.status` 全部报错。
**根因**: 实际 API 是 `{ submit, submitting, error, success, state, reset, clearError, clearSuccess }`。
**修复**: Read 真实组件代码,重写所有 4 个表单的 state 引用。
**教训**: **不要凭直觉使用第三方 hook,先 Read 源码**。

### P-2: `@m5/ui` 没有 `Textarea` 组件
**现象**: 引入 `Textarea` 报错"没有导出的成员"。
**根因**: 项目尚未提供 Textarea 组件。
**修复**: 使用原生 `<textarea>` + inline style 替代,与项目 dark theme 一致。
**教训**: **表单场景复杂时,优先检查 UI 库,缺什么用 native + style 兜底**。

### P-3: Tabs `count` 只接受 number
**现象**: `count: \`${configs.length} 现有\`` 报错"不能将 string 分配给 number"。
**根因**: TabsItem.count 是 number 类型。
**修复**: 改为 `count: configs.length`(纯数字)。
**教训**: **数字 badge 显示字符串说明需用 suffix/prefix 属性,不是 count**。

### P-4: E2E 1 个断言笔误
**现象**: `session.userInput === '1+1=?'` 失败。
**根因**: 实际写入是 `'请计算 1+1=?'`,断言值丢了"请计算"。
**修复**: 修正断言值。
**教训**: **复制粘贴时仔细校对,不要相信自己的断言**。

## Anti-Patterns (供未来避坑)

### AP-1: 不要凭直觉假设 hook API
Read 真实组件源码后再用。

### AP-2: 不要相信对话总结中的"已完成"
Phase-25 修复 Phase-24 types 漂移的经验,适用于所有层(types/sdk/view-model)。

### AP-3: 不要在 IDE 显示错误时立即修改代码
先 cat 验证文件实际状态,IDE 可能有缓存延迟。

## Phase-27 预告

可选方向:
1. **SSE 实时流推送** — Session 详情页改为运行时增量更新 execution 进度(改造 studio-client 的 runSession 表单支持流式输出)
2. **Tool risk gating UI** — 高风险工具调用前弹审批确认(关联到 Phase-22 trust-governance),在 Studio 的"运行会话"中加入 tool risk 评估
3. **Agent 持久层改造** — `agent.service.ts` 的 4 个 in-memory 数组替换为 TypeORM 实体
4. **Config 版本控制** — Studio 创建/更新/删除时记录审计日志
5. **会话导出** — Studio 增加"导出 session JSON / Markdown"按钮,供离线分析

## 关键文件清单

- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/agents/studio/page.tsx` (RSC, 25 行)
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/agents/studio/studio-client.tsx` (Client, 570 行)
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/phase26-e2e-agent-studio.ts` (E2E, 48 断言)
- `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/.trae/specs/phase-26-agent-studio/{spec,tasks,retrospective}.md`