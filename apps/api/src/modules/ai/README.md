# AI — AI 分析微服务

> 所属领域：P-04 AI 智能引擎 · 树哥后台自动执行

提供文本综合分析、情感评分、关键词提取等 NLP 能力。采用内存数据源模拟 AI 推理（情感词典 + 关键词词频加权），可切换为真实 LLM/ML 服务实现。

---

## 模块概述

AI 分析模块是神机营 SaaS 平台的基础 NLP 引擎，为诊断、营销推荐、内容分析等功能提供文本智能处理能力。

- **所属领域**: P-04 (AI 智能引擎)
- **模块类型**: 基础能力模块（无数据库依赖）
- **状态**: 模拟引擎运行中，可平滑切换真实 LLM

---

## 核心实体/接口

### AiService 接口

| 名称 | 签名 | 说明 |
|:-----|:-----|:-----|
| `analyzeText()` | `(text, options?) → AnalysisResult` | 综合分析：类别 + 情感 + 关键词一次完成 |
| `classifyCategory()` | `(text, options?) → CategoryResult` | 文本分类（基于关键词匹配 + 权重打分） |
| `sentimentScore()` | `(text) → SentimentResult` | 情感打分（-1.0 ~ 1.0，情感词典计分） |
| `extractKeywords()` | `(text, options?) → KeywordResult[]` | 关键词提取（词频 + 长度 + 领域权重） |
| `getAnalysisStats()` | `() → AnalysisStats` | 分析日志统计 |

### 核心类型

```typescript
interface AnalysisResult {
  text: string                         // 原始输入
  category: string                     // 类别标签
  sentiment: SentimentResult           // 情感结果
  keywords: string[]                   // 关键词列表
  confidence: number                   // 置信度 [0,1]
  processedAt: string                  // 处理时间戳 (ISO)
  tokensConsumed: number               // 模拟 token 消耗
}

interface SentimentResult {
  score: number                        // -1.0 ~ 1.0
  label: 'positive' | 'neutral' | 'negative'
  breakdown: { positive: number; neutral: number; negative: number }
}

interface CategoryResult {
  category: string                     // 主类别
  subCategory?: string                 // 次类别
  confidence: number
}

interface KeywordResult {
  keyword: string
  score: number
}
```

### 预定义类别（10 个领域）

`technology` · `finance` · `healthcare` · `education` · `entertainment` · `sports` · `politics` · `lifestyle` · `business` · `science`

### 情感词库

- **POSITIVE_WORDS**: 中英文正向词汇（good/优秀/出色/喜欢 等 ~40+）
- **NEGATIVE_WORDS**: 中英文负向词汇（bad/糟糕/失败/错误 等 ~40+）
- **NEUTRAL_WORDS**: 中性词汇（maybe/一般/普通 等 ~15）

---

## 主要 API 端点

| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| POST | `/ai/analyze` | 文本综合分析（类别 + 情感 + 关键词） |
| POST | `/ai/sentiment` | 情感打分 |
| POST | `/ai/keywords` | 关键词提取 |

### 请求/响应示例

```typescript
// POST /ai/analyze
{ "text": "The new cloud AI platform is amazing and profitable", "topKKeywords": 3 }

// 响应
{
  "text": "The new cloud AI platform is amazing and profitable",
  "category": "technology",
  "sentiment": { "score": 0.67, "label": "positive", "breakdown": { "positive": 0.5, "neutral": 0.5, "negative": 0 } },
  "keywords": ["amazing", "profit", "cloud"],
  "confidence": 0.3,
  "processedAt": "2026-07-29T00:00:00.000Z",
  "tokensConsumed": 48
}
```

---

## 处理流程

```
┌─────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 输入文本 ├──→│ 预处理分词   ├──→│ 多路并行动作 │──→│ 聚合返回结果 │
│         │   │ 去停用词     │   │ ┌──────────┐ │   │              │
│         │   │ 小写统一     │   │ │ 分类引擎  │ │   │ AnalysisResult│
│         │   │ 标点分割     │   │ ├──────────┤ │   │              │
│         │   │              │   │ │ 情感引擎  │ │   │              │
│         │   │              │   │ ├──────────┤ │   │              │
│         │   │              │   │ │ 关键词引擎│ │   │              │
│         │   │              │   │ └──────────┘ │   │              │
└─────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

### 情感评分逻辑

1. 分词 → 遍历情感词典匹配
2. 计分: `score = (posCount - negCount) / max(posCount + negCount, 1)`
3. 归一化到 [-1, 1]，映射 label: `>0.2 → positive` / `<-0.2 → negative` / 其他 → `neutral`

### 关键词提取逻辑

1. 词频统计（过滤长度 < 2 的词汇）
2. 加权打分: `freq/total + length*0.01 + (category_match ? 0.1 : 0)`
3. 取 topN（默认 5），可选 minScore 下限过滤

---

## 依赖关系

### 模块依赖

| 依赖模块 | 类型 | 说明 |
|:---------|:-----|:-----|
| `AgentModule` | 守卫 | `TenantGuard` 租户上下文隔离 |
| NestJS 核心 | 框架 | `@nestjs/common` Controller/DI |

### 服务导出

| 导出 | 消费者 |
|:-----|:-------|
| `AiService` | 诊断模块、营销推荐、内容分析 |

---

## RBAC 角色要求

| 端点 | 守卫 | 角色要求 |
|:-----|:------|:---------|
| `POST /ai/*` | `@UseGuards(TenantGuard)` | 已验证租户均可访问（tenant-scoped） |

> 当前所有 AI 端点使用 `TenantGuard` 确保租户上下文隔离，无额外的细粒度角色校验。如需限制为 `admin` 或 `analyst` 角色，可叠加 `@Roles()` 装饰器。

---

## 扩展指南

为切换到真实 LLM 服务，只需实现 `AiService` 的同名方法签名（`analyzeText` / `sentimentScore` / `extractKeywords`），并在 `AiModule` 中替换 provider 即可。当前模拟实现可作为 fallback 兜底。
