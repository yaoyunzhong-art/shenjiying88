import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'payouts-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'payouts-data.ts'), 'utf-8')
})

describe('FinancePayoutsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FinancePayoutsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载提现快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes("import { loadFinancePayoutsSnapshot } from './payouts-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFinancePayoutsSnapshot()'))
    assert.ok(PAGE_SRC.includes('<FinancePayoutsClient snapshot={snapshot} />'))
  })

  it('页面应接入管理员权限边界与动态渲染', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:payouts:read'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('FinancePayoutsPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应固证 fallback 语义', () => {
    assert.ok(PAGE_SRC.includes('loadFinancePayoutsSnapshot -> defaultPayouts fallback'))
    assert.ok(PAGE_SRC.includes('local finance payout samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('FinancePayoutsData — 快照合同', () => {
  it('应定义提现快照结构与默认样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('payouts: PayoutRecord[]'))
    assert.ok(DATA_SRC.includes('export const defaultPayouts'))
    assert.ok(DATA_SRC.includes("status: 'PENDING'"))
    assert.ok(DATA_SRC.includes("method: 'BANK'"))
  })

  it('应固定 fallback 并给出错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('提现实时接口尚未接入，当前展示 fallback 样本数据。'))
  })
})

describe('FinancePayoutsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留筛选、统计卡和审核动作', () => {
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('methodFilter'))
    assert.ok(CLIENT_SRC.includes('提现单总数'))
    assert.ok(CLIENT_SRC.includes('待审核'))
    assert.ok(CLIENT_SRC.includes('通过'))
    assert.ok(CLIENT_SRC.includes('拒绝'))
  })
})
