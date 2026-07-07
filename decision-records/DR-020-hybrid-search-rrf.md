# DR-020: Hybrid Search RRF 合并策略

**Status**: Accepted
**Date**: Phase-23 (2026-06-26)
**Context**: Phase-23 T84 Hybrid Search (BM25 + Vector)

## 决策

采用 **RRF (Reciprocal Rank Fusion)** 合并 BM25 和 Vector 结果,公式:
```
score(d) = Σ weight_i / (k + rank_i(d) + 1)
```

## 背景

传统 Hybrid Search 用线性加权:
```
score(d) = α * bm25_score(d) + β * vector_score(d)
```
但线性加权需要:
1. BM25 和 Vector score 必须归一化到同一区间
2. 权重 α/β 难以调优 (不同 query 最佳权重不同)

## RRF 优势

- **无需归一化**: 只用 rank (整数),不是 score
- **权重稳定**: 不同 query 表现一致
- **实现简单**: 不需要复杂的 score 变换
- **CORM 2010 学术论文**: 经过多年验证

## 公式细节

- `k = 60` (默认, 控制高分衰减)
- `weight` 默认 0.5 (BM25) + 0.5 (Vector)
- 同一 doc 在多 source 都出现 → 累加分数

## 后果

- ✅ 实现简单 (代码 < 100 行)
- ✅ 测试覆盖 IDF/MRR/P95 等边界
- ✅ 生产可换 BM25s / OpenSearch 等真实实现
- ⚠️ `weight=0` 仍然会调用 source (只是不贡献分数)
- ⚠️ metadata filter 在 add 时过滤 (避免运行时开销)

## 关键测试

- `AC-4 IDF`: 罕见词应仅返回命中 doc (过滤 score=0)
- `AC-13`: weight=1/0 仍能跑,但 vector 贡献为 0
- `AC-15 metadata filter`: 在 add 时按 metadata 过滤
