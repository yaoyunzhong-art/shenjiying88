# Anti-pattern · Chunk Merge 陷阱

> 创建: 2026-06-26 (Phase-18 T23)
> 严重度: 🔴 高 (T23 真实发生,1 小时调试)
> 关联: [DR-006](./DR-006-rag-indexer-v1.md)

## 现象

```typescript
// ❌ 反例 - 短段落合并策略
const flush = () => {
  const text = buffer.join('\n').trim();
  const tokens = estimateTokens(text);
  if (tokens < MIN_TOKENS_PER_CHUNK && chunks.length > 0) {
    // 短段落 → 合并到上一个 chunk
    chunks[chunks.length - 1].content += '\n\n' + text;
    return;
  }
  // ... 创建新 chunk
};
```

实际发生:
- 文档 `# Doc A\n\npara 1\n\npara 2` 被切成 1 个 chunk (而非 3 个)
- AC-5 测试 `totalChunks >= 3` 失败
- e2e 3/5 失败

## 根因

合并策略语义错位:
- 合并短段落 → 减少 chunk 数 → 但**丢失段落边界**
- 召回时无法精准定位"para 1"还是"para 2"
- chunk 体积变大,但召回精度下降

## 解法 · 按 ## section 独立成 chunk

```typescript
// ✅ 正例 - section 独立成 chunk
for (const line of lines) {
  if (h1) {
    flushSection(currentSectionName);
    currentTitle = h1[1].trim();
  } else if (h2) {
    flushSection(currentSectionName); // 触发前一个 section
    currentSectionName = h2[1].trim();
  } else if (emptyLine) {
    flushSection(currentSectionName); // 按段落切分
  } else {
    buffer.push(line);
  }
}
```

### 优势

- 每个 section 独立成 chunk,即使短
- 段落边界清晰,chunk 体积小
- 超长 section 才按段落滑动切分 (而不是合并)

### 妥协

- 短 section 可能产生 1-token chunk (但 index 体量仍可控)
- 召回时多个短 section 一起返回,精度反而更高

## 测试教训

e2e AC-1 期望 `chunks.length >= 3` 立即暴露了短段落合并策略的失败。
**e2e 测试比单测更擅长捕捉语义边界问题。**

## 经验

> **RAG 切分策略:section 边界 > 段落合并;召回精度 > chunk 体量。**
> **e2e 测试立即暴露策略漏洞,优于单测。**