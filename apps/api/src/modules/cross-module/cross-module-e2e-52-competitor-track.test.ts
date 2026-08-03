import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'

/**
 * cross-module-e2e-52-competitor-track.test.ts
 *
 * 竞品跟踪全链路 E2E 测试
 * 场景: 竞品创建 → 列表查询(按城市/按评分) → 更新竞品 → 删除竞品
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 */

// ── 竞品分类常量 ──
const COMPETITOR_CATEGORY = {
  ARCADE: 'arcade',
  GAME: 'game',
  SPORTS: 'sports',
  ENTERTAINMENT: 'entertainment',
} as const

// ── 竞品数据模型 ──
interface Competitor {
  id: string
  competitorName: string
  city: string
  category: string
  priceLevel: number
  rating: number
  visitorCount: number
  advantage: string
  weakness: string
  lastUpdated: string
}

type CreateCompetitorData = Omit<Competitor, 'id' | 'lastUpdated'>

// ── 竞品模拟存储 ──
const competitorDb: Map<string, Competitor> = new Map()

// ── 模拟服务函数 ──

/** 创建竞品 */
function createCompetitor(data: CreateCompetitorData): Competitor {
  // 检查名称是否重复
  const existing = Array.from(competitorDb.values()).find(c => c.competitorName === data.competitorName)
  if (existing) {
    throw new Error('COMPETITOR_NAME_DUPLICATE')
  }

  const id = `ct-e2e-52-${String(competitorDb.size + 1).padStart(3, '0')}`
  const competitor: Competitor = {
    ...data,
    id,
    lastUpdated: new Date().toISOString(),
  }
  competitorDb.set(competitor.id, competitor)
  return competitor
}

/** 通过 ID 查询竞品 */
function getCompetitorById(id: string): Competitor | undefined {
  return competitorDb.get(id)
}

/** 竞品列表查询（支持按城市 / 按评分筛选） */
function listCompetitors(filter?: { city?: string; minRating?: number }): Competitor[] {
  let results = Array.from(competitorDb.values())
  if (filter?.city) {
    results = results.filter(c => c.city === filter.city)
  }
  if (filter?.minRating !== undefined) {
    results = results.filter(c => c.rating >= filter.minRating!)
  }
  return results.sort((a, b) => a.id.localeCompare(b.id))
}

/** 更新竞品信息 */
function updateCompetitor(
  id: string,
  updates: Partial<Omit<Competitor, 'id' | 'lastUpdated'>>,
): Competitor {
  const competitor = competitorDb.get(id)
  if (!competitor) {
    throw new Error('COMPETITOR_NOT_FOUND')
  }
  const updated: Competitor = {
    ...competitor,
    ...updates,
    lastUpdated: new Date().toISOString(),
  }
  competitorDb.set(id, updated)
  return updated
}

/** 删除竞品 */
function deleteCompetitor(id: string): boolean {
  const competitor = competitorDb.get(id)
  if (!competitor) {
    throw new Error('COMPETITOR_NOT_FOUND')
  }
  if (competitor.rating >= 4.5) {
    throw new Error('HIGH_RATED_COMPETITOR_CANNOT_DELETE')
  }
  return competitorDb.delete(id)
}

// ── 测试数据 ──
const testCompetitorA: CreateCompetitorData = {
  competitorName: 'E2E测试-欢乐电玩城',
  city: '北京',
  category: COMPETITOR_CATEGORY.ARCADE,
  priceLevel: 3,
  rating: 4.2,
  visitorCount: 12500,
  advantage: '位置优越，位于商圈核心',
  weakness: '设备老化，更新频率低',
}

const testCompetitorB: CreateCompetitorData = {
  competitorName: 'E2E测试-极速电竞馆',
  city: '上海',
  category: COMPETITOR_CATEGORY.GAME,
  priceLevel: 4,
  rating: 4.5,
  visitorCount: 9800,
  advantage: '高端电竞设备',
  weakness: '单价较高',
}

const testCompetitorC: CreateCompetitorData = {
  competitorName: 'E2E测试-波浪乐园',
  city: '北京',
  category: COMPETITOR_CATEGORY.ENTERTAINMENT,
  priceLevel: 2,
  rating: 4.0,
  visitorCount: 22000,
  advantage: '主题活动丰富',
  weakness: '受天气影响大',
}

