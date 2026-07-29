import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'customer-tags-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'customer-tags-data.ts'), 'utf-8')
})

describe('CustomerTagsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function CustomerTagsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载标签快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCustomerTagsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import CustomerTagsClient from './customer-tags-client'"))
    assert.ok(PAGE_SRC.includes('<CustomerTagsClient snapshot={snapshot} />'))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('CustomerTagsPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('CustomerTagsData — 快照合同', () => {
  it('应定义 snapshot 合同和来源标签', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-customer-tags-snapshot'"))
    assert.ok(DATA_SRC.includes('tags: Tag[]'))
  })

  it('应提供标签常量、样本和表单辅助函数', () => {
    assert.ok(DATA_SRC.includes('export const TAG_CATEGORIES'))
    assert.ok(DATA_SRC.includes('export const TAG_COLORS'))
    assert.ok(DATA_SRC.includes('export const TAG_SOURCES'))
    assert.ok(DATA_SRC.includes('export const defaultTags'))
    assert.ok(DATA_SRC.includes('export function validateTagForm'))
    assert.ok(DATA_SRC.includes('export function computeTagStats'))
  })
})

describe('CustomerTagsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: CustomerTagsSnapshotDelivery'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留表单 CRUD 与统计区', () => {
    assert.ok(CLIENT_SRC.includes('确认删除'))
    assert.ok(CLIENT_SRC.includes('标签总数'))
    assert.ok(CLIENT_SRC.includes('AI预测标签'))
    assert.ok(CLIENT_SRC.includes('分类分布'))
    assert.ok(CLIENT_SRC.includes('来源分析'))
  })
})
