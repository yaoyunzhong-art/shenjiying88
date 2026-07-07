# Anti-pattern · 健康度单维度评分

> 创建: 2026-06-26 (Phase-19 T34)
> 严重度: 🟡 中
> 关联: [lessons-learned/phase-19.md](../lessons-learned/phase-19.md) §痛点 3

## 现象

```typescript
// ❌ 反例 - 单维度评分
function healthScore(tenant) {
  if (tenant.p95Ms > 1000) return 'CRITICAL';
  return 'HEALTHY';
}
```

实际发生:
- 性能好但配额超限 → 仍 HEALTHY → 漏报
- 错误率高但性能好 → 仍 HEALTHY → 漏报
- Champion 全部流失 → 仍 HEALTHY → 漏报

## 根因

单维度无法反映多维度风险,SaaS 平台的健康是多维度的综合。

## 解法 · 4 维度加权

参见 [DR-009](./DR-009-health-score-model.md)。

```typescript
// ✅ 正例 - 4 维加权
const score = performance * 0.3 + reliability * 0.3 + quotaHealth * 0.2 + community * 0.2;
```

## 经验

> **健康度 = 4 维度加权,缺一不可。**
> **Phase-20 用真实数据校准权重。**
