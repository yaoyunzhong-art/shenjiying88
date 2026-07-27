export interface SeoModuleLink {
  id: string;
  title: string;
  href: string;
  summary: string;
  owner: string;
}

export interface SeoSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'seo-api' | 'seo-fallback';
  tenantId: string;
  stats: {
    totalMetadata: number;
    totalSitemaps: number;
    totalGeos: number;
    pagesOptimized: number;
    pagesPending: number;
    healthScore: number;
    lastUpdated: string;
  };
  modules: SeoModuleLink[];
  suggestions: string[];
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

const MODULES: SeoModuleLink[] = [
  {
    id: 'seo-health',
    title: 'SEO 健康报告',
    href: '/seo/health',
    summary: '查看覆盖率、问题清单和优先处理项。',
    owner: '搜索运营组',
  },
  {
    id: 'seo-metadata',
    title: 'SEO 元数据管理',
    href: '/seo/metadata',
    summary: '维护页面 title、description、canonical 和 OG 元信息。',
    owner: '内容运营组',
  },
  {
    id: 'seo-sitemap',
    title: 'Sitemap 管理',
    href: '/seo/sitemap',
    summary: '统一维护页面优先级、更新频率和抓取范围。',
    owner: '平台架构组',
  },
  {
    id: 'seo-geo',
    title: 'GEO 地域标签',
    href: '/seo/geo-locations',
    summary: '维护城市、商圈和地标的投放覆盖。',
    owner: '区域营销组',
  },
];

const SUGGESTIONS = [
  '优先补齐门店详情页的 meta description，并控制在 50-160 字。',
  '为核心门店页补全 JSON-LD 结构化数据，提升本地搜索权重。',
  '同步 Open Graph 卡片到高分享页面，统一社交预览样式。',
  '检查高价值城市的 GEO 标签覆盖，优先补齐 S 级城市。',
];

export async function loadSeoSnapshot(tenantId = 'tenant-seo'): Promise<SeoSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'seo-fallback',
    tenantId,
    stats: {
      totalMetadata: 32,
      totalSitemaps: 118,
      totalGeos: 24,
      pagesOptimized: 86,
      pagesPending: 19,
      healthScore: 72,
      lastUpdated: '2026-07-27T08:10:00.000Z',
    },
    modules: MODULES,
    suggestions: SUGGESTIONS,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadSeoSnapshot fallback -> seo module samples',
    businessDataSource: 'local seo stats + module links + suggestions',
    refreshPath: 'SeoPage -> loadSeoSnapshot',
    note: 'SEO 工作台已完成三层拆分，后续接入真实 SEO 巡检接口。',
  };
}
