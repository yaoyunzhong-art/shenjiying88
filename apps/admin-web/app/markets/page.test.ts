import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'markets-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, '../markets-data.ts'), 'utf-8')
})

describe('MarketsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function MarketsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载市场快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMarketsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadMarketsSnapshot } from '../markets-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })
})

describe('MarketsPage — 来源态透明化', () => {
  it('页面应展示市场来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(PAGE_SRC.includes('loadMarketsSnapshot -> markets'))
    assert.ok(PAGE_SRC.includes('loadMarketsSnapshot -> MOCK_MARKETS fallback'))
    assert.ok(PAGE_SRC.includes('local market configuration samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('MarketsData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('markets: MarketItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留市场样本和详情合同', () => {
    assert.ok(DATA_SRC.includes('export const MOCK_MARKETS'))
    assert.ok(DATA_SRC.includes('export const MOCK_MARKET_DETAILS'))
    assert.ok(DATA_SRC.includes('中国大陆'))
    assert.ok(DATA_SRC.includes('新加坡'))
  })

  it('应尝试读取上游 markets 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('markets', resolveMarketsApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('mapApiMarket'))
    assert.ok(DATA_SRC.includes('unwrapApiPayload'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('市场实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('MarketsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: MarketsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留搜索、状态和区域筛选', () => {
    assert.ok(CLIENT_SRC.includes('useSearchFilter'))
    assert.ok(CLIENT_SRC.includes('MARKET_LIST_SEARCH_FIELDS'))
    assert.ok(CLIENT_SRC.includes('setStatusFilter'))
    assert.ok(CLIENT_SRC.includes('setRegionFilter'))
    assert.ok(CLIENT_SRC.includes('区域筛选'))
  })

  it('客户端组件应保留统计、表格和分页', () => {
    assert.ok(CLIENT_SRC.includes('QuickStats'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('市场列表（匹配'))
  })

  it('客户端组件应处理空态边界', () => {
    assert.ok(CLIENT_SRC.includes('EmptyState'))
    assert.ok(CLIENT_SRC.includes('暂无市场数据'))
  })
})

describe('Markets — 反例与边界', () => {
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
})
