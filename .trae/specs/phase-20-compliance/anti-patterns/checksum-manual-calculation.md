# Anti-pattern · 校验位手动计算

## ❌ 错误
```typescript
// 手动算校验位
const sum = digits.map((d, i) => d * weights[i]).reduce((a, b) => a + b, 0);
const checksum = codes[sum % 11]; // 我"以为" codes[9]='4' → 错!
```

## 问题
- 极易算错 (数组索引 vs 元素值混淆)
- 测试 ID 选错 → 整个测试 fail
- 浪费调试时间

## ✅ 正确
1. 写代码: `function checksum(id) { /* 严格按 GB 11643-1999 */ }`
2. 准备已知有效的真实 ID (来自官方文档)
3. 写测试断言 checksum(knownValidId) === knownValidChecksum
4. 用代码验证,不要口算

## 教训
T39 调试 30+ 分钟才意识到 codes 数组索引 9 是 '3' 不是 '4'。
