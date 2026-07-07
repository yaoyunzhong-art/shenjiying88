# Pattern: Three-Level Referral Chain

> 适用场景: 社群裂变、推荐奖励、三级分销、团队计酬

## 核心算法

构建 ancestor chain (A→B→C→D 时,D 的 chain = [D, C, B, A]):

```
function buildAncestorChain(currentParentId):
  chain = [currentParentId]
  cursor = currentParentId
  for i in range(2):  // 限深 3 (current + 2 ancestor)
    parentRecord = findRecordByChild(cursor)
    if (!parentRecord) break
    chain.push(parentRecord.parentUserId)
    cursor = parentRecord.parentUserId
  return chain
```

## 关键点

1. **找 parent 的 record,不是 child 的** — 这是常见 bug 来源
2. **限深 3**: 防刷 + 符合法规 (3 级以上涉嫌传销)
3. **递归向上**,不递归向下 (向下可能无限)

## 奖励规则 (默认)

| Level | 积分 | 优惠券 |
|---|---|---|
| L1 (直接) | 100 | ¥50 |
| L2 (间接) | 50 | 无 |
| L3 (二级间接) | 10 | 无 |

## 测试覆盖

- A→B (1 level): chain = [A]
- A→B→C (2 level): C 的 chain = [B, A]
- A→B→C→D (3 level): D 的 chain = [C, B, A]
- D 的父 (C) 也是被 B 邀请的 → B 拿 L2,A 拿 L3

## 性能

- 单次 trackSignup: O(depth) = O(3) 常数
- 推荐指标: trackRate ≥ 95%

---

> 来源: Phase-17 Pulse-68 · referral.e2e.test.ts 7/7 PASS
