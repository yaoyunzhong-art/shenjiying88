import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'discrepancy-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'discrepancy-detail-data.ts'), 'utf-8')
})

describe('DiscrepancyDetailPage — 服务端壳层', () => {
  it('页面应为 async server component 并消费动态路由参数', () => {
    assert.ok(PAGE_SRC.includes('export default async function DiscrepancyDetailPage'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载差异快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadDiscrepancyDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes("import { loadDiscrepancyDetailSnapshot } from './discrepancy-detail-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入差异详情权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'finance:reconciliation:discrepancies:id:read'"))
  })
})

describe('DiscrepancyDetailPage — 来源态透明化', () => {
  it('页面应展示差异详情来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('{sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('刷新路径:'))
    assert.ok(PAGE_SRC.includes('{sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('页面应同时固证 api 与 fallback 来源口径', () => {
    assert.ok(PAGE_SRC.includes('loadDiscrepancyDetailSnapshot -> finance/reconciliation/[id]'))
    assert.ok(PAGE_SRC.includes('loadDiscrepancyDetailSnapshot -> defaultDetail fallback'))
    assert.ok(PAGE_SRC.includes('local discrepancy detail sample'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('DiscrepancyDetailData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('detail: DiscrepancyDetail'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本与格式化工具', () => {
    assert.ok(DATA_SRC.includes('export function defaultDetail(id: string)'))
    assert.ok(DATA_SRC.includes('ORD-20260715-0042'))
    assert.ok(DATA_SRC.includes('export function fmtCents('))
    assert.ok(DATA_SRC.includes('export function diffKindLabel('))
    assert.ok(DATA_SRC.includes('export function diffKindColor('))
  })

  it('应提供 loader 与写链路 helper', () => {
    assert.ok(DATA_SRC.includes('export async function loadDiscrepancyDetailSnapshot('))
    assert.ok(DATA_SRC.includes('export async function submitDiscrepancyAdjustment('))
    assert.ok(DATA_SRC.includes('export async function resolveDiscrepancy('))
    assert.ok(DATA_SRC.includes('async function apiFetch<T>('))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('对账差异详情实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('DiscrepancyDetailClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并初始化本地态', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: DiscrepancyDetailSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('const [detail, setDetail] = useState(snapshot.detail)'))
    assert.ok(CLIENT_SRC.includes('snapshot.error ?? null'))
  })

  it('客户端组件应支持 router.refresh 与返回导航', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('router.back()'))
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留调账、处理与时间线交互', () => {
    assert.ok(CLIENT_SRC.includes('submitDiscrepancyAdjustment'))
    assert.ok(CLIENT_SRC.includes('resolveDiscrepancy'))
    assert.ok(CLIENT_SRC.includes('手动调账'))
    assert.ok(CLIENT_SRC.includes('提交调账'))
    assert.ok(CLIENT_SRC.includes('标记已处理'))
    assert.ok(CLIENT_SRC.includes('OperationLogTimeline'))
  })

  it('客户端组件应保留详情信息和卡片展示', () => {
    assert.ok(CLIENT_SRC.includes('总差额'))
    assert.ok(CLIENT_SRC.includes('内部交易信息'))
    assert.ok(CLIENT_SRC.includes('外部交易信息'))
    assert.ok(CLIENT_SRC.includes('对账快照'))
    assert.ok(CLIENT_SRC.includes('差异说明'))
  })
})

describe('DiscrepancyDetail — 反例与边界', () => {
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

  it('客户端不应再从页面层 useEffect/useParams 拉首屏数据', () => {
    assert.ok(!PAGE_SRC.includes('useEffect'))
    assert.ok(!CLIENT_SRC.includes('useParams'))
    assert.ok(!CLIENT_SRC.includes('loadDetail()'))
  })
})

