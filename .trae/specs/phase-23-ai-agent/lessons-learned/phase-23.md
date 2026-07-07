# Phase-23 Lessons Learned: AI Agent & Knowledge V2

**Phase**: Phase-23 (T81-T96, 6 pulse)
**主题**: AI Agent 框架 + 知识系统 V2
**时间跨度**: 16 个任务, 5 个 commit
**总单测**: 181 单测全过 (T81: 24 + T82: 27 + T83: 23 + T84: 15 + T85-T88: 56 + T89-T92: 55 + T93-T95: 32 = 232 待修正 - 51 旧 = 181 新)

---

## 5 大成功

### 1. 多模态 embedding 维度清晰分层
- 文本 384 维 (MiniLM-style mock): sha256 + 词袋 + 位置编码 + L2 归一化
- 图片 512 维 (CLIP-style mock): sha256 + 尺寸特征 + 颜色直方图 + md5 块
- 跨模态投影: 切片 → cosine,处理 zero-vector 边界
- **启示**: 不同模态用不同维度 + 不同 embedding 策略,简单有效

### 2. Hybrid Search RRF 合并效果稳健
- BM25 (TF-IDF + 长度归一化) + Vector (cosine) → RRF (Reciprocal Rank Fusion)
- 各 source 权重可调 (bm25Weight/vectorWeight)
- 边界: 过滤 score=0 doc (避免 IDF 测试返回所有 doc)
- **启示**: RRF 比线性加权更鲁棒,不需要 score 归一化

### 3. Agent ReAct 循环可观测性
- 完整 trace: 每步 thought/action/observation/finalAnswer/durationMs
- onStep callback 实时上报 (可用于 UI streaming)
- AbortSignal 支持外部中断
- Mock LLM 全局 step counter: 简单但能测试循环终止
- **启示**: Agent 可观测性是生产质量的关键

### 4. 知识图谱 + GraphRAG 实用模式
- Entity + Relation + BFS 子图 + shortestPath
- GraphRAG: 实体抽取 → 子图 → 向量 → 路径 4 步流水线
- extractEntities 兼容所有 type (不仅是 Person/Place/...)
- **启示**: Graph + Vector hybrid 比纯 RAG 更适合多跳问题

### 5. A/B 测试显著性检验实用化
- hashToBucket (sha256 → [0,1)) 实现 sticky assignment
- normalCdf (Abramowitz 近似) + twoProportionZTest + twoSampleTTest
- Report 自动算 winner + pValue + lift + CI
- **启示**: 用标准 z-test 即可,不需要贝叶斯等复杂方法

---

## 5 大痛点

### 1. mock hash 函数字节数 bug (最严重)
- **现象**: Image embedding 输出 NaN
- **根因**: sha256 输出 32 字节, md5 输出 16 字节, 但循环访问超出范围 (undefined → NaN)
- **修复**: 循环条件用实际哈希长度: `i < 32 && i < dim` (sha256), `i < 16 && idx + i < dim` (md5)
- **教训**: mock 函数必须严格遵守实际算法的字节数,不能"差不多"

### 2. Word boundary 误匹配
- **现象**: 'Alicee' 被误匹配为 'Alice' (substr 'alice' 是 'alicee' 的子串)
- **修复**: 用 `\b` word boundary regex 取代 indexOf 子串扫描
- **教训**: NLP 任务必须用 word boundary,不能用朴素子串匹配

### 3. AgentMemory 双层 wrap 丢失 createdAt
- **现象**: LongTermMemory.store 把 entry 传给 AgentMemory.set, AgentMemory 重新包装时 createdAt 被覆盖为 now
- **根因**: AgentMemory.set 的实现假设 value 是 plain object,而不是嵌套对象
- **修复**: LongTermMemory 直接用 Map 存储,不再 wrap AgentMemory
- **教训**: 嵌套 wrapper 必须显式控制时间字段,不能依赖下层的"友好"默认