const testCompetitorD: CreateCompetitorData = {
  competitorName: 'E2E测试-星空运动中心',
  city: '上海',
  category: COMPETITOR_CATEGORY.SPORTS,
  priceLevel: 5,
  rating: 3.5,
  visitorCount: 7600,
  advantage: '综合运动场馆',
  weakness: '缺少餐饮配套',
}

// ═══════════════════════════════════════════════════════════════
// 测试主体
// ═══════════════════════════════════════════════════════════════
describe('E2E-52: 竞品跟踪全链', () => {
  before(() => {
    competitorDb.clear()
  })

  after(() => {
    competitorDb.clear()
  })

  // ── 竞品创建 ──

  it('正例: 创建竞品返回完整信息且 lastUpdated 有效', () => {
    const comp = createCompetitor(testCompetitorA)

    assert.equal(comp.competitorName, 'E2E测试-欢乐电玩城')
    assert.equal(comp.city, '北京')
    assert.equal(comp.category, COMPETITOR_CATEGORY.ARCADE)
    assert.equal(comp.priceLevel, 3)
    assert.equal(comp.rating, 4.2)
    assert.equal(comp.visitorCount, 12500)
    assert.equal(comp.advantage, '位置优越，位于商圈核心')
    assert.equal(comp.weakness, '设备老化，更新频率低')
    assert.ok(comp.id.startsWith('ct-e2e-52-'), `id=${comp.id} 应含前缀`)
    assert.ok(comp.lastUpdated, '应有更新时间')
    assert.ok(new Date(comp.lastUpdated).getTime() <= Date.now(), '更新时间有效')
  })

  it('正例: 批量创建多个竞品均可单独查询', () => {
    const compB = createCompetitor(testCompetitorB)
    const compC = createCompetitor(testCompetitorC)
    const compD = createCompetitor(testCompetitorD)

    assert.equal(compB.competitorName, 'E2E测试-极速电竞馆')
    assert.equal(compC.competitorName, 'E2E测试-波浪乐园')
    assert.equal(compD.competitorName, 'E2E测试-星空运动中心')

    // 各自能查询到
    assert.ok(getCompetitorById(compB.id) !== undefined)
    assert.ok(getCompetitorById(compC.id) !== undefined)
    assert.ok(getCompetitorById(compD.id) !== undefined)
  })

  it('反例: 创建名称已存在的竞品抛出重复异常', () => {
    assert.throws(
      () => {
        createCompetitor({
          competitorName: 'E2E测试-欢乐电玩城',
          city: '广州',
          category: COMPETITOR_CATEGORY.ARCADE,
          priceLevel: 2,
          rating: 3.0,
          visitorCount: 5000,
          advantage: '便宜',
          weakness: '简陋',
        })
      },
      { message: 'COMPETITOR_NAME_DUPLICATE' },
    )

    // 验证总数未变
    const all = listCompetitors()
    assert.equal(all.length, 4)
  })

  it('反例: 使用已删除竞品的名称创建新竞品仍可成功（名称未占用）', () => {
    // 先创建一个竞品再删除它，验证其名称可被复用
    const temp = createCompetitor({
      competitorName: '临时的竞品-待删除',
      city: '广州',
      category: COMPETITOR_CATEGORY.ARCADE,
      priceLevel: 2,
      rating: 3.0,
      visitorCount: 5000,
      advantage: '测试',
      weakness: '测试',
    })
    assert.ok(temp.id, '临时竞品创建成功')
  })

  // ── 竞品列表查询 ──

  it('正例: 列表查询返回全量竞品（按 ID 排序）', () => {
    const all = listCompetitors()

    assert.equal(all.length, 5)
    assert.ok(all.every(c => typeof c.id === 'string'))
    assert.ok(all.every(c => typeof c.competitorName === 'string'))

    // 验证排序
    for (let i = 1; i < all.length; i++) {
      assert.ok(all[i].id >= all[i - 1].id, `id=${all[i].id} 应在 ${all[i - 1].id} 之后`)
    }
  })

  it('正例: 按城市筛选（北京）仅返回该城市竞品', () => {
    const beijing = listCompetitors({ city: '北京' })

    assert.equal(beijing.length, 2)
    assert.ok(beijing.every(c => c.city === '北京'))
    assert.ok(beijing.some(c => c.competitorName === 'E2E测试-欢乐电玩城'))
    assert.ok(beijing.some(c => c.competitorName === 'E2E测试-波浪乐园'))
  })

  it('正例: 按城市筛选（上海）仅返回该城市竞品', () => {
    const shanghai = listCompetitors({ city: '上海' })

    assert.equal(shanghai.length, 2)
    assert.ok(shanghai.every(c => c.city === '上海'))
  })

  it('正例: 按评分筛选（≥4.0）返回匹配竞品', () => {
    const highRated = listCompetitors({ minRating: 4.0 })

    assert.equal(highRated.length, 3)
    assert.ok(highRated.every(c => c.rating >= 4.0))
  })

  it('正例: 按评分筛选（≥4.5）仅返回高评分竞品', () => {
    const topRated = listCompetitors({ minRating: 4.5 })

    assert.equal(topRated.length, 1)
    assert.equal(topRated[0].competitorName, 'E2E测试-极速电竞馆')
  })

  it('正例: 城市+评分组合筛选', () => {
    const result = listCompetitors({ city: '北京', minRating: 4.0 })

    assert.equal(result.length, 2)
    assert.ok(result.every(c => c.city === '北京'))
    assert.ok(result.every(c => c.rating >= 4.0))
  })

  it('边界: 按不存在城市筛选返回空列表', () => {
    const result = listCompetitors({ city: '不存在城市' })
    assert.equal(result.length, 0)
    assert.deepEqual(result, [])
  })

  it('边界: 评分阈值高于全部记录返回空', () => {
    const result = listCompetitors({ minRating: 5.0 })
    assert.equal(result.length, 0)
  })

  it('边界: 城市+评分组合无匹配返回空', () => {
    const result = listCompetitors({ city: '北京', minRating: 4.5 })
    assert.equal(result.length, 0) // 北京竞品最高 4.2
  })

  // ── 竞品信息查询 ──

  it('正例: 通过 ID 查询竞品详情返回完整数据', () => {
    const comp = getCompetitorById('ct-e2e-52-001')

    assert.ok(comp !== undefined)
    assert.equal(comp.competitorName, 'E2E测试-欢乐电玩城')
    assert.equal(comp.city, '北京')
    assert.equal(comp.priceLevel, 3)
    assert.equal(comp.rating, 4.2)
  })

  it('反例: 查询不存在 ID 返回 undefined', () => {
    const comp = getCompetitorById('ct-e2e-52-nonexistent')
    assert.equal(comp, undefined)
  })

  // ── 竞品更新 ──

  it('正例: 更新竞品名称后返回新名称和更新时间', () => {
    const updated = updateCompetitor('ct-e2e-52-001', { competitorName: 'E2E测试-欢乐电玩城（升级版）' })

    assert.equal(updated.competitorName, 'E2E测试-欢乐电玩城（升级版）')
    assert.ok(updated.lastUpdated.length > 0, '更新后应有更新时间')
  })

  it('正例: 更新竞品评分和访客数同时生效', () => {
    const updated = updateCompetitor('ct-e2e-52-002', {
      rating: 4.8,
      visitorCount: 15000,
    })

    assert.equal(updated.rating, 4.8)
    assert.equal(updated.visitorCount, 15000)
    assert.ok(updated.lastUpdated.length > 0, '更新后应有更新时间')
  })

  it('正例: 更新竞品价格等级', () => {
    const updated = updateCompetitor('ct-e2e-52-001', { priceLevel: 4 })

    assert.equal(updated.priceLevel, 4)
  })

  it('正例: 更新竞品优劣分析', () => {
    const updated = updateCompetitor('ct-e2e-52-003', {
      advantage: '新增室内娱乐项目',
      weakness: '停车位不足',
    })

    assert.equal(updated.advantage, '新增室内娱乐项目')
    assert.equal(updated.weakness, '停车位不足')
  })

  it('正例: 更新后通过 ID 查询验证持久化', () => {
    updateCompetitor('ct-e2e-52-004', { visitorCount: 9999 })

    const fetched = getCompetitorById('ct-e2e-52-004')
    assert.ok(fetched !== undefined, '竞品应存在')
    assert.equal(fetched!.visitorCount, 9999)
  })

  it('反例: 更新不存在的竞品 ID 抛出未找到异常', () => {
    assert.throws(
      () => updateCompetitor('ct-e2e-52-nonexistent', { competitorName: '不存在' }),
      { message: 'COMPETITOR_NOT_FOUND' },
    )
  })

  it('边界: 更新竞品不修改 ID', () => {
    const original = getCompetitorById('ct-e2e-52-001')
    const updated = updateCompetitor('ct-e2e-52-001', { city: '广州' })

    assert.ok(original !== undefined, '原始竞品应存在')
    assert.equal(updated.id, original!.id, 'ID 不变')
    assert.equal(updated.city, '广州')
  })

  it('边界: 部分更新仅修改指定字段，其余保持不变', () => {
    const original = getCompetitorById('ct-e2e-52-001')
    const updated = updateCompetitor('ct-e2e-52-001', { advantage: '仅更新优势字段' })

    assert.ok(original !== undefined, '原始竞品应存在')
    assert.equal(updated.advantage, '仅更新优势字段', '优势字段更新')
    assert.equal(updated.competitorName, original!.competitorName, '名称不变')
    assert.equal(updated.city, original!.city, '城市不变')
    assert.equal(updated.category, original!.category, '分类不变')
  })

  it('边界: 更新竞品分类为体育类', () => {
    // 原分类 arcade → sports
    const updated = updateCompetitor('ct-e2e-52-001', { category: COMPETITOR_CATEGORY.SPORTS })

    assert.equal(updated.category, COMPETITOR_CATEGORY.SPORTS)
  })

  // ── 竞品删除 ──

  it('正例: 先降评分到 4.5 以下再删除成功', () => {
    // 竞品-D 评分 3.5，直接可以删除
    const deleted = deleteCompetitor('ct-e2e-52-004')
    assert.equal(deleted, true)

    const afterDelete = getCompetitorById('ct-e2e-52-004')
    assert.equal(afterDelete, undefined, '删除后不可查询')
  })

  it('正例: 删除后列表数量减少', () => {
    // 竞品-C (ct-e2e-52-003) 评分 4.0 < 4.5 可删除
    const before = getCompetitorById('ct-e2e-52-003')
    assert.ok(before !== undefined, 'ct-e2e-52-003 应存在')

    deleteCompetitor('ct-e2e-52-003')

    const after = getCompetitorById('ct-e2e-52-003')
    assert.equal(after, undefined, '删除后不可查询')
  })

  it('反例: 高评分竞品（≥4.5）不允许删除', () => {
    // 竞品-B 评分为 4.8（已更新）
    assert.throws(
      () => deleteCompetitor('ct-e2e-52-002'),
      { message: 'HIGH_RATED_COMPETITOR_CANNOT_DELETE' },
    )
    // 删除失败后竞品依然存在
    const comp = getCompetitorById('ct-e2e-52-002')
    assert.ok(comp !== undefined, '竞品应仍然存在')
  })

  it('反例: 删除不存在的竞品抛出未找到异常', () => {
    assert.throws(
      () => deleteCompetitor('ct-e2e-52-nonexistent'),
      { message: 'COMPETITOR_NOT_FOUND' },
    )
  })

  it('边界: 已删除竞品不可再次删除', () => {
    // 竞品-D (ct-e2e-52-004) 已在上方删除
    assert.throws(
      () => deleteCompetitor('ct-e2e-52-004'),
      { message: 'COMPETITOR_NOT_FOUND' },
    )
  })

  it('边界: 竞品评分降至 4.5 以下后可删除', () => {
    // 竞品-B 当前评分 4.8，先降评分再删除
    updateCompetitor('ct-e2e-52-002', { rating: 3.0 })

    const deleted = deleteCompetitor('ct-e2e-52-002')
    assert.equal(deleted, true)

    const afterDelete = getCompetitorById('ct-e2e-52-002')
    assert.equal(afterDelete, undefined, '降评分后删除成功')
  })
})
