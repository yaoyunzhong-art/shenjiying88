# Agent 管理中心

## 模块定位

Agent 管理中心是 shenjiying88 管理后台的 AI Agent 全生命周期管理平台，提供从 Agent 配置、运行、监控到评估与编排的一站式管控能力。该模块面向具备 `foundation.governance.read` 权限的后台管理员，聚合了 6 个子功能模块，帮助运营团队高效管理智能体服务。

## 核心能力

- **仪表盘概览**：实时展示运行中/已完成/失败会话数量、总执行次数、平均执行步数与耗时等关键指标，并呈现 dashboard/configs/tools/evaluations 四条控制面快照的来源态与错误证据。
- **Agent 配置管理**：管理 Agent 配置模板，包括模型选择（如 deepseek-v4）、系统提示词、允许工具列表、超时设置与是否启用反思能力。
- **会话列表与详情**：查看所有 Agent 会话历史，支持按状态筛选，并提供会话详情页展示执行记录与质量评估。
- **工具注册管理**：注册与管理 Agent 可调用的外部工具（如 order_query、refund_create），含输入 Schema 定义与风险等级标识。
- **质量评估报告**：对 Agent 输出进行多维度评分（相关性/准确性/完整性/安全性/帮助性/简洁性），支持批量下钻分析。
- **Agent Studio 编排**：在线编排 Agent 工作流，实时测试与调试 Agent 行为。

## 目录结构

```
agents/
├── page.tsx                          # 服务端入口页面（async 组件）
├── page.test.ts / page.test.tsx      # L1+L2 综合测试（正例/反例/边界/防御/数据校验）
├── error.tsx                         # 错误边界 UI
├── loading.tsx                       # 加载骨架屏
├── not-found.tsx                     # 404 回退页
├── agent-view-model.ts              # 数据层：加载函数 + Fallback 数据 + 业务封装
├── agent-view-model.test.ts         # 数据层测试
├── dashboard/                        # 仪表盘子页
│   ├── page.tsx / page.test.tsx
│   └── dashboard-client.tsx
├── configs/                          # Agent 配置管理子页
│   ├── page.tsx / page.test.tsx
│   └── agent-configs-client.tsx / agent-configs-client.test.tsx
├── sessions/                         # 会话列表子页
│   ├── page.tsx / page.test.tsx
│   ├── agent-sessions-client.tsx / agent-sessions-client.test.tsx
│   └── [id]/                         # 会话详情动态路由
│       ├── page.tsx / page.test.tsx
│       └── session-detail-client.tsx / session-detail-client.test.tsx
├── tools/                            # Agent 工具管理子页
│   ├── page.tsx / page.test.tsx
│   ├── agent-tools-client.tsx / client.test.tsx
├── evaluations/                      # 质量评估子页
│   ├── page.tsx / page.test.tsx
│   └── agent-evaluations-client.tsx
└── studio/                           # Agent Studio 编排子页
    ├── page.tsx / page.test.tsx
    └── studio-client.tsx
```

## 使用示例

```tsx
// 服务端组件中加载 Agent 概览
import { loadAgentDashboardSnapshot } from './agent-view-model';

const snapshot = await loadAgentDashboardSnapshot({ cache: 'no-store' });
// 返回: { runningCount, completedCount, failedCount, avgSteps, avgDurationMs, ... }
// 后端不可达时自动降级为 FALLBACK 数据

// 提交 Agent 配置
import { submitAgentConfig } from './agent-view-model';
const config = await submitAgentConfig({
  name: '客服 Agent',
  model: 'deepseek-v4',
  systemPrompt: '你是一个专业的客服 Agent',
  allowedTools: ['order_query', 'refund_create'],
  maxSteps: 10,
  timeoutMs: 30000,
  enabled: true,
});

// 流式运行 Agent 会话
import { runAgentSessionStream } from './agent-view-model';
const stream = runAgentSessionStream({
  configId: 'agent-cfg-cs',
  userInput: '查询订单状态',
  tenantId: 'tenant-demo',
});
for await (const event of stream) {
  console.log(event); // 实时事件流
}
```

## 相关 REST API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/agent/configs` | 获取 Agent 配置列表 |
| POST | `/api/v1/agent/configs` | 创建 Agent 配置 |
| DELETE | `/api/v1/agent/configs/:id` | 删除指定 Agent 配置 |
| GET | `/api/v1/agent/sessions` | 获取会话列表 |
| GET | `/api/v1/agent/sessions/:id` | 获取会话详情 |
| GET | `/api/v1/agent/sessions/:id/execution` | 获取会话执行记录 |
| POST | `/api/v1/agent/sessions/run` | 运行 Agent 会话 |
| POST | `/api/v1/agent/sessions/stream` | 流式运行 Agent 会话 |
| POST | `/api/v1/agent/sessions/batch` | 批量运行 Agent |
| GET | `/api/v1/agent/tools` | 获取注册工具列表 |
| GET | `/api/v1/agent/stats` | 获取 Agent 统计概览 |
| GET | `/api/v1/agent/evaluations` | 获取质量评估列表 |
| GET | `/api/v1/agent/evaluations/:sessionId` | 获取指定会话的评估结果 |

> 所有数据加载函数均包含 `api` / `fallback` 双模式，后端不可达时自动降级为内置 Fallback 数据，确保 UI 不白屏。写操作（创建/运行/删除）在失败时直接抛错，不做静默降级。
