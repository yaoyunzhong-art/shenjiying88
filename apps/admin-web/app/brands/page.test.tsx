import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'brands-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'brands-data.ts'), 'utf-8')
})

describe('BrandsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function BrandsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载品牌快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadBrandsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import BrandsClient from './brands-client'"))
    assert.ok(PAGE_SRC.includes('<BrandsClient snapshot={snapshot} />'))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'brands:read'"))
  })
})

describe('BrandsPage — 来源态透明化', () => {
  it('页面应展示品牌来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应固证本地品牌快照来源', () => {
    assert.ok(PAGE_SRC.includes("sourceLabel: snapshot.sourceLabel"))
    assert.ok(PAGE_SRC.includes('loadBrandsSnapshot -> defaultBrands snapshot'))
    assert.ok(PAGE_SRC.includes('local brand sample snapshot records'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('BrandsData — 快照合同', () => {
  it('应定义 snapshot 合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-brand-snapshot'"))
    assert.ok(DATA_SRC.includes('brands: BrandItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应提供默认品牌快照样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultBrands'))
    assert.ok(DATA_SRC.includes('M5 Premium 旗舰品牌'))
    assert.ok(DATA_SRC.includes('NatureEssence 自然精华'))
    assert.ok(DATA_SRC.includes('LondonStyle 伦敦风尚'))
  })

  it('应暴露统计与市场辅助函数', () => {
    assert.ok(DATA_SRC.includes('export function computeBrandStats'))
    assert.ok(DATA_SRC.includes('export function getBrandUniqueMarkets'))
  })

  it('应通过 loadBrandsSnapshot 返回快照', () => {
    assert.ok(DATA_SRC.includes('export async function loadBrandsSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-brand-snapshot'"))
  })
})

describe('BrandsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: BrandsSnapshotDelivery'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留搜索、筛选和表格', () => {
    assert.ok(CLIENT_SRC.includes('SearchFilterInput'))
    assert.ok(CLIENT_SRC.includes('Tabs'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
    assert.ok(CLIENT_SRC.includes('Pagination'))
    assert.ok(CLIENT_SRC.includes('useSearchFilter'))
  })

  it('客户端组件应保留状态、等级和市场三层筛选', () => {
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('tierFilter'))
    assert.ok(CLIENT_SRC.includes('marketFilter'))
    assert.ok(CLIENT_SRC.includes('品牌状态'))
    assert.ok(CLIENT_SRC.includes('品牌等级'))
    assert.ok(CLIENT_SRC.includes('市场分布'))
  })

  it('客户端组件应处理空列表边界', () => {
    assert.ok(CLIENT_SRC.includes('EmptyState'))
    assert.ok(CLIENT_SRC.includes('未找到匹配品牌'))
  })
})

describe('BrandsPage — 反例与边界', () => {
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
