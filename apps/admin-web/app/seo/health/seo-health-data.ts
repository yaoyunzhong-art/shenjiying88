export type SeoIssueSeverity = 'high' | 'medium' | 'low';

export interface SeoHealthIssue {
  id: string;
  path: string;
  severity: SeoIssueSeverity;
  owner: string;
  summary: string;
  suggestion: string;
}

export interface SeoHealthSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'seo-health-api' | 'seo-health-fallback';
  tenantId: string;
  totalPages: number;
  pagesWithMetadata: number;
  pagesWithSitemap: number;
  avgMetadataScore: number;
  coverageRate: number;
  severitySummary: Record<SeoIssueSeverity, number>;
  issues: SeoHealthIssue[];
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

const ISSUES: SeoHealthIssue[] = [
  {
    id: 'seo-issue-001',
    path: '/',
    severity: 'high',
    owner: '首页运营组',
    summary: '缺少结构化数据',
    suggestion: '补充 WebSite 与 Organization JSON-LD。',
  },
  {
    id: 'seo-issue-002',
    path: '/stores/beijing',
    severity: 'high',
    owner: '城市站运营组',
    summary: '缺失 title / description',
    suggestion: '补齐门店页元数据并增加商圈关键词。',
  },
  {
    id: 'seo-issue-003',
    path: '/activities/summer',
    severity: 'medium',
    owner: '营销活动组',
    summary: '未注册 sitemap',
    suggestion: '将活动页加入 sitemap 并设置周更新频率。',
  },
  {
    id: 'seo-issue-004',
    path: '/faq',
    severity: 'medium',
    owner: '帮助中心组',
    summary: 'canonical 缺失',
    suggestion: '为 FAQ 页补充 canonical，避免重复收录。',
  },
  {
    id: 'seo-issue-005',
    path: '/contact',
    severity: 'low',
    owner: '品牌内容组',
    summary: 'OG 图片缺失',
    suggestion: '为联系页配置统一的 Open Graph 卡片。',
  },
];

function buildSeveritySummary(issues: SeoHealthIssue[]): Record<SeoIssueSeverity, number> {
  return {
    high: issues.filter((issue) => issue.severity === 'high').length,
    medium: issues.filter((issue) => issue.severity === 'medium').length,
    low: issues.filter((issue) => issue.severity === 'low').length,
  };
}

export async function loadSeoHealthSnapshot(tenantId = 'tenant-seo'): Promise<SeoHealthSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'seo-health-fallback',
    tenantId,
    totalPages: 120,
    pagesWithMetadata: 86,
    pagesWithSitemap: 98,
    avgMetadataScore: 74,
    coverageRate: 82,
    severitySummary: buildSeveritySummary(ISSUES),
    issues: ISSUES,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadSeoHealthSnapshot fallback -> issue samples',
    businessDataSource: 'local seo issue list + severity summary',
    refreshPath: 'SeoHealthPage -> loadSeoHealthSnapshot',
    note: 'SEO 健康页当前展示 fallback 扫描结果，后续切换到真实巡检输出。',
  };
}
