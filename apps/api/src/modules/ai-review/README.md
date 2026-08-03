# AI Review · AI 代码审查模块

利用 LLM (Claude / OpenAI / DeepSeek) 对 PR Diff 进行自动化代码审查，提供安全、性能、正确性等多维度评审意见。

## 核心功能

1. **PR Diff 自动化审查** — 接收 PR diff 输入，经 RAG 检索上下文后调用 LLM 生成评审报告
2. **多维度问题分类** — 支持 security / performance / correctness / maintainability / architecture 等 10 种评审分类，critical → suggestion 4 级严重性
3. **LLM Provider 多模型支持** — 通过 LLMProviderFactory 统一管理 Claude / OpenAI / DeepSeek 三款 provider，实现主备切换
4. **成本追踪与控制** — CostTrackerService 记录每次 LLM 调用开销，支持 Prompt Cache 和预算超限拦截（BudgetExceededError）
5. **配置管理** — 支持创建/更新/查询/删除评审配置，可自定义语言、严重性阈值等参数

## 主要依赖

| 组件 | 职责 |
|---|---|
| `AIReviewController` | REST 路由层：`POST /ai-review/reviews` 等 9 个端点 |
| `AIReviewService` | 核心业务：PR Diff 解析 → RAG 检索 → Prompt 构建 → LLM 调用 → 结果解析 |
| `ClaudeProvider` / `OpenAIProvider` / `DeepSeekProvider` | LLM 模型适配器 |
| `LLMProviderFactory` | Provider 工厂，按配置选择模型 |
| `CostTrackerService` | 调用成本追踪与缓存 |
| `AdvancedReviewService` | 高级代码审查 (🐜 V17) |

## 配置项

配置通过 `ConfigModule.forFeature(llmConfig)` 注入，位于 `llm/llm.config.ts`：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `LLM_PROVIDER` | 主 provider (`claude` / `openai` / `deepseek`) | `claude` |
| `LLM_API_KEY` | API 密钥 | — |
| `LLM_BUDGET_LIMIT` | 单次会话预算上限 (USD) | `0.50` |
| `LLM_CACHE_TTL` | Prompt Cache TTL (秒) | `3600` |
| `LLM_MAX_TOKENS` | 单次生成最大 token 数 | `4096` |

## 文件结构

```
ai-review/
├── ai-review.module.ts          # NestJS 模块定义（@Global 注册）
├── ai-review.controller.ts      # REST 控制器 (9 个端点)
├── ai-review.service.ts         # 核心评审服务
├── ai-review.dto.ts             # 请求/响应 DTO (class-validator 装饰)
├── ai-review.entity.ts          # 实体/接口类型定义
├── ai-review.contract.ts        # 合约接口
├── ai-review-advanced.service.ts # 高级代码审查服务
├── ai-cs-advanced.service.ts    # 客服高级分析
├── ai-diagnosis-advanced.service.ts # 诊断高级分析
├── ai-model-config-advanced.service.ts # 模型配置高级服务
├── ai-sales-insight.service.ts  # 销售洞察服务
├── ai-forecast-insight.service.ts # 预测洞察服务
├── llm/
│   ├── llm.config.ts            # LLM 配置定义
│   ├── llm.provider.ts          # Provider 工厂 + 三个 Provider 实现
│   ├── cost-tracker.service.ts  # 成本追踪服务
│   ├── prompt-templates.ts      # Prompt 模板 (Diff/Test/Performance/RFC)
│   ├── types.ts                 # LLM 通用类型定义
│   ├── cost-report.py           # 成本报告脚本
│   └── llm.test.ts              # LLM 单元测试
├── *.spec.ts / *.test.ts        # 单元/集成测试
└── *.e2e.test.ts                # E2E 测试
```

## P-38 财务冲刺

- **TD-001** — LLM API 成本控制（CostTracker + Cache + Budget 拦截）
- **TD-002** — AI Review 准确率 ≥ 70%（RAG 上下文注入 + Prompt 模板优化）
- 集成 Phase-21 GitHub Webhook 触发自动评审

---

> Phase-19 · Pulse-73 (完整流程实现) · Pulse-80 (启动连接)
