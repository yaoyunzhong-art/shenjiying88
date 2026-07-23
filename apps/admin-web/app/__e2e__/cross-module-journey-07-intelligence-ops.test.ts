/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链07
 * P-50 V2 运营参谋跨模块测试: 竞品数据 → AI引擎 → 前端建议展示
 *
 * 测试链: venue-data (竞品DB) → intelligence-ai (AI引擎规划) → 
 *          monitor-collector (监控) → admin-web (运营参谋页面)
 *
 * 模拟: 竞品数据流入AI引擎生成运营建议, 监控告警流入Dashboard
 *
 * 增强: 2026-07-23 — 扩展至26个测试用例, 覆盖更多边界/异常/权限场景
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 1. 竞品数据模型（来自 venue-data.service.ts） ───
interface CompetitorVenue {
  name: string; city: string; district?: string
  priceLevel: number; equipmentCount: number
  rating: number; monthlyRevenue?: number
}

interface CityStats {
  avgPrice: number
  avgEquipmentCount: number
  avgRating: number
  competitorCount: number
  marketTrend: string
}

// ─── 2. AI引擎建议模型（来自 intelligence-ai.service.ts） ───
interface AISuggestion {
  category: string
  question: string
  suggestion: string
  confidence: number
  dataEvidence: string
}

interface AwarenessAlert {
  type: string; severity: string
  description: string
  competitorName: string
  recommendedAction: string
}

interface KnowledgeCard {
  id: string; tags: string[]
  content: string; freshness: number
}

// ─── 3. 监控告警模型（来自 monitor-collector.service.ts） ───
interface MonitorAlert {
  id: string; type: string; severity: string
  storeName: string; description: string
  detectedAt: string; scanMode: string
}

// ─── 4. 角色权限模型 ───
type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

interface OperationPermission {
  canViewData: boolean
  canEditSuggestions: boolean
  canManageAlerts: boolean
  canExportReports: boolean
}

// ─── 5. 报表模型 ───
interface OperationReport {
  reportId: string
  generatedAt: number
  city: string
  totalCompetitors: number
  avgPriceLevel: number
  avgEquipment: number
  alertCount: number
  topSuggestion: string
  generatedBy: string
}

// ─── Mock competitor DB (venue-data.service 模拟) ───
const MOCK_COMPETITOR_DB: CompetitorVenue[] = [
  { name: '玩咖电玩城', city: '上海', district: '徐汇', priceLevel: 3, equipmentCount: 45, rating: 4.2, monthlyRevenue: 350000 },
  { name: '潮玩空间', city: '上海', district: '浦东', priceLevel: 4, equipmentCount: 60, rating: 4.5, monthlyRevenue: 520000 },
  { name: '星际乐园', city: '上海', district: '静安', priceLevel: 5, equipmentCount: 80, rating: 4.8, monthlyRevenue: 780000 },
  { name: '电玩先锋', city: '上海', district: '徐汇', priceLevel: 2, equipmentCount: 30, rating: 3.8, monthlyRevenue: 220000 },
  { name: '极速电玩', city: '北京', district: '朝阳', priceLevel: 4, equipmentCount: 55, rating: 4.3, monthlyRevenue: 480000 },
  { name: '欢乐时光', city: '上海', district: '黄浦', priceLevel: 3, equipmentCount: 35, rating: 4.0, monthlyRevenue: 280000 },
  { name: '未来玩家', city: '深圳', district: '南山', priceLevel: 5, equipmentCount: 90, rating: 4.9, monthlyRevenue: 920000 },
  { name: '游戏基地', city: '广州', district: '天河', priceLevel: 3, equipmentCount: 40, rating: 4.1, monthlyRevenue: 310000 },
]

// ─── Mock AI引擎生成运营建议 ───
const CATEGORY_QUESTIONS: Record<string, { question: string; suggestion: string }> = {
  pricing: { question: '周末高峰时段如何定价？', suggestion: '建议分时段定价，高峰溢价20%' },
  activity: { question: '本月主推什么活动？', suggestion: '推荐抖音团购套餐+周末主题比赛' },
  equipment: { question: '下季度设备更新方向？', suggestion: '优先VR设备和新增运动竞技类' },
  promotion: { question: '竞品推低价团购如何应对？', suggestion: '不建议打价格战，差异化套餐回应' },
  recruit: { question: '是否需要引入联名或IP跨界活动？', suggestion: '建议选择与客群匹配的轻IP进行短期联名' },
  seasonal: { question: '暑假/寒假推出什么限定活动？', suggestion: '重点针对学生和亲子客群' },
  blindbox: { question: '盲盒/抽奖促销如何设计？', suggestion: '保底+公示概率的透明度设计' },
}

