import {
  createBusinessClient,
  getDefaultApiBaseUrl,
  type BusinessFinanceLedgerRecord,
  type BusinessRevenueSummary,
} from '@m5/sdk';
import {
  buildStorefrontScopeHeaders,
  formatCurrency,
  resolveStorefrontScope,
  type StorefrontScope,
} from './storefront-transactions';

export type FinanceRange = 'all' | 'week' | 'month';
export type FinanceRecordType = 'income' | 'expense' | 'refund' | 'adjustment';

export type StorefrontLedgerRecord = BusinessFinanceLedgerRecord;

export type StorefrontRevenueSummary = BusinessRevenueSummary;

export interface FinanceOverviewCard {
  label: string;
  value: string;
  color: string;
  hint?: string;
}

export interface FinanceRecordViewModel {
  id: string;
  date: string;
  timestamp: string;
  type: FinanceRecordType;
  typeLabel: string;
  category: string;
  amount: number;
  amountLabel: string;
  description: string;
  statusLabel: string;
  statusColor: string;
  orderIdLabel: string;
  transactionIdLabel: string;
}

export interface FinanceTrendPoint {
  month: string;
  revenue: number;
  expense: number;
  refund: number;
  netRevenue: number;
  transactionCount: number;
}

export interface StorefrontFinanceDashboard {
  summary: StorefrontRevenueSummary;
  records: FinanceRecordViewModel[];
  trend: FinanceTrendPoint[];
  overviewCards: FinanceOverviewCard[];
}

function createStorefrontFinanceClient(scope?: StorefrontScope) {
  const resolvedScope = resolveStorefrontScope(scope);
  const client = createBusinessClient(getDefaultApiBaseUrl());
  const init: RequestInit = {
    cache: 'no-store',
    headers: buildStorefrontScopeHeaders(resolvedScope),
  };

  return {
    getRevenueSummary: (query: { startDate: string; endDate: string }) =>
      client.finance.getRevenueSummary(
        {
          storeId: resolvedScope.storeId,
          startDate: query.startDate,
          endDate: query.endDate,
        },
        init,
      ),
    listLedgers: (query: { recordedAfter: string; recordedBefore: string; limit: number }) =>
      client.finance.listLedgers(
        {
          storeId: resolvedScope.storeId,
          recordedAfter: query.recordedAfter,
          recordedBefore: query.recordedBefore,
          limit: query.limit,
        },
        init,
      ),
  };
}

export function getFinanceTypeLabel(type: FinanceRecordType) {
  switch (type) {
    case 'income':
      return '收入';
    case 'expense':
      return '支出';
    case 'refund':
      return '退款';
    case 'adjustment':
      return '调整';
    default:
      return '未知';
  }
}

export function getFinanceTypeColor(type: FinanceRecordType) {
  switch (type) {
    case 'income':
      return '#34d399';
    case 'expense':
      return '#f87171';
    case 'refund':
      return '#fbbf24';
    case 'adjustment':
      return '#60a5fa';
    default:
      return '#94a3b8';
  }
}

export function mapLedgerTypeToFinanceType(
  type: StorefrontLedgerRecord['type'],
): FinanceRecordType {
  switch (type) {
    case 'REVENUE':
      return 'income';
    case 'EXPENSE':
      return 'expense';
    case 'REFUND':
      return 'refund';
    case 'ADJUSTMENT':
      return 'adjustment';
    default:
      return 'adjustment';
  }
}

