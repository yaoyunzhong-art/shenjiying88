# Anti-pattern · 告警疲劳 (Alert Fatigue)

## ❌ 错误
```typescript
// 没有优先级,所有告警都发飞书群
engine.addRule({ id: 'cpu_high', severity: 'P0', /* 阈值 50% */ });
engine.addRule({ id: 'cpu_high2', severity: 'P0', /* 阈值 60% */ });
engine.addRule({ id: 'cpu_high3', severity: 'P0', /* 阈值 70% */ });
engine.addRule({ id: 'cpu_high4', severity: 'P0', /* 阈值 80% */ });
// 一天触发 200 次飞书消息
```

## 问题
- oncall 工程师对告警麻木,真正 P0 不被重视
- 飞书 / PagerDuty 通道被淹没,关键消息漏掉
- 工程师开始 mute 告警群,形成恶性循环
- 误报太多,真信号被淹没

## ✅ 正确
```typescript
// 1. 分级: P0 (立即 page) / P1 (工作时间内通知) / P2 (每日汇总)
// 2. 抑制: P0 抑制 P1/P2 (DR-018)
// 3. 冷启动保护: minSamples 避免启动时假阳性
engine.addRule({
  id: 'cpu_high',
  severity: 'P1',
  evaluator: (s) => s.avg > 70,
  minSamples: 10,
  windowMs: 60_000,
});

// 4. 告警合并: 同一规则 5min 内不重复 page
engine.cooldown('cpu_high', 5 * 60 * 1000);

// 5. 维护窗口: 时间段内自动 silenced
engine.silence({
  ruleIds: ['cpu_high', 'latency_high'],
  startsAt: '2026-07-01T02:00:00Z',
  endsAt: '2026-07-01T04:00:00Z',
  reason: 'DB migration',
});
```

## 教训
- T75 Alert 引擎: 5 条默认规则都是 P0/P1,不滥用 P2
- T76 Runbook: dry-run 模式避免测试时真 page
- 告警数量目标: < 5 次/天/oncall,P0 < 1 次/周
- 季度 review: 哪些告警没人响应 → 删除或降级