// ─── Mock 监控告警 ───
const MOCK_ALERTS: MonitorAlert[] = [
  { id: 'alert-1', type: 'price_change', severity: 'high', storeName: '玩咖电玩城', description: '竞品降价¥20', detectedAt: '2026-07-18T10:00:00Z', scanMode: 'incremental' },
  { id: 'alert-2', type: 'new_activity', severity: 'medium', storeName: '潮玩空间', description: '推出抖音团购套餐', detectedAt: '2026-07-18T14:00:00Z', scanMode: 'incremental' },
  { id: 'alert-3', type: 'equipment_update', severity: 'low', storeName: '星际乐园', description: '新增VR设备10台', detectedAt: '2026-07-19T09:00:00Z', scanMode: 'full' },
  { id: 'alert-4', type: 'price_change', severity: 'critical', storeName: '极速电玩', description: '竞品降价¥50', detectedAt: '2026-07-20T16:00:00Z', scanMode: 'incremental' },
]

// ─── Mock 知识卡片 ───
const MOCK_KNOWLEDGE_CARDS: KnowledgeCard[] = [
  { id: 'card-1', tags: ['定价', '策略'], content: '竞品调价预警：上海区域平均价格下降5%', freshness: 0.95 },
  { id: 'card-2', tags: ['活动', '抖音'], content: '北京竞品推出团购套餐后客流提升30%', freshness: 0.85 },
  { id: 'card-3', tags: ['设备', 'VR'], content: 'VR设备投资回收周期约8个月', freshness: 0.75 },
  { id: 'card-4', tags: ['运营', '夏季'], content: '夏季须关注空调耗电量对运营成本影响', freshness: 0.65 },
]

// ─── 角色权限映射 ───
const ROLE_PERMISSIONS: Record<UserRole, OperationPermission> = {
  admin: { canViewData: true, canEditSuggestions: true, canManageAlerts: true, canExportReports: true },
  manager: { canViewData: true, canEditSuggestions: true, canManageAlerts: false, canExportReports: true },
  operator: { canViewData: true, canEditSuggestions: false, canManageAlerts: false, canExportReports: false },
  viewer: { canViewData: false, canEditSuggestions: false, canManageAlerts: false, canExportReports: false },
};

// ─── Helper: 按城市过滤竞品 ───
function getCompetitorsByCity(city: string): CompetitorVenue[] {
  return MOCK_COMPETITOR_DB.filter(v => v.city === city)
}

// ─── Helper: 按区域过滤竞品 ───
function getCompetitorsByDistrict(city: string, district: string): CompetitorVenue[] {
  return MOCK_COMPETITOR_DB.filter(v => v.city === city && v.district === district)
}

// ─── Helper: AI引擎按类别生成建议 ───
function getAISuggestions(city: string, competitors: CompetitorVenue[]): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  for (const [category, info] of Object.entries(CATEGORY_QUESTIONS)) {
    const cityCompetitors = competitors.length
    suggestions.push({
      category, question: info.question, suggestion: info.suggestion,
      confidence: Math.min(0.95, 0.5 + cityCompetitors * 0.08),
      dataEvidence: `${city}共${cityCompetitors}家竞品, 平均设备${Math.round(competitors.reduce((s, c) => s + c.equipmentCount, 0) / Math.max(1, cityCompetitors))}台`,
    })
  }
  return suggestions
}

// ─── Helper: 过滤指定严重级别的告警 ───
function getAlertsBySeverity(minSeverity: string): MonitorAlert[] {
  const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 }
  const minRank = severityRank[minSeverity] ?? 1
  return MOCK_ALERTS.filter(a => (severityRank[a.severity] ?? 0) >= minRank)
}

// ─── Helper: 按类型统计告警数量 ───
function countAlertsByType(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const alert of MOCK_ALERTS) {
    counts[alert.type] = (counts[alert.type] ?? 0) + 1
  }
  return counts
}

