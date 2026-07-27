import type { ReportTab } from './reports-utils';

export type ReportCatalogStatus = 'ready' | 'draft' | 'scheduled';

export interface ReportCatalogItem {
  id: string;
  title: string;
  type: ReportTab;
  owner: string;
  tenantId: string;
  lastGenerated: string;
  rowCount: number;
  cached: boolean;
  status: ReportCatalogStatus;
  summary: string;
}

export interface ReportsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'reports-api' | 'reports-fallback';
  tenantId: string;
  activePeriod: { from: string; to: string };
  stats: {
    todayNew: number;
    pendingReview: number;
    published: number;
    total: number;
    cachedReports: number;
  };
  catalog: ReportCatalogItem[];
  exportFormats: Array<'csv' | 'json' | 'html'>;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    id: 'report-revenue-001',
    title: '营收趋势总览',
    type: 'revenue',
    owner: '数据分析组',
    tenantId: 'demo-tenant',
    lastGenerated: '2026-07-27 08:45',
    rowCount: 31,
    cached: false,
    status: 'ready',
    summary: '按天汇总营收、订单数和客单价。',
  },
  {
    id: 'report-product-001',
    title: '商品销量排行',
    type: 'product-ranking',
    owner: '商品运营组',
    tenantId: 'demo-tenant',
    lastGenerated: '2026-07-27 08:20',
    rowCount: 20,
    cached: true,
    status: 'ready',
    summary: '跟踪高销量 SKU 与重点品牌。',
  },
  {
    id: 'report-payment-001',
    title: '支付方式占比',
    type: 'payment-mix',
    owner: '财务稽核组',
    tenantId: 'demo-tenant',
    lastGenerated: '2026-07-27 07:55',
    rowCount: 6,
    cached: true,
    status: 'scheduled',
    summary: '对比微信、支付宝、现金等支付结构。',
  },
  {
    id: 'report-order-001',
    title: '订单转化漏斗',
    type: 'order',
    owner: '经营分析组',
    tenantId: 'demo-tenant',
    lastGenerated: '2026-07-26 22:10',
    rowCount: 5,
    cached: false,
    status: 'draft',
    summary: '跟踪浏览、加购、下单、支付转化。',
  },
  {
    id: 'report-inventory-001',
    title: '库存周转观察',
    type: 'inventory',
    owner: '供应链组',
    tenantId: 'tenant-supply',
    lastGenerated: '2026-07-27 06:40',
    rowCount: 1,
    cached: false,
    status: 'ready',
    summary: '输出库存周转率和补货预警。',
  },
  {
    id: 'report-heatmap-001',
    title: '时段热力图',
    type: 'hourly-heatmap',
    owner: '门店运营组',
    tenantId: 'tenant-ops',
    lastGenerated: '2026-07-27 07:30',
    rowCount: 168,
    cached: false,
    status: 'scheduled',
    summary: '按周维度分析门店高峰时段。',
  },
];

function buildStats(catalog: ReportCatalogItem[]) {
  return {
    todayNew: 2,
    pendingReview: catalog.filter((item) => item.status === 'draft').length,
    published: catalog.filter((item) => item.status === 'ready').length,
    total: catalog.length,
    cachedReports: catalog.filter((item) => item.cached).length,
  };
}

export async function loadReportsSnapshot(tenantId = 'demo-tenant'): Promise<ReportsSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'reports-fallback',
    tenantId,
    activePeriod: { from: '2026-07-01', to: '2026-07-27' },
    stats: buildStats(REPORT_CATALOG),
    catalog: REPORT_CATALOG,
    exportFormats: ['csv', 'json', 'html'],
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadReportsSnapshot fallback -> report catalog samples',
    businessDataSource: 'local report catalog + report health summary',
    refreshPath: 'ReportsPage -> loadReportsSnapshot',
    note: '报表中心当前展示 fallback 快照，后续可切换到真实报表编排接口。',
  };
}
