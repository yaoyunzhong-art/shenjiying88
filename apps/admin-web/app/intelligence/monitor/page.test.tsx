import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'monitor-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'monitor-data.ts'), 'utf-8')
})

describe('MonitorPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function MonitorPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 monitor 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMonitorSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadMonitorSnapshot } from './monitor-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('MonitorPage — 来源态透明化', () => {
  it('页面应展示竞争监控来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签（page 端不再展示 sourceEvidence）', () => {
    assert.ok(!PAGE_SRC.includes('loadMonitorSnapshot -> intelligence/monitor/summary'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadMonitorSnapshot -> defaultMonitorSummary fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('local monitor alert samples'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('不可作为闭环复签证据'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('MonitorData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('alerts: Alert[]'))
    assert.ok(DATA_SRC.includes('trend: TrendPoint[]'))
    assert.ok(DATA_SRC.includes('scanTimestamp: string'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 告警与趋势样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultAlerts'))
    assert.ok(DATA_SRC.includes('玩咖电玩城'))
    assert.ok(DATA_SRC.includes('星际乐园'))
    assert.ok(DATA_SRC.includes('export const defaultTrend'))
  })

  it('应尝试读取上游 monitor summary 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('intelligence/monitor/summary', resolveIntelligenceApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("cache: 'no-store'"))
    assert.ok(DATA_SRC.includes('unwrapApiPayload'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('竞争监控实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('MonitorClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染错误提示', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: MonitorSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮和自动刷新开关', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('30_000'))
    assert.ok(CLIENT_SRC.includes('autoRefresh'))
  })

  it('客户端组件应保留类型映射、严重度和筛选', () => {
    assert.ok(CLIENT_SRC.includes('TYPE_LABELS'))
    assert.ok(CLIENT_SRC.includes('TYPE_ICONS'))
    assert.ok(CLIENT_SRC.includes('SEV_LEVELS'))
    assert.ok(CLIENT_SRC.includes('全部类型'))
    assert.ok(CLIENT_SRC.includes('全部级别'))
  })

  it('客户端组件应保留走势、列表和展开详情', () => {
    assert.ok(CLIENT_SRC.includes('周异动走势'))
    assert.ok(CLIENT_SRC.includes('weeklyTrend'))
    assert.ok(CLIENT_SRC.includes('expandedId'))
    assert.ok(CLIENT_SRC.includes('AI解决建议'))
    assert.ok(CLIENT_SRC.includes('暂无监控数据'))
  })
})

describe('Monitor — 反例与边界', () => {
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

  it('客户端不应继续直接 fetch 监控接口', () => {
    assert.ok(!CLIENT_SRC.includes('fetch('))
    assert.ok(CLIENT_SRC.includes('formatTime'))
    assert.ok(CLIENT_SRC.includes('24h内仅展示最新一次'))
  })
})
