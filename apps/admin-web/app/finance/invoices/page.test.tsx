import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'invoices-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'invoices-data.ts'), 'utf-8')
})

describe('FinanceInvoicesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FinanceInvoicesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载发票快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes("import { loadFinanceInvoicesSnapshot } from './invoices-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFinanceInvoicesSnapshot()'))
    assert.ok(PAGE_SRC.includes('<FinanceInvoicesClient snapshot={snapshot} />'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(PAGE_SRC.includes("requiredPermission: 'finance:invoices:read'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('FinanceInvoicesPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('写入路径: {sourceEvidence.writePath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('应固证 mock 来源标签与假写链路', () => {
    assert.ok(PAGE_SRC.includes('loadFinanceInvoicesSnapshot -> defaultInvoices'))
    assert.ok(PAGE_SRC.includes('local finance invoice samples'))
    assert.ok(PAGE_SRC.includes('FinanceInvoicesClient:create/issue/cancel -> local state mutation only'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('FinanceInvoicesData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('invoices: Invoice[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认发票样本与新建表单', () => {
    assert.ok(DATA_SRC.includes('export const defaultInvoiceCreateForm'))
    assert.ok(DATA_SRC.includes('export const defaultInvoices'))
    assert.ok(DATA_SRC.includes('INV-20260719-001'))
    assert.ok(DATA_SRC.includes('INV-20260719-002'))
    assert.ok(DATA_SRC.includes('华北联营门店'))
  })

  it('应固定返回服务端 mock 快照', () => {
    assert.ok(DATA_SRC.includes('export async function loadFinanceInvoicesSnapshot()'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('generatedAt: getLatestInvoiceTimestamp(defaultInvoices)'))
  })
})

describe('FinanceInvoicesClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应接收 snapshot 并保留来源态提示', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: FinanceInvoicesSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.invoices'))
    assert.ok(CLIENT_SRC.includes('snapshot.generatedAt'))
    assert.ok(CLIENT_SRC.includes('local state mutation only'))
  })

  it('客户端组件应保留筛选、新建、开具、作废能力', () => {
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('showCreate'))
    assert.ok(CLIENT_SRC.includes('actionLoading'))
    assert.ok(CLIENT_SRC.includes('新建发票'))
    assert.ok(CLIENT_SRC.includes('开具'))
    assert.ok(CLIENT_SRC.includes('作废'))
    assert.ok(CLIENT_SRC.includes('handleCreate'))
    assert.ok(CLIENT_SRC.includes('handleIssue'))
    assert.ok(CLIENT_SRC.includes('handleCancel'))
  })

  it('客户端组件应保留空态、统计卡与表格渲染', () => {
    assert.ok(CLIENT_SRC.includes('发票总数'))
    assert.ok(CLIENT_SRC.includes('草稿待处理'))
    assert.ok(CLIENT_SRC.includes('已开金额'))
    assert.ok(CLIENT_SRC.includes('暂无发票'))
    assert.ok(CLIENT_SRC.includes('<table'))
    assert.ok(CLIENT_SRC.includes('.map(('))
  })
})

describe('FinanceInvoices — 反例与边界', () => {
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
