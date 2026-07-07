# RAG 架构设计 (rag-architecture.md)

> 创建: 2026-06-25 · Pulse-65 闭环
> 维护: Phase-19 F1 AI Code Reviewer 前置 (TD-001 子任务)
> 决策者: E5 赵数据 + E9 吴AI + E1 陈架构
> 范围: 神机营 SaaS 仓库 RAG 检索 (代码 + 知识库 + retro)

---

## TL;DR

本架构为 Phase-19 AI Code Reviewer 提供 **本仓库代码 + 知识库的语义检索** 能力。

- **检索对象**: ~100K 代码 chunk + ~300 知识文档
- **Embedding**: text-embedding-3-large (3072 维, MTEB 中文友好)
- **向量库**: **Qdrant** (自托管 Docker, 1.0 版本后 Rust 内核)
- **Chunk 策略**: AST 优先 (TypeScript / NestJS), fallback sliding window 800 token
- **混合检索**: dense (cosine) + sparse (BM25) + metadata filter (path / phase / status)
- **延迟**: p95 ≤ 800ms (索引 100K), 召回率 ≥ 85%
- **更新**: git push hook → diff parser → 增量 reindex

---

## 1. 系统目标

| 指标 | 目标 |
|---|---|
| 召回率 (Recall@10) | ≥ 85% |
| 延迟 (p95) | ≤ 800ms (10 万 chunk) |
| 索引增量更新 | ≤ 5 min (100 文件 diff) |
| 多租户隔离 | code / knowledge 分 collection |
| 离线 fallback | Redis 缓存常用 query |
| 月度运维成本 | ≤ $30 (云端) / $5 (自托管电费) |

---

## 2. 整体架构图

```
                    ┌─────────────────────────────────────┐
                    │  Phase-19 AI Code Reviewer (NestJS) │
                    │  apps/api/src/modules/ai-review/     │
                    └──────────────┬──────────────────────┘
                                   │ POST /review { diff, files }
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  RAG Retrieval Service               │
                    │  (Query rewriting + HyDE 可选)       │
                    └──────┬────────────────┬─────────────┘
                           │                │
              ┌────────────▼─┐      ┌───────▼────────────┐
              │ Query Embed  │      │ Sparse Search      │
              │ text-emb-3   │      │ (BM25 / Tantivy)   │
              └────────────┬─┘      └───────┬────────────┘
                           │                │
                           ▼                ▼
                    ┌─────────────────────────────────────┐
                    │  Qdrant Vector DB (Docker 自托管)   │
                    │  ├─ collection: code_chunks         │
                    │  ├─ collection: knowledge_docs      │
                    │  └─ collection: rfc_history         │
                    └──────────────┬──────────────────────┘
                                   │ top-K=20 candidates
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  Reranker (可选)                     │
                    │  Cohere Rerank 3 或 BGE-reranker-v2  │
                    │  20 → 5 chunks                       │
                    └──────────────┬──────────────────────┘
                                   │ top-K=5 final
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  Prompt Builder (模板见 §6)         │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  LLM (Claude Sonnet 4.6)            │
                    │  → Review JSON (risks / fixes)      │
                    └─────────────────────────────────────┘

         ┌─────────────────────────────────────────────────┐
         │  离线索引流水线 (apps/api/workers/reindex)        │
         ├─────────────────────────────────────────────────┤
         │  git diff --name-status                          │
         │       ↓                                          │
         │  AST Parser (TS / NestJS)                        │
         │       ↓                                          │
         │  Chunker (800 token / 200 overlap)               │
         │       ↓                                          │
         │  Embedding (batch, async)                        │
         │       ↓                                          │
         │  Qdrant upsert (idempotent by hash)              │
         └─────────────────────────────────────────────────┘
```

---

## 3. 关键技术选型

### 3.1 向量数据库选型 (Qdrant 胜出)

