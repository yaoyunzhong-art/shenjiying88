# AutoRollback 状态机模式

> 创建: 2026-06-26 (Phase-19 T27)
> 关联: [DR-007](./DR-007-anomaly-detection.md)

## 9 状态状态机

```
PENDING ─┐
         ├→ AWAITING_CONFIRM ─→ (confirm) → SNAPSHOTTING
WARNING  │                            ↑
         │                            │ cancel
CRITICAL ┘                            │
                                      ↓
                          CANCELLED ←─┘
                                      

SNAPSHOTTING ─→ ROLLING_BACK ─→ VERIFYING ─→ COMPLETED / FAILED
```

## 设计原则

1. **误触发防护** - CRITICAL 必走二次确认
2. **可中止** - 任何阶段可 cancel
3. **可审计** - history 记录每步状态 + note + timestamp
4. **可重放** - snapshot 完整,可重新回滚

## 状态机实现模板

```typescript
type Status = 'PENDING' | 'AWAITING_CONFIRM' | 'SNAPSHOTTING' | ...;
const validTransitions = {
  PENDING: ['AWAITING_CONFIRM', 'CANCELLED'],
  AWAITING_CONFIRM: ['PENDING', 'CANCELLED'],
  // ...
};

function transition(record, newStatus) {
  if (!validTransitions[record.status].includes(newStatus)) {
    throw new Error(`Invalid transition: ${record.status} → ${newStatus}`);
  }
  record.status = newStatus;
  record.history.push({ status: newStatus, timestamp: now() });
}
```

## Anti-patterns

- ❌ 直接修改 status 不记录 history → 无法审计
- ❌ CRITICAL 不需要确认 → 高风险
- ❌ 一次性状态 (无 history) → 无法复盘
