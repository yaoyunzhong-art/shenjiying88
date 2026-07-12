/**
 * 门店对比页 — Store Comparison Page (Next.js App Router Page)
 * 功能: 多门店 KPI 横向对比、营收柱状图、详细对比表格
 * 类型: B-列表页 (含搜索/过滤/对比)
 *
 * 增强内容:
 * - Metadata + JSON-LD 结构化数据
 * - 支持 searchParams 传递门店 ID
 * - 页面标题 & 描述 SEO
 * - 错误边界提示
 */
import type { Metadata } from 'next';
import { CompareStoresClient } from './compare-stores-client';

export const metadata: Metadata = {
  title: '门店对比 — 多门店KPI横向分析',
  description:
    '多维度门店 KPI 横向对比，支持区域筛选、状态筛选、多指标排序，选定标杆门店查看差异。',
  openGraph: {
    title: '门店对比 | KPI 横向分析',
    description: '多门店营收、订单、满意度、设备利用率一键对比',
    type: 'website',
  },
};

interface PageProps {
  searchParams?: Promise<{
    ids?: string;
    baseline?: string;
  }>;
}

export default async function CompareStoresPage({ searchParams }: PageProps) {
  // 从 searchParams 中提取预选门店 ID 和标杆门店 ID
  let preselectedIds: string[] = [];
  let baselineId: string | undefined;

  if (searchParams) {
    const sp = await searchParams;
    if (sp.ids) {
      preselectedIds = sp.ids.split(',').filter(Boolean);
    }
    if (sp.baseline) {
      baselineId = sp.baseline;
    }
  }

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '门店对比工具',
            applicationCategory: 'BusinessApplication',
            description:
              '多维度门店 KPI 横向对比工具，支持区域筛选、状态筛选、多指标排序，选定标杆门店查看差异。',
            browserRequirements: '需要现代浏览器',
          }),
        }}
      />
      <CompareStoresClient
        preselectedIds={preselectedIds}
        baselineId={baselineId}
      />
    </>
  );
}
