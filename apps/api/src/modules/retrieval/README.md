# Retrieval 检索模块

> RAG（检索增强生成）检索服务。基于向量数据库 + BM25 混合检索，支持代码库语义搜索、知识库检索以及多租户隔离的 RAG 上下文构建。

## 核心功能

- **语义检索** — 通过 Embedding 模型将查询文本转为向量，在 Qdrant 向量数据库中进行相似度搜索
- **知识库检索** — 专门的知识文档集合（`knowledge_docs`）检索，支持独立查询
- **混合检索 (Hybrid Search)** — Dense 向量 + Sparse BM25 加权融合，兼顾语义匹配与关键词命中
- **RAG 上下文构建** — 一次检索同时获取代码片段 + 知识库片段，供 LLM Prompt 拼装
- **增量索引** — 通过 `indexChunks` 将 Chunk 写入 Qdrant，支持代码索引器增量更新
- **缓存加速** — Redis 缓存查询结果（可配置 TTL），降低 Embedding + 检索延迟
- **组件健康检查** — 聚合 Qdrant / Embedder 健康状态，查询最后索引时间
- **多租户隔离** — 通过 `TenantGuard` 守卫鉴权，预留按 tenantId 动态分 collection 的扩展点
- **代码索引** — BM25 稀疏向量计算引擎（内存版），支持中英文混合分词

## 主要 API 端点

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `api/retrieval/query` | 代码库语义检索（支持 filter / hybrid / rerank） |
| POST | `api/retrieval/query/knowledge` | 知识库专用检索端点 |
| GET | `api/retrieval/health` | 组件健康状态检查（Qdrant / Embedder / 最后索引时间） |

### 检索请求体结构

```json
{
  "query": "搜索文本",
  "topK": 10,
  "threshold": 0.65,
  "collections": ["code_chunks"],
  "phaseFilter": ["phase-19"],
  "pathPrefix": "apps/api/src/modules",
  "hybrid": true,
  "rerank": false
}
```

## 内部服务与核心类

| 类/服务 | 说明 |
|---------|------|
| `RetrievalService` | 检索核心服务：Embeding → 向量搜索 → 重排序 → 缓存 → RAG 上下文 |
| `QdrantClientWrapper` | Qdrant 向量数据库客户端封装（CRUD / Hybrid Search / Health） |
| `EmbeddingService` | Embedding 模型封装（支持 text-embedding-3-large 等 Provider） |
| `BM25Index` | 内存版 BM25 稀疏向量索引（中英文混合分词，配合 Hybrid Search） |

## 依赖关系

- **Qdrant** — 向量数据库，存储 Chunk Embedding + 检索
- **Redis (可选)** — 查询结果缓存，通过 `CacheService` 注入
- **OpenAI Embedding API / 自托管模型** — Embedding 向量生成
- **AgentModule** — 引用 `TenantGuard` 多租户守卫
- **NestJS ConfigModule** — 配置管理（`retrievalConfig`）

## 配置项说明

配置通过 `apps/api/src/modules/retrieval/config/retrieval.config.ts` 集中管理，环境变量覆盖：

### Qdrant 连接

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `QDRANT_HOST` | `127.0.0.1` | Qdrant 主机地址 |
| `QDRANT_PORT` | `6333` | REST API 端口 |
| `QDRANT_API_KEY` | — | 生产环境 API Key |
| `QDRANT_DEFAULT_COLLECTION` | `shenjiying_code_chunks` | 默认 Collection |

### Embedding

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `EMBEDDING_PROVIDER` | `text-embedding-3-large` | Embedding 模型 |
| `OPENAI_API_KEY` | — | OpenAI 或兼容服务的 API Key |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | 兼容服务的 Base URL |

### 检索参数

| 配置项 | 默认值 | 说明 |
|-------|--------|------|
| `retrieval.defaultTopK` | `10` | 默认返回条数 |
| `retrieval.defaultThreshold` | `0.65` | 相似度阈值 |
| `retrieval.hybridEnabled` | `true` | 是否启用混合检索 |
| `retrieval.denseWeight` | `0.65` | Dense 向量权重 |
| `retrieval.sparseWeight` | `0.30` | Sparse BM25 权重 |

### 缓存

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `RAG_CACHE_ENABLED` | `true` | 是否启用缓存 |
| `retrieval.cache.ttlSeconds` | `3600` | 缓存 TTL（秒） |
| `retrieval.cache.keyPrefix` | `rag:` | 缓存 Key 前缀 |

### 代码索引

| 环境变量 / 配置 | 默认值 | 说明 |
|---------------|--------|------|
| `chunking.codeChunkSize` | `800` | Token 块目标大小 |
| `chunking.codeChunkOverlap` | `200` | 块间重叠 Token 数 |

## 模块结构

```
retrieval/
├── README.md
├── retrieval.module.ts       # NestJS 模块定义
├── retrieval.controller.ts   # REST 端点
├── retrieval.service.ts      # 检索核心逻辑
├── retrieval.client.ts       # Qdrant 客户端封装
├── retrieval.embedder.ts     # Embedding 服务
├── retrieval.bm25.ts         # BM25 稀疏向量计算引擎
├── retrieval.types.ts        # 类型定义 (DTO/接口/异常)
├── retrieval.dto.ts          # class-validator DTO
├── retrieval.entity.ts       # 持久化实体定义
├── retrieval.contract.ts     # 跨模块合约
├── health.controller.ts      # 健康检查端点
├── config/
│   └── retrieval.config.ts   # 配置项
├── *.spec.ts / *.test.ts     # 单元测试 & 集成测试
└── *.e2e.test.ts             # E2E 测试
```
