import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'feasibility-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'feasibility-data.ts'), 'utf-8')
})

describe('FeasibilityPage — 服务端壳层', () => {
  it('页面应为 async server component 并解析 searchParams', () => {
    assert.ok(PAGE_SRC.includes('export default async function FeasibilityPage'))
    assert.ok(PAGE_SRC.includes('searchParams?: Promise<Record<string, string | string[] | undefined>>'))
    assert.ok(PAGE_SRC.includes('const resolvedSearchParams = searchParams ? await searchParams : undefined'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 feasibility 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFeasibilitySnapshot(resolvedSearchParams)'))
    assert.ok(PAGE_SRC.includes("import { loadFeasibilitySnapshot } from './feasibility-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'intelligence:feasibility:read'"))
  })
})

describe('FeasibilityPage — 来源态透明化', () => {
  it('页面应展示可行性来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('query: {sourceEvidence.query}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签（page 端不再展示 sourceEvidence）', () => {
    assert.ok(!PAGE_SRC.includes('loadFeasibilitySnapshot -> intelligence/feasibility + intelligence/finance-panorama'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadFeasibilitySnapshot -> buildFallbackFeasibilityReport + buildFallbackFinancePanorama'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('local feasibility samples + local budget comparison derivation'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('不可作为闭环复签证据'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('FeasibilityData — 快照合同', () => {
  it('应定义 request、report、finance 与 budget comparison 快照结构', () => {
    assert.ok(DATA_SRC.includes('export interface FeasibilityRequest'))
    assert.ok(DATA_SRC.includes('export interface FeasibilityReport'))
    assert.ok(DATA_SRC.includes('export interface FinancePanorama'))
    assert.ok(DATA_SRC.includes('budgetComparison: BudgetComparisonRow[]'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
  })

  it('应定义城市区域映射与查询参数归一化', () => {
    assert.ok(DATA_SRC.includes('export const CITY_DISTRICTS'))
    assert.ok(DATA_SRC.includes('上海'))
    assert.ok(DATA_SRC.includes('长沙'))
    assert.ok(DATA_SRC.includes('normalizeFeasibilityRequest'))
    assert.ok(DATA_SRC.includes("export type FeasibilityTab = 'report' | 'finance'"))
  })

  it('应尝试读取上游 feasibility 与 finance-panorama 接口', () => {
    assert.ok(DATA_SRC.includes("postIntelligenceData<FeasibilityReport>('intelligence/feasibility'"))
    assert.ok(DATA_SRC.includes("postIntelligenceData<FinancePanorama>('intelligence/finance-panorama'"))
    assert.ok(DATA_SRC.includes("cache: 'no-store'"))
  })

  it('失败时应回退到 fallback 样本并保留预算对比', () => {
    assert.ok(DATA_SRC.includes('buildFallbackFeasibilityReport'))
    assert.ok(DATA_SRC.includes('buildFallbackFinancePanorama'))
    assert.ok(DATA_SRC.includes('buildBudgetComparison'))
    assert.ok(DATA_SRC.includes('可行性实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('FeasibilityClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并同步 request 状态', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: FeasibilitySnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('useEffect(() => {'))
    assert.ok(CLIENT_SRC.includes('setCity(snapshot.request.city)'))
  })

  it('客户端组件应使用路由查询触发服务端快照刷新', () => {
    assert.ok(CLIENT_SRC.includes('usePathname'))
    assert.ok(CLIENT_SRC.includes('URLSearchParams'))
    assert.ok(CLIENT_SRC.includes('router.replace(`${pathname}?${params.toString()}`)'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留报告、设备、风险、预算对比和财务全景渲染', () => {
    assert.ok(CLIENT_SRC.includes('建议设备配置'))
    assert.ok(CLIENT_SRC.includes('风险因素'))
    assert.ok(CLIENT_SRC.includes('预算对比分析'))
    assert.ok(CLIENT_SRC.includes('财务全景表'))
    assert.ok(CLIENT_SRC.includes('同城平均值对比'))
  })

  it('客户端组件应保留输入约束与错误提示', () => {
    assert.ok(CLIENT_SRC.includes('请选择城市和区域'))
    assert.ok(CLIENT_SRC.includes('min={100}'))
    assert.ok(CLIENT_SRC.includes('max={1000}'))
    assert.ok(CLIENT_SRC.includes('min={50}'))
    assert.ok(CLIENT_SRC.includes('max={5000}'))
  })
})

describe('Feasibility — 反例与边界', () => {
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

  it('客户端不应继续直接 fetch feasibility 接口', () => {
    assert.ok(!CLIENT_SRC.includes('fetch('))
    assert.ok(DATA_SRC.includes('Math.max(100, request.budget - 100)'))
    assert.ok(DATA_SRC.includes('Math.min(2000, request.budget + 200)'))
  })
})
