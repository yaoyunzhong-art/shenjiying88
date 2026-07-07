/**
 * finance-dashboard-data.ts — 财务看板 Mock 数据与类型定义
 */

// ===================== 类型定义 =====================

export interface StorePAndL {
  storeId: string;
  storeName: string;
  period: string;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  operatingProfit: number;
  operatingMargin: number;
}

export interface BrandPAndL {
  brandId: string;
  brandName: string;
  period: string;
  totalRevenue: number;
  totalCostOfGoods: number;
  totalGrossProfit: number;
  internalTransaction_elimination: number;
  brandNetRevenue: number;
  stores: StorePAndL[];
}

export type TransactionStatus = 'pending' | 'split' | 'transferred' | 'completed' | 'failed';

export interface AccountTransactionLog {
  logId: string;
  transactionId: string;
  accountName: string;
  accountType: 'brand' | 'store' | 'supplier' | 'platform';
  amount: number;
  status: TransactionStatus;
  splitRatio: number;
  remarks: string;
  createdAt: string;
  updatedAt: string;
}

// ===================== 常量 =====================

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: '待分账',
  split: '已分账',
  transferred: '已划转',
  completed: '已完成',
  failed: '失败',
};

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  pending: '#f59e0b',
  split: '#3b82f6',
  transferred: '#8b5cf6',
  completed: '#22c55e',
  failed: '#ef4444',
};

// ===================== Mock 数据 =====================

export const MOCK_STORE_PANDL: StorePAndL[] = [
  {
    storeId: 'STORE001',
    storeName: '上海旗舰店',
    period: '2026-06',
    revenue: 1285680,
    costOfGoods: 514272,
    grossProfit: 771408,
    grossMargin: 0.60,
    operatingExpenses: 385704,
    operatingProfit: 385704,
    operatingMargin: 0.30,
  },
  {
    storeId: 'STORE002',
    storeName: '北京分店',
    period: '2026-06',
    revenue: 856320,
    costOfGoods: 342528,
    grossProfit: 513792,
    grossMargin: 0.60,
    operatingExpenses: 256896,
    operatingProfit: 256896,
    operatingMargin: 0.30,
  },
  {
    storeId: 'STORE003',
    storeName: '广州分店',
    period: '2026-06',
    revenue: 642740,
    costOfGoods: 257096,
    grossProfit: 385644,
    grossMargin: 0.60,
    operatingExpenses: 192822,
    operatingProfit: 192822,
    operatingMargin: 0.30,
  },
];

export const MOCK_BRAND_PANDL: BrandPAndL = {
  brandId: 'BRAND001',
  brandName: '花西子',
  period: '2026-06',
  totalRevenue: 2784740,
  totalCostOfGoods: 1113896,
  totalGrossProfit: 1670844,
  internalTransaction_elimination: 245680,
  brandNetRevenue: 1425164,
  stores: MOCK_STORE_PANDL,
};

export const MOCK_TRANSACTION_LOGS: AccountTransactionLog[] = [
  {
    logId: 'LOG-001',
    transactionId: 'TX-20260701-001',
    accountName: '花西子品牌账户',
    accountType: 'brand',
    amount: 38570,
    status: 'completed',
    splitRatio: 0.30,
    remarks: '上海旗舰店 6月营收分账',
    createdAt: '2026-07-01 10:00:00',
    updatedAt: '2026-07-01 10:30:00',
  },
  {
    logId: 'LOG-002',
    transactionId: 'TX-20260701-002',
    accountName: '上海旗舰店',
    accountType: 'store',
    amount: 89998,
    status: 'transferred',
    splitRatio: 0.70,
    remarks: '上海旗舰店 6月营收分账',
    createdAt: '2026-07-01 10:00:00',
    updatedAt: '2026-07-01 10:15:00',
  },
  {
    logId: 'LOG-003',
    transactionId: 'TX-20260701-003',
    accountName: '花西子品牌账户',
    accountType: 'brand',
    amount: 25690,
    status: 'split',
    splitRatio: 0.30,
    remarks: '北京分店 6月营收分账',
    createdAt: '2026-07-01 11:00:00',
    updatedAt: '2026-07-01 11:00:00',
  },
  {
    logId: 'LOG-004',
    transactionId: 'TX-20260701-004',
    accountName: '北京分店',
    accountType: 'store',
    amount: 59942,
    status: 'pending',
    splitRatio: 0.70,
    remarks: '北京分店 6月营收分账',
    createdAt: '2026-07-01 11:00:00',
    updatedAt: '2026-07-01 11:00:00',
  },
  {
    logId: 'LOG-005',
    transactionId: 'TX-20260701-005',
    accountName: '杭州花西子供应链',
    accountType: 'supplier',
    amount: 15000,
    status: 'failed',
    splitRatio: 0,
    remarks: '采购款结算失败-账户信息异常',
    createdAt: '2026-07-01 14:00:00',
    updatedAt: '2026-07-01 14:05:00',
  },
  {
    logId: 'LOG-006',
    transactionId: 'TX-20260702-001',
    accountName: '花西子品牌账户',
    accountType: 'brand',
    amount: 19282,
    status: 'pending',
    splitRatio: 0.30,
    remarks: '广州分店 6月营收分账',
    createdAt: '2026-07-02 09:00:00',
    updatedAt: '2026-07-02 09:00:00',
  },
  {
    logId: 'LOG-007',
    transactionId: 'TX-20260702-002',
    accountName: '广州分店',
    accountType: 'store',
    amount: 44992,
    status: 'pending',
    splitRatio: 0.70,
    remarks: '广州分店 6月营收分账',
    createdAt: '2026-07-02 09:00:00',
    updatedAt: '2026-07-02 09:00:00',
  },
  {
    logId: 'LOG-008',
    transactionId: 'TX-20260628-001',
    accountName: '平台服务费',
    accountType: 'platform',
    amount: 8560,
    status: 'completed',
    splitRatio: 0.03,
    remarks: '6月平台服务费结算',
    createdAt: '2026-06-28 16:00:00',
    updatedAt: '2026-06-28 16:30:00',
  },
];

// ===================== 辅助函数 =====================

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString('zh-CN', { hour12: false });
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    brand: '品牌账户',
    store: '门店账户',
    supplier: '供应商',
    platform: '平台',
  };
  return labels[type] ?? type;
}