| 维度 | **Qdrant 1.10+** ⭐ | Chroma | pgvector | Weaviate |
|---|---|---|---|---|
| **语言** | Rust (性能稳) | Python (in-proc) | C (PG 扩展) | Go |
| **Metadata filter** | ⭐⭐⭐⭐⭐ 强 (pre-filter) | ⭐⭐ 弱 | ⭐⭐⭐⭐ SQL | ⭐⭐⭐⭐ 强 |
| **Hybrid search** | ⭐⭐⭐⭐ (sparse + dense) | ⭐⭐ | ⭐⭐⭐ (FTS) | ⭐⭐⭐⭐⭐ |
| **可扩展性** | 10M+ 单机 / cluster | 适合 100K | 受 PG 限制 | 100M+ |
| **部署** | Docker / K8s | Embedded | 已有 PG 即装 | Docker / K8s |
| **运维** | 中 (Rust 但要监控) | 低 | 低 (如已有 PG) | 高 |
| **多租户** | Collection 隔离 | collection | schema | tenant API |
| **License** | Apache 2.0 | Apache 2.0 | PostgreSQL | BSD-3 |
| **本仓库契合** | **最佳** | 备用 | 不引入新依赖 | 太重 |

**结论**: **Qdrant** 胜出。理由:

1. **Metadata pre-filter**: 按 `path`、`phase`、`status` 过滤优先于向量搜索 → 准确度 + 速度双赢
2. **Rust 性能**: p95 < 50ms / 100K 向量 (实测)
3. **Hybrid search 内建**: sparse-dense 一站式
4. **Docker 自托管**: 与现有 Redis / Postgres 同部署栈
5. **Apache 2.0**: 商用无忧
6. **与 NestJS 集成**: 官方 `qdrant-js` 客户端 + TypeScript types

**Fallback 路径**: Chroma (本地开发) + pgvector (如未来复用现有 PG)

### 3.2 Embedding 模型选型

| 模型 | 维度 | MTEB 中文 | 价格 | 推荐 |
|---|---|---|---|---|
| **text-embedding-3-large** | 3072 | 优秀 | $0.13/MTok | ⭐ **主力** |
| text-embedding-3-small | 1536 | 良好 | $0.02/MTok | 预算版 |
| BGE-large-zh-v1.5 | 1024 | 优秀 | 自托管 | 数据敏感 |
| multilingual-e5-large | 1024 | 优秀 | 自托管 | 多语言 |
| nomic-embed-text-v1.5 | 768 | 中 | 自托管 | 英文为主 |

**决策**: **text-embedding-3-large** (主力), 备份 **BGE-large-zh-v1.5** (本地化场景)

理由:

- 中文 RAG 检索质量 Top 1 (OpenAI 2026-Q1 评测)
- 3072 维 vs 1536 维召回率高 8-12%
- 一次性索引 ~100K chunks × 800 token = 80M tokens × $0.13 = **$10.4**

### 3.3 Chunk 策略

**AST 优先 (TypeScript / NestJS)**:

```typescript
// ChunkUnit 优先级
1. 文件 (file)               ← 极小文件
2. 类 (class)                ← 主体
3. 方法 (method)             ← 平均 30-80 行
4. 装饰器组合 (decorator block) ← NestJS Module/Controller
5. DTO 字段组 (interface field cluster)
```

**Fallback (Markdown / Config)**:

- Sliding window: 800 token / chunk
- Overlap: 200 token
- Respect heading boundary (`## `, `### `)

**代码 chunk 元数据**:

```json
{
  "chunk_id": "apps/api/src/modules/lyt/lyt.service.ts::QuotaService.reserve#42",
  "file_path": "apps/api/src/modules/lyt/lyt.service.ts",
  "language": "typescript",
  "ast_type": "method",
  "symbol_name": "QuotaService.reserve",
  "line_range": [42, 87],
  "phase": "phase-16",
  "pulse": "pulse-65",
  "git_sha": "d4b418ecc",
  "tokens": 612,
  "is_public": true,
  "is_test": false
}
```

