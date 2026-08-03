const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type RenovationTier = 'economy' | 'standard' | 'luxury'
export type FeasibilityTab = 'report' | 'finance'

export interface FeasibilityRequest {
  city: string
  district: string
  budget: number
  area: number
  tier: RenovationTier
  tab: FeasibilityTab
}

export interface FeasibilityReport {
  city: string
  district: string
  budget: number
  score: number
  scoreLevel: 'high' | 'medium' | 'low'
  summary: string
  competitorDensity: number
  competitorCount: number
  avgPrice: number
  suggestedEquipment: { name: string; count: number; cost: number; reason: string }[]
  suggestedPriceRange: { min: number; max: number; avg: number }
  riskFactors: { factor: string; level: 'high' | 'medium' | 'low'; suggestion: string }[]
  marketTrend: string
  estimatedMonthlyRevenue: number
  estimatedPaybackMonths: number
}

export interface FinancePanorama {
  budget: number
  area: number
  tier: RenovationTier
  city: string
  district: string
  initialInvestment: {
    equipmentCost: number
    renovationCost: number
    softwareSystemCost: number
    deposit: number
    total: number
  }
  monthlyFixedCost: {
    rent: number
    labor: number
    equipmentMaintenance: number
    systemSubscription: number
    total: number
  }
  monthlyVariableCost: {
    electricity: number
    consumables: number
    marketing: number
    total: number
  }
  monthlyTotalCost: number
  revenueEstimate: {
    avgTicketPrice: number
    estimatedDailyTraffic: number
    estimatedMonthlyRevenue: number
    estimatedMonthlyProfit: number
  }
  monthlyDepreciation: number
  monthlyAmortization: number
  paybackMonths: number
  paybackWithDepreciation: number
  cityAvgComparison: {
    initialInvestment: number
    monthlyFixedCost: number
    monthlyRevenue: number
    paybackMonths: number
  }
}

export interface BudgetComparisonRow {
  budget: number
  score: number
  payback: number
  revenue: number
}

export interface FeasibilitySnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  request: FeasibilityRequest
  cityDistricts: Record<string, string[]>
  report: FeasibilityReport
  finance: FinancePanorama
  budgetComparison: BudgetComparisonRow[]
  generatedAt: string
  error?: string
}

