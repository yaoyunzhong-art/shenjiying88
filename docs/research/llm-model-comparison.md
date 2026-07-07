# LLM 模型选型调研 (llm-model-comparison.md)

> 创建: 2026-06-25 · Pulse-65 闭环
> 维护: Phase-19 智能化引擎筹备 (TD-001)
> 决策者: E5 赵数据 + E9 吴AI + E1 陈架构
> 数据截至: 2026 年 4-6 月官方定价 + 第三方实测

---

## TL;DR

| 角色 | 推荐模型 | 价格 (USD/1M tok) | 理由 |
|---|---|---|---|
| **主力 (Primary)** | **Claude Sonnet 4.6** | $3 / $15 (in/out) | 代码 review 准确率最高、长上下文 1M、中文支持强、prompt cache 节省 90% |
| **Fallback** | **GPT-5** (OpenAI) | $1.25 / $10 | 主线降级 (Anthropic 不可用),JSON 函数调用稳定,中文 OK |
| **本地化 / 数据敏感** | **Qwen2.5-Coder 32B** | 自托管 GPU 成本 | 92.7% HumanEval,Apache 2.0,数据不出门 |
| **轻量 (Auto E2E / RFC 起草)** | **Claude Haiku 4.5** | $1 / $5 | 速度 + 成本最优,与 Sonnet 4.6 同 API |
| **Embedding (RAG)** | **text-embedding-3-large** | $0.13 | MTEB 评分最高,3072 维,中文友好 |

**预算估算** (Phase-19 5 天, 假设 100 个 PR review + 50 个 RFC 起草):

- 主力: ~$45 / Phase (按 50k input + 5k output tokens / PR × 100 = 5.5M + 0.5M tokens)
- Fallback / 轻量: ~$10 / Phase
- Embedding (一次性索引 100k 代码块): ~$1.3
- **月度总预算**: ~$250-400 (含日常)

---

## 1. 评估维度

针对 Phase-19 **AI Code Reviewer** + **Smart RFC Drafter** 两个核心场景,权重如下:

| 维度 | 权重 | 说明 |
|---|---|---|
| **代码 review 准确率** | 30% | false positive ≤20% 是硬性 KPI |
| **中文支持** | 20% | 本仓库 retro / RFC 多为中文,模型需理解 |
| **上下文长度** | 15% | RAG 需要 ≥128K,全文件 diff 要塞得下 |
| **API 稳定性 / SLA** | 15% | CI 流水线不允许频繁超时 |
| **成本 (per 1M tok)** | 10% | 预算受限,需可预测 |
| **JSON / Tool Use** | 5% | review 输出结构化 JSON |
| **延迟 (p50)** | 5% | PR review 反馈应在 30s 内 |

---

## 2. 候选模型对比

### 2.1 Anthropic Claude 家族 (主力候选)