### 4. Test isolation: global state 跨 test 累积
- **现象**: MockLLM 用 session key 计数 step,但不同 test 用相似 query,导致计数错乱
- **修复**: 改用全局递增 counter (每个 instance 独立),并在测试中显式 `reset()`
- **教训**: Mock 对象必须有显式 reset 机制,或完全 stateless

### 5. setTimeout 即使 rejected 也跑完
- **现象**: 慢 tool 测试 (5s setTimeout) 即使 race reject 后仍占用 Event Loop 5 秒
- **修复**: 
  - tool execute 用 `finally { clearTimeout(timeoutHandle) }` 清理
  - 测试用 `() => new Promise<void>(r => { pendingResolve = r })` 而非 setTimeout,reject 后手动 `pendingResolve?.()`
- **教训**: 测试中的 setTimeout 必须可中断,否则会拖慢整个 suite

---

## 8 大行动

1. **生产 mock 严格按真实算法**: sha256/md5/embedding 模型必须有正确的字节数和维度
2. **NLP 任务强制 word boundary**: 实体抽取 / 关键词匹配 / 文本相似度都用 `\b`
3. **Wrapper 层不假设数据结构**: 每个 wrapper 必须明确文档化其 value 结构
4. **Mock 必须可 reset**: 测试间状态隔离是基本要求
5. **setTimeout 必须可中断**: 长跑测试用 pending Promise + 显式 resolve,不用 setTimeout
6. **Async cleanup 配套使用**: try/catch/finally 三件套,确保资源释放
7. **Golden dataset 提前准备**: 评估指标 (Recall/MRR/NDCG) 必须有标准 query 才能测
8. **统计检验用标准方法**: A/B 测试 z-test + t-test 足够,不必上贝叶斯

---

## 5 大决策记录 (DR 索引)

- **DR-019 多模态 embedding 分维策略**: 文本 384 + 图片 512, 跨模态 cosine 投影
- **DR-020 Hybrid Search RRF 合并**: 比线性加权更鲁棒
- **DR-021 Agent ReAct 主循环**: Thought → Action → Observation, maxSteps + AbortSignal
- **DR-022 GraphRAG 4 步流水线**: 实体抽取 → 子图 → 向量 → 路径
- **DR-023 A/B Test 显著性检验**: z-test for proportions + t-test for continuous

---

## 6 大 Pattern (复用模式)

- `multimodal-embedding.service.ts` → 多模态统一接口
- `hybrid-search.ts` → BM25 + Vector RRF 通用合并
- `retrieval-eval.ts` → Golden Dataset + 多指标评估
- `agent-core.ts` → ReAct + LLM 接口抽象
- `knowledge-graph.ts` → Entity + Relation + BFS + shortestPath
- `ab-testing.ts` → sticky assignment + 显著性检验

---

## 4 大 Anti-Pattern (避坑)

- **mock 假数据违反算法规格** (NaN 满天飞)
- **substr 匹配代替 word boundary** (Alicee → Alice)
- **wrapper 假设数据结构** (createdAt 被覆盖)
- **不可中断的 setTimeout** (Event Loop 阻塞)

---

## Phase-23 整体进度

| Pulse | Tasks | 单测 | Commit |
|-------|-------|------|--------|
| 94 (Embedding + Parser) | T81+T82 | 24+27 | 58c071cfe |
| 95 (Retrieval Eval + Hybrid Search) | T83+T84 | 23+15 | 19a75ab92 |
| 96 (Agent Framework) | T85-T88 | 11+18+11+16 | ba3eacd10 |
| 98 (Memory & Graph) | T89-T92 | 10+15+11+19 | f0fc30b08 |
| 99 (Eval & Load Test) | T93-T95 | 16+8+8 | 67c3dd724 |
| **总计** | **T81-T95** | **232 单测** | **5 commit** |

**Phase-23 闭环**: T96 Retro + 5 DR + 6 Pattern + 4 Anti-pattern + 8 Lesson → 可作为 Phase-24 (Production Hardening) 输入
