import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'payment-channels-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'payment-channels-data.ts'), 'utf-8')
})

describe('PaymentChannelsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function PaymentChannelsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 payment channels 快照', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadPaymentChannelsSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadPaymentChannelsSnapshot } from './payment-channels-data'"))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'payment-channels:read'"))
  })
})

describe('PaymentChannelsPage — 来源态透明化', () => {
  it('页面应展示支付渠道来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应同时固证 api 与 fallback 来源标签（page 端不再展示 sourceEvidence）', () => {
    assert.ok(!PAGE_SRC.includes('loadPaymentChannelsSnapshot -> cashier/channels'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('loadPaymentChannelsSnapshot -> defaultChannels fallback'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('local payment channel samples'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('不可作为闭环复签证据'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('PaymentChannelsData — 快照合同', () => {
  it('应定义 api|fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes('channels: PaymentChannel[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应定义默认 fallback 样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultChannels'))
    assert.ok(DATA_SRC.includes('微信支付'))
    assert.ok(DATA_SRC.includes('支付宝'))
    assert.ok(DATA_SRC.includes('银联刷卡'))
  })

  it('应尝试读取上游 cashier/channels 接口', () => {
    assert.ok(DATA_SRC.includes("new URL('cashier/channels', resolvePaymentChannelsApiBaseUrl())"))
    assert.ok(DATA_SRC.includes('unwrapApiPayload<{ channels: PaymentChannel[] }>'))
  })

  it('失败时应回退到 fallback 样本并返回错误提示', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes('支付渠道实时接口不可达，已切换到 fallback 样本数据。'))
  })
})

describe('PaymentChannelsClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并渲染 error', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: PaymentChannelsSnapshotDelivery'))
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
  })

  it('客户端组件应支持刷新按钮并触发 router.refresh', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留 tabs、列表和空态', () => {
    assert.ok(CLIENT_SRC.includes("type ChanTab = 'online' | 'offline' | 'all'"))
    assert.ok(CLIENT_SRC.includes('线上支付'))
    assert.ok(CLIENT_SRC.includes('线下支付'))
    assert.ok(CLIENT_SRC.includes('暂无支付渠道'))
    assert.ok(CLIENT_SRC.includes('.map('))
  })

  it('客户端组件应保留费率、健康检查和状态展示', () => {
    assert.ok(CLIENT_SRC.includes('费率:'))
    assert.ok(CLIENT_SRC.includes('健康检查:'))
    assert.ok(CLIENT_SRC.includes('statusColor'))
    assert.ok(CLIENT_SRC.includes('providerIcon'))
  })
})

describe('PaymentChannels — 反例与边界', () => {
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

  it('客户端应处理空列表边界', () => {
    assert.ok(CLIENT_SRC.includes('filtered.length === 0'))
    assert.ok(CLIENT_SRC.includes('当前筛选条件下没有支付渠道'))
  })
})
