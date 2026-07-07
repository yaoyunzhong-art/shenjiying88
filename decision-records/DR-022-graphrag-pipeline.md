# DR-022: GraphRAG 4 步流水线

**Status**: Accepted
**Date**: Phase-23 (2026-06-26)
**Context**: Phase-23 T91 GraphRAG + 知识图谱

## 决策

GraphRAG 采用 **4 步流水线**:
```
1. extractEntities(query, graph)   // 文本 → 实体列表
2. subgraph(entities, maxHops)      // 多起点 BFS
3. vectorSearch(query, subgraph)     // 语义比对
4. extractPaths(query, topResults)  // 路径提取
```

## 背景

纯 RAG (向量检索) 对**多跳问题**效果差:
- "Alice 工作的公司在哪里?" 需要: Alice → Acme → NYC 3 步
- 纯向量检索: "Alice" 检索到的 doc 可能不包含 NYC 信息

GraphRAG 结合:
- **图谱**: 显式多跳关系
- **向量**: 语义兜底 (没有图也能工作)

## 关键设计

### extractEntities (V2 mock)
- 子串匹配 (含 word boundary,避免 "Alicee" → "Alice")
- 兼容所有 type (不只 Person/Place/...)
- aliases 也参与匹配

### subgraph (BFS)
- 多起点 union
- maxHops 限制 (默认 2,防止爆炸)
- relationTypes 过滤 (可选)

### vectorSearch
- 每个 entity 拼接 name + aliases + properties → embed
- cosine 与 query embedding
- 按 score 排序,topK 截断

### extractPaths
- BFS 最短路径
- 从 query 实体到 top 向量结果

## 后果

- ✅ 多跳问题能力提升
- ✅ 向量兜底 (没有图也能 work)
- ✅ 可观测 (combined + subgraph + vectorResults + paths)
- ⚠️ Mock entity 抽取是子串匹配 (生产换 NER / LLM)
- ⚠️ 多 sub union 可能有重复 (用 Set 去重)

## 关键修复

1. **extractEntities 兼容 Company type**: 原代码只迭代 Person/Place/Product/Concept,丢失 Company
2. **word boundary regex**: `\b${name}\b` 避免子串误匹配
3. **subgraph union 去重**: 用 `Set<entityId>` 防止重复节点
