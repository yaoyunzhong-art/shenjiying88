export interface StoreReportRow {
  storeId: string;
  storeName: string;
  date: string;
  admissionFee: number;
  coinRevenue: number;
  diningRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  cost: number;
  profit: number;
  profitRate: number;
}

export type ProfitFilter = 'ALL' | 'PROFIT' | 'LOSS';

export interface StoreReportSummary {
  totalRevenue: number;
  totalProfit: number;
  profitableCount: number;
  lossCount: number;
}

export interface StoreReportsSnapshot {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-reports-api' | 'store-reports-fallback';
  rows: StoreReportRow[];
  summary: StoreReportSummary;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

export const DEFAULT_STORE_REPORTS: StoreReportRow[] = [
  {
    storeId: 's1',
    storeName: '朝阳大悦城旗舰店',
    date: '2026-07-18',
    admissionFee: 28500,
    coinRevenue: 62300,
    diningRevenue: 41800,
    otherRevenue: 3400,
    totalRevenue: 136000,
    cost: 88700,
    profit: 47300,
    profitRate: 0.3478,
  },
  {
    storeId: 's2',
    storeName: '上海陆家嘴中心店',
    date: '2026-07-18',
    admissionFee: 19200,
    coinRevenue: 48600,
    diningRevenue: 35200,
    otherRevenue: 5000,
    totalRevenue: 108000,
    cost: 75600,
    profit: 32400,
    profitRate: 0.3,
  },
  {
    storeId: 's3',
    storeName: '深圳万象天地店',
    date: '2026-07-18',
    admissionFee: 8100,
    coinRevenue: 21500,
    diningRevenue: 12400,
    otherRevenue: 1000,
    totalRevenue: 43000,
    cost: 35800,
    profit: 7200,
    profitRate: 0.1674,
  },
  {
    storeId: 's4',
    storeName: '成都太古里体验店',
    date: '2026-07-18',
    admissionFee: 15600,
    coinRevenue: 37900,
    diningRevenue: 28600,
    otherRevenue: 3900,
    totalRevenue: 86000,
    cost: 61100,
    profit: 24900,
    profitRate: 0.2895,
  },
  {
    storeId: 's5',
    storeName: '杭州银泰旗舰店',
    date: '2026-07-18',
    admissionFee: 9800,
    coinRevenue: 14200,
    diningRevenue: 8700,
    otherRevenue: 1300,
    totalRevenue: 34000,
    cost: 39600,
    profit: -5600,
    profitRate: -0.1647,
  },
];

const API_PATH = '/api/stores/reports';

function resolveAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_ADMIN_WEB_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizeRow(item: unknown, index: number): StoreReportRow {
  const record = asRecord(item);
  return {
    storeId: typeof record.storeId === 'string' ? record.storeId : `store-${index + 1}`,
    storeName: typeof record.storeName === 'string' ? record.storeName : `门店 ${index + 1}`,
    date: typeof record.date === 'string' ? record.date : new Date().toISOString(),
    admissionFee: Number(record.admissionFee ?? 0),
    coinRevenue: Number(record.coinRevenue ?? 0),
    diningRevenue: Number(record.diningRevenue ?? 0),
    otherRevenue: Number(record.otherRevenue ?? 0),
    totalRevenue: Number(record.totalRevenue ?? 0),
    cost: Number(record.cost ?? 0),
    profit: Number(record.profit ?? 0),
    profitRate: Number(record.profitRate ?? 0),
  };
}

function buildSummary(rows: StoreReportRow[]): StoreReportSummary {
  return {
    totalRevenue: rows.reduce((sum, row) => sum + row.totalRevenue, 0),
    totalProfit: rows.reduce((sum, row) => sum + row.profit, 0),
    profitableCount: rows.filter((row) => row.profit > 0).length,
    lossCount: rows.filter((row) => row.profit < 0).length,
  };
}

function getGeneratedAt(rows: StoreReportRow[]): string {
  return rows
    .map((row) => row.date)
    .sort((left, right) => left.localeCompare(right))
    .at(-1) ?? new Date().toISOString();
}

async function fetchStoreReports(): Promise<StoreReportRow[]> {
  const response = await fetch(`${resolveAppBaseUrl()}${API_PATH}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`store reports upstream failed: ${response.status}`);
  }

  const body = (await response.json()) as unknown;
  const payload = asRecord(body);
  const data = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(body)
      ? body
      : null;

  if (!data) {
    throw new Error('store reports upstream payload invalid');
  }

  return data.map((item, index) => normalizeRow(item, index));
}

export async function loadStoreReportsSnapshot(): Promise<StoreReportsSnapshot> {
  try {
    const rows = await fetchStoreReports();
    return {
      deliveryMode: 'api',
      sourceLabel: 'store-reports-api',
      rows,
      summary: buildSummary(rows),
      generatedAt: getGeneratedAt(rows),
      controlPlaneSource: 'loadStoreReportsSnapshot -> /api/stores/reports',
      businessDataSource: 'store reports upstream payload',
      refreshPath: 'StoreReportsPage -> loadStoreReportsSnapshot',
      note: '当前页面直接消费门店经营报表服务端快照。',
    };
  } catch {
    const rows = DEFAULT_STORE_REPORTS;
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'store-reports-fallback',
      rows,
      summary: buildSummary(rows),
      generatedAt: getGeneratedAt(rows),
      controlPlaneSource: 'loadStoreReportsSnapshot fallback -> DEFAULT_STORE_REPORTS',
      businessDataSource: 'local store report samples',
      refreshPath: 'StoreReportsPage -> loadStoreReportsSnapshot',
      note: '当前页面已回退到本地报表样本，不可作为实时经营复签证据。',
      error: '门店报表实时接口不可达，已切换到 fallback 样本数据。',
    };
  }
}
