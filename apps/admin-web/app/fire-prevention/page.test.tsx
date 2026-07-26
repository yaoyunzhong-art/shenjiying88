import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'fire-prevention-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'fire-prevention-data.ts'), 'utf-8')
})

describe('FirePreventionPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FirePreventionPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应读取 fire-prevention 快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes("import { loadFirePreventionSnapshot } from './fire-prevention-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFirePreventionSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入权限门禁与来源态证据', () => {
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('客户端 fake write'))
  })
})

describe('FirePreventionData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('items: InspectionItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义样本、状态映射和 fake write 帮助函数', () => {
    assert.ok(DATA_SRC.includes('export const FIRE_STATUS_MAP'))
    assert.ok(DATA_SRC.includes('export const RISK_MAP'))
    assert.ok(DATA_SRC.includes('export const defaultInspectionItems'))
    assert.ok(DATA_SRC.includes('export function filterFireInspectionItems'))
    assert.ok(DATA_SRC.includes('export function summarizeFireInspectionStats'))
    assert.ok(DATA_SRC.includes('export async function mockCreateFireInspection'))
    assert.ok(DATA_SRC.includes('export async function mockUpdateFireInspection'))
    assert.ok(DATA_SRC.includes('export function buildFireInspectionCsv'))
    assert.ok(DATA_SRC.includes('export async function loadFirePreventionSnapshot'))
  })
})

describe('FirePreventionClient — 客户端渲染层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留筛选、分页、导出和弹窗交互', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('selectedIds.size > 0'))
    assert.ok(CLIENT_SRC.includes('handleBatchComplete'))
    assert.ok(CLIENT_SRC.includes('handleExportReport'))
    assert.ok(CLIENT_SRC.includes('Modal'))
    assert.ok(CLIENT_SRC.includes('function InspectionForm'))
  })
})
