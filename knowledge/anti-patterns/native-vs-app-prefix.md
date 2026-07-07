# Anti-Pattern · native-vs-app-prefix (跨 app 前缀错乱)

> 创建日期: 2026-06-25

> 来源: Pulse-63 P0-002 修复
> 危害: test timeout 66s (Node 22 bug 触发)

## 错误表现
在 `apps/app/app-journey.test.ts` 中,5 处 assertion 错误地期望 `native-` / `NATIVE-` 前缀:

```typescript
// ❌ 错误 (期望 native- 但实际是 app-)
assert.ok(ledger[0]!.ledgerKey.startsWith('native-ledger:'));
assert.equal(receiptCode, 'NATIVE-MEMBER-LOGIN-PROCEED');
assert.equal(auth.audience, 'native-app-handler-sync');
assert.ok(auth.authorization.includes('NATIVE-MEMBER-LOGIN-PROCEED-HANDLER'));
assert.ok(receipt.ackToken.includes('NATIVE-MEMBER-LOGIN-PROCEED'));
```

```typescript
// ✅ 正确 (跟 market-bootstrap.ts 实际返回一致)
assert.ok(ledger[0]!.ledgerKey.startsWith('app-ledger:'));
assert.equal(receiptCode, 'APP-MEMBER-LOGIN-PROCEED');
assert.equal(auth.audience, 'app-handler-sync');
assert.ok(auth.authorization.includes('APP-MEMBER-LOGIN-PROCEED-HANDLER'));
assert.ok(receipt.ackToken.includes('APP-MEMBER-LOGIN-PROCEED'));
```

## 根因
1. 写 test 时凭印象写前缀,没看源函数实际返回
2. 跨 app (`miniapp` / `app` / `admin-web`) 命名空间不一致
3. Node 22.x test runner 在 assert fail 时 hang 整个 file-level root test,触发 30s timeout,**不报 fail**

## 正确做法
1. **写 test 前先 Read 源函数**确认返回字符串格式
2. **跨 app 对齐**: `app` 用 `app-` / `APP-`,`miniapp` 用 `miniapp-` / `MINIAPP-`,`admin-web` 用 `admin-` / `ADMIN-`
3. **如果 timeout 是 fail 引起的**: bisect by describe block 定位,而不是加 `process.exit` hack

## 关联专家
- E7(孙体验): UX 测试需对齐实际前缀
- W5L3: Node test runner 行为诊断

## 关联文档
- [lessons-learned/pulse-63.md](../lessons-learned/pulse-63.md) Lesson 1
- [anti-patterns/exit-hook-hack.md](exit-hook-hack.md) · 不要用 beforeExit hack 掩盖问题
