# DR-008 · RAG Vector Database (Qdrant)

> 决策日期: 2026-06-26
> 决策者: Champion (E5 赵数据) + W6-AI/数据 Lead
> 状态: ✅ 已通过 (Phase-19 起生效)

---

## 1. 🎯 背景

Phase-19 AI Code Reviewer + RAG 知识检索需要向量数据库:
- 存储代码 / 文档的 embedding
- 支持 hybrid search (dense + sparse)
- 中文友好
- 部署运维简单

---

## 2. 📋 候选方案

| 方案 | 优点 | 缺点 | 适配 |
|---|---|---|---|
| **Pinecone** | 托管 / 易用 | 贵 / 数据出境 | 海外 |
| **Weaviate** | 功能丰富 | 重 / 资源消耗大 | 大型 |
| **Milvus** | 性能强 | 复杂 | 超大规模 |
| **Chroma** | 轻量 / 易部署 | 功能简单 | 小型 / 实验 |
| **Qdrant** ⭐ | 性能 / Rust / Hybrid Search / 中等 | 较新 | 中型生产 |

---

## 3. ✅ 决策

**选用 Qdrant 1.10+**(开源版 / 自托管)。

**理由**:
1. **Hybrid Search 内置**:dense + sparse + metadata 一次查询
2. **Rust 性能**:QPS 10K+,延迟 < 10ms
3. **中文友好**:多语言模型支持
4. **部署简单**:单 binary / docker-compose
5. **过滤功能**:payload 过滤 + 向量搜索同时
6. **开源 + 商业支持**:避免 vendor lock-in
7. **过滤 + 向量结合**:tenantId 隔离天然支持

---

## 4. 📐 部署

```yaml
# docker-compose.dev.yml
services:
  qdrant:
    image: qdrant/qdrant:v1.10.0
    ports:
      - "6333:6333"
      - "6334:6334"  # gRPC
    volumes:
      - ./qdrant_data:/qdrant/storage
    environment:
      QDRANT__SERVICE__GRPC_PORT: 6334
```

---

## 5. 📐 Collection 设计

```
collections:
  code_chunks:
    vector_size: 1536  # text-embedding-3-large
    distance: Cosine
    payload_schema:
      - chunkId: keyword
      - filePath: keyword
      - language: keyword
      - phase: keyword
      - gitSha: keyword
      - tenantId: keyword  # 多租户隔离

  knowledge_docs:
    vector_size: 1536
    distance: Cosine
    payload_schema:
      - docId: keyword
      - title: keyword
      - category: keyword  # 'pattern' / 'decision' / 'lesson'
      - phase: keyword

  pr_reviews:
    vector_size: 1536
    distance: Cosine
    payload_schema:
      - prId: keyword
      - reviewer: keyword
      - timestamp: integer
```

---

## 6. 📐 Hybrid Search

```typescript
// apps/api/src/modules/retrieval/retrieval.client.ts
async hybridSearch(query: string, options: HybridSearchOptions) {
  const denseVec = await this.embedder.embed(query)
  const sparseVec = this.bm25Index.querySparseVector(query)

  return await this.qdrant.search('code_chunks', {
    vector: { name: 'dense', vector: denseVec },
    sparse_vector: { name: 'sparse', vector: sparseVec },  // BM25
    filter: {
      must: [
        { key: 'tenantId', match: { value: options.tenantId } },  // 多租户
        { key: 'language', match: { any: options.languages ?? ['typescript', 'markdown'] } },
      ],
    },
    limit: options.topK ?? 10,
    with_payload: true,
  })
}
```

---

## 7. ✅ 验收

- [x] Qdrant 1.10+ docker-compose 部署
- [x] collection 初始化 (Phase-71 自动)
- [x] Hybrid Search (dense + sparse) 接入
- [x] tenantId 过滤

---

## 8. 🔗 关联

- [decision-records/DR-005-rag-architecture.md](./DR-005-rag-architecture.md) · RAG 架构
- [knowledge/patterns/](../patterns/) · RAG 模式
- [best-practices/llm-integration.md](../best-practices/llm-integration.md) · LLM 集成
