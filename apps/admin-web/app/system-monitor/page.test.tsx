import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'system-monitor-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'system-monitor-data.ts'), 'utf-8')
})

describe('SystemMonitorPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function SystemMonitorPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载系统监控快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSystemMonitorSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadSystemMonitorSnapshot } from './system-monitor-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应通过 E54 拍平移除 AdminPermissionGate', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'AdminPermissionGate 已通过 E54 拍平移除')
  })
})

describe('SystemMonitorPage — 来源态透明化', () => {
  it('页面应展示系统监控来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(PAGE_SRC.includes('loadSystemMonitorSnapshot -> system/metrics + system/services + system/activities'))
    assert.ok(PAGE_SRC.includes('loadSystemMonitorSnapshot -> defaultMetrics/defaultServices/defaultLogs'))
    assert.ok(PAGE_SRC.includes('local fallback monitor samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('SystemMonitorData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('metrics: SystemMetric[]'))
    assert.ok(DATA_SRC.includes('services: ServiceStatus[]'))
    assert.ok(DATA_SRC.includes('logs: ActivityLog[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultMetrics'))
    assert.ok(DATA_SRC.includes('export const defaultServices'))
    assert.ok(DATA_SRC.includes('export const defaultLogs'))
    assert.ok(DATA_SRC.includes('文件存储(OSS)'))
    assert.ok(DATA_SRC.includes('美团外卖Token过期告警'))
  })

  it('应尝试读取上游 system-monitor 接口', () => {
    assert.ok(DATA_SRC.includes("fetchSystemMonitorPart<{ metrics: SystemMetric[] }>('system/metrics')"))
    assert.ok(DATA_SRC.includes("fetchSystemMonitorPart<{ services: ServiceStatus[] }>('system/services')"))
    assert.ok(DATA_SRC.includes("fetchSystemMonitorPart<{ logs: ActivityLog[] }>('system/activities')"))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('SystemMonitorClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: SystemMonitorSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留指标、服务、日志三块渲染', () => {
    assert.ok(CLIENT_SRC.includes('SystemMetricsGrid'))
    assert.ok(CLIENT_SRC.includes('ServiceStatusPanel'))
    assert.ok(CLIENT_SRC.includes('ActivityLogPanel'))
    assert.ok(CLIENT_SRC.includes('.map('))
  })

  it('客户端组件应保留趋势箭头与状态色逻辑', () => {
    assert.ok(CLIENT_SRC.includes('metricColor'))
    assert.ok(CLIENT_SRC.includes('statusBadgeColor'))
    assert.ok(CLIENT_SRC.includes('activityIcon'))
    assert.ok(CLIENT_SRC.includes('↑'))
    assert.ok(CLIENT_SRC.includes('text-red-600'))
  })
})

describe('SystemMonitor — 反例与边界', () => {
  it('源码中不应出现 describe.skip', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
  })

  it('源码中不应出现 as any', () => {
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })

  it('客户端应处理空日志边界', () => {
    assert.ok(CLIENT_SRC.includes('logs.length === 0'))
    assert.ok(CLIENT_SRC.includes('暂无活动日志'))
  })
})
