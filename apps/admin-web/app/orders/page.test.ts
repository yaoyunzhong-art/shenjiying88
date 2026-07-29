import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'orders-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, '../orders-data.ts'), 'utf-8')
})

describe('OrdersPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function OrdersPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 orders 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadOrdersSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadOrdersSnapshot } from '../orders-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'order:read'"))
  })
})

describe('OrdersPage — 来源态透明化', () => {
  it('页面应展示订单来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(PAGE_SRC.includes('loadOrdersSnapshot -> transactions?type=order'))
    assert.ok(PAGE_SRC.includes('loadOrdersSnapshot -> MOCK_ORDERS fallback'))
    assert.ok(PAGE_SRC.includes('local order samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('OrdersData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('orders: OrderItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留默认 fallback 样本与状态合同', () => {
    assert.ok(DATA_SRC.includes('export const MOCK_ORDERS'))
    assert.ok(DATA_SRC.includes('ORDER_STATUS_MAP'))
    assert.ok(DATA_SRC.includes('ORDER_STATUS_FLOW'))
    assert.ok(DATA_SRC.includes('朝阳旗舰店'))
  })

  it('应尝试读取上游 orders 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('transactions?type=order', resolveOrdersApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('mapApiOrderToOrderItem'))
    assert.ok(DATA_SRC.includes('extractOrderRecords'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('订单实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('OrdersClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: OrdersSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留筛选、表格和分页结构', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('FilterChips'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
  })

  it('客户端组件应保留订单统计与详情跳转', () => {
    assert.ok(CLIENT_SRC.includes('总订单'))
    assert.ok(CLIENT_SRC.includes('客单价'))
    assert.ok(CLIENT_SRC.includes('router.push(`/orders/${item.id}`)'))
    assert.ok(CLIENT_SRC.includes('nextStatusLabel'))
  })
})

describe('Orders — 反例与边界', () => {
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

  it('客户端应保留 ALL 默认筛选与金额区间边界', () => {
    assert.ok(CLIENT_SRC.includes("'ALL'"))
    assert.ok(CLIENT_SRC.includes("type AmountRange = 'ALL' | 'under100' | '100to300' | 'over300'"))
    assert.ok(CLIENT_SRC.includes('item.totalAmount < 100'))
    assert.ok(CLIENT_SRC.includes('item.totalAmount > 300'))
  })
})
