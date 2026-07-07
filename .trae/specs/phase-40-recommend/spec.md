# Phase-40 智能推荐 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:04 CST
> **创建人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **状态**: 🟡 框架版,等 Phase-39 完成后启动
> **预计**: 2 天工期 (P3 已放宽到 20 天)

---

## 0. 现状盘点 (派发前必做)

**⚠️ 必须做**:派发 T170 任务卡前,先盘点智能推荐模块。

待验证:
- `apps/api/src/modules/ai-review/` (可能含推荐)
- `Recommendation` / `UserProfile` / `Preference` 实体
- 与 Phase-36 会员画像集成
- 已有 AI 模型 (rule-based / ML)

---

## 1. 业务目标

智能推荐是 SaaS 平台运营升级核心:
- **商品推荐**: 基于消费历史的 SKU 推荐
- **会员画像**: 消费力 / 品类偏好 / 活跃时段
- **个性化营销**: 优惠券精准投放
- **流失预警**: 会员流失风险评分
- **智能客服**: AI 自动回答

依赖 Phase-36 会员画像 + Phase-39 报表数据。

---

## 2. 数据模型 (待详细化)

### UserPreference (用户偏好)
```typescript
interface UserPreference {
  id: string
  userId: string
  categoryWeights: Record<string, number>  // { 台球: 0.8, 餐饮: 0.3 }
  priceRange: { min: number; max: number }
  activeHours: number[]                     // [18, 19, 20, 21, 22]
  brandAffinities: Record<string, number>   // 品牌偏好
  updatedAt: string
}
```

### RecommendationRule (推荐规则)
```typescript
interface RecommendationRule {
  id: string
  tenantId: string
  name: string
  type: 'FREQUENTLY_BOUGHT' | 'COLLABORATIVE' | 'TRENDING' | 'PERSONAL'
  config: {
    lookbackDays: number
    minOrders: number
    topK: number
  }
  enabled: boolean
  priority: number                          // 多个规则时优先级
}
```

### Recommendation (推荐结果)
```typescript
interface Recommendation {
  id: string
  userId: string
  productId: string
  score: number                             // 0-1
  reason: string                            // "基于您最近购买的 X"
  ruleId: string
  expiresAt: string
  clickedAt?: string
  convertedAt?: string                      // 是否下单
}
```

---

## 3. 任务卡 (T170 · 待拆)

| T-NN | 标题 | 估时 | 依赖 |
|------|------|------|------|
| T170-1 | 用户偏好采集 + 画像构建 | 0.5d | - |
| T170-2 | 4 类推荐规则引擎 | 1d | T170-1 |
| T170-3 | 推荐 API + A/B 测试 | 0.5d | T170-2 |

**总计**: 2 天

---

## 4. Champion 督导

- **E42 李事业部总经理** (Phase-35~40)
- **E19 王运营总监** (推荐 KPI)
- **E44 周技术总监** (AI 模型选型)

---

## 5. 关键决策待定 (Open Questions)

1. **推荐算法**: 协同过滤 / 内容推荐 / 深度学习?
2. **冷启动**: 新会员/新商品推荐策略?
3. **A/B 测试**: 比例 + 评估指标?
4. **隐私合规**: 是否需要用户授权?
5. **模型部署**: 本地 vs 云 API?

**待大飞哥决策**: 🟡 P1 优先级

---

## 6. 上下游依赖

### 上游 (✅ 已就位)
- Phase-35 收银台 (订单 + 消费记录)
- Phase-36 会员 (画像 + 等级)
- Phase-37 库存 (商品库)
- Phase-38 财务 (消费力)
- Phase-39 报表 (KPI)

### 下游 (✅ P1 完成)
- P2 智能化 (Phase-41~44) 上游
- 老板 E41 王董事长 (集团精准营销)

---

## 7. 反模式预引用

- [concurrency-safety.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/concurrency-safety.md): 并发推荐请求
- [naming-consistency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/naming-consistency.md): 派发前盘点

---

> 🦞 **"Phase-40 推荐 = 智能运营 = P1 业务深耕收官"**

待 Phase-39 完成后启动 T170,P1 业务深耕 100% 收官 (6/6 phase)。