export type BudgetStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED'
export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

export interface BudgetItem {
  id: string
  tenantId: string
  name: string
  category: string
  totalCents: number
  usedCents: number
  remainingCents: number
  currency: string
  period: BudgetPeriod
  status: BudgetStatus
  version: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface ApprovalRequest {
  id: string
  budgetId: string
  budgetName: string
  requester: string
  amountCents: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  version: number
  createdAt: string
}

export interface BudgetSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  budgets: BudgetItem[]
  approvals: ApprovalRequest[]
  generatedAt: string
  error?: string
}

export const defaultBudgets: BudgetItem[] = [
  {
    id: 'bgt-001',
    tenantId: 'demo-tenant',
    name: 'Q3 市场推广预算',
    category: '市场',
    totalCents: 50000000,
    usedCents: 12500000,
    remainingCents: 37500000,
    currency: 'CNY',
    period: 'QUARTERLY',
    status: 'ACTIVE',
    version: 3,
    notes: '含渠道投放与线下活动',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-15T10:00:00.000Z',
  },
  {
    id: 'bgt-002',
    tenantId: 'demo-tenant',
    name: '7月运营费用预算',
    category: '运营',
    totalCents: 20000000,
    usedCents: 8500000,
    remainingCents: 11500000,
    currency: 'CNY',
    period: 'MONTHLY',
    status: 'ACTIVE',
    version: 2,
    notes: '服务器、人工、客服',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-14T08:00:00.000Z',
  },
  {
    id: 'bgt-003',
    tenantId: 'demo-tenant',
    name: '待审批市场追加预算',
    category: '市场',
    totalCents: 15000000,
    usedCents: 0,
    remainingCents: 15000000,
    currency: 'CNY',
    period: 'MONTHLY',
    status: 'PENDING',
    version: 1,
    notes: '追加投放预算',
    createdAt: '2026-07-16T00:00:00.000Z',
    updatedAt: '2026-07-16T00:00:00.000Z',
  },
]

export const defaultApprovals: ApprovalRequest[] = [
  {
    id: 'apr-001',
    budgetId: 'bgt-003',
    budgetName: '待审批市场追加预算',
    requester: 'zhang@example.com',
    amountCents: 15000000,
    reason: 'Q3 追加线上投放预算',
    status: 'PENDING',
    version: 1,
    createdAt: '2026-07-16T00:00:00.000Z',
  },
  {
    id: 'apr-002',
    budgetId: 'bgt-002',
    budgetName: '7月运营费用预算',
    requester: 'li@example.com',
    amountCents: 3000000,
    reason: '紧急服务器扩容费用',
    status: 'APPROVED',
    version: 2,
    createdAt: '2026-07-14T08:00:00.000Z',
  },
]

function getLatestBudgetTimestamp(budgets: BudgetItem[], approvals: ApprovalRequest[]): string {
  const timestamps = [...budgets.map((item) => item.updatedAt), ...approvals.map((item) => item.createdAt)]
  if (timestamps.length === 0) return '—'
  return timestamps.reduce((latest, current) => (current > latest ? current : latest), timestamps[0]!)
}

export async function loadBudgetSnapshot(): Promise<BudgetSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    budgets: defaultBudgets,
    approvals: defaultApprovals,
    generatedAt: getLatestBudgetTimestamp(defaultBudgets, defaultApprovals),
    error: '预算实时接口尚未接入，当前展示 fallback 样本数据。',
  }
}