> 数据来源: [Anthropic Pricing 2026-04](https://platform.claude.com/docs/en/about-claude/pricing) · [ClaudeAPI Pricing Guide](https://www.claudeapi.com/en/blog/pricing/claude-api-pricing-guide/)

| 模型 | Input $/MTok | Output $/MTok | Cache 命中 | Context | 代码能力 | 中文 |
|---|---|---|---|---|---|---|
| **Claude Opus 4.7** | $5 | $25 | $0.50 | 200K | 顶尖 | 优秀 |
| **Claude Sonnet 4.6** ⭐ | **$3** | **$15** | **$0.30** | **1M** | **优秀** | **优秀** |
| **Claude Haiku 4.5** | $1 | $5 | $0.10 | 200K | 良好 | 良好 |

**关键优势**:

- **Prompt Caching**: 系统提示 + 知识库引用重复利用 → input 成本直降 90% (Sonnet 4.6: $3 → $0.30/MTok)
- **代码 review 业界公认第一**: 在 HumanEval / SWE-Bench Verified 多个基准上稳定领先
- **Anthropic API 全球可用**,Region endpoint 满足数据驻留
- **Opus 4.7+ 新 tokenizer**: 相同文本多 35% token → 实际成本要乘以 1.35

**劣势**:

- 相比 GPT-5 价格略高 (Sonnet $3 vs GPT-5 $1.25 input)
- 偶尔对 PR 中的中文注释回复英文,需在 system prompt 显式约束

### 2.2 OpenAI GPT 家族 (Fallback 候选)

> 数据来源: [OpenAI Pricing 2026-03](https://muneebdev.com/openai-api-pricing-2026/) · [OpenAI Pricing Guide](https://www.getapipulse.com/blog-openai-pricing-guide.html)

| 模型 | Input $/MTok | Output $/MTok | Cache 命中 | Context | 代码能力 | 中文 |
|---|---|---|---|---|---|---|
| **GPT-5.4** | $2.50 | $15 | $0.25 | 1.05M | 优秀 | 良好 |
| **GPT-5** ⭐ | **$1.25** | **$10** | **$0.125** | **400K** | **优秀** | **良好** |
| **GPT-5 Mini** | $0.25 | $2 | $0.025 | 128K | 良好 | 良好 |
| **GPT-4o** | $2.50 | $10 | $1.25 | 128K | 良好 | 良好 |
| **GPT-4o Mini** | $0.15 | $0.60 | $0.075 | 128K | 中 | 中 |

**关键优势**:

- **GPT-5 性价比极高**: $1.25 input 是 Sonnet 4.6 的 42%,输出类似
- **Tool Search**: 多工具场景省 47% token
- **Computer Use**: 适合后续 L3 Agent
- **缓存折扣达 90%** (GPT-5 家族)

**劣势**:

- 中文 prompt 处理不如 Claude 细腻 (尤其古文 / 专业术语)
- 长上下文 (1M+) 时 prompt > 272K 会触发 2x input 费用
- 工具调用 schema 略复杂

### 2.3 开源 / 自托管 (数据敏感场景)

> 数据来源: [PocketLLM 2026](https://pocketllm.app/blog/best-llms-for-coding-2026/) · [Best Ollama Models](https://www.morphllm.com/best-ollama-models) · [PromptQuorum 2026](https://www.promptquorum.com/de/local-llms/best-local-llms-2026)

| 模型 | HumanEval | VRAM (Q4_K_M) | License | 中文 | 推荐用途 |
|---|---|---|---|---|---|
| **Qwen2.5-Coder 32B** ⭐ | **92.7%** | 22GB | Apache 2.0 | 优秀 | 本地代码 review 主力 |
| **Qwen2.5-Coder 7B** | ~75% | 5GB | Apache 2.0 | 优秀 | 边缘 / CI 本地 |
| **Qwen3 14B** | 85% | 9GB | Apache 2.0 | 优秀 | 多语言通用 |
| **DeepSeek-R1 32B (distill)** | ~82% | 20GB | MIT | 优秀 | 复杂推理 |
| **Llama 3.3 70B** | ~78% | 43GB | Custom (受限) | 良好 | 长上下文 RAG |
| **Mistral Small 22B** | ~80% | 14GB | Apache 2.0 | 中等 | Function calling 强 |
| **DeepSeek Coder V2 16B** | ~78% | 10-12GB | DeepSeek | 优秀 | 预算 GPU |

**关键优势**:

- **数据零出网**,适合内部 PR / 客户敏感代码
- **Qwen2.5-Coder 32B** 与 Claude 3.5 Sonnet 在 HumanEval 上仅差几个点
- **Apache 2.0 / MIT** 商用无忧
- **Llama 3.3 70B** 128K 上下文适合 RAG 生成

**劣势**:

- **部署成本**: 32B Q4 需要 ≥ 22GB VRAM (≥ RTX 4090 / Mac M2 Ultra 64G+)
- **延迟**: 自托管 50-200ms 首 token,大批量 PR 时吞吐受 GPU 限制
- **运维负担**: 模型升级、量化、监控需专人

### 2.4 Google Gemini (备选)

| 模型 | Input $/MTok | Output $/MTok | Context | 代码 |
|---|---|---|---|---|
| Gemini 2.5 Pro | $1.25 | $10 | 1M (部分 2M) | 良好 |
| Gemini 1.5 Flash | $0.075 | $0.30 | 1M | 中 |

**优势**: 输入价格极低 (Flash $0.075),2M 上下文无敌
**劣势**: 代码 review 略逊 Claude / GPT,中文一般,API 不在中国大陆直连

---

## 3. 实测对比 (PocketLLM 2026 编码基准)

| 模型 | HumanEval | Real-task | Context | Speed | Privacy | 总分 |
|---|---|---|---|---|---|---|
| **Claude 3.5 Sonnet** | 优秀 | 优秀 | 优秀 | 良好 | 0 (云) | **96** |
| **GPT-4o** | 良好 | 优秀 | 良好 | 良好 | 0 (云) | 92 |
| **Qwen 2.5 Coder 32B** | 优秀 | 优秀 | 良好 | 中 | 100 (本地) | **90** |
| **DeepSeek Coder V2 236B** | 优秀 | 良好 | 良好 | 差 | 100 (本地) | 89 |
| **Gemini 1.5 Pro** | 良好 | 良好 | **优秀 (2M)** | 良好 | 0 (云) | 86 |
| **DeepSeek Coder V2 Lite** | 良好 | 良好 | 中 | 优秀 | 100 | 85 |

**结论**: Claude / GPT-4o 是云端代码 review 双雄;Qwen 2.5 Coder 32B 是本地化最佳替代。

---

## 4. 成本对比 (月预算估算)

**场景**: Phase-19 5 天,假设 100 PR review + 50 RFC draft,每次约 50K input + 5K output tokens。

| 模型 | 输入 token | 输出 token | 月度成本 |
|---|---|---|---|
| Claude Opus 4.7 | 5.5M × $5 = $27.5 | 0.55M × $25 = $13.75 | **$41.25** |
| **Claude Sonnet 4.6** ⭐ | 5.5M × $3 = $16.5 | 0.55M × $15 = $8.25 | **$24.75** |
| Claude Haiku 4.5 | 5.5M × $1 = $5.5 | 0.55M × $5 = $2.75 | **$8.25** |
| GPT-5 | 5.5M × $1.25 = $6.9 | 0.55M × $10 = $5.5 | **$12.4** |
| GPT-5 Mini | 5.5M × $0.25 = $1.4 | 0.55M × $2 = $1.1 | **$2.5** |
| GPT-4o Mini | 5.5M × $0.15 = $0.83 | 0.55M × $0.6 = $0.33 | **$1.16** |

**开启 Prompt Caching 后** (假设系统提示 80% 复用):

- Claude Sonnet 4.6: 实际成本 $24.75 × 0.3 ≈ **$7.4 / Phase** (节省 70%)
- GPT-5: $12.4 × 0.2 ≈ **$2.5 / Phase** (节省 80%)

**月度稳态** (含日常 PR + RFC + embed):
- 主力 Sonnet 4.6: ~$120 / 月
- Fallback GPT-5: ~$50 / 月
- Embedding (一次性): $1.3
- **合计**: ~$170-250 / 月 (含 buffer)

---

## 5. 推荐架构

```
              ┌─────────────────────────────┐
              │  Phase-19 AI Service (NestJS) │
              └──────────────┬───────────────┘
                             │
                  ┌──────────┴──────────┐
                  │  LLM Router (策略)   │
                  └──────────┬──────────┘
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐
   │ Sonnet   │        │  GPT-5   │        │ Qwen 2.5 │
   │ 4.6      │        │ fallback │        │ Coder 32B│
   │ 主力     │        │ (20%)    │        │ 敏感数据 │
   └──────────┘        └──────────┘        └──────────┘
   准确率优先           兜底 / 成本低         数据不出门
```

**路由策略**:

1. **默认**: Claude Sonnet 4.6 (主路)
2. **降级触发**: API 错误率 > 5% OR p95 延迟 > 30s → 切 GPT-5
3. **特殊路径**:
   - 标注 `[SENSITIVE]` 的 PR → 走本地 Qwen 2.5 Coder 32B (后续 Phase 引入)
   - 标注 `[FAST]` 的轻量任务 (auto e2e 起草) → 走 Haiku 4.5
4. **Embedding**: 统一 `text-embedding-3-large` ($0.13/MTok,中文友好)

---

## 6. Phase-19 落地决策

| 项 | 决策 | 备注 |
|---|---|---|
| **Primary LLM** | Claude Sonnet 4.6 | 准确率 + 上下文 + 中文最优 |
| **Fallback LLM** | GPT-5 | 性价比高,API 不重叠 (双供应商降低封锁风险) |
| **Embedding** | text-embedding-3-large | RAG 检索质量 |
| **本地化模型** | Phase-20+ 再评估 (Qwen 2.5 Coder 32B) | 当前 GPU 资源不足,优先云端 |
| **预算上限** | $400 / 月 (硬限,超额熔断) | 包含 fallback + cache miss buffer |
| **SLA** | 主路 99.5% 可用 + Fallback 99.9% | 双供应商 |
| **数据脱敏** | 强制 (PR description + 文件路径 + 注释中 PII 字段) | TD-002 风险 |

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| Anthropic API 限流 | 中 | 高 | 路由到 GPT-5 + 申请 Tier-2 |
| LLM 误判 (FP > 20%) | 中 | 高 | 早期 Phase-19 只对 `apps/api/src/modules/*` 启用,人工抽检 10% |
| 成本超支 | 中 | 中 | 月度硬上限 + 每日 dashboard 预警 |
| Prompt 泄露知识库 | 低 | 中 | 检索结果截断 (top-5 chunk) + 不传原始 PR diff > 100KB |
| 中文质量不稳定 | 低 | 中 | 系统 prompt 显式 `请用中文回复,术语保留英文` |
| Cache miss 拖累成本 | 中 | 低 | 监控 cache hit rate,低于 60% 优化 prompt 结构 |

---

## 8. Phase-20+ 演进路线

| 阶段 | 时间 | 目标 |
|---|---|---|
| **Phase-19** | 2026-07-09 | Claude Sonnet 4.6 (主) + GPT-5 (备) |
| **Phase-20** | 2026-07-20 | 引入本地 Qwen 2.5 Coder 32B (敏感 PR) |
| **Phase-22** | 2026-08 | Auto-Ensemble: 多模型投票,Sonnet 4.6 + Opus 4.7 + GPT-5.4 |
| **Phase-25** | 2026-10+ | 微调 Qwen 2.5 Coder on 本仓库代码 → 自托管成为主力 |

---

## 9. 关联文档

- [DR-003-intelligence-engine.md](../../knowledge/decision-records/DR-003-intelligence-engine.md) · Phase-19 决策
- [rag-architecture.md](./rag-architecture.md) · RAG 架构 (本仓库代码检索)
- [dev-roadmap.md](../../dev-roadmap.md) · Stage F 路线图
- [intelligence-engine.md](../../knowledge/intelligence-engine.md) · 智能化引擎总览

---

## 10. 参考资料

1. [Anthropic Claude Pricing](https://platform.claude.com/docs/en/about-claude/pricing) - 官方定价 (2026-04)
2. [OpenAI API Pricing 2026](https://muneebdev.com/openai-api-pricing-2026/) - GPT-5 / GPT-5.4 详细定价
3. [15 Best LLMs for Coding 2026](https://pocketllm.app/blog/best-llms-for-coding-2026/) - 实测编码基准
4. [Best Ollama Models for Coding & RAG](https://www.morphllm.com/best-ollama-models) - Qwen 92.7% HumanEval
5. [AI Pricing History 2023-2026](https://tokenmix.ai/blog/ai-pricing-trends-history) - 价格下降曲线
6. [Comparing LLM Provider Pricing](https://www.grizzlypeaksoftware.com/library/comparing-llm-provider-pricing-and-performance-19oanku0) - 横向对比

---

> 下次审查: Phase-19 Kickoff (2026-07-09)
> 由 main agent 维护,任何价格变动请同步更新 §4