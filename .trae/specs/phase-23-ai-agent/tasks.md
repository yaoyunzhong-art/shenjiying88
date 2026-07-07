# Phase-23 · Tasks (T81-T96)

| T# | 任务 | Pulse | 状态 |
|---|---|---|---|
| T81 | 多模态 embedding | 94 | pending |
| T82 | 文档解析升级 | 94 | pending |
| T83 | 检索评估框架 | 95 | pending |
| T84 | Hybrid Search | 95 | pending |
| T85 | ReAct Agent 引擎 | 96 | pending |
| T86 | 工具注册中心 | 96 | pending |
| T87 | 多 Agent 协作 | 97 | pending |
| T88 | 自我反思 + 错误恢复 | 97 | pending |
| T89 | 长期记忆 | 98 | pending |
| T90 | 知识图谱 | 98 | pending |
| T91 | GraphRAG | 98 | pending |
| T92 | Memory + Graph 整合 API | 98 | pending |
| T93 | A/B 测试框架 | 99 | pending |
| T94 | 质量评估 | 99 | pending |
| T95 | 性能压测 | 99 | pending |
| T96 | Phase-23 Retro + Phase-24 | 99 | pending |

---

## T81 · 多模态 embedding (Pulse-94)
- sentence-transformers/all-MiniLM-L6-v2 (384 维) + CLIP-ViT-B/32 (512 维)
- V1 是 256 维 hash,V2 升级真实模型
- 多模态统一向量空间 (文本 + 图片)

## T82 · 文档解析升级 (Pulse-94)
- PDF (pdf-parse) / Word (mammoth) / Excel (xlsx)
- OCR (tesseract.js) 处理扫描图片
- 表格/公式保留结构

## T83 · 检索评估框架 (Pulse-95)
- Recall@K / Precision@K / MRR / NDCG
- golden dataset (人工标注 query + relevant docs)
- 自动化 benchmark pipeline

## T84 · Hybrid Search (Pulse-95)
- BM25 (关键词) + 向量 (语义) + reranker
- Reciprocal Rank Fusion (RRF) 合并
- metadata filter (tenant/brand/date range)

## T85 · ReAct Agent 引擎 (Pulse-96)
- 思考 (Thought) → 行动 (Action) → 观察 (Observation) 循环
- max_iterations 防止死循环
- streaming 输出

## T86 · 工具注册中心 (Pulse-96)
- 工具定义 schema (OpenAI Function Calling 兼容)
- HTTP / DB / RAG / Calculator 4 类内置
- 用户自定义工具

## T87 · 多 Agent 协作 (Pulse-97)
- Manager-Worker 模式
- 任务分解 + 结果聚合
- Agent 间消息总线

## T88 · 自我反思 + 错误恢复 (Pulse-97)
- Agent 输出评估 (LLM-as-judge)
- 错误检测 + 重试
- Fallback chain

## T89 · 长期记忆 (Pulse-98)
- User Preference (结构化 KV)
- Conversation History (摘要 + 关键节点)
- Feedback Loop (点赞 / 踩)

## T90 · 知识图谱 (Pulse-98)
- 实体抽取 (NER + RE)
- 关系推理 (transE / RotatE)
- Neo4j 持久化

## T91 · GraphRAG (Pulse-98)
- 图谱遍历 + 向量检索混合
- 社区发现 (Leiden 算法)
- 多跳推理

## T92 · Memory + Graph 整合 API (Pulse-98)
- 统一 retrieve 接口
- context 拼装 (memory + graph + vector)
- LLM 总结

## T93 · A/B 测试框架 (Pulse-99)
- 用户分桶 (hash mod)
- 指标埋点
- 显著性检验

## T94 · 质量评估 (Pulse-99)
- Faithfulness (答案忠于上下文)
- Relevance (与 query 相关)
- Completeness (覆盖 query 各方面)

## T95 · 性能压测 (Pulse-99)
- QPS / latency / cost / GPU 利用率
- cache 命中率
- 弹性伸缩验证

## T96 · Phase-23 Retro + Phase-24 (Pulse-99)
- lessons-learned/phase-23.md
- 3 DR (RAG-V2 / Agent / GraphRAG)
- Phase-24 spec/tasks
