# Anti-Pattern · strict-test-name-pattern (测试名严格匹配导致 skip)

> 创建日期: 2026-06-25
> 来源: Pulse-63 bisect 调试发现
> 危害: 误判 timeout 原因

## 错误表现
调试时用严格 pattern:
```bash
--test-name-pattern='^app journey: ledger replayable for successfully submitted action$'
```

如果 describe 名字不 match 这个 pattern,describe 内其他 test 被 skip,造成 file-level root test 不一致状态,**触发 false timeout**。

## 为什么危险
1. **误导**: 看起来 timeout 像是 test 卡住,实际是 skip 状态不一致
2. **浪费时间**: bisect 走错方向
3. **混合 bug**: 跟真 timeout 难以区分

## 正确做法
1. **bisect 时用 substring** (不要 `^...$`):
   ```bash
   # ✅ 优选
   --test-name-pattern='ledger replayable'
   ```
2. **如果必须严格匹配**,加 sibling describe pattern:
   ```bash
   --test-name-pattern='^app journey: ledger replayable|^app journey: bootstrap sequence|^app journey: market initialization'
   ```
3. **看 `tests 1, suites 0` 输出**: 这是 file-level timeout 标志
4. **看 `pass 0, fail 0, cancelled 1`**: 这可能是 skip 状态

## 关联专家
- W5L3: 测试调试

## 关联文档
- [lessons-learned/pulse-63.md](../lessons-learned/pulse-63.md) Lesson 3