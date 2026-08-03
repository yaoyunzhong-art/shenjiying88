export type DevToolCategory = 'brand' | 'deploy' | 'platform'

export interface DevToolEntry {
  id: string
  label: string
  description: string
  icon: string
  href: string
  category: DevToolCategory
  tags: string[]
  enabled: boolean
}

export interface DevToolsActivity {
  id: string
  type: DevToolCategory
  action: string
  target: string
  timestamp: string
  status: 'success' | 'info' | 'warning'
}

export interface DevEnvironmentStatus {
  name: string
  status: 'healthy' | 'warning' | 'ready'
  version: string
  updatedAt: string
}

export interface DevServiceStatus {
  name: string
  status: 'healthy' | 'degraded'
  latency: string
}

export interface DevToolsSnapshotDelivery {
  deliveryMode: 'mock'
  entries: DevToolEntry[]
  recentActivities: DevToolsActivity[]
  environments: DevEnvironmentStatus[]
  services: DevServiceStatus[]
  generatedAt: string
}

export const defaultDevToolEntries: DevToolEntry[] = [
  {
    id: 'brand-main',
    label: '品牌概览',
    description: '查看所有品牌列表、状态、模板与活动概况',
    icon: 'BR',
    href: '/dev-tools/brand',
    category: 'brand',
    tags: ['品牌', '概览', '模板'],
    enabled: true,
  },
  {
    id: 'brand-dashboard',
    label: '运营看板',
    description: '品牌运营数据仪表盘，展示关键指标与趋势',
    icon: 'DB',
    href: '/dev-tools/brand/dashboard',
    category: 'brand',
    tags: ['看板', '运营', '数据'],
    enabled: true,
  },
  {
    id: 'brand-campaigns',
    label: '营销活动',
    description: '品牌营销活动管理与投放效果追踪',
    icon: 'CM',
    href: '/dev-tools/brand/campaigns',
    category: 'brand',
    tags: ['营销', '活动', '投放'],
    enabled: true,
  },
  {
    id: 'deploy-main',
    label: '部署管理',
    description: '多环境部署管理与回滚操作',
    icon: 'DP',
    href: '/dev-tools/deploy',
    category: 'deploy',
    tags: ['部署', '环境', '回滚'],
    enabled: true,
  },
  {
    id: 'platform-main',
    label: '开放平台',
    description: 'API 文档、开发者管理、QPS 监控',
    icon: 'PF',
    href: '/dev-tools/platform',
    category: 'platform',
    tags: ['API', '开发者', '文档'],
    enabled: true,
  },
]

export const defaultRecentActivities: DevToolsActivity[] = [
  { id: 'a1', type: 'deploy', action: '发布成功', target: '收银系统 v2.3.1', timestamp: '2026-07-16 04:30', status: 'success' },
  { id: 'a2', type: 'brand', action: '新品牌上架', target: '极限攀岩馆', timestamp: '2026-07-16 02:15', status: 'info' },
  { id: 'a3', type: 'deploy', action: '回滚完成', target: '财务对账 v2.2.0', timestamp: '2026-07-15 22:30', status: 'warning' },
  { id: 'a4', type: 'platform', action: 'API 密钥轮换', target: '收银 API v3', timestamp: '2026-07-15 18:00', status: 'info' },
  { id: 'a5', type: 'brand', action: '活动上线', target: '暑期大促 Campaign', timestamp: '2026-07-15 14:00', status: 'success' },
]

export const defaultEnvironments: DevEnvironmentStatus[] = [
  { name: '生产环境', status: 'healthy', version: 'v2.3.1', updatedAt: '2026-07-16' },
  { name: '预发环境', status: 'warning', version: 'v2.4.0', updatedAt: '2026-07-15' },
  { name: '测试环境', status: 'ready', version: 'v2.3.0', updatedAt: '2026-07-13' },
]

export const defaultServiceStatuses: DevServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', latency: '12ms' },
  { name: 'Brand Service', status: 'healthy', latency: '8ms' },
  { name: 'Deploy Pipeline', status: 'healthy', latency: '3s' },
  { name: 'Platform API', status: 'degraded', latency: '450ms' },
  { name: 'Database', status: 'healthy', latency: '5ms' },
  { name: 'Cache (Redis)', status: 'healthy', latency: '2ms' },
]

export async function loadDevToolsSnapshot(): Promise<DevToolsSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    entries: defaultDevToolEntries,
    recentActivities: defaultRecentActivities,
    environments: defaultEnvironments,
    services: defaultServiceStatuses,
    generatedAt: new Date().toISOString(),
  }
}
