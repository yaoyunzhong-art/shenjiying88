# Anti-pattern · 共享 RegExp 的 lastIndex 状态

## ❌ 错误
```typescript
const PATTERNS = {
  phone: /1[3-9]\d{9}/g,
  email: /\S+@\S+\.\S+/g,
};

// 多次调用
detect('138...'); // OK
detect('139...'); // OK (单次调用 OK,但...)
detect('138...
139...'); // 如果 lastIndex 没重置,会从上次结束位置开始
```

## 问题
- `/g` 标志 RegExp 的 lastIndex 是状态ful 的
- 共享 PATTERNS 对象时,多次调用 lastIndex 互相干扰
- 尤其在并发场景 (测试 + 服务共用)

## ✅ 正确
```typescript
// 方案 1: 每次新建 RegExp (推荐)
const regex = new RegExp(pattern.source, pattern.flags);

// 方案 2: 重置 lastIndex
PATTERNS.phone.lastIndex = 0;
while ((m = PATTERNS.phone.exec(text)) !== null) { ... }

// 方案 3: 不用 /g,用 matchAll
for (const m of text.matchAll(PATTERNS.phone)) { ... }
```

## 教训
T39 测试 idCard 时反复失败,实际是 regex state 问题。
