import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { ItemCFStrategy } from './item-cf.strategy'
import { UserCFStrategy } from './user-cf.strategy'
import { PopularStrategy } from './popular.strategy'
import { RecentlyViewedStrategy } from './recently-viewed.strategy'
import { PersonalizedStrategy } from './personalized.strategy'
import { ProductAdapter } from '../datasources/product.adapter'
import { PurchaseHistoryAdapter } from '../datasources/purchase-history.adapter'
import { MemberPreferenceAdapter } from '../datasources/member-preference.adapter'
import type { ProductSnapshot, PurchaseHistory, ViewHistory, MemberPreference } from '../recommend.entity'

describe('5 个推荐策略测试', () => {
  let product: ProductAdapter
  let purchase: PurchaseHistoryAdapter
  let pref: MemberPreferenceAdapter

  beforeEach(() => {
    product = new ProductAdapter()
    purchase = new PurchaseHistoryAdapter()
    pref = new MemberPreferenceAdapter()
  })

  // ============================================================
  // ItemCFStrategy
  // ============================================================
  describe('ItemCF: 物品协同过滤', () => {
    const strategy = new ItemCFStrategy()

    const products: ProductSnapshot[] = [
      { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'cat1', priceCents: 1000, available: true },
      { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'cat1', priceCents: 1100, available: true },
      { id: 'C', tenantId: 'T', sku: 'C', name: 'C', category: 'cat2', priceCents: 2000, available: true }
    ]

    it('无 contextItem 商品返回空', () => {
      product.seed(products)
      const out = strategy.recommend('T', 'A', product, purchase, 5)
      // A 没有购买者,无协同过滤信号
      assert.equal(out.length, 0)
    })

    it('余弦相似度计算', () => {
      product.seed(products)
      // m1 买过 A 和 B (强共现)
      purchase.seedPurchases([
        { memberId: 'm1', tenantId: 'T', itemId: 'A', category: 'cat1', purchasedAt: '2024-06-01', quantity: 1, amountCents: 1000 },
        { memberId: 'm1', tenantId: 'T', itemId: 'B', category: 'cat1', purchasedAt: '2024-06-02', quantity: 1, amountCents: 1100 },
        // m2 也买过 A 和 B
        { memberId: 'm2', tenantId: 'T', itemId: 'A', category: 'cat1', purchasedAt: '2024-06-01', quantity: 1, amountCents: 1000 },
        { memberId: 'm2', tenantId: 'T', itemId: 'B', category: 'cat1', purchasedAt: '2024-06-02', quantity: 1, amountCents: 1100 }
      ])
      const out = strategy.recommend('T', 'A', product, purchase, 5)
      assert.equal(out.length, 1)
      assert.equal(out[0].itemId, 'B')
      assert.ok(out[0].score > 0)
      assert.match(out[0].reasoning, /A/)
    })

    it('不同租户不串号', () => {
      product.seed(products)
      purchase.seedPurchases([
        { memberId: 'm1', tenantId: 'T2', itemId: 'A', category: 'cat1', purchasedAt: '2024-06-01', quantity: 1, amountCents: 1000 },
        { memberId: 'm1', tenantId: 'T2', itemId: 'B', category: 'cat1', purchasedAt: '2024-06-02', quantity: 1, amountCents: 1100 }
      ])
      const out = strategy.recommend('T1', 'A', product, purchase, 5)
      assert.equal(out.length, 0)  // T1 没有 A 的购买者
    })
  })

  // ============================================================
  // UserCFStrategy
  // ============================================================
  describe('UserCF: 用户协同过滤', () => {
    const strategy = new UserCFStrategy()

    it('新会员无历史返回空', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 100, available: true }
      ])
      purchase.seedPurchases([
        { memberId: 'm2', tenantId: 'T', itemId: 'A', category: 'c', purchasedAt: '2024-01-01', quantity: 1, amountCents: 100 }
      ])
      const out = strategy.recommend('T', 'm-new', product, purchase, 5)
      assert.equal(out.length, 0)
    })

    it('相似会员买过推荐', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 100, available: true },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c', priceCents: 200, available: true },
        { id: 'C', tenantId: 'T', sku: 'C', name: 'C', category: 'c', priceCents: 300, available: true }
      ])
      purchase.seedPurchases([
        // m1 买过 A, B
        { memberId: 'm1', tenantId: 'T', itemId: 'A', category: 'c', purchasedAt: '2024-01-01', quantity: 1, amountCents: 100 },
        { memberId: 'm1', tenantId: 'T', itemId: 'B', category: 'c', purchasedAt: '2024-01-02', quantity: 1, amountCents: 200 },
        // m2 买过 A, C (与 m1 共享 A,推荐 C)
        { memberId: 'm2', tenantId: 'T', itemId: 'A', category: 'c', purchasedAt: '2024-01-01', quantity: 1, amountCents: 100 },
        { memberId: 'm2', tenantId: 'T', itemId: 'C', category: 'c', purchasedAt: '2024-01-02', quantity: 1, amountCents: 300 }
      ])
      const out = strategy.recommend('T', 'm1', product, purchase, 5)
      assert.equal(out.length, 1)
      assert.equal(out[0].itemId, 'C')
      assert.match(out[0].reasoning, /相似会员/)
    })

    it('排除已购商品', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 100, available: true },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c', priceCents: 200, available: true }
      ])
      purchase.seedPurchases([
        { memberId: 'm1', tenantId: 'T', itemId: 'A', category: 'c', purchasedAt: '2024-01-01', quantity: 1, amountCents: 100 },
        { memberId: 'm1', tenantId: 'T', itemId: 'B', category: 'c', purchasedAt: '2024-01-02', quantity: 1, amountCents: 200 },
        { memberId: 'm2', tenantId: 'T', itemId: 'A', category: 'c', purchasedAt: '2024-01-01', quantity: 1, amountCents: 100 },
        { memberId: 'm2', tenantId: 'T', itemId: 'B', category: 'c', purchasedAt: '2024-01-02', quantity: 1, amountCents: 200 }
      ])
      const out = strategy.recommend('T', 'm1', product, purchase, 5)
      // m1 已购 A, B, 不应再推荐
      assert.equal(out.length, 0)
    })
  })

  // ============================================================
  // PopularStrategy
  // ============================================================
  describe('Popular: 热门排行', () => {
    const strategy = new PopularStrategy()

    it('按销量降序', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c1', priceCents: 100, available: true },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c1', priceCents: 200, available: true },
        { id: 'C', tenantId: 'T', sku: 'C', name: 'C', category: 'c2', priceCents: 300, available: true }
      ])
      product.incrementSold('A', 100)
      product.incrementSold('B', 50)
      product.incrementSold('C', 30)
      const out = strategy.recommend('T', product, purchase, 5)
      assert.equal(out[0].itemId, 'A')
      assert.equal(out[1].itemId, 'B')
    })

    it('排除 itemIds', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 100, available: true },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c', priceCents: 200, available: true }
      ])
      product.incrementSold('A', 10)
      product.incrementSold('B', 5)
      const out = strategy.recommend('T', product, purchase, 5, new Set(['A']))
      assert.equal(out.length, 1)
      assert.equal(out[0].itemId, 'B')
    })

    it('多样性: 同类目不超过 ceil(limit/3)', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c1', priceCents: 100, available: true },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c1', priceCents: 200, available: true },
        { id: 'C', tenantId: 'T', sku: 'C', name: 'C', category: 'c1', priceCents: 300, available: true },
        { id: 'D', tenantId: 'T', sku: 'D', name: 'D', category: 'c2', priceCents: 400, available: true }
      ])
      product.incrementSold('A', 100)
      product.incrementSold('B', 90)
      product.incrementSold('C', 80)
      product.incrementSold('D', 70)
      const out = strategy.recommend('T', product, purchase, 3)
      // limit=3, maxPerCategory=ceil(3/3)=1 → c1 只能有 1 个
      const cat1Count = out.filter(c => {
        const p = product.query('T').find(x => x.id === c.itemId)
        return p?.category === 'c1'
      }).length
      assert.ok(cat1Count <= 1)
    })

    it('空租户返回空', () => {
      const out = strategy.recommend('T-empty', product, purchase, 5)
      assert.equal(out.length, 0)
    })
  })

  // ============================================================
  // RecentlyViewedStrategy
  // ============================================================
  describe('RecentlyViewed: 最近浏览', () => {
    const strategy = new RecentlyViewedStrategy()

    it('按时间倒序', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 100, available: true },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c', priceCents: 200, available: true }
      ])
      const views: ViewHistory[] = [
        { memberId: 'm1', tenantId: 'T', itemId: 'A', viewedAt: '2024-01-01' },
        { memberId: 'm1', tenantId: 'T', itemId: 'B', viewedAt: '2024-06-01' }
      ]
      purchase.seedViews(views)
      const out = strategy.recommend('T', 'm1', product, purchase, 5)
      assert.equal(out[0].itemId, 'B')  // 最近
    })

    it('排除已购', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 100, available: true }
      ])
      purchase.seedViews([
        { memberId: 'm1', tenantId: 'T', itemId: 'A', viewedAt: '2024-01-01' }
      ])
      const out = strategy.recommend('T', 'm1', product, purchase, 5, new Set(['A']))
      assert.equal(out.length, 0)
    })

    it('排除当前 item', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 100, available: true }
      ])
      purchase.seedViews([
        { memberId: 'm1', tenantId: 'T', itemId: 'A', viewedAt: '2024-01-01' }
      ])
      const out = strategy.recommend('T', 'm1', product, purchase, 5, new Set(), 'A')
      assert.equal(out.length, 0)
    })

    it('无浏览返回空', () => {
      const out = strategy.recommend('T', 'm-no-view', product, purchase, 5)
      assert.equal(out.length, 0)
    })
  })

  // ============================================================
  // PersonalizedStrategy
  // ============================================================
  describe('Personalized: 个性化', () => {
    const strategy = new PersonalizedStrategy()

    it('类目偏好匹配', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'tech', priceCents: 1000, available: true, tags: [] },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'food', priceCents: 2000, available: true, tags: [] }
      ])
      pref.seed([
        { memberId: 'm1', tenantId: 'T', favoriteCategories: ['tech'], favoriteTags: [], lifecycleStage: 'ACTIVE', totalSpendCents: 5000, orderCount: 3 }
      ])
      const out = strategy.recommend('T', 'm1', product, pref, 5)
      assert.equal(out[0].itemId, 'A')
      assert.match(out[0].reasoning, /tech/)
    })

    it('tag 偏好匹配', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 1000, available: true, tags: ['premium', 'new'] },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c', priceCents: 2000, available: true, tags: ['old'] }
      ])
      pref.seed([
        { memberId: 'm1', tenantId: 'T', favoriteCategories: [], favoriteTags: ['premium'], lifecycleStage: 'ACTIVE', totalSpendCents: 5000, orderCount: 3 }
      ])
      const out = strategy.recommend('T', 'm1', product, pref, 5)
      assert.equal(out[0].itemId, 'A')
    })

    it('排除不可用商品', () => {
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'tech', priceCents: 1000, available: false }
      ])
      pref.seed([
        { memberId: 'm1', tenantId: 'T', favoriteCategories: ['tech'], favoriteTags: [], lifecycleStage: 'ACTIVE', totalSpendCents: 5000, orderCount: 3 }
      ])
      const out = strategy.recommend('T', 'm1', product, pref, 5)
      assert.equal(out.length, 0)
    })

    it('无会员偏好返回空', () => {
      const out = strategy.recommend('T', 'm-unknown', product, pref, 5)
      assert.equal(out.length, 0)
    })

    it('价格匹配消费能力', () => {
      // avg order = 1000/2 = 500 cents
      // A: price=300, ratio=300/500=0.6 (在 0.5-2.0 范围内) → score +0.2
      // B: price=50000, ratio=100, 超范围 → score 0
      product.seed([
        { id: 'A', tenantId: 'T', sku: 'A', name: 'A', category: 'c', priceCents: 300, available: true, tags: [] },
        { id: 'B', tenantId: 'T', sku: 'B', name: 'B', category: 'c', priceCents: 50000, available: true, tags: [] }
      ])
      pref.seed([
        { memberId: 'm1', tenantId: 'T', favoriteCategories: [], favoriteTags: [], lifecycleStage: 'ACTIVE', totalSpendCents: 1000, orderCount: 2 }
      ])
      const out = strategy.recommend('T', 'm1', product, pref, 5)
      assert.ok(out.length >= 1)
      assert.equal(out[0].itemId, 'A')
    })
  })
})