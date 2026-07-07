# E9 吴AI · AI/数据专家洞察

> 创建: 2026-06-26 · Pulse-68
> 专家: E9 吴AI (W6-AI/数据 Lead)
> 状态: 待 R7 通过后正式 Approver

---

## 1. 🎯 关注领域

- LLM 应用架构
- RAG 与知识库
- ML 模型选型
- 数据驱动决策

---

## 2. 💡 核心洞察

### 洞察 1: LLM 不是银弹,先评估 ROI

**观点**: 80% 场景用规则引擎 / 简单模型即可,LLM 是最后选项。

**评估矩阵**:
| 任务 | 推荐方案 | 原因 |
|---|---|---|
| 文本分类 (固定标签) | BERT / 规则 | LLM 过度 |
| 复杂推理 | GPT-4 / Claude Sonnet | 必要 |
| 实时翻译 | LLM 缓存 + 规则 | 延迟 / 成本 |
| 代码评审 | Claude Sonnet (RAG) | 复杂 + 高价值 |

---

### 洞察 2: RAG 质量 = 检索质量,不是 LLM 质量

**观点**: 70% LLM 输出质量取决于检索的 context。

**优化**:
- Hybrid Search (dense + sparse) ⭐
- Reranker (Cohere / bge-reranker)
- 上下文压缩 (ContextualCompression)
- Query 改写 (Multi-Query)

---

### 洞察 3: 成本 = 隐性 P0

**观点**: LLM 成本最容易爆,必须有 budget gate。

**实践**:
- 月度硬上限 + 软上限
- Fallback 链 (贵 → 便宜)
- Prompt 缓存 (≥ 60% 命中率)
- 简化模型优先 (Haiku / GPT-4o-mini)

---

## 3. 📐 神机营 AI 应用路径

| Phase | 应用 | 模型 |
|---|---|---|
| Phase-19 | AI Code Reviewer | Claude Sonnet |
| Phase-22 | Auto E2E Generator | GPT-4o-mini |
| Phase-25 | Local BGE Embedding | 本地 (省钱) |
| Phase-28 | Smart Support Bot | Claude Sonnet (RAG) |

---

## 4. 🔗 关联

- [best-practices/llm-integration.md](../best-practices/llm-integration.md)
- [decision-records/DR-005-rag-architecture.md](../decision-records/DR-005-rag-architecture.md)
- [decision-records/DR-008-rag-vector-database.md](../decision-records/DR-008-rag-vector-database.md)
