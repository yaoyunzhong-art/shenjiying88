import { getBizClient } from '../../../lib/sdk'

export interface MemberProfile {
  id: string
  phone: string
  cardNo: string
  name: string
  level: string
  balance: number
  points: number
}

export interface ConsumptionRecord {
  id: string
  orderNo: string
  time: string
  amount: number
  type: 'sale' | 'refund' | 'topup'
  description: string
}

export interface CashierShiftInfo {
  type: 'morning' | 'mid' | 'evening'
  startAt: string
  endAt: string
  duration: number
}

export interface CashierTillStatus {
  tillNo: string
  version: string
  printerOnline: boolean
  cashDrawerOpen: boolean
  scannerOnline: boolean
  networkOnline: boolean
}

export interface CashierPanelTransaction {
  id: string
  receiptNo: string
  time: string
  amount: number
  payment: string
  type: 'sale' | 'refund'
  memberName: string
}

export interface CashierDiagnostic {
  id: string
  title: string
  status: 'stable' | 'watch' | 'risk'
  detail: string
}

export interface CashierSnapshotSummary {
  transactionCount: number
  totalRevenue: number
  cashAmount: number
  mobileAmount: number
  expectedCashRemit: number
  changeFloatUsed: number
  refundCount: number
  refundTotal: number
}

export interface CashierSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'store-cashier-fallback'
  storeId: string
  cashierTitle: string
  cashierName: string
  shiftInfo: CashierShiftInfo
  tillStatus: CashierTillStatus
  transactions: CashierPanelTransaction[]
  summary: CashierSnapshotSummary
  diagnostics: CashierDiagnostic[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

const FALLBACK_MEMBERS: MemberProfile[] = [
  { id: 'm001', phone: '13800138001', cardNo: 'VIP2024001', name: '张三', level: '黄金会员', balance: 5280.5, points: 3200 },
  { id: 'm002', phone: '13800138002', cardNo: 'VIP2024002', name: '李四', level: '白银会员', balance: 1320, points: 860 },
  { id: 'm003', phone: '13800138003', cardNo: 'VIP2024003', name: '王五', level: '铂金会员', balance: 10880, points: 6850 },
]

const FALLBACK_HISTORY: Record<string, ConsumptionRecord[]> = {
  m001: [
    { id: 'c001', orderNo: 'ORD20260711001', time: '2026-07-11 20:15', amount: 128, type: 'sale', description: '主机区消费' },
    { id: 'c002', orderNo: 'ORD20260710008', time: '2026-07-10 18:30', amount: 300, type: 'topup', description: '会员充值' },
    { id: 'c003', orderNo: 'ORD20260709003', time: '2026-07-09 17:00', amount: 30, type: 'refund', description: '退款冲正' },
  ],
  m002: [
    { id: 'c004', orderNo: 'ORD20260712005', time: '2026-07-12 15:20', amount: 88, type: 'sale', description: '桌游区消费' },
  ],
  m003: [
    { id: 'c005', orderNo: 'ORD20260713001', time: '2026-07-13 11:10', amount: 500, type: 'topup', description: '会员充值' },
    { id: 'c006', orderNo: 'ORD20260713002', time: '2026-07-13 19:50', amount: 168, type: 'sale', description: 'VR 区消费' },
  ],
}

export const CASHIER_TRANSACTIONS: CashierPanelTransaction[] = [
  { id: 'log1', receiptNo: 'REC20260711-001', time: '20:15', amount: 128, payment: '微信支付', type: 'sale', memberName: '张三' },
  { id: 'log2', receiptNo: 'REC20260711-002', time: '19:30', amount: 58, payment: '现金', type: 'sale', memberName: '李四' },
  { id: 'log3', receiptNo: 'REC20260711-003', time: '18:00', amount: 30, payment: '微信', type: 'refund', memberName: '王五' },
]

export function buildCashierSummary(transactions: CashierPanelTransaction[]): CashierSnapshotSummary {
  return {
    transactionCount: transactions.length,
    totalRevenue: transactions.filter((item) => item.type === 'sale').reduce((sum, item) => sum + item.amount, 0),
    cashAmount: 3200,
    mobileAmount: 5450,
    expectedCashRemit: 3100,
    changeFloatUsed: 100,
    refundCount: transactions.filter((item) => item.type === 'refund').length,
    refundTotal: transactions.filter((item) => item.type === 'refund').reduce((sum, item) => sum + item.amount, 0),
  }
}

export function buildCashierDiagnostics(storeId: string): CashierDiagnostic[] {
  return [
    {
      id: 'cashier-source',
      title: '收银首屏来源态透明',
      status: 'stable',
      detail: `门店 ${storeId} 首屏面板通过 snapshot loader 下发，刷新统一回源 page wrapper。`,
    },
    {
      id: 'cashier-member',
      title: '会员检索优先走 SDK',
      status: 'watch',
      detail: '会员查询优先调用 @m5/sdk，SDK 不可用时回退本地样本以保证演示闭环。',
    },
    {
      id: 'cashier-checkout',
      title: '结账动作仍为演示态',
      status: 'risk',
      detail: '收银结账与交班写链路尚未实装，当前仅保留结构固证与交互演示。',
    },
  ]
}

export async function loadCashierSnapshot(storeId: string): Promise<CashierSnapshot> {
  const transactions = CASHIER_TRANSACTIONS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-cashier-fallback',
    storeId,
    cashierTitle: '会员收银',
    cashierName: '收银员',
    shiftInfo: { type: 'morning', startAt: '08:00', endAt: '16:00', duration: 8 },
    tillStatus: {
      tillNo: 'POS-01',
      version: 'v3.2.1',
      printerOnline: true,
      cashDrawerOpen: false,
      scannerOnline: true,
      networkOnline: true,
    },
    transactions,
    summary: buildCashierSummary(transactions),
    diagnostics: buildCashierDiagnostics(storeId),
    generatedAt: '2026-07-27T18:15:00.000Z',
    controlPlaneSource: 'loadCashierSnapshot fallback -> CASHIER_TRANSACTIONS + buildCashierSummary',
    businessDataSource: 'local cashier panel samples + SDK member lookup with fallback directory',
    refreshPath: `CashierPage -> loadCashierSnapshot(${storeId})`,
    note: '当前页面首屏消费本地收银快照，会员检索优先走 SDK，失败时降级到 fallback 样本，不作为正式收银复签证据。',
    error: '收银写链路尚未完成真实闭环，当前保留来源态固证与交互演示。',
  }
}

