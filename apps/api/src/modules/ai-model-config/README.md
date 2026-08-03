# AI Model Config 模块

## 功能概述

AI 模型配置模块 (`ai-model-config`) 提供平台级 AI 模型配置管理能力，支持多租户场景下门店自主配置 AI 模型参数。

### 核心能力

- **系统预设管理**: 提供 GPT-4o、Claude 3.5 Sonnet、通义千问 Qwen-VL、DeepSeek V3/R1 等预设配置模板
- **门店自主配置**: 支持创建/管理门店级别的 AI 模型配置（加密存储 API Key）
- **一键切换**: 热加载切换配置，延迟 < 500ms
- **历史版本与回滚**: 90 天保留期，支持回滚操作
- **多租户隔离**: 基于 tenant/store_id 的 RLS 强隔离
- **字段级安全**: API Key AES-256 加密存储，响应脱敏
- **健康检查**: 配置切换前自动进行健康检查

## 核心 Service 列表

| Service | 文件 | 职责 |
|---------|------|------|
| `AiModelConfigService` | `ai-model-config.service.ts` | 主编排服务 — 预设查询、门店配置 CRUD、一键切换、历史回滚、API Key 解密 |
| `AiModelConfigAdvancedService` | `ai-model-config-advanced.service.ts` | 高级服务 — 模型版本管理、性能基准测试、成本分析、配置校验、A/B 评估 |
| `HotReloadService` | `hot-reload.service.ts` | 热加载服务 — WebSocket 实时推送、本地缓存、自动回滚失败配置 |
| `RecommendationService` | `recommendation.service.ts` | 配置推荐服务 — 基于行业/使用场景推荐最佳配置 |
| `SnapshotService` | `snapshot.service.ts` | 快照服务 — 配置历史快照管理与 90 天清理策略 |
| `VaultService` | `vault.service.ts` | 密钥管理服务 — 对 AES-256 加密/解密操作的封装 |

## 主要 API 端点

| 方法 | 端点 | 说明 | 鉴权 |
|------|------|------|------|
| `GET` | `/api/ai-model-config/presets` | 查询预设列表（跨租户） | 公开 |
| `GET` | `/api/ai-model-config/presets/:id` | 查询单个预设 | 公开 |
| `POST` | `/api/ai-model-config/store-configs` | 创建门店配置 | Tenant |
| `GET` | `/api/ai-model-config/store-configs` | 列出门店配置（脱敏） | Tenant |
| `GET` | `/api/ai-model-config/store-configs/current` | 获取当前生效配置 | Tenant |
| `POST` | `/api/ai-model-config/switch` | 一键切换配置 | Tenant |
| `GET` | `/api/ai-model-config/history/:configId` | 查询历史版本 | Tenant |
| `POST` | `/api/ai-model-config/rollback` | 回滚到指定历史版本 | Tenant |

## 依赖关系

| 依赖 | 说明 |
|------|------|
| `@nestjs/common` | NestJS 框架基础 |
| `@nestjs/websockets` | WebSocket 实时推送 |
| `@nestjs/event-emitter` | 事件驱动配置变更通知 |
| `../../database/pg-pool` | PostgreSQL 连接池 |
| `../../common/context/tenant-context` | 多租户上下文注入 |

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `POSTGRES_URL` | `string` | — | PG 连接串（生产模式） |
| 无 PG_URL | — | — | 降级到内存 Map 存储（dev/test） |
| `ENCRYPTION_KEY` | `string` | — | AES-256 密钥（API Key 加密） |
| 历史保留期 | — | 90 天 | 过期间历史自动清理 |
| 切换延迟 | — | < 500ms | 一键切换热加载目标 |

## 目录结构

```
ai-model-config/
├── README.md                            # 本文件
├── ai-model-config.service.ts           # 主服务
├── ai-model-config.controller.ts        # API 控制器
├── ai-model-config.module.ts            # NestJS 模块
├── ai-model-config.entity.ts            # 实体定义
├── ai-model-config.dto.ts               # 入参校验 DTO
├── ai-model-config.repository.ts        # 数据仓库（PG/内存双后端）
├── ai-model-config.contract.ts          # 跨模块合约
├── ai-model-config.swagger.ts           # Swagger 文档
├── ai-model-config-advanced.service.ts  # 高级服务
├── hot-reload.service.ts                # 热加载服务
├── recommendation.service.ts            # 配置推荐服务
├── snapshot.service.ts                  # 快照服务
├── vault.service.ts                     # 密钥管理服务
├── encryption.util.ts                   # 加密工具
├── swagger.config.ts                    # Swagger 配置
└── __tests__/
    └── ai-model-config.e2e-spec.ts      # E2E 测试
```
