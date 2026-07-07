# Phase-23 · AI Agent & Knowledge V2 (Spec)

> 启动: Pulse-94 (2026-07-03)
> 闭环: Pulse-99 (2026-07-08)
> Owner: E9 林 AI Architect + E20 王 Agent Engineer

## 0. 概述
从"AI 助手"升级到"AI Agent":多模态 RAG + 工具调用 + 长期记忆 + Agent 编排。

## 1. 目标
1. **多模态 RAG**: 图片/表格/公式 检索,不只是文本
2. **Agent 编排**: 多步推理 + 工具调用 + 自我反思
3. **长期记忆**: 跨 session 记住用户偏好/历史
4. **知识图谱**: 实体关系推理 (产品 ↔ 客户 ↔ 订单)
5. **A/B 测试**: AI 回答质量量化评估

## 2. 范围 (T81-T96, 16 tasks)

### Phase 1 · RAG V2 (Pulse-94-95, T81-T84)
- T81 多模态 embedding (CLIP-ViT-B/32 + sentence-transformers)
- T82 文档解析升级 (PDF/Word/Excel + OCR)
- T83 检索评估框架 (Recall@K / MRR / NDCG)
- T84 Hybrid Search (BM25 + 向量 + reranker)

### Phase 2 · Agent Framework (Pulse-96-97, T85-T88)
- T85 ReAct Agent 引擎 (思考 → 行动 → 观察)
- T86 工具注册中心 (HTTP/DB/RAG/Calculator)
- T87 多 Agent 协作 (Manager-Worker 模式)
- T88 自我反思 + 错误恢复

### Phase 3 · Memory & Knowledge Graph (Pulse-98, T89-T92)
- T89 长期记忆 (User Preference / History / Feedback)
- T90 知识图谱 (实体抽取 + 关系推理)
- T91 GraphRAG (图谱 + 向量混合检索)
- T92 Memory + Graph 整合 API

### Phase 4 · Eval & Retro (Pulse-99, T93-T96)
- T93 A/B 测试框架 (control vs treatment)
- T94 质量评估 (faithfulness / relevance / completeness)
- T95 性能压测 (QPS / latency / cost)
- T96 Phase-23 Retro + Phase-24

## 3. 技术栈
- **sentence-transformers/all-MiniLM-L6-v2** (384 维) — V1 是 256 维 hash
- **CLIP-ViT-B/32** — 图片 embedding
- **tesseract.js** — OCR
- **pdf-parse / mammoth / xlsx** — 文档解析
- **OpenAI Function Calling** — 工具调用协议
- **Neo4j / NetworkX** — 知识图谱
- **BM25 (rank-bm25)** + **Cross-encoder reranker**
- **LangChain / LlamaIndex** (评估,不直接依赖)

## 4. 验收
- ✅ 多模态检索 Recall@10 ≥ 0.85
- ✅ Agent 任务完成率 ≥ 80%
- ✅ P95 端到端 latency < 3s
- ✅ 长期记忆准确率 ≥ 90%
- ✅ GraphRAG 比纯向量检索 NDCG@10 提升 ≥ 15%

## 5. 不在范围
- 多语言 AI (Phase-24 i18n)
- AI 训练/微调 (Phase-25 平台化)
- 用户行为分析 (V2,PostHog 集成)

## 6. 度量目标
| 指标 | 目标 |
|---|---|
| 代码行数 | +3000 行 (RAG V2 + Agent + Memory + Graph) |
| 测试 | 50+ 单测 + 10 e2e 场景 |
| Embedding 维度 | 384 (V2) vs 256 (V1) |
| 检索召回 | Recall@10 ≥ 0.85 |
| Agent 工具数 | ≥ 15 |
| 知识图谱节点 | ≥ 10K |
