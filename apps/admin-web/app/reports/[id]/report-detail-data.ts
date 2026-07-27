import type { ReportResult, ReportTab } from '../reports-utils';

export interface ReportDetailSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'report-detail-api' | 'report-detail-fallback';
  reportId: string;
  tenantId: string;
  title: string;
  reportTab: ReportTab;
  report: ReportResult | null;
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

const REPORTS: Record<string, ReportResult> = {
  'report-revenue-001': {
    type: 'revenue',
    tenantId: 'demo-tenant',
    period: { from: '2026-07-01', to: '2026-07-27' },
    columns: [
      { field: 'period', alias: '日期', type: 'dimension' },
      { field: 'revenue', alias: '营收(元)', type: 'metric' },
      { field: 'orders', alias: '订单数', type: 'metric' },
    ],
    rows: [
      { period: '2026-07-01', revenue: 125000, orders: 860 },
      { period: '2026-07-08', revenue: 136200, orders: 905 },
      { period: '2026-07-15', revenue: 148800, orders: 960 },
      { period: '2026-07-22', revenue: 152600, orders: 996 },
      { period: '2026-07-27', revenue: 167300, orders: 1082 },
    ],
    totals: { period: '合计', revenue: 729900, orders: 4803 },
    generatedAt: '2026-07-27T08:45:00.000Z',
    cached: false,
  },
  'report-product-001': {
    type: 'product-ranking',
    tenantId: 'demo-tenant',
    period: { from: '2026-07-01', to: '2026-07-27' },
    columns: [
      { field: 'sku', alias: 'SKU', type: 'dimension' },
      { field: 'name', alias: '商品名', type: 'dimension' },
      { field: 'soldQty', alias: '销量', type: 'metric' },
    ],
    rows: [
      { sku: 'SKU-A001', name: '摇摇乐套餐', soldQty: 420 },
      { sku: 'SKU-A007', name: '抓娃娃礼包', soldQty: 386 },
      { sku: 'SKU-B010', name: '机台币补充包', soldQty: 274 },
    ],
    totals: { sku: '-', name: '合计', soldQty: 1080 },
    generatedAt: '2026-07-27T08:20:00.000Z',
    cached: true,
  },
  'report-payment-001': {
    type: 'payment-mix',
    tenantId: 'demo-tenant',
    period: { from: '2026-07-01', to: '2026-07-27' },
    columns: [
      { field: 'method', alias: '支付方式', type: 'dimension' },
      { field: 'amount', alias: '金额(元)', type: 'metric' },
    ],
    rows: [
      { method: '微信支付', amount: 436000 },
      { method: '支付宝', amount: 182000 },
      { method: '现金', amount: 43800 },
    ],
    totals: { method: '合计', amount: 661800 },
    generatedAt: '2026-07-27T07:55:00.000Z',
    cached: true,
  },
};

function getReportTitle(type: string): string {
  switch (type) {
    case 'revenue':
      return '营收趋势报表';
    case 'product-ranking':
      return '商品销量排行';
    case 'payment-mix':
      return '支付方式占比';
    case 'hourly-heatmap':
      return '时段热力图';
    case 'order':
      return '订单转化漏斗';
    case 'inventory':
      return '库存周转报表';
    default:
      return `报表 ${type}`;
  }
}

function getReportTab(type: string): ReportTab {
  if (type === 'product-ranking') return 'product-ranking';
  if (type === 'payment-mix') return 'payment-mix';
  if (type === 'hourly-heatmap') return 'hourly-heatmap';
  if (type === 'order') return 'order';
  if (type === 'inventory') return 'inventory';
  return 'revenue';
}

export async function loadReportDetailSnapshot(
  reportId: string,
  tenantId = 'demo-tenant',
): Promise<ReportDetailSnapshotDelivery> {
  const report = REPORTS[reportId] ?? null;

  if (!report) {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'report-detail-fallback',
      reportId,
      tenantId,
      title: '未找到报表',
      reportTab: 'revenue',
      report: null,
      generatedAt: new Date().toISOString(),
      controlPlaneSource: 'loadReportDetailSnapshot fallback -> local report map',
      businessDataSource: 'empty detail fallback',
      refreshPath: 'ReportDetailPage -> loadReportDetailSnapshot',
      note: '当前报表 ID 未命中本地样本，详情页展示 fallback 空态。',
      error: '未找到该报表快照。',
    };
  }

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'report-detail-fallback',
    reportId,
    tenantId,
    title: getReportTitle(report.type),
    reportTab: getReportTab(report.type),
    report,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadReportDetailSnapshot fallback -> local report map',
    businessDataSource: 'local report rows + totals snapshot',
    refreshPath: 'ReportDetailPage -> loadReportDetailSnapshot',
    note: '报表详情页已切换到服务端快照包装，后续再接入真实报表明细接口。',
  };
}
