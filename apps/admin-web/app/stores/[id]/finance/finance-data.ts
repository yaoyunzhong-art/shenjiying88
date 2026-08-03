export type FinanceTransactionType = '营收' | '支出'
export type FinanceTransactionStatus = 'settled' | 'pending'

export interface FinanceTransaction {
  id: string
  date: string
  type: FinanceTransactionType
  category: string
  amount: number
  method: string
  status: FinanceTransactionStatus
}

export interface FinanceBreakdownItem {
  label: string
  amount: number
  percent: number
  color: string
}

export interface FinanceSnapshotSummary {
  totalIncome: number
  totalExpense: number
  netProfit: number
  pendingSettle: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
  todayRevenue: number
  monthlyRevenue: number
  grossMargin: number
}

export interface FinanceSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-finance-mock'
  storeId: string
  transactions: FinanceTransaction[]
  incomeBreakdown: FinanceBreakdownItem[]
  expenseBreakdown: FinanceBreakdownItem[]
  summary: FinanceSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const FINANCE_TRANSACTIONS: FinanceTransaction[] = [
  { id: 'T001', date: '2026-07-12', type: '营收', category: '游戏收入', amount: 12800, method: '微信', status: 'settled' },
  { id: 'T002', date: '2026-07-12', type: '营收', category: '饮品销售', amount: 3200, method: '支付宝', status: 'settled' },
  { id: 'T003', date: '2026-07-11', type: '支出', category: '电费', amount: -4500, method: '对公', status: 'settled' },
  { id: 'T004', date: '2026-07-11', type: '营收', category: '会员充值', amount: 8900, method: '微信', status: 'pending' },
  { id: 'T005', date: '2026-07-10', type: '支出', category: '设备维护', amount: -2800, method: '现金', status: 'settled' },
  { id: 'T006', date: '2026-07-10', type: '营收', category: '门票收入', amount: 5600, method: '微信', status: 'settled' },
  { id: 'T007', date: '2026-07-09', type: '营收', category: '游戏收入', amount: 10200, method: '支付宝', status: 'settled' },
  { id: 'T008', date: '2026-07-09', type: '支出', category: '采购', amount: -3200, method: '转账', status: 'settled' },
  { id: 'T009', date: '2026-07-08', type: '营收', category: '饮品销售', amount: 2800, method: '现金', status: 'settled' },
  { id: 'T010', date: '2026-07-07', type: '营收', category: '会员充值', amount: 15000, method: '微信', status: 'pending' },
  { id: 'T011', date: '2026-07-07', type: '支出', category: '人力成本', amount: -28000, method: '对公', status: 'settled' },
  { id: 'T012', date: '2026-07-06', type: '营收', category: '游戏收入', amount: 14500, method: '微信', status: 'settled' },
]

function buildFinanceBreakdown(
  sourceTotal: number,
  items: Array<{ label: string; ratio: number; color: string }>
): FinanceBreakdownItem[] {
  return items.map((item) => ({
    label: item.label,
    amount: Math.round(sourceTotal * item.ratio),
    percent: Math.round(item.ratio * 100),
    color: item.color,
  }))
}

export function buildFinanceSummary(
  transactions: FinanceTransaction[]
): FinanceSnapshotSummary {
  const totalIncome = transactions
    .filter((item) => item.type === '营收')
    .reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = transactions
    .filter((item) => item.type === '支出')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0)
  const pendingSettle = transactions
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + item.amount, 0)
  const incomeCount = transactions.filter((item) => item.type === '营收').length
  const expenseCount = transactions.filter((item) => item.type === '支出').length
  const netProfit = totalIncome - totalExpense

  return {
    totalIncome,
    totalExpense,
    netProfit,
    pendingSettle,
    transactionCount: transactions.length,
    incomeCount,
    expenseCount,
    todayRevenue: 12800,
    monthlyRevenue: totalIncome,
    grossMargin: totalIncome ? Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)) : 0,
  }
}

export async function loadFinanceSnapshot(storeId: string): Promise<FinanceSnapshot> {
  const transactions = FINANCE_TRANSACTIONS.map((item) => ({ ...item }))
  const summary = buildFinanceSummary(transactions)

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-finance-mock',
    storeId,
    transactions,
    incomeBreakdown: buildFinanceBreakdown(summary.totalIncome, [
      { label: '游戏收入', ratio: 0.45, color: '#6366f1' },
      { label: '会员充值', ratio: 0.35, color: '#8b5cf6' },
      { label: '饮品销售', ratio: 0.12, color: '#14b8a6' },
      { label: '门票收入', ratio: 0.08, color: '#06b6d4' },
    ]),
    expenseBreakdown: buildFinanceBreakdown(summary.totalExpense, [
      { label: '人力成本', ratio: 0.7, color: '#f59e0b' },
      { label: '水电费用', ratio: 0.15, color: '#ec4899' },
      { label: '设备维护', ratio: 0.1, color: '#f97316' },
      { label: '采购', ratio: 0.05, color: '#a855f7' },
    ]),
    summary,
    generatedAt: '2026-07-27T16:10:00.000Z',
    controlPlaneSource: 'loadFinanceSnapshot -> FINANCE_TRANSACTIONS + buildFinanceSummary',
    businessDataSource: 'local finance samples + derived income/expense breakdown',
    refreshPath: `FinancePage -> loadFinanceSnapshot(${storeId})`,
    note: '当前门店财务页消费本地 finance snapshot loader，已显式暴露来源态、刷新路径与假写边界，不作为实时财务复签证据。',
    error: '门店财务控制面尚未接入实时账务上游，当前展示 mock 快照。',
  }
}
