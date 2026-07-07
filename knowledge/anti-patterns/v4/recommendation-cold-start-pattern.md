# 反模式: 推荐系统冷启动 (Recommendation Cold Start)

> **T170 / Phase-40 / DR-40**
> 创建: 2026-06-28
> 适用: 所有推荐系统 / 个性化引擎 / 协同过滤服务

## 概述

推荐系统面对**新会员/匿名访客/低历史用户**时,常见的 8 个反模式会导致
**空推荐列表**、**冷启动崩溃**、**重复推荐已购商品**、**结果同质化** 等问题。

冷启动是推荐系统的"出生关"——必须 graceful fallback,不能返回空。

---

## 8 个反模式 (Anti-Patterns)

### AP-1: 无冷启动检测,直接返回空数组

**反模式 (❌)**
```typescript
async recommend(req: RecommendationRequest): Promise<Candidate[]> {
  // 新会员没有购买历史, 协同过滤直接返回 []
  const purchases = await purchaseAdapter.queryMemberPurchases(req.tenantId, req.memberId)
  if (purchases.length === 0) return []  // ❌ 空数组对前端是灾难
}
```

**问题**:
- 新会员首次访问看到空白推荐,转化率暴跌 80%+
- 控制台无错误但业务无输出,排查困难
- 无法区分"系统异常" vs "无历史数据"

**正解 (✅)**
```typescript
const decision = coldStart.detect({
  hasMemberId: !!req.memberId,
  purchaseCount: purchases.length,
  viewCount: views.length,
  lifecycleStage: prefs?.lifecycleStage
})

if (decision.isColdStart) {
  // 优雅降级到 Popular 策略
  return popularStrategy.recommend(req.tenantId, productAdapter, purchaseAdapter, limit)
}

return fuse(strategies, weights)
```

---

### AP-2: 多策略结果直接拼接,无多样性打散

**反模式 (❌)**
```typescript
const candidates = [
  ...itemCFResults,
  ...userCFResults,
  ...popularResults
]
return candidates.slice(0, limit)  // ❌ 前 N 个全是 item-cf, 全是同品牌/同类目
```

**问题**:
- 前 5 个推荐全是同一品牌,用户体验差
- 长尾商品永远曝光不到
- 多样性缺失导致推荐系统 Gini 系数接近 1

**正解 (✅)**
```typescript
// MMR (Maximal Marginal Relevance) 打散
fused = diversification.rerank(fused, productMap, limit)
// λ=0.7 平衡相关性与多样性
// score_mmr = λ * relevance(i) - (1-λ) * max(similarity(i, selected))
```

---

### AP-3: 评分融合使用平均而非加权

**反模式 (❌)**
```typescript
const fusedScore = candidates.reduce((s, c) => s + c.score, 0) / candidates.length
// ❌ 不区分策略重要性
```

**问题**:
- 5 个策略等权重,无法体现个性化 > 热门
- ACTIVE 会员和 NEW 会员用相同权重
- ItemCF 应该有更高权重因为它基于历史行为

**正解 (✅)**
```typescript
const weights = scoring.computeWeights(strategies, {
  baseScore: 1.0,
  strategyWeights: ScoringService.DEFAULT_WEIGHTS,
  memberPreferences: prefs
})
// DEFAULT_WEIGHTS = { 'item-cf': 0.35, 'user-cf': 0.20, 'popular': 0.20, 'recently-viewed': 0.10, 'personalized': 0.15 }
// ACTIVE 会员 → personalized 加权到 0.30
// NEW 会员 → popular 加权到 0.50
```

---

### AP-4: 推荐结果包含已购商品

**反模式 (❌)**
```typescript
const candidates = await itemCF.recommend(ctx, memberId, limit)
// ❌ 不排除已购, 用户看到"再次购买"提示
```

**问题**:
- 用户体验差,"我已经买过了还推荐?"
- 转化率降低 40%
- 商业规则违反

**正解 (✅)**
```typescript
const excludeItemIds = new Set<string>()
if (req.excludePurchased !== false && req.memberId) {
  for (const id of purchaseAdapter.queryPurchasedItemIds(req.tenantId, req.memberId)) {
    excludeItemIds.add(id)
  }
}
if (req.contextItemId) excludeItemIds.add(req.contextItemId)

const candidates = strategy.recommend(ctx, memberId, limit, excludeItemIds)
```

---

### AP-5: 推荐缺货商品

**反模式 (❌)**
```typescript
// ❌ 没有过滤 available=false 的商品
const candidates = popularStrategy.recommend(ctx, limit)
return candidates
```

**问题**:
- 点击后跳转"已售罄",用户体验崩塌
- 投诉率上升 60%

**正解 (✅)**
```typescript
if (req.excludeOutOfStock !== false) {
  for (const p of productAdapter.query(req.tenantId)) {
    if (!p.available) excludeItemIds.add(p.id)
  }
}
```

