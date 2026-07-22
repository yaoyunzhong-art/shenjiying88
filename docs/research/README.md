# docs/research — 技术研究成果文档

## 模块概述

`docs/research` 是神机营 SaaS **技术研究与选型决策的知识库目录**，收录了 Phase-19 智能化引擎筹备阶段的关键调研报告。当前包含两份核心文档：LLM 模型选型对比与 RAG 检索架构设计，均由 E 级架构师团队 (E5 赵数据 + E9 吴AI + E1 陈架构) 在 Pulse-65 闭环中决策产出。

该目录的产出物直接影响 AI Code Reviewer、Smart RFC Drafter 等智能化特性的技术选型与落地路径：

- **LLM 模型选型** (`llm-model-comparison.md`)：系统对比 Anthropic Claude、OpenAI GPT、Qwen、DeepSeek 等主流模型，对代码 review 准确率、中文支持、上下文长度、API 稳定性、成本 6 个维度加权评分，最终推荐 Claude Sonnet 4.6 为主力 + Qwen2.5-Coder 32B 为本地化备选
- **RAG 架构设计** (`rag-architecture.md`)：面向 ~100K 代码 chunk + ~300 知识文档的语义检索场景，设计了基于 Qdrant 向量库 + text-embedding-3-large + AST 优先分块策略的混合检索方案，召回率目标 ≥85%，p95 延迟 ≤800ms

## 技术栈

| 组件 | 用途 |
|------|------|
| Markdown | 文档格式 |
| Mermaid | 架构图 (rag-architecture.md 中的 swimlane/flowchart) |
| Claude Sonnet 4.6 | 主力 LLM (代码 review) |
| Qwen2.5-Coder 32B | 本地化/数据敏感场景 |
| text-embedding-3-large | Embedding 模型 (3072 维) |
| Qdrant | 向量数据库 (Rust 内核) |
| Redis | 离线 fallback 缓存 |
| BM25 + Dense Retrieval | 混合检索策略 |

## 快速开始

```bash
# 1. 查阅 LLM 选型决策
cat docs/research/llm-model-comparison.md

# 2. 查阅 RAG 架构设计
cat docs/research/rag-architecture.md

# 3. 搜索相关关键词 (如 "Claude"、"Qdrant"、"召回率")
grep -n "Claude\|Qdrant\|Recall" docs/research/*.md

# 4. 新增研究成果 (新建文档后，更新本 README)
# 命名规范: <主题>-<年份>.md 或 <技术名>-architecture.md
```

## 目录结构

```
docs/research/
├── README.md                    # 本文件 — 研究成果索引
├── llm-model-comparison.md      # LLM 模型选型调研 (Phase-19)
│   ├── 评估维度 (6 权重维度)
│   ├── 候选模型对比 (Claude / GPT / Qwen / DeepSeek / Gemini)
│   ├── 预算估算 (月度 ~$250-400)
│   └── 本地化替代方案 (Qwen2.5-Coder 32B)
└── rag-architecture.md          # RAG 检索架构设计 (TD-001)
    ├── 系统目标 (召回率 / 延迟 / 增量更新)
    ├── 架构图 (语义检索流水线)
    ├── Chunk 策略 (AST 优先 + sliding window)
    └── 部署方案 (Docker Qdrant + Redis fallback)
```

## 圈梁检查点清单

- [ ] `llm-model-comparison.md` 中的模型定价/评测数据为最新 (建议每季度刷新)
- [ ] RAG 架构中 Qdrant 的 collection schema 与实际部署的索引结构一致
- [ ] Embedding 模型选择已在 Qdrant 中配置对应维度 (text-embedding-3-large 为 3072 维)
- [ ] 混合检索的 dense / sparse 权重配置与实测调优结果匹配
- [ ] 模型的 JSON / Tool Use 能力已在 AI Code Reviewer 流水线中验证
- [ ] 本地化方案 (Qwen2.5-Coder) 的 GPU 资源需求已纳入基础设施预算
- [ ] 新研究产出物遵循 `docs/research/` 命名规范并更新索引
- [ ] 纯 Markdown + Mermaid 格式，无图片外部引用，可在终端/CI 中完整阅读
- [ ] 决策日期、决策者、关联 TD 任务号标注完整，便于追溯
- [ ] RAG 增量更新策略与 git hook / CI pipeline 集成已验证通过
