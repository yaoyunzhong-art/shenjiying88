# Anti-Pattern · exit-hook-hack (用 process.exit 掩盖 timeout)

> 创建日期: 2026-06-25

> 来源: Pulse-63 调试过程 (已移除)
> 危害: 掩盖真问题,长期累积债务

## 错误表现
看到 test timeout,直接在 file 末尾加:
```typescript
process.on('beforeExit', () => {
  process.exit(0);
});
```

或:
```typescript
test.after(() => process.exit(0)); // ❌ test 没有 after 属性
```

## 为什么错
1. **掩盖真因**: timeout 通常是 assertion fail 或 active handle leak,exit hack 让你看不到错误
2. **假性"修复"**: CI 显示 pass,但实际 test 没跑完
3. **未来债务**: 当真问题累积,exit hack 也会失效
4. **Node test runner**: `--test-force-exit` 也无效,因为内部 timer

## 正确诊断步骤
1. **bisect by describe**: 用 `--test-name-pattern='describe1|describe2|...'` 拆解
2. **单 test 跑**: 用 `--test-name-pattern='^test_name$'` 严格匹配,定位哪个 test 卡
3. **看输出**: `not ok 1 - file` + `failureType: 'testTimeoutFailure'` 是 timeout;`failureType: 'testAssertionFailure'` 是 fail
4. **读源函数**: 如果是 assertion fail,看源函数返回 vs 期望值

## 正确做法
- **诊断**: 先 bisect + 看 `failureType`,不要直接加 hack
- **修复**: 修 assertion (而不是 exit hack)
- **如果真要 exit**: 用 `process.exit(0)` 在每个 test 末尾,且 commit message 必须标注 `[TEST-EXIT-HACK]`

## 关联专家
- W5L3: Node test runner 行为诊断

## 关联文档
- [lessons-learned/pulse-63.md](../lessons-learned/pulse-63.md) Lesson 2
- [anti-patterns/native-vs-app-prefix.md](native-vs-app-prefix.md) · assertion 写错是 root cause 之一