export async function searchMember(query: string): Promise<MemberProfile | null> {
  const keyword = query.trim()
  if (!keyword) {
    return null
  }

  const biz = getBizClient()
  if (biz) {
    try {
      const result = await biz.cashier.lookupMember(keyword)
      if (result) {
        return {
          id: result.id,
          phone: result.phone,
          cardNo: result.memberNo,
          name: result.name,
          level: result.tier,
          balance: 0,
          points: result.points,
        }
      }
    } catch {
      // SDK 失败时回退到样本，保证结构演示可继续
    }
  }

  const lowerKeyword = keyword.toLowerCase()
  return (
    FALLBACK_MEMBERS.find(
      (member) =>
        member.phone.includes(keyword) ||
        member.cardNo.toLowerCase().includes(lowerKeyword) ||
        member.name.includes(keyword),
    ) ?? null
  )
}

export async function fetchConsumptionHistory(memberId: string): Promise<ConsumptionRecord[]> {
  const biz = getBizClient()
  if (biz) {
    try {
      const txns = await biz.cashier.listMemberTransactions(memberId)
      if (txns && txns.length > 0) {
        return txns.map((tx) => ({
          id: tx.orderId,
          orderNo: tx.orderNo || tx.orderId,
          time: tx.createdAt,
          amount: (tx.totalAmount || 0) / 100,
          type: tx.paymentStatus === 'REFUNDED' ? 'refund' : tx.paymentStatus === 'TOPUP' ? 'topup' : 'sale',
          description: `订单 ${tx.orderNo || tx.orderId}`,
        }))
      }
    } catch {
      // SDK 失败时回退到样本，保证结构演示可继续
    }
  }

  return (FALLBACK_HISTORY[memberId] ?? []).map((item) => ({ ...item }))
}
