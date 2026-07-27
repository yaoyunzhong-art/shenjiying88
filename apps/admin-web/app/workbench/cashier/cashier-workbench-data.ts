import { mapToBackendRole } from '@m5/types'

import { getBizClient } from '../../lib/sdk'

export interface CashierSession {
  id: string
  date: string
  startTime: string
  endTime: string
  openingBalance: number
  cashRevenue: number
  cardRevenue: number
  onlineRevenue: number
  refundAmount: number
  expectedTotal: number
  actualTotal: number
  difference: number
  transactionCount: number
  status: 'open' | 'closed' | 'pending_review'
}

export interface RecentTransaction {
  id: string
  time: string
  type: 'sale' | 'recharge' | 'refund'
  amount: number
  method: string
  customer: string
}

export interface CashierWorkbenchSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'cashier-workbench-api' | 'cashier-workbench-fallback'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  session: CashierSession
  recentTxns: RecentTransaction[]
  backendRole: string | null
  usesOperatorBridge: boolean
}

type CashierOrder = {
  paymentStatus?: string
  status?: string
  refundedAmount?: number
  createdAt?: string
  totalAmount?: number
  memberId?: string
}

type CashierChannelStat = {
  channel: string
  today: number
}

const FALLBACK_SESSION: CashierSession = {
  id: 'CS001',
  date: '2026-07-11',
  startTime: '08:00',
  endTime: '—',
  openingBalance: 2000,
  cashRevenue: 3850,
  cardRevenue: 2120,
  onlineRevenue: 5680,
  refundAmount: 360,
  expectedTotal: 3850 + 2120 + 5680 - 360,
  actualTotal: 3850 + 2120 + 5680 - 358,
  difference: 2,
  transactionCount: 86,
  status: 'open',
}

function generateFallbackTxns(): RecentTransaction[] {
  return Array.from({ length: 10 }, (_, index) => {
    const date = new Date(Date.now() - index * 1_200_000)
    const types = ['sale', 'sale', 'sale', 'recharge', 'refund'] as const
    const type = types[Math.floor(Math.random() * types.length)]

    return {
      id: `TXN-${index + 1}`,
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      type,
      amount: Math.round((20 + Math.random() * 300) * 100) / 100,
      method: ['现金', '微信', '支付宝', '会员卡', '银联'][Math.floor(Math.random() * 5)]!,
      customer: ['散客', '张明', '李华', '王芳', '会员'][Math.floor(Math.random() * 5)]!,
    }
  })
}

export async function loadCashierWorkbenchSnapshot(): Promise<CashierWorkbenchSnapshot> {
  const backendRole = mapToBackendRole('CASHIER') ?? null
  const usesOperatorBridge = backendRole === 'operator'
  const biz = getBizClient()

  if (biz) {
    try {
      const [orders, channelStats] = (await Promise.all([
        biz.orders.list({ limit: 10 }).catch(() => null),
        biz.cashier.getChannelStats().catch(() => null),
      ])) as [CashierOrder[] | null, CashierChannelStat[] | null]

      const now = new Date()
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate(),
      ).padStart(2, '0')}`

      let cashRevenue = 0
      let cardRevenue = 0
      let onlineRevenue = 0
      let refundAmount = 0

      if (channelStats) {
        for (const item of channelStats) {
          if (item.channel === 'CASH') cashRevenue = item.today
          else if (item.channel === 'CARD') cardRevenue = item.today
          else onlineRevenue += item.today
        }
      }

      if (orders) {
        refundAmount = orders
          .filter((order) => order.paymentStatus === 'REFUNDED' || order.status === 'refunded')
          .reduce((sum, order) => sum + (order.refundedAmount || 0), 0)
      }

      const recentTxns: RecentTransaction[] = (orders ?? []).slice(0, 10).map((order, index) => ({
        id: `TXN-${index + 1}`,
        time: order.createdAt ? order.createdAt.slice(11, 16) : '--:--',
        type: order.paymentStatus === 'REFUNDED' ? 'refund' : 'sale',
        amount: (order.totalAmount || 0) / 100,
        method: '在线',
        customer: order.memberId?.slice(0, 4) ?? '--',
      }))

      return {
        deliveryMode: 'api',
        sourceLabel: 'cashier-workbench-api',
        generatedAt: new Date().toISOString(),
        controlPlaneSource: 'loadCashierWorkbenchSnapshot -> getBizClient() browser SDK session bridge',
        businessDataSource: 'biz.orders.list + biz.cashier.getChannelStats',
        refreshPath: 'loadCashierWorkbenchSnapshot(root)',
        note:
          '当前页面已命中浏览器 SDK 业务数据，若交易列表为空则保留 fallback 样本兜底；服务端首屏仍可能因无浏览器上下文而退化。',
        session: {
          id: `CS-${dateStr}`,
          date: dateStr,
          startTime: '08:00',
          endTime: '—',
          openingBalance: 2000,
          cashRevenue: cashRevenue / 100,
          cardRevenue: cardRevenue / 100,
          onlineRevenue: onlineRevenue / 100,
          refundAmount: refundAmount / 100,
          expectedTotal: (cashRevenue + cardRevenue + onlineRevenue - refundAmount) / 100,
          actualTotal: (cashRevenue + cardRevenue + onlineRevenue - refundAmount) / 100,
          difference: 0,
          transactionCount: orders?.length ?? 0,
          status: 'open',
        },
        recentTxns: recentTxns.length > 0 ? recentTxns : generateFallbackTxns(),
        backendRole,
        usesOperatorBridge,
      }
    } catch {
      // browser SDK 不可用时继续走 fallback，保证 E54 壳层首屏稳定
    }
  }

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'cashier-workbench-fallback',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadCashierWorkbenchSnapshot fallback -> server snapshot shell without browser SDK',
    businessDataSource: 'FALLBACK_SESSION + generateFallbackTxns',
    refreshPath: 'loadCashierWorkbenchSnapshot(root)',
    note:
      '服务端快照当前无法直接复用浏览器侧 SDK，本轮先保留收银工作台 fallback 首屏与来源态透明化，后续再深化真替换。',
    session: FALLBACK_SESSION,
    recentTxns: generateFallbackTxns(),
    backendRole,
    usesOperatorBridge,
  }
}
