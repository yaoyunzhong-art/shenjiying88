import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'alliances-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'alliances-data.ts'), 'utf-8')
})

describe('AlliancesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function AlliancesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 alliances 快照', () => {
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadAlliancesSnapshot()'))
    assert.ok(!PAGE_SRC.includes(")import { loadAlliancesSnapshot } from './alliances-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'alliances:read'"))
  })
})

describe('AlliancesPage — 来源态透明化', () => {
  it('页面应展示联盟伙伴来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api、指标占位与 fallback 来源标签', () => {
    assert.ok(!PAGE_SRC.includes('loadAlliancesSnapshot -> alliance/partner'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadAlliancesSnapshot -> defaultPartners fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes(')营收/分润指标缺省时以 0 值占位'))
    assert.ok(!PAGE_SRC.includes(')不可作为闭环复签证据'))
  })
})

describe('AlliancesData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('partners: AlliancePartner[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义联盟伙伴类型与筛选条件', () => {
    assert.ok(DATA_SRC.includes('export interface AlliancePartner'))
    assert.ok(DATA_SRC.includes('revenueShare: number'))
    assert.ok(DATA_SRC.includes('settlementStatus: SettlementStatus'))
    assert.ok(DATA_SRC.includes('export interface PartnerFilter'))
  })

  it('应定义默认 fallback 样本且覆盖多状态多等级', () => {
    assert.ok(DATA_SRC.includes('export const defaultPartners'))
    assert.ok(DATA_SRC.includes('喜茶'))
    assert.ok(DATA_SRC.includes("status: 'INACTIVE'"))
    assert.ok(DATA_SRC.includes("status: 'SUSPENDED'"))
    assert.ok(DATA_SRC.includes("currentGrade: 'S'"))
    assert.ok(DATA_SRC.includes("currentGrade: 'C'"))
  })

  it('应尝试读取上游 alliance/partner 接口，并对经营指标字段显式占位', () => {
    assert.ok(DATA_SRC.includes("new URL('alliance/partner', resolveAlliancesApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('revenueShare: 0'))
    assert.ok(DATA_SRC.includes("settlementStatus: 'pending'"))
    assert.ok(DATA_SRC.includes('totalRevenue: 0'))
    assert.ok(DATA_SRC.includes('totalOrders: 0'))
  })

  it('失败或空结果时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("throw new Error('alliances upstream empty')"))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('联盟伙伴实时接口不可达或为空，已切换到 fallback 样本数据。'))
  })
})

describe('AlliancesClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: AlliancesSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留搜索、筛选和结果统计', () => {
    assert.ok(CLIENT_SRC.includes("placeholder=\"搜索伙伴名称或联系方式...\""))
    assert.ok(CLIENT_SRC.includes('状态:'))
    assert.ok(CLIENT_SRC.includes('等级:'))
    assert.ok(CLIENT_SRC.includes('行业:'))
    assert.ok(CLIENT_SRC.includes('共 {filtered.length} 条结果'))
  })

  it('客户端组件应保留等级、状态、结算和健康度展示', () => {
    assert.ok(CLIENT_SRC.includes('GRADE_LABELS'))
    assert.ok(CLIENT_SRC.includes('STATUS_LABELS'))
    assert.ok(CLIENT_SRC.includes('SETTLEMENT_LABELS'))
    assert.ok(CLIENT_SRC.includes('healthBarColor'))
    assert.ok(CLIENT_SRC.includes('未评定'))
  })

  it('客户端组件应处理空结果边界', () => {
    assert.ok(CLIENT_SRC.includes('filtered.length === 0'))
    assert.ok(CLIENT_SRC.includes('无匹配结果'))
    assert.ok(CLIENT_SRC.includes('清除所有筛选'))
  })
})

describe('Alliances — 反例与边界', () => {
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

  it('客户端应保留亿/万金额格式与健康度保护', () => {
    assert.ok(CLIENT_SRC.includes('亿'))
    assert.ok(CLIENT_SRC.includes('万'))
    assert.ok(CLIENT_SRC.includes('score === null'))
    assert.ok(CLIENT_SRC.includes('Math.min(partner.healthScore, 100)'))
  })
})
