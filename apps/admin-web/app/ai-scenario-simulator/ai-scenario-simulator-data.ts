import type { ScenarioVariable, SimulationResult } from '@m5/ui'

export interface ScenarioPreset {
  id: string
  label: string
  description: string
  category: string
  variables: ScenarioVariable[]
  simulate: (values: Record<string, number | string>) => Promise<SimulationResult[]>
}

export interface HistoryRecord {
  id: string
  presetLabel: string
  values: Record<string, number | string>
  results: SimulationResult[]
  timestamp: string
}

export interface ScenarioTrend {
  label: string
  avgAfter: number
  count: number
}

export interface AiScenarioSimulatorSnapshot {
  deliveryMode: 'snapshot'
  sourceLabel: string
  generatedAt: string
  categoryDescriptions: Record<string, string>
  presets: ScenarioPreset[]
  presetStats: {
    totalVariables: number
    totalCategories: number
    avgSimTime: number
  }
}

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  营销: '优化广告预算与营销策略，最大化 ROI',
  运营: '平衡人力配置与服务质量，控制运营成本',
  定价: '制定科学定价策略，提升营收与客单价',
}

export const presets: ScenarioPreset[] = [
  {
    id: 'marketing-budget',
    label: '营销预算分配模拟',
    description: '调整广告预算与折扣力度，预测对营收和会员增长的影响',
    category: '营销',
    variables: [
      { id: 'adBudget', label: '广告预算 (元)', type: 'number', defaultValue: 50000, min: 5000, max: 500000, step: 5000 },
      { id: 'discountRate', label: '折扣力度 (%)', type: 'number', defaultValue: 15, min: 0, max: 50, step: 5 },
      { id: 'channelCount', label: '推广渠道数', type: 'number', defaultValue: 3, min: 1, max: 10, step: 1 },
      {
        id: 'campaignType',
        label: '活动类型',
        type: 'select',
        defaultValue: 'new-member',
        options: [
          { value: 'new-member', label: '拉新活动' },
          { value: 'retention', label: '留存活动' },
          { value: 'festival', label: '节日大促' },
        ],
      },
    ],
    simulate: async (values) => {
      const adBudget = Number(values.adBudget)
      const discount = Number(values.discountRate)
      const channels = Number(values.channelCount)
      const revenueBoost = adBudget * 0.8 * (1 + channels * 0.05) * (discount > 30 ? 0.7 : 1)
      const memberBoost = adBudget * 0.003 * (1 + channels * 0.15) * (String(values.campaignType) === 'new-member' ? 1.5 : 1)
      const costIncrease = adBudget * 0.6
      return [
        { variable: '预估营收', before: 300000, after: Math.round(300000 + revenueBoost), unit: '元', direction: 'up', changePercent: Math.round((revenueBoost / 300000) * 100) },
        { variable: '新增会员', before: 1200, after: Math.round(1200 + memberBoost), unit: '人', direction: 'up', changePercent: Math.round((memberBoost / 1200) * 100) },
        { variable: 'ROI', before: 2.5, after: Math.round((((revenueBoost - costIncrease) / adBudget + 2.5) * 10)) / 10, unit: 'x', direction: revenueBoost > costIncrease ? 'up' : 'down', changePercent: Math.round(((revenueBoost - costIncrease) / adBudget / 2.5) * 100) },
      ]
    },
  },
  {
    id: 'staff-scheduling',
    label: '排班人力模拟',
    description: '调整排班人数与班次结构，预测服务效率与人力成本',
    category: '运营',
    variables: [
      { id: 'staffCount', label: '店员总数', type: 'number', defaultValue: 8, min: 3, max: 30, step: 1 },
      { id: 'peakRatio', label: '高峰时段占比 (%)', type: 'number', defaultValue: 60, min: 30, max: 90, step: 5 },
      {
        id: 'shiftMode',
        label: '班次模式',
        type: 'select',
        defaultValue: 'three-shift',
        options: [
          { value: 'single-shift', label: '单班制' },
          { value: 'two-shift', label: '两班制' },
          { value: 'three-shift', label: '三班制' },
        ],
      },
      { id: 'avgCrowd', label: '日均客流', type: 'number', defaultValue: 500, min: 100, max: 5000, step: 100 },
    ],
    simulate: async (values) => {
      const staff = Number(values.staffCount)
      const peak = Number(values.peakRatio)
      const crowd = Number(values.avgCrowd)
      const shiftMode = String(values.shiftMode)
      const efficiency = (shiftMode === 'three-shift' ? 85 : shiftMode === 'two-shift' ? 75 : 60) + peak * 0.05
      const waitTime = Math.max(2, Math.round(crowd / (staff * (shiftMode === 'three-shift' ? 4 : shiftMode === 'two-shift' ? 3 : 2)) * (1 - peak / 200)))
      const monthlyCost = staff * 5500 * (shiftMode === 'three-shift' ? 1.1 : shiftMode === 'two-shift' ? 1 : 0.85)
      return [
        { variable: '服务效率', before: 65, after: Math.min(98, Math.round(efficiency)), unit: '%', direction: 'up', changePercent: Math.round((efficiency / 65 - 1) * 100) },
        { variable: '预估等待时间', before: 15, after: waitTime, unit: '分钟', direction: waitTime < 15 ? 'up' : 'down', changePercent: Math.round(((15 - waitTime) / 15) * 100) },
        { variable: '月人力成本', before: 44000, after: Math.round(monthlyCost), unit: '元', direction: 'down', changePercent: Math.round(((monthlyCost - 44000) / 44000) * 100) },
      ]
    },
  },
  {
    id: 'pricing-optimization',
    label: '定价策略模拟',
    description: '调整票价与会员价，预测营收变化与客单价',
    category: '定价',
    variables: [
      { id: 'basePrice', label: '标准票价 (元)', type: 'number', defaultValue: 128, min: 30, max: 500, step: 10 },
      { id: 'memberDiscount', label: '会员折扣 (%)', type: 'number', defaultValue: 20, min: 5, max: 80, step: 5 },
      { id: 'membershipRatio', label: '会员占比 (%)', type: 'number', defaultValue: 40, min: 10, max: 90, step: 5 },
      {
        id: 'seasonType',
        label: '季节类型',
        type: 'select',
        defaultValue: 'peak',
        options: [
          { value: 'peak', label: '旺季' },
          { value: 'regular', label: '平季' },
          { value: 'off-peak', label: '淡季' },
        ],
      },
    ],
    simulate: async (values) => {
      const basePrice = Number(values.basePrice)
      const discount = Number(values.memberDiscount)
      const memberRatio = Number(values.membershipRatio)
      const season = String(values.seasonType)
      const seasonMultiplier = season === 'peak' ? 1.3 : season === 'off-peak' ? 0.7 : 1
      const avgVisitor = Math.round(1500 * seasonMultiplier)
      const memberPrice = Math.round(basePrice * (1 - discount / 100))
      const avgPrice = Math.round(basePrice * (1 - (memberRatio / 100) * (discount / 100)))
      const dailyRevenue = avgPrice * avgVisitor
      const baseRevenue = basePrice * avgVisitor
      return [
        { variable: '日均客流', before: 1500, after: Math.round(avgVisitor * (1 + discount / 200)), unit: '人', direction: avgVisitor > 1500 ? 'up' : 'down', changePercent: Math.round(((avgVisitor - 1500) / 1500) * 100) },
        { variable: '日均营收', before: baseRevenue, after: dailyRevenue, unit: '元', direction: dailyRevenue > baseRevenue ? 'up' : 'down', changePercent: Math.round(((dailyRevenue - baseRevenue) / baseRevenue) * 100) },
        { variable: '会员消费均价', before: 96, after: memberPrice, unit: '元', direction: memberPrice > 96 ? 'up' : 'down', changePercent: Math.round(((memberPrice - 96) / 96) * 100) },
      ]
    },
  },
]

export async function loadAiScenarioSimulatorSnapshot(): Promise<AiScenarioSimulatorSnapshot> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-ai-scenario-simulator-snapshot',
    generatedAt: new Date().toISOString(),
    categoryDescriptions: CATEGORY_DESCRIPTIONS,
    presets,
    presetStats: {
      totalVariables: presets.reduce((sum, preset) => sum + preset.variables.length, 0),
      totalCategories: new Set(presets.map((preset) => preset.category)).size,
      avgSimTime: 1.2,
    },
  }
}
