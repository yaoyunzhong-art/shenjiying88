import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'intelligence-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'intelligence-data.ts'), 'utf-8')
})

describe('IntelligencePage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function IntelligencePage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 intelligence 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadIntelligenceSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadIntelligenceSnapshot } from './intelligence-data'"))
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

describe('IntelligencePage — 来源态透明化', () => {
  it('页面应展示情报总览来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签（page 端不再展示 sourceEvidence）', () => {
    assert.ok(!PAGE_SRC.includes('loadIntelligenceSnapshot -> loadMonitorSnapshot -> intelligence/monitor/summary'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadIntelligenceSnapshot -> loadMonitorSnapshot -> defaultMonitorSummary fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('fallback monitor samples + local decision inventory'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('不可作为闭环复签证据'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('IntelligenceData — 快照合同', () => {
  it('应通过 monitor snapshot 生成 dashboard 快照', () => {
    assert.ok(DATA_SRC.includes("import { loadMonitorSnapshot } from './monitor/monitor-data'"))
    assert.ok(DATA_SRC.includes('const monitorSnapshot = await loadMonitorSnapshot()'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('navigationCards: IntelligenceNavigationCard[]'))
    assert.ok(DATA_SRC.includes('quickActions: IntelligenceQuickAction[]'))
  })

  it('应保留默认知识卡片和 AI 建议数量', () => {
    assert.ok(DATA_SRC.includes('const DEFAULT_SUGGESTIONS = 63'))
    assert.ok(DATA_SRC.includes('const DEFAULT_KNOWLEDGE_CARDS = 248'))
    assert.ok(DATA_SRC.includes('totalSuggestions: DEFAULT_SUGGESTIONS'))
    assert.ok(DATA_SRC.includes('knowledgeCards: DEFAULT_KNOWLEDGE_CARDS'))
  })

  it('应保留四个导航入口与三项快速操作', () => {
    assert.ok(DATA_SRC.includes("href: '/intelligence/feasibility'"))
    assert.ok(DATA_SRC.includes("href: '/intelligence/operations'"))
    assert.ok(DATA_SRC.includes("href: '/intelligence/monitor'"))
    assert.ok(DATA_SRC.includes('export const defaultQuickActions'))
    assert.ok(DATA_SRC.includes('获取AI建议'))
  })
})

describe('IntelligenceClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染错误提示', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: IntelligenceSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留 KPI、功能入口与快速操作', () => {
    assert.ok(CLIENT_SRC.includes('KpiCard'))
    assert.ok(CLIENT_SRC.includes('IntelligenceKpiGrid'))
    assert.ok(CLIENT_SRC.includes('功能入口'))
    assert.ok(CLIENT_SRC.includes('快速操作'))
    assert.ok(CLIENT_SRC.includes('.map('))
  })

  it('客户端组件应保留高优先级告警 badge 逻辑', () => {
    assert.ok(CLIENT_SRC.includes('kpi.highSeverityAlerts > 0'))
    assert.ok(DATA_SRC.includes('条新告警'))
    assert.ok(CLIENT_SRC.includes('bg-red-500'))
  })
})

describe('Intelligence — 反例与边界', () => {
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

  it('客户端不应继续直接 fetch KPI', () => {
    assert.ok(!CLIENT_SRC.includes('fetch('))
    assert.ok(!PAGE_SRC.includes('useEffect'))
  })
})
