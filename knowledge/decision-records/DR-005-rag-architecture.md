# DR-005 · RAG 架构决策记录

> 创建: 2026-06-26 01:40 CST · Pulse-68 等待期
> ⚠️ DR编号冲突注意: .trae/specs 下另有 `phase-18-experience-ai/decision-records/DR-005-tenant-isolation-lint.md` 讨论租户隔离
> 两者不同主题, 本DR仅聚焦 `RAG架构决策`
> 修复建议: 后续版本统一DR编号体系, 避免跨目录编号重复
> 状态: **PROPOSED · Pulse-71 实施前可调整**
> 关联: [intelligence-engine.md](../../intelligence-engine.md) · Stage F · F1 AI Code Reviewer

---

## 1. 背景

### 1.1 问题
Phase-19 智能化引擎需要 AI Code Reviewer (F1 子系统),核心挑战:
- 仓库代码 ≥ 30k 行 service,完整 prompt 超过 LLM 上下文
- 单一 keyword 检索召回率低
- 没有代码结构感知

### 1.2 目标
- Review 准确率 ≥70%
- 检索召回率 ≥85%
- p95 延迟 ≤800ms
- 月度 LLM 成本 ≤$400

---

## 2. 决策

### 2.1 技术选型

| 维度 | 选型 | 理由 |
|---|---|---|
| **向量数据库** | Qdrant 1.10+ | Rust 内核 · Metadata pre-filter · Apache 2.0 · 与 monorepo 兼容 |
| **Embedding 模型** | text-embedding-3-large | MTEB 中文友好 · 3072 维 · $0.13/MTok |
| **LLM 主力** | Claude Sonnet 4.6 | 代码 review 业界第一 · 1M 上下文 · Prompt Cache |
| **LLM Fallback** | GPT-5 | 性价比 + 双供应商降低封锁风险 |
| **Reranker** | Cohere Rerank 3 (Phase-22) | 显著提升 top-K 准确率 |
| **Embedding Cache** | Redis 7+ | 重复代码块直接命中 |

### 2.2 架构图

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│ PR diff  │ ──▶ │ Indexer      │ ──▶ │ Qdrant   │
└──────────┘     │ (Python AST) │     │ vectors  │
                 └──────────────┘     └──────────┘
                                            ▲
                                            │
┌──────────┐     ┌──────────────┐     ┌──────────┐
│ User PR  │ ──▶ │ Retrieval    │ ──▶ │ Hybrid   │
│ Review   │     │ Service      │     │ Search   │
└──────────┘     └──────┬───────┘     │ dense+BM25│
                        │             └──────────┘
                        ▼
                 ┌──────────────┐     ┌──────────┐
                 │ Rerank       │ ──▶ │ LLM      │
                 │ (Cohere)     │     │ (Claude) │
                 └──────────────┘     └────┬─────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ Review       │
                                    │ Comment      │
                                    └──────────────┘
```

### 2.3 Chunk 策略

```python
CHUNK_STRATEGY = {
    "primary": "ast-aware",      # class / method / NestJS decorator 边界
    "fallback": "sliding_window", # 800 tokens + 200 overlap
    "max_chunk_size": 1500,
    "min_chunk_size": 100,
}
```

### 2.4 Hybrid Search 权重

```python
SEARCH_WEIGHTS = {
    "dense": 0.65,      # 向量相似度
    "sparse_bm25": 0.30, # 关键词匹配
    "metadata": 0.05,   # 文件路径 / 模块名 / git blame
}
```

---

## 3. 备选方案

### 3.1 不做 RAG (Pure LLM)
- **优点**: 简单,无 infrastructure 成本
- **缺点**: 30k 行 service 完整 prompt 超过 1M context,且 cost 爆炸
- **拒绝**: 单次 review 成本 >$5,月度 >$10000

### 3.2 用 Chroma 替代 Qdrant
- **优点**: Python 原生,易集成
- **缺点**: Metadata pre-filter 弱,千万级数据慢
- **拒绝**: 30k 行代码 ~ 50k chunks,Chroma 性能瓶颈

### 3.3 自托管 Embedding (BGE-large)
- **优点**: 数据不出门,无 API 成本
- **缺点**: GPU 资源需求 + 维护成本
- **决定**: Phase-22 评估,初期用 OpenAI

---

## 4. 实施计划

### 4.1 Phase-19 (2026-07-09)
- [x] Pulse-66 调研 + 脚手架 (12 文件)
- [ ] Pulse-71 接入 Qdrant + OpenAI Embed
- [ ] app.module.ts 注册 RetrievalModule
- [ ] 安装依赖 (`@qdrant/js-client-rest` / `openai` / `gpt-tokenizer`)
- [ ] 100 PR 训练集 + 准确率 ≥70% 验收

### 4.2 Phase-20 (2026-07-16)
- [ ] BM25 sparse vector 接入
- [ ] Hybrid Search 调优
- [ ] Redis embedding cache
- [ ] Recall@10 ≥85% 验收

### 4.3 Phase-22 (2026-07-30)
- [ ] Cohere Rerank 接入
- [ ] 自动 feedback loop (false positive 反馈优化)
- [ ] p95 ≤800ms 验收

---

## 5. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| LLM 成本超预算 | 中 | 高 | 硬限 $400/月 · prompt cache · fallback GPT-5 |
| Embedding 准确率低 | 中 | 中 | MTEB 验证 · BGE fallback · 定期重索引 |
| Qdrant 部署失败 | 低 | 高 | Docker fallback · 文档手册 · OrbStack 测试 |
| False Positive 高 | 中 | 中 | 仅对 `apps/api/src/modules/*` 启用 · 人工抽检 10% |
| 隐私泄露 | 低 | 极高 | 敏感数据脱敏 · 内部 LLM API · 审计日志 |

---

## 6. 度量指标 (KPI)

### 6.1 性能
- 检索 Recall@10 ≥85%
- 检索 p95 延迟 ≤800ms
- LLM Review 单次 ≤$0.50
- 月度 LLM 成本 ≤$400

### 6.2 质量
- AI Review 准确率 ≥70%
- False Positive ≤20%
- False Negative ≤15%
- 采纳率(团队) ≥50%

### 6.3 工程
- Qdrant 可用性 ≥99.9%
- 索引重建 < 10 min
- Embedding cache 命中率 ≥60%

---

## 7. 关联文档

- [intelligence-engine.md](../../intelligence-engine.md) §4.1 · Stage F AI Code Reviewer
- [docs/research/rag-architecture.md](../../../../docs/research/rag-architecture.md) · 详细架构设计
- [docs/research/llm-model-comparison.md](../../../../docs/research/llm-model-comparison.md) · LLM 选型
- [DR-003-intelligence-engine.md](./DR-003-intelligence-engine.md) · 智能化引擎决策
- [dev-roadmap.md](../../../../dev-roadmap.md) §3 Phase 路线

---

> 由 Pulse-68 等待期 Day 1 起草
> Phase-71 实施后更新实际数据(准确率 / 延迟 / 成本)