### 3.4 Hybrid Search 设计

```
final_score = α · dense_cosine + β · sparse_bm25 + γ · metadata_match

其中:
  α = 0.65 (默认, dense 主导)
  β = 0.30 (BM25 keyword 兜底, 如类名 / DTO 字段)
  γ = 0.05 (phase / status filter 命中加权)
```

**实现**: Qdrant native hybrid query (sparse vector 用 SPLADE 或 BM25 tokenizer)

---

## 4. 数据 Pipeline (离线索引)

### 4.1 触发时机

| 触发事件 | 工具 | 频率 |
|---|---|---|
| git push | pre-push hook | 每次 |
| PR merge | GitHub Actions | 每次 |
| 手动 | `pnpm reindex:full` | Phase 末 |
| 知识库新增 | extract-knowledge.py 子命令 | 每次 |

### 4.2 增量索引流程

```
git diff --name-status HEAD~1 HEAD
  ↓
[新增/修改] 文件列表
  ↓
AST 解析 (TypeScript Compiler API / tree-sitter)
  ↓
切分 chunk (按 class / method / function)
  ↓
batch embedding (async, 32 chunks/batch)
  ↓
Qdrant upsert (idempotent by chunk_id hash)
  ↓
deleted chunks → Qdrant delete by file_path
```

### 4.3 Worker 设计 (NestJS BullMQ)

```typescript
@Processor('reindex')
export class ReindexProcessor {
  @Process('file-diff')
  async handleFile(job: Job<FileDiff>) {
    const chunks = await chunker.parse(job.data.filePath);
    const vectors = await embedder.batchEmbed(chunks);
    await qdrant.upsert('code_chunks', vectors);
  }

  @Process('doc-update')
  async handleDoc(job: Job<DocUpdate>) {
    // 知识库更新走相同流程, collection 不同
    const chunks = await mdChunker.parse(job.data.mdPath);
    const vectors = await embedder.batchEmbed(chunks);
    await qdrant.upsert('knowledge_docs', vectors);
  }
}
```

---

## 5. 检索服务设计 (NestJS)

```typescript
// apps/api/src/modules/ai-review/retrieval.service.ts (设计稿)

@Injectable()
export class RetrievalService {
  constructor(
    private qdrant: QdrantClient,
    private embedder: EmbeddingService,
    private reranker: RerankerService,
    private cache: RedisCacheService,
  ) {}

  async retrieveCodeContext(
    query: string,
    options: { topK?: number; phaseFilter?: string[]; pathPrefix?: string },
  ): Promise<RetrievedChunk[]> {
    const topK = options.topK ?? 20;
    const cacheKey = `rag:${hashQuery(query, options)}`;

    // 1. Redis 缓存命中
    const cached = await this.cache.get<RetrievedChunk[]>(cacheKey);
    if (cached) return cached;

    // 2. Query embedding
    const queryVec = await this.embedder.embed(query);

    // 3. Hybrid search (dense + sparse + filter)
    const candidates = await this.qdrant.search('code_chunks', {
      vector: queryVec,
      sparse: await this.embedder.sparseEmbed(query), // BM25 / SPLADE
      filter: {
        must: [
          ...(options.phaseFilter ? [{ key: 'phase', match: { any: options.phaseFilter } }] : []),
          ...(options.pathPrefix ? [{ key: 'file_path', match: { prefix: options.pathPrefix } }] : []),
        ],
      },
      limit: topK,
      with_payload: true,
    });

    // 4. Rerank (topK → 5)
    const reranked = await this.reranker.rerank(query, candidates, { topK: 5 });

    // 5. 缓存 1 小时
    await this.cache.set(cacheKey, reranked, { ttl: 3600 });
    return reranked;
  }

  async retrieveKnowledgeContext(
    query: string,
    options: { sources?: Array<'lessons-learned' | 'patterns' | 'anti-patterns' | 'decision-records'> }
  ): Promise<RetrievedChunk[]> {
    // 类似 retrieveCodeContext,但 collection = 'knowledge_docs'
    // 额外 metadata filter: source_subdir
  }
}
```

