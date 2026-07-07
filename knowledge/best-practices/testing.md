# Best Practice · Testing (Node test runner 规范)

> 创建日期: 2026-06-25

> 来源: Pulse-63 调试 + Phase-15/16 e2e 编写

## 测试组织

### ✅ 一个 file 一个主测试主题
```
app-journey.test.ts      ← app 用户旅程 (5 describe + 25 test)
market-bootstrap.test.ts ← 33 top-level test
interaction-flow.test.ts ← 13 top-level test
```

### ✅ describe 嵌套仅当有共享 setup
```typescript
// ✅ 当多个 test 共享 context
describe('app journey: bootstrap sequence', () => {
  // setup
  test('test 1', ...);
  test('test 2', ...);
});

// ✅ top-level test 当每个独立
test('interaction: guest can perform login only', ...);
test('interaction: member can login without challenge', ...);
```

## Assertion 规范

### ✅ 测试前先读源函数确认返回格式
```typescript
// ❌ 凭印象写
assert.equal(receiptCode, 'NATIVE-MEMBER-LOGIN-PROCEED'); // 实际是 APP-

// ✅ 先 read source,再写
// market-bootstrap.ts L1133: `app-ledger:${entry.receiptCode}`
assert.ok(ledgerKey.startsWith('app-ledger:'));
```

### ✅ async test 显式 await
```typescript
// ❌ 漏 await
test('async test', () => {
  const result = service.fetch(); // Promise, 但 assert 同步跑
  assert.equal(result, expected); // 永远 fail
});

// ✅ async + await
test('async test', async () => {
  const result = await service.fetch();
  assert.equal(result, expected);
});
```

## Mock 规范

### ✅ mock fetch 用 Response 但不消费 body
```typescript
// ✅ 只创建 Response,不读 body
globalThis.fetch = async (input) => {
  return new Response(JSON.stringify({...}), { status: 200 });
};

// ⚠️ 注意: Node 22.x test runner 在 sync test assert fail 时会 hang file-level
// 避免混合问题:test 自身保持简单,assert 都正确
```

## Bisect 调试

### ✅ 用 substring 而非 strict match
```bash
# ✅ 优选
--test-name-pattern='ledger replayable'

# ⚠️ strict 可能导致 skip 状态不一致
--test-name-pattern='^app journey: ledger replayable for successfully submitted action$'
```

## 时间盒

### ✅ file-level timeout 跟 test-level timeout 区分
- **test timeout**: 30s default,可通过 `--test-timeout=3000` 调整
- **file timeout**: 不存在,但 Node test runner 在 sync test fail 时会 hang 触发 default timeout
- **真正 fix**: 修复 assertion,而不是加 exit hack

## 关联文档
- [anti-patterns/native-vs-app-prefix.md](../anti-patterns/native-vs-app-prefix.md)
- [anti-patterns/exit-hook-hack.md](../anti-patterns/exit-hook-hack.md)
- [anti-patterns/strict-test-name-pattern.md](../anti-patterns/strict-test-name-pattern.md)
