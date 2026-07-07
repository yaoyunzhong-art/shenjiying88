# Phase-25 Session 详情页 — Spec

## 范围

实现 Agent Session 详情页 `/agents/sessions/[id]`,作为 Phase-24 留作 Phase-25 预告的可观测面板:
1. 完整 message 时间线(system / user / assistant / tool)
2. Execution stats(步数、LLM 调用、工具调用、总耗时、状态)
3. Quality Evaluation 6 维度评分卡(相关性/准确性/完整性/安全性/有用性/简洁性)
4. Session 元数据 + Config metadata(关联 Agent 配置)

补全 Phase-24 遗漏的 `tools/page.tsx`,作为额外修复项。

## 架构原则

### AP-1: 真相源始终在后端 entity 文件
任何 Phase 之间的协议对齐,第一动作是 `cat apps/api/src/modules/X/X.entity.ts`,而非依赖对话总结或前一轮 spec。

### AP-2: DR-6 协议对齐不可降级
types / sdk / view-model / page 必须字段一致。若任一层失同步,build/IDE 立刻报错,不可静默fallback。

### AP-3: 详情页 RSC + Client 双层
- RSC (`page.tsx`):负责 server-side data fetch(view-model)+ 404 fallback (`notFound()`)
- Client (`session-detail-client.tsx`):负责交互(filter / toggle raw JSON)

### AP-4: fallback 策略保持一致
service 不可达 → 展示 fallback 数据集(已含 3 个 sess-xxx 样本覆盖 COMPLETED/RUNNING/FAILED 三态),客户端按 `deliveryMode` 标识。

## 任务清单 (8)

- T105: 探索现有 sessions 页面结构 + 动态路由模式 ✅
- T106: 设计详情页 layout ✅
- T107: 实现 page.tsx (RSC) + session-detail-client.tsx ✅
- T108: sessions 列表页加 "查看详情" 链接 ✅
- T109: E2E 验证 (58/58 断言全通) ✅
- T110: Retro + 知识沉淀 (本文档) ✅

## 补全任务

- T-Bonus-1: 重建 Phase-24 DR-6 协议对齐(types/index.ts 因某种原因被 revert,需要重新应用)
- T-Bonus-2: 补全 `apps/admin-web/app/agents/tools/page.tsx`(Phase-24 遗漏)

## 验收清单

- [x] `/agents/sessions/[id]` RSC 页面可访问
- [x] 4 个顶部 stats 卡(执行步数/总耗时/LLM 调用/工具调用)
- [x] 状态头部(StatusBadge + userInput + 创建信息 + raw JSON toggle)
- [x] 左栏:消息时间线(4 种角色 filter + 完整 bubble + toolCall 嵌套)
- [x] 左栏:最终输出卡(若存在)+ 错误卡(若存在)
- [x] 右栏:Config metadata 卡
- [x] 右栏:Session metadata 卡
- [x] 右栏:Execution 卡(状态 + 6 字段 grid + error)
- [x] 右栏:Evaluation 卡(综合分 + 通过/未通过 badge + 6 维度进度条 + feedback)
- [x] 列表页会话 ID 可点击导航到详情
- [x] 未知 sessionId 触发 Next.js `notFound()`
- [x] 后端不可达自动降级 fallback
- [x] types/sdk/admin-web 0 个 TypeScript 错误
- [x] E2E 58/58 断言通过

## 风险

### R-1: IDE cached types
修 types 后 IDE 仍报旧错,需 `pnpm --filter @m5/types build && pnpm --filter @m5/sdk build` 触发增量编译,或重启 TS Server。

### R-2: view-model Edit 不持久化
Phase-25 中途发现 view-model 中的 Session Detail loader 被 wipe (与 Phase-24 types revert 同类问题)。每次 Edit 后用 `cat -n` 验证。

### R-3: Phase-24 文档被删除风险
原 `.trae/specs/phase-24-frontend-integration/` 目录被外部清理,Phase-25 文档需及时落盘并备份。

## 已知未覆盖

- HTTP 端到端 curl(需 PostgreSQL + Redis)
- SSE/WebSocket 实时执行流推送(Phase-26 预告)
- 详情页内嵌运行按钮(Phase-27 预告)