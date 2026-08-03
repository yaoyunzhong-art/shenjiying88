# AI CS Module

## 模块概述
AI 智能客服引擎，提供全链路自动化客服能力。核心引擎 CSEngine 集成意图识别、知识检索、多 Provider 回退、转人工坐席、会话管理等能力。支持 OpenAI / DeepSeek / Mock 三种 LLM Provider 动态切换与故障回退。

## 核心功能
- **Message Processing** — 主入口 `POST /ai-cs/send`，自动意图识别 + 知识检索 + LLM 回复 + 会话关联
- **Conversation Management** — 会话创建/查询/活跃会话列表，跨 Provider 一致性
- **Intent Recognition** — 用户意图识别与分类
- **Knowledge Retrieval** — 多租户隔离的知识库检索（title 搜索 + topK）
- **Fallback Chain** — 多 LLM Provider 自动回退（OpenAI → DeepSeek → Mock）
- **Handoff (转人工)** — 自动创建工单转人工坐席、队列查询
- **Provider Switching** — OpenAI / DeepSeek / Mock 三种 Provider 适配器
- **Data Adapters** — Conversation / Knowledge / Intent 三层数据适配器
- **Session Caching** — 会话状态缓存与统计数据
- **RingBeam** — 环信通信模式集成
- **Advanced CS** — ai-cs-advanced.service 扩展客服高级能力

## API 端点列表

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `ai-cs/send` | 发送消息（主入口） |
| POST | `ai-cs/handoff` | 转人工坐席 |
| POST | `ai-cs/knowledge` | 添加知识库条目 |
| GET | `ai-cs/knowledge/search` | 知识库检索 |
| GET | `ai-cs/sessions` | 列出活跃会话 |
| GET | `ai-cs/sessions/:id` | 获取会话详情 |
| GET | `ai-cs/health` | 健康检查 |

## 依赖关系

### Core Services
- **CSEngine** — 客服核心引擎（主调度）
- **SessionService** — 会话管理与状态缓存
- **IntentService** — 意图识别
- **KnowledgeService** — 知识库检索
- **FallbackService** — Provider 故障回退调度
- **HandoffService** — 转人工工单管理

### Adapters
- **ConversationAdapter** — 会话数据适配器
- **KnowledgeAdapter** — 知识库数据适配器
- **IntentAdapter** — 意图数据适配器

### Providers
- **OpenAIProvider** — OpenAI LLM 接入
- **DeepSeekProvider** — DeepSeek LLM 接入
- **MockProvider** — Mock Provider（测试/回退用）

### Shared
- **TenantGuard** — 多租户安全守卫（复用 agent module）
- **NestJS** — Controller / Service / Module 架构
- **ValidationPipe** — DTO 参数校验

## 配置说明
```
# TenantId 从 JWT/Header 自动提取
# Provider Fallback 链: OpenAI → DeepSeek → Mock
# 每次会话自动 sync 配置，不跑 watch/tsc
# 会话过期时间可配置（默认 30 分钟）
# Knowledge 搜索 topK 默认 5，通过 Query 参数可调
# In-memory 存储，生产环境建议替换为 Redis/DB
```