export function getFinanceRangeStart(range: FinanceRange, now = new Date()) {
  const start = new Date(now);
  if (range === 'week') {
    start.setUTCDate(start.getUTCDate() - 6);
  } else if (range === 'month') {
    start.setUTCDate(start.getUTCDate() - 29);
  } else {
    start.setUTCMonth(start.getUTCMonth() - 5);
    start.setUTCDate(1);
  }
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function getFinanceRangeLabel(range: FinanceRange) {
  switch (range) {
    case 'week':
      return '近 7 天';
    case 'month':
      return '近 30 天';
    case 'all':
    default:
      return '近 6 个月';
  }
}

export function buildFinanceQueryWindow(range: FinanceRange, now = new Date()) {
  const start = getFinanceRangeStart(range, now);
  const end = new Date(now);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function mapLedgerToFinanceRecord(
  ledger: StorefrontLedgerRecord,
): FinanceRecordViewModel {
  const type = mapLedgerTypeToFinanceType(ledger.type);
  const signedAmount = type === 'income' ? ledger.amount : -ledger.amount;

  return {
    id: ledger.id,
    date: new Date(ledger.recordedAt).toLocaleDateString('zh-CN'),
    timestamp: new Date(ledger.recordedAt).toLocaleString('zh-CN'),
    type,
    typeLabel: getFinanceTypeLabel(type),
    category: ledger.category ?? getFinanceTypeLabel(type),
    amount: signedAmount,
    amountLabel: `${signedAmount >= 0 ? '+' : '-'}${formatCurrency(Math.abs(ledger.amount))}`,
    description: ledger.description,
    statusLabel: '已入账',
    statusColor: '#34d399',
    orderIdLabel: ledger.orderId ?? '-',
    transactionIdLabel: ledger.transactionId ?? '-',
  };
}

export function buildFinanceTrend(
  ledgers: StorefrontLedgerRecord[],
  now = new Date(),
  monthCount = 6,
): FinanceTrendPoint[] {
  const buckets = new Map<string, FinanceTrendPoint>();

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    buckets.set(month, {
      month,
      revenue: 0,
      expense: 0,
      refund: 0,
      netRevenue: 0,
      transactionCount: 0,
    });
  }

  for (const ledger of ledgers) {
    const bucketKey = ledger.recordedAt.slice(0, 7);
    const bucket = buckets.get(bucketKey);
    if (!bucket) {
      continue;
    }

    bucket.transactionCount += 1;
    if (ledger.type === 'REVENUE') {
      bucket.revenue += ledger.amount;
    } else if (ledger.type === 'EXPENSE') {
      bucket.expense += ledger.amount;
    } else if (ledger.type === 'REFUND') {
      bucket.refund += ledger.amount;
    } else if (ledger.type === 'ADJUSTMENT') {
      bucket.revenue += ledger.amount;
    }

    bucket.netRevenue = bucket.revenue - bucket.expense - bucket.refund;
  }

  return Array.from(buckets.values());
}

export function buildFinanceOverviewCards(
  summary: StorefrontRevenueSummary,
  trend: FinanceTrendPoint[],
): FinanceOverviewCard[] {
  const latest = trend[trend.length - 1];
  const previous = trend.length >= 2 ? trend[trend.length - 2] : undefined;
  const monthGrowth = previous && previous.revenue > 0
    ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
    : 0;

  return [
    {
      label: '总营收',
      value: formatCurrency(summary.totalRevenue),
      color: '#34d399',
      hint: `${monthGrowth >= 0 ? '↑' : '↓'} ${Math.abs(monthGrowth).toFixed(1)}%`,
    },
    {
      label: '总退款',
      value: formatCurrency(summary.totalRefund),
      color: '#fbbf24',
    },
    {
      label: '总支出',
      value: formatCurrency(summary.totalExpense),
      color: '#f87171',
    },
    {
      label: '净收入',
      value: formatCurrency(summary.netRevenue),
      color: summary.netRevenue >= 0 ? '#60a5fa' : '#f87171',
    },
    {
      label: '流水笔数',
      value: String(summary.transactionCount),
      color: '#a78bfa',
    },
  ];
}

export async function getStorefrontRevenueSummary(
  range: FinanceRange,
  scope?: StorefrontScope,
) {
  const client = createStorefrontFinanceClient(scope);
  const { startDate, endDate } = buildFinanceQueryWindow(range);
  return client.getRevenueSummary({ startDate, endDate });
}

export async function listStorefrontLedgerRecords(
  range: FinanceRange,
  scope?: StorefrontScope,
) {
  const client = createStorefrontFinanceClient(scope);
  const { startDate, endDate } = buildFinanceQueryWindow(range);
  return client.listLedgers({
    recordedAfter: startDate,
    recordedBefore: endDate,
    limit: 200,
  });
}

export async function loadStorefrontFinanceDashboard(
  range: FinanceRange,
  scope?: StorefrontScope,
): Promise<StorefrontFinanceDashboard> {
  const [summary, ledgers] = await Promise.all([
    getStorefrontRevenueSummary(range, scope),
    listStorefrontLedgerRecords(range, scope),
  ]);

  const records = ledgers.map(mapLedgerToFinanceRecord);
  const trend = buildFinanceTrend(ledgers);

  return {
    summary,
    records,
    trend,
    overviewCards: buildFinanceOverviewCards(summary, trend),
  };
}