export const CITY_DISTRICTS: Record<string, string[]> = {
  上海: ['徐汇', '浦东', '静安', '黄浦', '长宁'],
  北京: ['朝阳', '海淀', '东城', '西城', '丰台'],
  广州: ['天河', '越秀', '海珠', '番禺'],
  深圳: ['南山', '福田', '罗湖', '宝安'],
  成都: ['锦江', '武侯', '成华', '金牛'],
  杭州: ['上城', '西湖', '滨江', '余杭'],
  重庆: ['渝中', '江北', '南岸', '沙坪坝'],
  武汉: ['江汉', '武昌', '洪山'],
  西安: ['雁塔', '碑林', '未央'],
  南京: ['鼓楼', '秦淮', '建邺'],
  长沙: ['芙蓉', '天心', '岳麓'],
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveIntelligenceApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

function readSearchParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function readNumberParam(value: string | string[] | undefined, fallback: number): number {
  const raw = readSearchParam(value)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readTier(value: string | string[] | undefined): RenovationTier {
  const raw = readSearchParam(value)
  return raw === 'economy' || raw === 'luxury' ? raw : 'standard'
}

function readTab(value: string | string[] | undefined): FeasibilityTab {
  return readSearchParam(value) === 'finance' ? 'finance' : 'report'
}

function getDefaultRequest(): FeasibilityRequest {
  return {
    city: '上海',
    district: '徐汇',
    budget: 300,
    area: 400,
    tier: 'standard',
    tab: 'report',
  }
}

export function normalizeFeasibilityRequest(
  searchParams?: Record<string, string | string[] | undefined>
): FeasibilityRequest {
  const defaults = getDefaultRequest()
  const city = readSearchParam(searchParams?.city) ?? defaults.city
  const districts = CITY_DISTRICTS[city] ?? [defaults.district]
  const district = readSearchParam(searchParams?.district) ?? districts[0] ?? defaults.district

  return {
    city,
    district: districts.includes(district) ? district : districts[0] ?? defaults.district,
    budget: Math.min(2000, Math.max(100, readNumberParam(searchParams?.budget, defaults.budget))),
    area: Math.min(5000, Math.max(50, readNumberParam(searchParams?.area, defaults.area))),
    tier: readTier(searchParams?.tier),
    tab: readTab(searchParams?.tab),
  }
}

function districtBias(city: string, district: string): number {
  return [...`${city}${district}`].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 9
}

export function buildFallbackFeasibilityReport(
  city: string,
  district: string,
  budget: number
): FeasibilityReport {
  const densities: Record<string, { count: number; price: number }> = {
    上海: { count: 6, price: 135 },
    北京: { count: 5, price: 125 },
    广州: { count: 4, price: 88 },
    深圳: { count: 5, price: 105 },
    成都: { count: 4, price: 78 },
    杭州: { count: 3, price: 92 },
    南京: { count: 2, price: 75 },
    default: { count: 1, price: 60 },
  }

  const density = densities[city] ?? densities.default
  const scoreBase = 65 - density.count * 3 + budget * 0.04 + districtBias(city, district)
  const score = Math.min(95, Math.max(25, Math.round(scoreBase)))

  return {
    city,
    district,
    budget,
    score,
    scoreLevel: score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low',
    summary: `${city}${district}地区有${density.count}家竞品，人均约¥${density.price}。${score >= 75 ? '适合投资' : score >= 50 ? '可考虑' : '不建议'}。`,
    competitorDensity: Math.min(density.count * 10, 80),
    competitorCount: density.count,
    avgPrice: density.price,
    suggestedPriceRange: {
      min: density.price - 15,
      max: density.price + 25,
      avg: density.price,
    },
    suggestedEquipment: [
      { name: '街机射击区', count: 8, cost: 320000, reason: `${city}竞品平均 6-10 台，覆盖率高。` },
      { name: 'VR体验区', count: 4, cost: 280000, reason: '年轻客群偏好强，适合拉新破圈。' },
      { name: '跳舞机/音游区', count: 3, cost: 120000, reason: '社交属性强，翻台率高。' },
      { name: '夹娃娃机', count: 12, cost: 96000, reason: `${city}高频引流设备，平均回收期较短。` },
      { name: '篮球机', count: 4, cost: 48000, reason: '亲子客群与周末场景必配。' },
      { name: '赛车模拟器', count: 3, cost: 156000, reason: '差异化设备，可强化体验记忆点。' },
    ],
    riskFactors: [
      {
        factor: '同城竞品密度',
        level: density.count >= 5 ? 'high' : 'medium',
        suggestion: density.count >= 5 ? '建议差异化定位并预留首月营销预算。' : '竞争强度可控，建议强化商圈渗透。',
      },
      {
        factor: '预算匹配度',
        level: budget < 200 ? 'high' : 'low',
        suggestion: budget < 200 ? '建议提高至 300 万以上或缩减面积。' : '预算充裕，可支撑基础设备配置。',
      },
      {
        factor: '商圈成熟度',
        level: 'medium',
        suggestion: '建议叠加 7 日客流观察与工作日/周末切片验证。',
      },
    ],
    marketTrend: `${city}娱乐市场年增长率约 15-20%，年轻客群对沉浸式与社交型设备需求持续增长。`,
    estimatedMonthlyRevenue: Math.round((density.price * 1500 + budget * 80000) / 10),
    estimatedPaybackMonths: Math.round(
      budget * 10000 / Math.max(1, Math.round((density.price * 1500 + budget * 80000) / 10))
    ),
  }
}

export function buildFallbackFinancePanorama(
  budget: number,
  area: number,
  tier: RenovationTier,
  city: string,
  district: string
): FinancePanorama {
  const densities: Record<string, { price: number }> = {
    上海: { price: 135 },
    北京: { price: 125 },
    广州: { price: 88 },
    深圳: { price: 105 },
    成都: { price: 78 },
    杭州: { price: 92 },
    南京: { price: 75 },
    default: { price: 60 },
  }
  const cityRents: Record<string, { rent: number; salary: number }> = {
    上海: { rent: 280, salary: 12000 },
    北京: { rent: 250, salary: 12000 },
    深圳: { rent: 220, salary: 11000 },
    广州: { rent: 200, salary: 10000 },
    成都: { rent: 150, salary: 8000 },
    default: { rent: 100, salary: 6000 },
  }
  const tierPrices: Record<RenovationTier, number> = {
    economy: 600,
    standard: 1200,
    luxury: 3500,
  }

  const density = densities[city] ?? densities.default
  const cityRent = cityRents[city] ?? cityRents.default
  const tierPrice = tierPrices[tier]
  const renovationCost = tierPrice * area
  const equipmentCost = Math.round(budget * 10000 * 0.45)
  const softwareSystemCost = Math.round(Math.min(Math.max(80000 + area * 60, 80000), 200000))
  const monthlyRent = Math.round(cityRent.rent * area)
  const deposit = monthlyRent * 3
  const staffCount = area <= 200 ? 6 : area <= 500 ? 8 : area <= 800 ? 10 : 12
  const labor = staffCount * cityRent.salary
  const equipmentMaintenance = Math.round((equipmentCost * 0.1) / 12)
  const systemSubscription = Math.round(Math.min(Math.max(3000 + area * 3, 3000), 8000))
  const avgTicketPrice = density.price
  const estimatedDailyTraffic = Math.round((area / 2.5) * 1.2)
  const estimatedMonthlyRevenue = Math.round(avgTicketPrice * estimatedDailyTraffic * 30)
  const electricity = Math.round(area * 20)
  const consumables = Math.round(estimatedMonthlyRevenue * 0.025)
  const marketing = Math.round(estimatedMonthlyRevenue * 0.05)
  const monthlyFixedTotal = monthlyRent + labor + equipmentMaintenance + systemSubscription
  const monthlyVariableTotal = electricity + consumables + marketing
  const monthlyTotalCost = monthlyFixedTotal + monthlyVariableTotal
  const estimatedMonthlyProfit = estimatedMonthlyRevenue - monthlyTotalCost
  const monthlyDepreciation = Math.round(equipmentCost / 36)
  const monthlyAmortization = Math.round(renovationCost / 60)
  const initialTotal = equipmentCost + renovationCost + softwareSystemCost + deposit
  const paybackMonths = estimatedMonthlyProfit > 0 ? Math.ceil(initialTotal / estimatedMonthlyProfit) : 999
  const monthlyDeduct = estimatedMonthlyProfit - monthlyDepreciation - monthlyAmortization
  const paybackWithDepreciation = monthlyDeduct > 0 ? Math.ceil(initialTotal / monthlyDeduct) : 999

  return {
    budget,
    area,
    tier,
    city,
    district,
    initialInvestment: {
      equipmentCost,
      renovationCost,
      softwareSystemCost,
      deposit,
      total: initialTotal,
    },
    monthlyFixedCost: {
      rent: monthlyRent,
      labor,
      equipmentMaintenance,
      systemSubscription,
      total: monthlyFixedTotal,
    },
    monthlyVariableCost: {
      electricity,
      consumables,
      marketing,
      total: monthlyVariableTotal,
    },
    monthlyTotalCost,
    revenueEstimate: {
      avgTicketPrice,
      estimatedDailyTraffic,
      estimatedMonthlyRevenue,
      estimatedMonthlyProfit,
    },
    monthlyDepreciation,
    monthlyAmortization,
    paybackMonths,
    paybackWithDepreciation,
    cityAvgComparison: {
      initialInvestment: Math.round(initialTotal * 0.9),
      monthlyFixedCost: Math.round(monthlyFixedTotal * 0.95),
      monthlyRevenue: Math.round(estimatedMonthlyRevenue * 1.1),
      paybackMonths: Math.max(1, Math.round(paybackMonths * 1.15)),
    },
  }
}

function buildBudgetComparison(request: FeasibilityRequest): BudgetComparisonRow[] {
  const budgets = [Math.max(100, request.budget - 100), request.budget, Math.min(2000, request.budget + 200)]

  return budgets.map((budget) => {
    const report = buildFallbackFeasibilityReport(request.city, request.district, budget)
    const finance = buildFallbackFinancePanorama(budget, request.area, request.tier, request.city, request.district)

    return {
      budget,
      score: report.score,
      payback: finance.paybackMonths,
      revenue: finance.revenueEstimate.estimatedMonthlyRevenue,
    }
  })
}

async function postIntelligenceData<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const upstreamUrl = new URL(path, resolveIntelligenceApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`intelligence upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  return unwrapApiPayload<T>(payload)
}

export async function loadFeasibilitySnapshot(
  searchParams?: Record<string, string | string[] | undefined>
): Promise<FeasibilitySnapshotDelivery> {
  const request = normalizeFeasibilityRequest(searchParams)

  try {
    const [report, finance] = await Promise.all([
      postIntelligenceData<FeasibilityReport>('intelligence/feasibility', {
        city: request.city,
        district: request.district,
        budget: request.budget,
      }),
      postIntelligenceData<FinancePanorama>('intelligence/finance-panorama', {
        budget: request.budget,
        area: request.area,
        tier: request.tier,
        city: request.city,
        district: request.district,
      }),
    ])

    return {
      deliveryMode: 'api',
      request,
      cityDistricts: CITY_DISTRICTS,
      report,
      finance,
      budgetComparison: buildBudgetComparison(request),
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      request,
      cityDistricts: CITY_DISTRICTS,
      report: buildFallbackFeasibilityReport(request.city, request.district, request.budget),
      finance: buildFallbackFinancePanorama(request.budget, request.area, request.tier, request.city, request.district),
      budgetComparison: buildBudgetComparison(request),
      generatedAt: new Date().toISOString(),
      error: '可行性实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