---

### AP-6: 缓存 key 未含 tenantId,导致跨租户串号

**反模式 (❌)**
```typescript
const cacheKey = sha256(JSON.stringify({
  memberId, strategies, limit  // ❌ 缺 tenantId
}))
// T1 的 m1 和 T2 的 m1 共享同一份缓存
```

**问题**:
- **跨租户数据泄露** (P0 风险)
- 违反多租户隔离原则

**正解 (✅)**
```typescript
const cacheKey = sha256(JSON.stringify({
  tenantId: req.tenantId,  // ✅ 必须放在第一位
  memberId: req.memberId,
  strategies: req.strategies,
  limit: req.limit,
  filters: req.filters
}))
// 推荐反模式 v4: cross-tenant-data-leak
```

---

### AP-7: 无推荐理由 (reasoning) 字段

**反模式 (❌)**
```typescript
interface Candidate {
  itemId: string
  score: number
  // ❌ 没有 reasoning 字段,前端只能显示"为您推荐"
}
```

**问题**:
- 用户不知道为什么被推荐,可信度低
- A/B 测试无法分析不同理由的转化率
- 算法不透明,合规审计困难

**正解 (✅)**
```typescript
interface Candidate {
  itemId: string
  score: number
  reasoning: string  // ✅ 例: '与"无线耳机"常被一同购买'
  strategy: StrategyType  // ✅ 追溯是哪个策略选中的
  metadata?: Record<string, any>  // ✅ coOccurrence, itemPurchasers 等
}
```

---

### AP-8: 缓存无 TTL,新数据永不生效

**反模式 (❌)**
```typescript
class NaiveCache {
  store = new Map<string, Result>()

  get(key: string): Result | null {
    return this.store.get(key) ?? null  // ❌ 永不过期
  }
}
// 用户收藏了新商品,但 30 天内都不会出现在推荐中
```

**问题**:
- 会员新购商品 30 天内不会出现在推荐
- 价格调整不生效
- 长尾 LRU 永远轮换不出去

**正解 (✅)**
```typescript
class RecommendCacheService {
  private ttlMs = 5 * 60 * 1000  // ✅ 5 分钟 TTL
  private maxEntries = 200       // ✅ LRU 200 条上限

  get(key: string): RecommendationResult | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key)  // ✅ 主动过期
      return null
    }
    return entry.value
  }
}
```

---

## 检查清单 (Checklist)

| # | 反模式 | 检测方法 | 通过标准 |
|---|--------|---------|---------|
| 1 | 无冷启动 fallback | 单元测试匿名/NEW 会员 | 至少有 Popular 候选 |
| 2 | 无多样性打散 | 集成测试 5 个候选 | 至少 2 个不同类目 |
| 3 | 评分未加权 | 单元测试 computeWeights | ACTIVE 个性化权重 > popular |
| 4 | 包含已购商品 | 集成测试 m1 购买 A | 候选不含 A |
| 5 | 包含缺货商品 | 集成测试 available=false | 候选不含该商品 |
| 6 | 缓存缺 tenantId | 单元测试 fingerprint | key 包含 tenantId |
| 7 | 缺 reasoning 字段 | 单元测试 Candidate | 字段非空 |
| 8 | 缓存无 TTL | 单元测试 set + 等待 | 6min 后 get 返回 null |

---

## 推荐系统健康度指标 (推荐)

| 指标 | 健康阈值 | 计算方式 |
|------|---------|---------|
| Cold Start 占比 | < 20% | cold_start_count / total_requests |
| 缓存命中率 | > 30% | cache_hits / total_requests |
| 候选多样性 | > 60% | distinct_categories / total_candidates |
| 平均耗时 | < 100ms | executionMs p95 |
| Fallback 成功率 | 100% | 冷启动时返回非空候选 |

---

## 相关反模式

- **cross-tenant-data-leak** — 跨租户数据泄露 (T170 强化)
- **caching-strategy** — 缓存 LRU + TTL (T170)
- **multi-tenant-data-isolation-pattern** — 多租户隔离 (T169)
- **privacy-gdpr-pattern** — GDPR 数据最小化 (推荐场景)

---

## 实战案例 (T170 DR-40 决策链)

| 决策 | 触发条件 | 行动 |
|------|---------|------|
| DR-40-A | 匿名/NEW/<3 购买/<5 浏览 | fallback Popular |
| DR-40-B | 候选 > 5 个 | MMR rerank (λ=0.7) |
| DR-40-C | 多策略同时返回候选 | weightedSum 融合 |
| DR-40-D | 每个 Candidate | 必填 reasoning 字段 |
| DR-40-E | excludePurchased/excludeOutOfStock | 默认 true |
| DR-40-F | 所有缓存 key | tenantId 强制注入首位 |

---

**反模式库版本**: v4 (32 文件) · +1 (recommendation-cold-start-pattern)
**累计反模式**: 31 → **32**