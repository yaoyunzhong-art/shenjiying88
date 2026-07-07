# Anti-Pattern: Mock 假数据违反算法规格

**场景**: mock embedding / hash / 加密函数

## 错误示例

```typescript
// ❌ 错误: 假设 sha256 输出 64 字节 (其实是 32 字节)
function embedImageV2(image, dim = 512) {
  const hash = sha256(content);  // 32 bytes
  for (let i = 0; i < 64 && i < dim; i++) {
    vec[i] = hash[i] / 255;  // hash[32-63] = undefined → NaN
  }
}

// ❌ 错误: 假设 md5 输出 32 字节 (其实是 16 字节)
function embedImageV2(image, dim = 512) {
  const hash = md5(block);  // 16 bytes
  for (let i = 0; i < 32 && idx + i < dim; i++) {
    vec[idx + i] = hash[i] / 255;  // hash[16-31] = undefined → NaN
  }
}
```

## 症状

- 向量中夹杂 NaN
- cosine similarity 输出 NaN
- 整个 pipeline 失败

## 正确做法

```typescript
// ✅ 正确: 用实际字节数
function embedImageV2(image, dim = 512) {
  const hash = sha256(content);  // 32 bytes
  for (let i = 0; i < 32 && i < dim; i++) {  // 32 不是 64
    vec[i] = hash[i] / 255;
  }
}

// ✅ 正确: 零向量边界处理
function cosineSimilarity(a, b) {
  if (a.every(x => x === 0) || b.every(x => x === 0)) return 0;
  const sim = dotProduct(a, b) / (norm(a) * norm(b));
  return Number.isFinite(sim) ? sim : 0;
}
```

## 关键教训

| 算法 | 实际字节数 |
|------|----------|
| MD5 | 16 字节 (32 hex chars) |
| SHA-1 | 20 字节 (40 hex chars) |
| SHA-256 | 32 字节 (64 hex chars) |
| SHA-512 | 64 字节 (128 hex chars) |

mock 函数必须**严格按真实算法的字节数**实现,不能"差不多"。

## Phase-23 来源

T81 multimodal-embedding.service.ts (Image embedding NaN bug 修复)
