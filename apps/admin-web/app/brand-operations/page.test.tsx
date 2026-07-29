import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'brand-operations-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'brand-operations-data.ts'), 'utf-8')
})

describe('BrandOperationsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function BrandOperationsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载品牌运营快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadBrandOperationsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadBrandOperationsSnapshot } from './brand-operations-data'"))
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

describe('BrandOperationsPage — 来源态透明化', () => {
  it('页面应展示品牌运营来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    assert.ok(
      PAGE_SRC.includes(
        'loadBrandOperationsSnapshot -> brand-operations/assets + brand-operations/campaigns + brand-operations/collaborations'
      )
    )
    assert.ok(PAGE_SRC.includes('loadBrandOperationsSnapshot -> defaultAssets/defaultCampaigns/defaultCollaborations'))
    assert.ok(PAGE_SRC.includes('local brand operations samples'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('BrandOperationsData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('assets: BrandAssetItem[]'))
    assert.ok(DATA_SRC.includes('campaigns: BrandCampaignItem[]'))
    assert.ok(DATA_SRC.includes('collaborations: BrandCollaborationItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultAssets'))
    assert.ok(DATA_SRC.includes('export const defaultCampaigns'))
    assert.ok(DATA_SRC.includes('export const defaultCollaborations'))
    assert.ok(DATA_SRC.includes('神机营主 Logo'))
    assert.ok(DATA_SRC.includes('SEGA 联名推广'))
  })

  it('应尝试读取上游 brand-operations 接口', () => {
    assert.ok(DATA_SRC.includes("fetchBrandOperationsPart<BrandAssetItem[]>('brand-operations/assets')"))
    assert.ok(DATA_SRC.includes("fetchBrandOperationsPart<BrandCampaignItem[]>('brand-operations/campaigns')"))
    assert.ok(
      DATA_SRC.includes(
        "fetchBrandOperationsPart<BrandCollaborationItem[]>('brand-operations/collaborations')"
      )
    )
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('品牌运营实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('BrandOperationsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: BrandOperationsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留三类业务视图', () => {
    assert.ok(CLIENT_SRC.includes("type BrandTab = 'campaigns' | 'assets' | 'collaborations'"))
    assert.ok(CLIENT_SRC.includes('品牌活动'))
    assert.ok(CLIENT_SRC.includes('品牌素材'))
    assert.ok(CLIENT_SRC.includes('联名合作'))
  })

  it('客户端组件应保留搜索与空态处理', () => {
    assert.ok(CLIENT_SRC.includes('setKeyword'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有品牌活动'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有品牌素材'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有联名合作'))
  })
})

describe('BrandOperations — 反例与边界', () => {
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
