# Pattern · 区域故障切换状态机

## 场景
多区域 SaaS 需自动故障切换,保障 SLA。

## 4 状态机
```
HEALTHY → DEGRADED → DOWN → RECOVERING → HEALTHY
```

## 转移规则
- 1 次失败: HEALTHY → DEGRADED
- 连续 N 次失败 (阈值): DEGRADED → DOWN
- 1 次成功: DOWN → RECOVERING
- 连续 2 次成功: RECOVERING → HEALTHY

## 实现
```typescript
async checkHealth(region: Region): Promise<HealthResult> {
  const ok = await this.probe(region);
  const failures = ok ? 0 : this.failures.get(region) + 1;
  this.failures.set(region, failures);

  if (ok && this.state === 'RECOVERING') {
    this.transition(region, 'RECOVERING', 'HEALTHY');
  } else if (ok) {
    this.transition(region, this.state, 'HEALTHY');
  } else if (failures >= this.threshold) {
    this.transition(region, this.state, 'DOWN');
  } else {
    this.transition(region, this.state, 'DEGRADED');
  }
}
```

## 适用
- 多区域 SaaS (cn/us/eu/jp)
- 多可用区 (multi-AZ) 数据库
- 微服务熔断降级