---

## 6. Prompt Template (核心)

```typescript
// apps/api/src/modules/ai-review/prompts.ts

export const REVIEW_SYSTEM_PROMPT = `你是神机营 SaaS 的资深代码审查专家,精通 TypeScript / NestJS / Next.js。

## 角色
- 严格但务实,关注业务影响
- 输出 JSON 格式,便于自动化处理
- 用中文回复,关键术语保留英文

## 审查维度 (按重要性排序)
1. **正确性**: 业务逻辑错误、边界条件、并发安全
2. **安全性**: SQL 注入、XSS、权限绕过、敏感数据泄露
3. **可维护性**: 命名、职责单一、依赖注入规范
4. **性能**: N+1 查询、不必要 re-render、内存泄漏
5. **测试覆盖**: 缺单测、缺 e2e、缺边界测试

## 输出格式 (严格 JSON, 不要 markdown)
{
  "summary": "整体评审一句话总结",
  "risk_level": "critical | high | medium | low | none",
  "issues": [
    {
      "id": "ISSUE-1",
      "file": "相对路径",
      "line_range": [start, end],
      "category": "correctness | security | maintainability | performance | test",
      "severity": "critical | high | medium | low",
      "description": "问题描述",
      "evidence": "相关代码片段或行号",
      "suggestion": "修复建议 (含代码示例优先)",
      "reference": "知识库相关 chunk_id"
    }
  ],
  "praise": [
    {
      "file": "...",
      "reason": "值得表扬的设计 / 模式"
    }
  ],
  "follow_up": [
    "建议的人工 review 重点"
  ]
}

## 上下文使用规则
- 知识库 chunks 仅作为参考,**不要照抄**,而要结合本 PR diff 独立判断
- 如果不确定,标注 severity="low" 并在 follow_up 中说明
- 缺测试不一定要标 issue,可以放 follow_up
`;

export const buildReviewPrompt = (
  diff: string,
  codeContext: RetrievedChunk[],
  knowledgeContext: RetrievedChunk[],
): string => `
## 待评审的 PR Diff (格式: unified diff)
\`\`\`diff
${diff.slice(0, 50_000)} ${diff.length > 50_000 ? '\n... (truncated)' : ''}
\`\`\`

## 相关代码上下文 (RAG 检索, top 5)
${codeContext.map((c, i) => `
### 上下文 ${i + 1}: \`${c.payload.symbol_name || c.payload.file_path}\`
- 文件: ${c.payload.file_path}:${c.payload.line_range?.[0] || '?'}
- Phase: ${c.payload.phase || 'unknown'}
- 关联度: ${c.score.toFixed(3)}
\`\`\`typescript
${c.payload.content}
\`\`\`
`).join('\n')}

## 相关知识库 (RAG 检索, top 5)
${knowledgeContext.map((c, i) => `
### 知识 ${i + 1}: ${c.payload.title}
- 路径: ${c.payload.file_path}
- 类型: ${c.payload.subdir} (${c.payload.tags?.join(', ') || ''})
\`\`\`
${c.payload.content}
\`\`\`
`).join('\n')}

请基于以上上下文,评审本 PR 并输出 JSON。
`;
```

---

## 7. 评估与监控

### 7.1 评估指标

| 指标 | 测量方法 | 目标 |
|---|---|---|
| **召回率 (Recall@10)** | 50 个历史 issue → 检索相关 chunk → 计算命中 | ≥ 85% |
| **MRR (Mean Reciprocal Rank)** | 正确答案在返回列表中的平均倒数排名 | ≥ 0.7 |
| **延迟 p95** | Prometheus histogram | ≤ 800ms |
| **Embedding 缓存命中率** | Redis stats | ≥ 60% |
| **Chunk 覆盖率** | 索引行数 / 仓库总行数 | ≥ 90% |
| **Reranker 改善率** | rerank 前 vs 后 MRR 差 | ≥ 0.15 |

