/**
 * finance-dashboard-service.ts — 财务看板 API 服务层
 */
import {
  MOCK_STORE_PANDL,
  MOCK_BRAND_PANDL,
  MOCK_TRANSACTION_LOGS,
  type StorePAndL,
  type BrandPAndL,
  type AccountTransactionLog,
  type TransactionStatus,
} from './finance-dashboard-data';

const TENANT = 'demo-tenant';

function buildHeaders(): HeadersInit {
  return {
    'x-tenant-id': TENANT
  };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

// ===================== 门店损益 =====================

export interface PeriodParams {
  year?: number;
  month?: number;
}

function formatPeriod(params: PeriodParams): string {
  const now = new Date();
  const year = params.year ?? now.getFullYear();
  const month = params.month ?? now.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * 获取门店损益数据
 */
export async function getStorePAndL(storeId: string, period?: PeriodParams): Promise<StorePAndL | null> {
  const p = formatPeriod(period ?? {});
  try {
    const data = await requestJson<StorePAndL>(`/api/finance/store-pandl/${storeId}?period=${p}`);
    return data;
  } catch {
    const found = MOCK_STORE_PANDL.find(s => s.storeId === storeId && s.period === p);
    return found ?? null;
  }
}

/**
 * 获取所有门店损益（批量）
 */
export async function getAllStorePAndL(period?: PeriodParams): Promise<StorePAndL[]> {
  const p = formatPeriod(period ?? {});
  try {
    return await requestJson<StorePAndL[]>(`/api/finance/store-pandl?period=${p}`);
  } catch {
    return MOCK_STORE_PANDL.filter(s => s.period === p || !p);
  }
}

// ===================== 品牌损益 =====================

/**
 * 获取品牌损益数据
 */
export async function getBrandPAndL(brandId: string, period?: PeriodParams): Promise<BrandPAndL | null> {
  const p = formatPeriod(period ?? {});
  try {
    return await requestJson<BrandPAndL>(`/api/finance/brand-pandl/${brandId}?period=${p}`);
  } catch {
    if (MOCK_BRAND_PANDL.brandId === brandId) {
      return { ...MOCK_BRAND_PANDL, period: p };
    }
    return null;
  }
}

// ===================== 门店对比 =====================

/**
 * 对比多个门店的损益数据
 */
export async function compareStores(storeIds: string[], period?: PeriodParams): Promise<StorePAndL[]> {
  const p = formatPeriod(period ?? {});
  try {
    const ids = storeIds.join(',');
    return await requestJson<StorePAndL[]>(`/api/finance/compare?stores=${ids}&period=${p}`);
  } catch {
    return MOCK_STORE_PANDL.filter(s => storeIds.includes(s.storeId));
  }
}

// ===================== 分账日志 =====================

export interface TransactionFilter {
  status?: TransactionStatus;
  accountType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 查询分账日志
 */
export async function getTransactionLogs(filter?: TransactionFilter): Promise<AccountTransactionLog[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.accountType) params.set('accountType', filter.accountType);
    if (filter?.startDate) params.set('startDate', filter.startDate);
    if (filter?.endDate) params.set('endDate', filter.endDate);
    const query = params.toString();
    return await requestJson<AccountTransactionLog[]>(`/api/finance/transaction-logs${query ? `?${query}` : ''}`);
  } catch {
    let logs = [...MOCK_TRANSACTION_LOGS];
    if (filter?.status) {
      logs = logs.filter(l => l.status === filter.status);
    }
    if (filter?.accountType) {
      logs = logs.filter(l => l.accountType === filter.accountType);
    }
    if (filter?.startDate) {
      logs = logs.filter(l => l.createdAt >= filter.startDate!);
    }
    if (filter?.endDate) {
      logs = logs.filter(l => l.createdAt <= filter.endDate!);
    }
    return logs;
  }
}

/**
 * 查询分账状态
 */
export async function getAccountStatus(txId: string): Promise<AccountTransactionLog | null> {
  try {
    return await requestJson<AccountTransactionLog>(`/api/finance/transaction-logs/${txId}`);
  } catch {
    const found = MOCK_TRANSACTION_LOGS.find(l => l.transactionId === txId);
    return found ?? null;
  }
}

// ===================== 辅助函数 =====================

export function formatPeriodDisplay(period: string): string {
  if (!period) return '-';
  const [year, month] = period.split('-');
  if (!month) return period;
  return `${year}年${parseInt(month, 10)}月`;
}
