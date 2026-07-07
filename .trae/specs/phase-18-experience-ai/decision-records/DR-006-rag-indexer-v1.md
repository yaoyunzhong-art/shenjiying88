# DR-006 · RAG 索引器 V1 实现 (mock embedding)

> 创建: 2026-06-26 (Phase-18 T23)
> 状态: ✅ Accepted
> 关联: [phase-18/spec.md §5](../spec.md)

## Context

需要 RAG 知识库,让 AI assistant 能查询内部文档 (spec / lessons / patterns / decisions)。

完整 embedding 模型部署成本高 (Python + sentence-transformers + GPU/CPU 推理服务),V1 阶段希望:
- 立即可用,能 query 内部文档
- 切分策略稳定可复用
- V2 平滑升级到真实模型

## Decision

**V1 mock embedding + V2 真实模型双轨**:

### V1 (当前实施)
- 文档切分:按 `##` section + 空行分段,单 chunk ≤ 512 tokens
- Embedding: 256 维 hash-based (SHA-256 hash + 词袋 + L2 归一化)
- 存储:内存 Map (process restart 重建)
- 查询:cosine similarity + topK + kindFilter + minScore

### V2 (Phase-19 升级)
- Embedding: sentence-transformers/all-MiniLM-L6-v2 (384 维)
- 存储:LanceDB / SQLite-vec
- HTTP 接口:`POST /api/knowledge/query`

## Alternatives Considered

### A. 直接接 OpenAI text-embedding-3-small
- ✅ 1536 维高质量向量
- ❌ 成本高 ($0.02/1M tokens),每次 query 都花钱
- ❌ 数据出域 (合规风险)

### B. 本地 sentence-transformers (选定)
- ✅ 完全本地,无成本
- ✅ 384 维已足够区分度
- ⚠️ 需要 Python runtime + 模型下载 (~80MB)

### C. **V1 mock + V2 升级 (选定)**
- ✅ V1 立即可用,跑通流程
- ✅ V2 平滑升级,接口不变
- ✅ 切分策略稳定,embedding 是可替换组件

## Consequences

- ✅ V1 1 小时上线,5/5 测试通过
- ✅ 切分策略独立,可直接用于 V2
- ⚠️ V1 embedding 质量有限,长文档召回可能不精确
- 🔜 Phase-19:接入 sentence-transformers + LanceDB

## 关键代码

```typescript
// 切分 - 按 ## section
for (const line of lines) {
  if (h2) {
    flushSection(currentSectionName);
    currentSectionName = h2[1].trim();
  }
}

// Embedding - V1 mock
const hash = createHash('sha256').update(text).digest();
// 32 维 hash + 词袋 + L2 归一化 → 256 维
```

## 实施

- [knowledge-indexer.service.ts](../../../../apps/api/src/modules/knowledge/knowledge-indexer.service.ts)
- [knowledge-indexer.e2e.test.ts](../../../../apps/api/src/modules/knowledge/knowledge-indexer.e2e.test.ts) (5/5 PASS)