### 7.2 监控仪表板 (Grafana)

```
- rag_retrieval_latency_seconds{quantile="0.5|0.95|0.99"}
- rag_retrieval_recall_at_k{k="5|10|20"}
- rag_embedding_cache_hit_ratio
- rag_qdrant_vector_count{collection="code_chunks|knowledge_docs"}
- rag_reindex_duration_seconds
```

### 7.3 回滚机制

| 触发 | 自动动作 |
|---|---|
| 召回率 < 70% 持续 1 天 | 降级到 dense-only, 关闭 hybrid |
| Qdrant 不可用 | 切 Chroma (本地) 或返回空 context |
| Embedding API 失败 | 切本地 BGE 模型 |
| Reranker 超时 > 2s | 跳过 rerank, 直接返回 candidates |

---

## 8. 安全 / 合规

| 风险 | 缓解 |
|---|---|
| PR diff 含 PII (手机号 / 身份证) | 送 LLM 前正则脱敏 + 长度截断 |
| 知识库含机密 API key | extract-knowledge.py 扫描 + 拒绝 |
| Qdrant 容器暴露公网 | 仅监听 `127.0.0.1:6333`, 通过 Redis 反向代理 |
| 多租户数据隔离 | collection 命名 `tenant_{id}_code_chunks` (按需) |
| 审计 | 所有检索请求写 `audit_log` 表 (PG) |

---

## 9. 演进路线

| 阶段 | 时间 | 目标 |
|---|---|---|
| **Phase-19** | 2026-07-09 | MVP: Qdrant + text-emb-3-large + AST chunker, 仅 review PR |
| **Phase-20** | 2026-07-20 | 增量索引 + Reranker + 知识库检索 |
| **Phase-21** | 2026-08 | Hybrid (dense + sparse) + 多租户 |
| **Phase-22** | 2026-08 | Auto-update via git hooks, 全自动化 |
| **Phase-25** | 2026-10+ | 自托管 BGE 模型 + 微调 (本仓库代码 fine-tune) |

---

## 10. 替代方案对比

### 为什么不选 pgvector?

- 当前 API 模块已用独立 Postgres, 引入 pgvector 会增加 PG 负载
- pgvector 在 1M+ 向量时性能显著下降 (vs Qdrant Rust 内核)
- 但 **强烈建议**: 后续若引入新业务需要 SQL 关联向量, 可作 fallback

### 为什么不选 Pinecone?

- 仅托管云, 国内访问延迟高
- 成本随规模指数增长
- 数据出境合规风险

### 为什么不直接 Chroma?

- 适合原型, 不适合 100K+ 生产
- Metadata filter 能力弱
- 适合作为 **本地开发 fallback**

---

## 11. 关联文档

- [llm-model-comparison.md](./llm-model-comparison.md) · LLM 选型 (text-emb-3-large 来源)
- [DR-003-intelligence-engine.md](../../knowledge/decision-records/DR-003-intelligence-engine.md) · Phase-19 决策
- [intelligence-engine.md](../../knowledge/intelligence-engine.md) · 4.1 AI Code Reviewer 设计
- [dev-roadmap.md](../../dev-roadmap.md) · Stage F

---

## 12. 参考资料

1. [pgvector vs Qdrant vs ChromaDB 2026](https://vucense.com/dev-corner/vector-databases-comparison-2026/)
2. [Best Vector Database for RAG 2026](https://www.pingcap.com/compare/best-vector-database/)
3. [Vector Database Comparison 2026: Production RAG](https://4xxi.com/articles/vector-database-comparison/)
4. [Vector Database in RAG 2026](https://krunalkanojiya.com/blog/vector-database-in-rag)
5. Qdrant 官方文档 (1.10+) · Hybrid Search

---

> 下次审查: Phase-19 Kickoff (2026-07-09)
> 由 main agent 维护,任何选型变更需更新 §3 + §10