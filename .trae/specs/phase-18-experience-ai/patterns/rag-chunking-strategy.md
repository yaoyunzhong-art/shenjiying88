# RAG 切分策略 · Markdown 文档分块

> 创建: 2026-06-26 (Phase-18 T23)
> 状态: ✅ Established
> 关联: [DR-006](./DR-006-rag-indexer-v1.md)

## 策略概览

```
[原始 markdown 文档]
       ↓ 按 ## section + 空行分段
[Section Chunks (≤ 512 tokens)]
       ↓ 超长 section 按段落滑动切分
[Final Chunks]
       ↓ Embedding (V1 mock / V2 sentence-transformers)
[Vector Index]
```

## 3 层切分逻辑

### Layer 1 · # 标题 → 文档 title
- `#` 触发当前 section flush,并设置新文档 title
- title 写入 chunk metadata,便于按文档召回

### Layer 2 · ## 标题 → Section 边界
- `##` 触发当前 section flush,新 section 开始
- section name 写入 chunk metadata.section

### Layer 3 · 空行 → 段落边界
- 空行触发当前 buffer flush
- 短段落 (< 50 tokens) 合并到前一个 chunk
- 长段落 (> 512 tokens) 按句子边界滑动切分

## Token 估算

```typescript
// 简化估算
const cjkChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
const words = text.split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)).length;
const tokens = Math.ceil(cjkChars / 1.5) + words;
```

- 中文:每 1.5 字符 = 1 token
- 英文:每 1 word = 1 token (近似)

## 上限保护

- 单 chunk ≤ **512 tokens** (sentence-transformers 推荐值)
- 超长自动按段落滑动切分,重叠 50 tokens (Phase-19)

## Embedding 接口

```typescript
embed(text: string): number[] // 256 维 (V1) / 384 维 (V2)
```

- V1: SHA-256 hash + 词袋 + L2 归一化 → deterministic
- V2: sentence-transformers/all-MiniLM-L6-v2 → 语义级别

## Query 接口

```typescript
query({
  query: string,
  topK?: number,        // default 5
  kindFilter?: string,  // spec / lesson / pattern / decision / doc
  minScore?: number     // default 0
}): QueryResponse
```

- Cosine similarity 排序
- kindFilter 缩小召回范围 (例:只要 lesson)
- minScore 过滤低分 chunk

## Anti-patterns

- ❌ 按字符数切分 → 切断语义边界
- ❌ 无 section 概念 → 召回时丢失上下文
- ❌ 短段落全部独立成 chunk → 索引膨胀,query 慢

## 实施

- [knowledge-indexer.service.ts](../../../../apps/api/src/modules/knowledge/knowledge-indexer.service.ts)