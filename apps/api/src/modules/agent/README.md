# Agent Module

## 模块概述
AI Agent 核心引擎，支持多租户隔离的 Agent 配置管理、会话生命周期管理、事件驱动执行。集成 Tool Registry、Event Buffer（缓冲+双写）、SSE 实时推送、Quality Evaluation、AB Testing、Graph RAG、Multi-Agent 协作、Knowledge Graph、Long-Term Memory 等高级特性。

## 核心功能
- **Agent Config CRUD** — 创建/读取/更新/删除 Agent 配置，支持 tenantId 过滤
- **Session Management** — 创建 Agent 会话、运行执行、获取执行结果
- **SSE Real-time Streaming** — 通过 SSE 端点实时推送 Agent 执行事件，支持 Last-Event-ID 断连恢复
- **Batch Execution** — 批量 Agent 请求处理
- **Event Buffer & Event Store** — 事件缓冲 + 持久化双写
- **Tool Registry** — 注册/管理 Agent 可用工具
- **Quality Evaluation** — 质量评估（生成测项/打分/存储）
- **Self-Reflection** — Agent 自我反思机制
- **Graph RAG** — 图增强检索生成
- **Multi-Agent** — 多 Agent 协作编排
- **Knowledge Graph** — 知识图谱增强
- **Long-Term Memory** — 长期记忆存储与检索
- **Entity Linking** — 实体链接与解析
- **AB Testing** — Agent AB 测试框架
- **Simulator** — Agent 仿真测试
- **RingBeam** — 环信通信模式集成
- **Load Testing** — 压测支持

## API 端点列表

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `agent/configs` | 获取所有 Agent 配置 |
| GET | `agent/configs/:id` | 获取单个 Agent 配置 |
| POST | `agent/configs` | 创建 Agent 配置 |
| PUT | `agent/configs/:id` | 更新 Agent 配置 |
| DELETE | `agent/configs/:id` | 删除 Agent 配置 |
| POST | `agent/sessions/run` | 创建并运行 Agent 会话 |
| SSE | `agent/sessions/run-stream` | SSE 实时推送 Agent 会话事件 |
| GET | `agent/sessions/:id/events` | 获取会话历史事件（断连恢复） |
| POST | `agent/sessions/batch` | 批量 Agent 请求处理 |
| GET | `agent/sessions` | 列出所有 Agent 会话 |
| GET | `agent/sessions/:id` | 获取会话详情 |
| GET | `agent/sessions/:id/execution` | 获取会话执行详情 |
| GET | `agent/sessions/:id/evaluation` | 获取会话质量评估 |
| POST | `agent/evaluations` | 提交质量评估 |
| GET | `agent/evaluations` | 获取所有质量评估 |
| GET | `agent/stats` | 获取 Agent 统计信息 |
| GET | `agent/tools` | 获取已注册工具列表 |

## 依赖关系
- **ToolRegistry** — 工具注册中心（内部依赖）
- **EventBufferService** — 事件缓冲（内部依赖）
- **EventStoreService** — 事件持久化（内部依赖）
- **TenantGuard** — 多租户安全守卫
- **NestJS** — Controller / Service / Module 架构
- **ValidationPipe** — DTO 参数校验
- **rxjs** — SSE 事件流支持

## 配置说明
```
# TenantId 从 JWT/Header 自动提取，TenantGuard 校验
# EventBuffer 默认缓冲最近 100 条事件/session
# 生产环境需配置持久化数据库替换 In-memory store
```
