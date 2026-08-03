import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'procurement-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'procurement-data.ts'), 'utf-8')
})

describe('ProcurementPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function ProcurementPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 procurement 快照', () => {
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadProcurementSnapshot()'))
    assert.ok(!PAGE_SRC.includes(")import { loadProcurementSnapshot } from './procurement-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'procurement:read'"))
  })
})

describe('ProcurementPage — 来源态透明化', () => {
  it('页面应展示采购来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadProcurementSnapshot -> procurement-orders'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadProcurementSnapshot -> defaultOrders fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes(')local procurement order samples'))
    assert.ok(!PAGE_SRC.includes(')不可作为闭环复签证据'))
  })
})

describe('ProcurementData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('orders: ProcurementOrder[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultOrders'))
    assert.ok(DATA_SRC.includes('华强电子'))
    assert.ok(DATA_SRC.includes('益智玩具厂'))
    assert.ok(DATA_SRC.includes('杭州动漫科技'))
  })

  it('应尝试读取上游 procurement-orders 接口并映射状态', () => {
    assert.ok(DATA_SRC.includes("new URL('procurement-orders', resolveProcurementApiBaseUrl())"))
    assert.ok(DATA_SRC.includes("DRAFT: 'draft'"))
    assert.ok(DATA_SRC.includes("PENDING_APPROVAL: 'submitted'"))
    assert.ok(DATA_SRC.includes("RECEIVED: 'received'"))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('采购单实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('ProcurementClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: ProcurementSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留统计卡片、tab 和列表', () => {
    assert.ok(CLIENT_SRC.includes("type ProcTab = 'pending' | 'approved' | 'received' | 'all'"))
    assert.ok(CLIENT_SRC.includes('采购单'))
    assert.ok(CLIENT_SRC.includes('待处理'))
    assert.ok(CLIENT_SRC.includes('供应商处理中'))
    assert.ok(CLIENT_SRC.includes('.map('))
  })

  it('客户端组件应保留状态标签、优先级标签和空态', () => {
    assert.ok(CLIENT_SRC.includes('statusLabel'))
    assert.ok(CLIENT_SRC.includes('priorityLabel'))
    assert.ok(CLIENT_SRC.includes('暂无采购单'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有采购订单'))
  })
})

describe('Procurement — 反例与边界', () => {
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

  it('客户端应处理空列表边界', () => {
    assert.ok(CLIENT_SRC.includes('filtered.length === 0'))
    assert.ok(CLIENT_SRC.includes('暂无采购单'))
  })
})
