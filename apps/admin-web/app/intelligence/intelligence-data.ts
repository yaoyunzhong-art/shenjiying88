import { loadMonitorSnapshot } from './monitor/monitor-data'

export interface KpiData {
  monitoredCities: number
  totalAlerts: number
  highSeverityAlerts: number
  totalSuggestions: number
  knowledgeCards: number
  lastScanTime: string
}

export interface IntelligenceNavigationCard {
  href: string
  icon: string
  title: string
  desc: string
  accent: 'blue' | 'green' | 'red' | 'yellow'
  badge?: string
}

export interface IntelligenceQuickAction {
  href: string
  label: string
  accent: 'blue' | 'green' | 'red'
}

export interface IntelligenceSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  kpi: KpiData
  navigationCards: IntelligenceNavigationCard[]
  quickActions: IntelligenceQuickAction[]
  generatedAt: string
  error?: string
}

const DEFAULT_MONITORED_CITIES = 12
const DEFAULT_SUGGESTIONS = 63
const DEFAULT_KNOWLEDGE_CARDS = 248

function toLocalTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN')
}

function createNavigationCards(kpi: KpiData): IntelligenceNavigationCard[] {
  return [
    {
      href: '/intelligence/feasibility',
      icon: '📊',
      title: '开业可行性报告',
      desc: '竞品数据 + 商圈分析 + 设备配置建议',
      accent: 'blue',
      badge: '推荐',
    },
    {
      href: '/intelligence/operations',
      icon: '💡',
      title: '运营参谋 (AI选择题)',
      desc: '定价策略 · 活动方案 · 设备更新 · 促销应对',
      accent: 'green',
    },
    {
      href: '/intelligence/monitor',
      icon: '👀',
      title: '竞争监控',
      desc: '价格调整 · 新活动 · 优惠变化 · 评分异动',
      accent: 'red',
      badge: kpi.highSeverityAlerts > 0 ? `${kpi.highSeverityAlerts}条新告警` : undefined,
    },
    {
      href: '/intelligence/feasibility?tab=finance',
      icon: '💰',
      title: '财务全景表',
      desc: '首期投入 + 月成本 + 营收预估 + 回收期',
      accent: 'yellow',
    },
  ]
}

export const defaultQuickActions: IntelligenceQuickAction[] = [
  { href: '/intelligence/feasibility', label: '评估新店', accent: 'blue' },
  { href: '/intelligence/operations', label: '获取AI建议', accent: 'green' },
  { href: '/intelligence/monitor', label: '查看监控', accent: 'red' },
]

export async function loadIntelligenceSnapshot(): Promise<IntelligenceSnapshotDelivery> {
  const monitorSnapshot = await loadMonitorSnapshot()
  const totalAlerts = monitorSnapshot.alerts.filter((alert) => !alert.deduped).length
  const highSeverityAlerts = monitorSnapshot.alerts.filter(
    (alert) => alert.severity === 'high' && !alert.deduped
  ).length

  const kpi: KpiData = {
    monitoredCities: DEFAULT_MONITORED_CITIES,
    totalAlerts,
    highSeverityAlerts,
    totalSuggestions: DEFAULT_SUGGESTIONS,
    knowledgeCards: DEFAULT_KNOWLEDGE_CARDS,
    lastScanTime: monitorSnapshot.scanTimestamp ? toLocalTime(monitorSnapshot.scanTimestamp) : '--',
  }

  return {
    deliveryMode: monitorSnapshot.deliveryMode,
    kpi,
    navigationCards: createNavigationCards(kpi),
    quickActions: defaultQuickActions,
    generatedAt: monitorSnapshot.generatedAt,
    error: monitorSnapshot.error,
  }
}