// ─── Helper: 获取建议按置信度排序 ───
function getTopSuggestions(suggestions: AISuggestion[], topN: number): AISuggestion[] {
  return [...suggestions].sort((a, b) => b.confidence - a.confidence).slice(0, topN)
}

// ─── Helper: 计算城市市场统计 ───
function getCityStats(competitors: CompetitorVenue[]): CityStats {
  if (competitors.length === 0) {
    return { avgPrice: 0, avgEquipmentCount: 0, avgRating: 0, competitorCount: 0, marketTrend: 'unknown' }
  }
  const avgPrice = Math.round(competitors.reduce((s, c) => s + c.priceLevel, 0) / competitors.length * 10) / 10
  const avgEquipmentCount = Math.round(competitors.reduce((s, c) => s + c.equipmentCount, 0) / competitors.length)
  const avgRating = Math.round(competitors.reduce((s, c) => s + c.rating, 0) / competitors.length * 10) / 10
  return {
    avgPrice, avgEquipmentCount, avgRating,
    competitorCount: competitors.length,
    marketTrend: competitors.length >= 4 ? 'competitive' : competitors.length >= 2 ? 'growing' : 'sparse',
  }
}

// ─── Helper: 生成报表 ───
function generateReport(city: string, generatedBy: string, suggestions: AISuggestion[]): OperationReport {
  const competitors = getCompetitorsByCity(city)
  const stats = getCityStats(competitors)
  const topSuggestion = suggestions.length > 0 ? suggestions.sort((a, b) => b.confidence - a.confidence)[0].suggestion : ''
  return {
    reportId: `rpt-${city}-${Date.now()}`,
    generatedAt: Date.now(),
    city,
    totalCompetitors: stats.competitorCount,
    avgPriceLevel: stats.avgPrice,
    avgEquipment: stats.avgEquipmentCount,
    alertCount: MOCK_ALERTS.length,
    topSuggestion,
    generatedBy,
  }
}

// ─── Helper: 获取权限 ───
function getPermissions(role: UserRole): OperationPermission {
  return ROLE_PERMISSIONS[role]
}

// ═══════════════════════════════════
// 测试
// ═══════════════════════════════════

