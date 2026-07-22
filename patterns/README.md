# 🏗️ 架构模式（Architecture Patterns）

神机营 SaaS 项目中**可复用的架构设计模式、编码范式和系统级解决方案**的知识库。

## 简介

patterns/ 目录收录了神机营在开发过程中沉淀的经典架构模式，每个 `.md` 文件描述一种经过验证的设计模式，包含：适用场景、核心代码/类型签名、关键原则、扩展路线和来源模块。这些模式来自 NestJS 后端和前端应用的实际开发，是对《八底座》各模块设计思路的系统化提炼。

## 目录结构

```
patterns/
├── README.md               # 本文件—模式索引与使用说明
├── react-agent-loop.md     # ReAct Agent 主循环模式
└── multimodal-embedding.md # 多模态嵌入接口统一模式
```

## 模式清单

### 1. ReAct Agent 主循环

**文件**: `react-agent-loop.md`
**来源**: T85 agent-core.ts, T87 multi-agent.ts, T88 self-reflection.ts
**适用场景**: 复杂任务自动化（客服、编程助手、运营分析）

核心机制:
- `Thought → Action (Tool Call) → Observation` 循环
- 完整 step trace（每步记录 thought/action/observation/durationMs）
- 优雅终止（maxSteps + AbortSignal + finalAnswer）
- 错误不中断（tool 失败仅记录到 observation.error，继续循环）
- 可观测回调（onStep 支持 UI streaming）

扩展路线:
- 多 Agent 编排（Orchestrator → DAG 拓扑序 + 并行 Promise.all）
- 自反思引擎（评分 relevance/completeness/accuracy + 重试决策）

```typescript
class AgentCore {
  async run(query: string, options: { maxSteps, signal, onStep }): Promise<AgentRunResult>
}
```

### 2. 多模态嵌入接口统一

**文件**: `multimodal-embedding.md`
**来源**: T81 multimodal-embedding.service.ts（24/24 单测通过）
**适用场景**: 系统需要处理多种模态输入（文本/图片/音频/视频）

核心机制:
- 统一接口 `embed(input: ModalityInput): number[]`，但每种模态独立实现
- 不同模态使用不同维度：文本 384 维，图片 512 维，音频 256 维
- 跨模态相似度计算：针对切片对齐（min(dim1, dim2)），而非 pad/resize
- 零向量边界处理（cosine 除零时返回 0）

真实生产实现:
- 文本: `sentence-transformers/all-MiniLM-L6-v2`（384 维）
- 图片: `openai/clip-vit-base-patch32`（512 维）
- 跨模态: CLIP 原生支持，无需手动切片

```typescript
@Injectable()
export class MultimodalEmbeddingService {
  embed(input: ModalityInput): number[]
  crossSimilarity(a: ModalityInput, b: ModalityInput): number
}
```

## 核心原则

### 1. 模式即约定
每个模式文件不只是代码示例——它是对团队内设计约定的明确定义。所有新模块在涉及已有模式时，必须参考对应文件并遵循其接口/错误处理/可观测性约定。

### 2. 真实生产实现优先
模式文档中标注的接口签名、维度、算法必须与实际生产代码一致。mock 测试必须严格按真实算法字节数（如 sha256=32, md5=16）。

### 3. 扩展路线可执行
每个模式提供明确的扩展方向（如多 Agent、自反思、跨模态），并标注所需的 Phase/L 级基础设施条件。

### 4. 单测覆盖率即文档
每个模式的来源模块标注了单测通过数（如 T81 24/24），确保模式本身经过充分验证。

## 使用指南

### 查阅模式
```bash
cat patterns/react-agent-loop.md
cat patterns/multimodal-embedding.md
```

### 应用模式到新模块
1. 找到匹配的模式文件
2. 理解接口签名和关键原则
3. 参考代码实现，保持接口一致
4. 确保新模块通过同名数量级的单测

### 新增模式
1. 在 patterns/ 下创建 `your-pattern-name.md`
2. 模板要素：标题、适用场景、代码/类型、关键原则、扩展路线、来源模块
3. 更新本 README 中的模式清单和目录树

## 模式命名规范

- 文件名: `kebab-case.md`（小写字母+连字符）
- 标题: `# Pattern: PascalCase Name`
- 代码块标注 TypeScript 语言
- 来源标注 Phase-L 编号（如 T85、Phase-23）

## 维护指南

- 模式文件只追加（Append Only）——补充新扩展方向时不删除旧版本
- 源代码接口发生变化时，模式文档必须在同一次 PR 中同步更新
- 来源标注（TXX、Phase-XX）确保与 production 代码的对照追踪
- 模式之间可以互相引用（如多 Agent 模式引用单 Agent 主循环基类）
