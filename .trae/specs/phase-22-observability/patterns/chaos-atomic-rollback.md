# Pattern · Chaos 实验原子化设计

## 场景
故障演练需要可重复、可回滚、不影响生产。

## 实现
```typescript
class ChaosEngine {
  start({ type, scope, params, autoRevertMs }): ChaosExperiment {
    const id = `chaos-${uuid().slice(0, 8)}`;
    const exp = { id, type, scope, params, status: 'active', startedAt: now(), endsAt };
    this.experiments.set(id, exp);
    if (autoRevertMs) setTimeout(() => this.complete(id), autoRevertMs);
    return exp;
  }
  
  rollback(id): ChaosExperiment {
    const exp = this.experiments.get(id);
    clearTimeout(this.timers.get(id)); // 取消 autoRevert
    exp.status = 'rolled-back';
    this.experiments.delete(id);
    return exp;
  }
}
```

## 关键点
- **autoRevertMs**: 强制超时回滚,即使忘记 rollback 也不会永久故障
- **scope (global/tenant/endpoint/user)**: 限制爆炸半径
- **rollbackAll()**: 紧急情况一键恢复
- **recordImpact()**: 记录演练期间的真实影响 (totalRequests/errored/avgLatency)
- **Idempotent rollback**: rollback 后再 rollback 不会出错

## 适用
- 故障演练 (Chaos Engineering)
- 性能测试 (限流 + 延迟注入)
- 安全测试 (越权/异常输入)
- 兼容性测试 (旧 API + 新 API 并存)