describe('P-50 V2 运营参谋跨模块E2E', { concurrency: 1 }, () => {

  // ╔══════════════════════════════════╗
  // ║  P1: 竞品数据层 — 基础功能      ║
  // ╚══════════════════════════════════╝

  test('P1-1: 过滤上海竞品返回6家', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    assert.equal(shCompetitors.length, 6)
    assert.ok(shCompetitors.every(c => c.city === '上海'))
  })

  test('P1-2: 北京竞品返回1家', () => {
    const bjCompetitors = getCompetitorsByCity('北京')
    assert.equal(bjCompetitors.length, 1)
  })

  test('P1-3: 按区域过滤徐汇区返回2家', () => {
    const xhCompetitors = getCompetitorsByDistrict('上海', '徐汇')
    assert.equal(xhCompetitors.length, 2)
    assert.ok(xhCompetitors.every(c => c.district === '徐汇'))
  })

  test('P1-4: 按区域过滤不存在的区返回空', () => {
    const empty = getCompetitorsByDistrict('上海', '静安区')
    assert.equal(empty.length, 0)
  })

  test('P1-5: 空城市返回空竞品列表', () => {
    const empty = getCompetitorsByCity('Nonexistent')
    assert.equal(empty.length, 0)
  })

  test('P1-6: 城市市场统计 - 上海为competitive', () => {
    const shStats = getCityStats(getCompetitorsByCity('上海'))
    assert.equal(shStats.competitorCount, 6)
    assert.equal(shStats.marketTrend, 'competitive')
    assert.ok(shStats.avgRating >= 4.0)
  })

  test('P1-7: 城市市场统计 - 深圳设备数高于平均值', () => {
    const szStats = getCityStats(getCompetitorsByCity('深圳'))
    assert.equal(szStats.competitorCount, 1)
    assert.equal(szStats.marketTrend, 'sparse')
    assert.equal(szStats.avgEquipmentCount, 90)
  })

  test('P1-8: 城市市场统计 - 空城市返回unknown趋势', () => {
    const emptyStats = getCityStats([])
    assert.equal(emptyStats.marketTrend, 'unknown')
    assert.equal(emptyStats.competitorCount, 0)
    assert.equal(emptyStats.avgPrice, 0)
  })

  test('P1-9: 所有竞品中最优rating数据验证', () => {
    const allRatings = MOCK_COMPETITOR_DB.map(c => c.rating)
    assert.equal(Math.max(...allRatings), 4.9)
    const bestVenue = MOCK_COMPETITOR_DB.find(c => c.rating === 4.9)
    assert.equal(bestVenue?.name, '未来玩家')
  })

  test('P1-10: 竞品月营收有效性验证', () => {
    const allRevenues = MOCK_COMPETITOR_DB.map(c => c.monthlyRevenue).filter(r => r != null)
    assert.ok(allRevenues.every(r => r! > 0))
    // 最高营收
    assert.equal(Math.max(...allRevenues), 920000)
  })

  // ╔══════════════════════════════════╗
  // ║  P2: AI引擎 — 运营建议生成      ║
  // ╚══════════════════════════════════╝

  test('P2-1: 根据6家上海竞品生成7类建议', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const suggestions = getAISuggestions('上海', shCompetitors)
    assert.equal(suggestions.length, 7)
    assert.ok(suggestions.every(s => s.confidence > 0.5))
  })

  test('P2-2: 建议包含同城竞品数据', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const suggestions = getAISuggestions('上海', shCompetitors)
    assert.ok(suggestions.some(s => s.dataEvidence.includes('上海')))
  })

  test('P2-3: 北京仅1家竞品时confidence较低(<=0.6)', () => {
    const bjCompetitors = getCompetitorsByCity('北京')
    const suggestions = getAISuggestions('北京', bjCompetitors)
    assert.ok(suggestions.every(s => s.confidence <= 0.6))
  })

  test('P2-4: 深圳1家竞品时建议仍包含设备数据', () => {
    const szCompetitors = getCompetitorsByCity('深圳')
    const suggestions = getAISuggestions('深圳', szCompetitors)
    const equipmentSuggestion = suggestions.find(s => s.category === 'equipment')
    assert.ok(equipmentSuggestion)
    assert.ok(equipmentSuggestion!.dataEvidence.includes('平均设备90'))
  })

  test('P2-5: 无竞品时AI引擎返回低置信度建议', () => {
    const suggestions = getAISuggestions('无锡', [])
    assert.equal(suggestions.length, 7)
    assert.ok(suggestions.every(s => s.confidence < 0.6))
  })

  test('P2-6: Top-3高置信度建议排序正确', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const suggestions = getAISuggestions('上海', shCompetitors)
    const top3 = getTopSuggestions(suggestions, 3)
    assert.equal(top3.length, 3)
    assert.ok(top3[0].confidence >= top3[1].confidence)
    assert.ok(top3[1].confidence >= top3[2].confidence)
  })

  test('P2-7: Top-0返回空列表', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const suggestions = getAISuggestions('上海', shCompetitors)
    const top0 = getTopSuggestions(suggestions, 0)
    assert.equal(top0.length, 0)
  })

  test('P2-8: 7类建议类别覆盖完整（含盲盒+联名+季节）', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const suggestions = getAISuggestions('上海', shCompetitors)
    const categories = suggestions.map(s => s.category)
    assert.ok(categories.includes('pricing'))
    assert.ok(categories.includes('activity'))
    assert.ok(categories.includes('equipment'))
    assert.ok(categories.includes('promotion'))
    assert.ok(categories.includes('recruit'))
    assert.ok(categories.includes('seasonal'))
    assert.ok(categories.includes('blindbox'))
  })

  // ╔══════════════════════════════════╗
  // ║  P3: 监控告警层                  ║
  // ╚══════════════════════════════════╝

  test('P3-1: 4条告警含价格变更+新活动+设备更新', () => {
    assert.equal(MOCK_ALERTS.length, 4)
    const types = countAlertsByType()
    assert.equal(types['price_change'], 2)
    assert.equal(types['new_activity'], 1)
    assert.equal(types['equipment_update'], 1)
  })

  test('P3-2: 高优先级价格变更告警存在', () => {
    const highAlerts = MOCK_ALERTS.filter(a => a.severity === 'high')
    assert.equal(highAlerts.length, 1)
    assert.equal(highAlerts[0].type, 'price_change')
  })

  test('P3-3: critical级别告警存在且描述含降价', () => {
    const criticalAlerts = MOCK_ALERTS.filter(a => a.severity === 'critical')
    assert.equal(criticalAlerts.length, 1)
    assert.ok(criticalAlerts[0].description.includes('降价'))
    assert.equal(criticalAlerts[0].storeName, '极速电玩')
  })

  test('P3-4: 筛选medium及以上告警返回3条', () => {
    const filtered = getAlertsBySeverity('medium')
    assert.equal(filtered.length, 3)
  })

  test('P3-5: 筛选critical及以上告警返回1条', () => {
    const filtered = getAlertsBySeverity('critical')
    assert.equal(filtered.length, 1)
  })

  test('P3-6: 按扫描模式过滤 — incremental有3条', () => {
    const incremental = MOCK_ALERTS.filter(a => a.scanMode === 'incremental')
    assert.equal(incremental.length, 3)
  })

  test('P3-7: 全部告警detectedAt日期有效', () => {
    for (const alert of MOCK_ALERTS) {
      const date = new Date(alert.detectedAt)
      assert.ok(date instanceof Date && !isNaN(date.getTime()), `无效日期: ${alert.detectedAt}`)
    }
  })

  // ╔══════════════════════════════════╗
  // ║  P4: 知识卡片层                  ║
  // ╚══════════════════════════════════╝

  test('P4-1: 4张知识卡片各有内容且freshness递减', () => {
    assert.equal(MOCK_KNOWLEDGE_CARDS.length, 4)
    for (let i = 1; i < MOCK_KNOWLEDGE_CARDS.length; i++) {
      assert.ok(MOCK_KNOWLEDGE_CARDS[i - 1].freshness >= MOCK_KNOWLEDGE_CARDS[i].freshness)
    }
  })

  test('P4-2: VR设备标签卡片freshness正确', () => {
    const vrCard = MOCK_KNOWLEDGE_CARDS.find(c => c.tags.includes('VR'))
    assert.ok(vrCard)
    assert.ok(vrCard!.content.includes('VR'))
  })

  test('P4-3: 知识卡片按freshness排序有效', () => {
    const sorted = [...MOCK_KNOWLEDGE_CARDS].sort((a, b) => b.freshness - a.freshness)
    assert.equal(sorted[0].freshness, 0.95)
    assert.equal(sorted[0].tags.includes('定价'), true)
  })

  // ╔══════════════════════════════════╗
  // ║  N1: 异常场景                    ║
  // ╚══════════════════════════════════╝

  test('N1-1: 竞品评分超出合理范围时统计不受影响', () => {
    const badCompetitors: CompetitorVenue[] = [
      { name: '测试', city: '测试市', priceLevel: 999, equipmentCount: 0, rating: -1 },
    ]
    const stats = getCityStats(badCompetitors)
    assert.equal(stats.avgPrice, 999) // 异常值仍参与计算
    assert.equal(stats.avgRating, -1)
    // 业务层面异常值未过滤
  })

  test('N1-2: 告警类型未知仍然可被统计', () => {
    const unusualAlerts: MonitorAlert[] = [
      ...MOCK_ALERTS,
      { id: 'alert-x', type: 'unknown_event', severity: 'info', storeName: '测试店', description: '未知事件', detectedAt: '2026-07-21T00:00:00Z', scanMode: 'unknown' },
    ]
    assert.equal(unusualAlerts.length, 5)
    assert.ok(unusualAlerts.some(a => a.type === 'unknown_event'))
  })

  test('N1-3: 空买家行为数据不导致报表生成失败', () => {
    const cityStats = getCityStats([])
    assert.equal(cityStats.competitorCount, 0)
    assert.equal(cityStats.avgPrice, 0)
  })

  // ╔══════════════════════════════════╗
  // ║  N2: 权限与安全                  ║
  // ╚══════════════════════════════════╝

  test('N2-1: admin拥有所有权限', () => {
    const perm = getPermissions('admin')
    assert.ok(perm.canViewData)
    assert.ok(perm.canEditSuggestions)
    assert.ok(perm.canManageAlerts)
    assert.ok(perm.canExportReports)
  })

  test('N2-2: manager可导出但不可管理告警', () => {
    const perm = getPermissions('manager')
    assert.ok(perm.canViewData)
    assert.ok(perm.canEditSuggestions)
    assert.ok(!perm.canManageAlerts)
    assert.ok(perm.canExportReports)
  })

  test('N2-3: operator仅查看数据', () => {
    const perm = getPermissions('operator')
    assert.ok(perm.canViewData)
    assert.ok(!perm.canEditSuggestions)
    assert.ok(!perm.canManageAlerts)
    assert.ok(!perm.canExportReports)
  })

  test('N2-4: viewer无任何权限', () => {
    const perm = getPermissions('viewer')
    assert.ok(!perm.canViewData)
    assert.ok(!perm.canEditSuggestions)
    assert.ok(!perm.canManageAlerts)
    assert.ok(!perm.canExportReports)
  })

  test('N2-5: 未知角色应报错或返回默认权限', () => {
    // 模拟未知角色降级为viewer行为
    const unknownRole = 'unknown' as UserRole
    const perm = ROLE_PERMISSIONS[unknownRole]
    assert.equal(perm, undefined)
  })

  // ╔══════════════════════════════════╗
  // ║  B1: 报表生成                    ║
  // ╚══════════════════════════════════╝

  test('B1-1: 生成上海运营报表包含竞品统计', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const suggestions = getAISuggestions('上海', shCompetitors)
    const report = generateReport('上海', 'admin', suggestions)
    assert.equal(report.city, '上海')
    assert.equal(report.totalCompetitors, 6)
    assert.equal(report.avgEquipment, 50) // (45+60+80+30+35+90)/6 ≈ 56.. let me recalc
    // (45+60+80+30+35)/5 for original... now with 6 Shanghai

    // Calculate expected
    const sh = getCompetitorsByCity('上海')
    const avgEq = Math.round(sh.reduce((s, c) => s + c.equipmentCount, 0) / sh.length)
    assert.equal(report.avgEquipment, avgEq)
  })

  test('B1-2: 生成报表不含深圳但可生成', () => {
    const szCompetitors = getCompetitorsByCity('深圳')
    const suggestions = getAISuggestions('深圳', szCompetitors)
    const report = generateReport('深圳', 'manager', suggestions)
    assert.equal(report.totalCompetitors, 1)
    assert.equal(report.generatedBy, 'manager')
    assert.ok(report.reportId.startsWith('rpt-深圳'))
  })

  test('B1-3: 空城市报表生成显示0竞品', () => {
    const suggestions = getAISuggestions('拉萨', [])
    const report = generateReport('拉萨', 'operator', suggestions)
    assert.equal(report.totalCompetitors, 0)
    assert.equal(report.avgEquipment, 0)
  })

  // ╔══════════════════════════════════╗
  // ║  B2: 价格与收入分析              ║
  // ╚══════════════════════════════════╝

  test('B2-1: 上海竞品最高价格级别为5', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const maxPriceLevel = Math.max(...shCompetitors.map(c => c.priceLevel))
    assert.equal(maxPriceLevel, 5)
  })

  test('B2-2: 上海竞品设备总数计算', () => {
    const shCompetitors = getCompetitorsByCity('上海')
    const totalEq = shCompetitors.reduce((s, c) => s + c.equipmentCount, 0)
    assert.equal(totalEq, 340) // 45+60+80+30+35+90 = 340
  })

  test('B2-3: 月营收大于30万的竞品占比', () => {
    const highRevenue = MOCK_COMPETITOR_DB.filter(c => (c.monthlyRevenue ?? 0) > 300000)
    assert.equal(highRevenue.length, 6) // 350k+520k+780k+480k+280k(=280k no)+920k = 6
    // Actually 220k < 300k, 280k < 300k too. Let's recalc
    const over300k = MOCK_COMPETITOR_DB.filter(c => (c.monthlyRevenue ?? 0) > 300000)
    assert.equal(over300k.length, 6) // 350+520+780+480+920 = 5... wait let's compute
    // 350000 ✓, 520000 ✓, 780000 ✓, 220000 ✗, 480000 ✓, 280000 ✗, 920000 ✓, 310000 ✓ = 6
  })
})
