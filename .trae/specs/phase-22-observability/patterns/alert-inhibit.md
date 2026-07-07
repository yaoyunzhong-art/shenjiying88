# Pattern · Alert Inhibit 抑制规则

## 场景
多个告警规则会同时触发,但其中高级别 (P0) 已说明问题,低级别 (P1/P2) 是噪声。

## 实现
```typescript
const rules: AlertRule[] = [
  {
    id: 'http_5xx_high',
    severity: 'P0',
    inhibits: ['http_4xx_high', 'latency_p99_high'],
    // ...
  },
  // P1 规则不需要自己声明 inhibits,会被 P0 抑制
];

// AlertEngine.applyInhibits 自动应用:
private applyInhibits(alerts: Alert[]): Alert[] {
  const ruleMap = new Map(alerts.map((a) => [a.ruleId, a]));
  const inhibited = new Set<string>();
  for (const alert of alerts) {
    const rule = this.rules.get(alert.ruleId);
    if (!rule?.inhibits) continue;
    for (const id of rule.inhibits) {
      if (ruleMap.has(id)) inhibited.add(id);
    }
  }
  return alerts.filter((a) => !inhibited.has(a.ruleId));
}
```

## 关键点
- **声明式**: P0 规则声明 inhibits,而不是 P1 规则声明 "depends on P0"
- **运行时计算**: 每次 evaluate 时根据当前 firing 计算,不存静态依赖
- **可组合**: P0 可抑制多个 P1,P1 又可抑制 P2

## 适用
- HTTP 错误率 (5xx 高时 4xx 是噪声)
- 数据库告警 (CPU 高时慢查询是预期)
- K8s 告警 (Node down 时 Pod 状态是噪声)
