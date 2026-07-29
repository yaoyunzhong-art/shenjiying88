import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'suppliers-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'suppliers-data.ts'), 'utf-8')
})

describe('StoreSuppliersPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function StoreSuppliersPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载供应商快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSuppliersSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadSuppliersSnapshot } from './suppliers-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(!PAGE_SRC.includes('{sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'suppliers:read'"))
  })
})

describe('SuppliersData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('suppliers: SupplierItem[]'))
    assert.ok(DATA_SRC.includes('stats: SupplierStats'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应固证上游 suppliers 接口与 fallback 样本（DATA 层仍承担）', () => {
    assert.ok(DATA_SRC.includes("new URL('suppliers', resolveSuppliersApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('export const MOCK_SUPPLIERS'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('供应商实时接口不可达，已切换到 fallback 样本数据。'))
  })

  it('应保留供应商统计与格式化能力', () => {
    assert.ok(DATA_SRC.includes('export function computeSupplierStats'))
    assert.ok(DATA_SRC.includes('export function formatCurrency'))
    assert.ok(DATA_SRC.includes('SUPPLIER_CATEGORY_MAP'))
  })
})

describe('SuppliersClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端应保留搜索、筛选与空态', () => {
    assert.ok(CLIENT_SRC.includes('setKeyword'))
    assert.ok(CLIENT_SRC.includes('setStatus'))
    assert.ok(CLIENT_SRC.includes('setCategory'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有供应商数据'))
  })

  it('客户端应渲染列表核心字段', () => {
    assert.ok(CLIENT_SRC.includes('供应商管理'))
    assert.ok(CLIENT_SRC.includes('供应商总数'))
    assert.ok(CLIENT_SRC.includes('累计金额'))
    assert.ok(CLIENT_SRC.includes('最近订单'))
  })
})

describe('Suppliers — 防御', () => {
  it('源码中不应出现 describe.skip 或 as any', () => {
    assert.ok(!PAGE_SRC.includes('describe.skip'))
    assert.ok(!CLIENT_SRC.includes('describe.skip'))
    assert.ok(!DATA_SRC.includes('describe.skip'))
    assert.ok(!PAGE_SRC.includes('as any'))
    assert.ok(!CLIENT_SRC.includes('as any'))
    assert.ok(!DATA_SRC.includes('as any'))
  })
})
