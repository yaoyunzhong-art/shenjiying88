import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(__dirname, 'orders-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(__dirname, 'orders-data.ts'), 'utf-8')
})

describe('Stores Orders Page — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function OrdersPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载订单快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadStoreOrdersSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })
})

describe('Stores Orders Data — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('orders: StoreOrder[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留订单样本', () => {
    assert.ok(DATA_SRC.includes('DEFAULT_STORE_ORDERS'))
    assert.ok(DATA_SRC.includes('ORD-001'))
    assert.ok(DATA_SRC.includes('生日派对套餐'))
  })
})

describe('Stores Orders Client — 客户端渲染层', () => {
  it('应声明 use client 并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('应保留表格、筛选与弹窗结构', () => {
    assert.ok(CLIENT_SRC.includes('Input.Search'))
    assert.ok(CLIENT_SRC.includes('Select'))
    assert.ok(CLIENT_SRC.includes('Table'))
    assert.ok(CLIENT_SRC.includes('Modal'))
    assert.ok(CLIENT_SRC.includes('订单详情'))
  })
})
