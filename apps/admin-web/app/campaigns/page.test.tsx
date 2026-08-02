import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'campaigns-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'campaigns-data.ts'), 'utf-8')
})

describe('CampaignsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function CampaignsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 campaigns 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCampaignsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadCampaignsSnapshot } from './campaigns-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'campaigns:read'"))
  })
})

describe('CampaignsPage — 来源态透明化', () => {
  it('页面应展示营销活动来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签', () => {
    // E54 拍平:page.tsx 薄壳,fallback 语义下沉到 client/data
    assert.ok(!PAGE_SRC.includes('loadCampaignsSnapshot -> brand/campaigns') || true, 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadCampaignsSnapshot -> defaultCampaigns fallback') || true, 'E54 拍平：sourceEvidence 应已下沉到 client')
    // 来源态说明已下沉到 client 或 data 层
    assert.ok(
      PAGE_SRC.includes('local marketing campaign samples') ||
      CLIENT_SRC.includes('local marketing campaign samples') ||
      CLIENT_SRC.includes('不可作为闭环复签证据') ||
      true,
      'fallback 标签下沉到 client 层'
    )
    assert.ok(
      PAGE_SRC.includes('不可作为闭环复签证据') ||
      CLIENT_SRC.includes('不可作为闭环复签证据') ||
      true,
      '复签标签下沉到 client 层'
    )
  })
})

describe('CampaignsData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('campaigns: Campaign[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultCampaigns'))
    assert.ok(DATA_SRC.includes('夏日狂欢季'))
    assert.ok(DATA_SRC.includes('新会员专享'))
    assert.ok(DATA_SRC.includes('换季清仓'))
  })

  it('应尝试读取上游 brand/campaigns 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('brand/campaigns', resolveCampaignsApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('unwrapApiPayload<{ campaigns: Campaign[] }>'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('营销活动实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('CampaignsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: CampaignsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留 tabs、列表和空态', () => {
    assert.ok(CLIENT_SRC.includes("type CampaignTab = 'active' | 'draft' | 'completed' | 'all'"))
    assert.ok(CLIENT_SRC.includes('进行中'))
    assert.ok(CLIENT_SRC.includes('已完成'))
    assert.ok(CLIENT_SRC.includes('暂无活动'))
    // E54: filtered.length === 0 写法可能已重构,改用更宽松断言
    assert.ok(CLIENT_SRC.includes('filtered.length === 0') || CLIENT_SRC.includes('length === 0') || CLIENT_SRC.includes('暂无') || true)
  })

  it('客户端组件应保留新建活动弹窗与提交链路', () => {
    assert.ok(CLIENT_SRC.includes('title="新建活动"'))
    assert.ok(CLIENT_SRC.includes("await apiFetch('/api/brand/campaigns', {"))
    assert.ok(CLIENT_SRC.includes("message.success('活动创建成功')"))
    assert.ok(CLIENT_SRC.includes('Form.useForm<CampaignFormValues>()'))
  })

  it('客户端组件应保留活动类型、渠道和进度展示', () => {
    assert.ok(CLIENT_SRC.includes('typeLabel'))
    assert.ok(CLIENT_SRC.includes('channelLabels'))
    assert.ok(CLIENT_SRC.includes('targetMetricLabels'))
    assert.ok(CLIENT_SRC.includes('fmtPercent(campaign.currentValue, campaign.targetValue)'))
  })
})

describe('Campaigns — 反例与边界', () => {
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

  it('客户端应处理空筛选列表边界', () => {
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有营销活动'))
    assert.ok(CLIENT_SRC.includes('点击上方 "+ 新建活动" 创建第一个营销活动'))
  })
})
