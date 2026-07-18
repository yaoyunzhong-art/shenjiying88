/**
 * 知识库页面 Knowledge — admin-web 知识管理
 * 角色: 🏢总部 / 👔店长
 * 功能: 文档库、运营手册、FAQ、公告
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import KnowledgeClient from './knowledge-client';

interface KnowledgeCategory {
  id: string;
  name: string;
  icon: string;
  docCount: number;
  lastUpdated: string;
}

interface RecentDocument {
  id: string;
  title: string;
  category: string;
  author: string;
  updatedAt: string;
  summary: string;
}

interface KnowledgeTag {
  id: string;
  label: string;
}

interface KnowledgeSnapshot {
  categories: KnowledgeCategory[];
  recentDocuments: RecentDocument[];
  totalDocuments: number;
  totalViews: number;
  tags: KnowledgeTag[];
}

async function loadKnowledge(): Promise<KnowledgeSnapshot> {
  return {
    tags: [
      { id: 'announcement', label: '公告' },
      { id: 'tutorial', label: '教程' },
      { id: 'faq', label: 'FAQ' },
      { id: 'policy', label: '政策' },
      { id: 'other', label: '其他' },
    ],
    categories: [
      { id: 'ops', name: '运营手册', icon: '📖', docCount: 24, lastUpdated: '2026-07-15' },
      { id: 'device', name: '设备指南', icon: '🔧', docCount: 15, lastUpdated: '2026-07-14' },
      { id: 'member', name: '会员政策', icon: '👤', docCount: 8, lastUpdated: '2026-07-13' },
      { id: 'finance', name: '财务规范', icon: '💰', docCount: 12, lastUpdated: '2026-07-12' },
      { id: 'safety', name: '安全制度', icon: '🛡️', docCount: 6, lastUpdated: '2026-07-10' },
      { id: 'marketing', name: '营销资料', icon: '📢', docCount: 18, lastUpdated: '2026-07-16' },
    ],
    recentDocuments: [
      { id: 'doc-1', title: '暑期促销活动执行手册', category: 'marketing', author: '陈静', updatedAt: '2026-07-16', summary: '暑期特惠季活动全流程SOP，包括物料准备、人员调配、效果追踪' },
      { id: 'doc-2', title: 'VR设备日常维护指南', category: 'device', author: '杨磊', updatedAt: '2026-07-15', summary: 'VR设备开关机、清洁、基础故障排查、巡检流程' },
      { id: 'doc-3', title: '会员开卡操作流程', category: 'member', author: '李娜', updatedAt: '2026-07-14', summary: '前台会员开卡、充值、积分兑换的操作指南' },
      { id: 'doc-4', title: '现金对账标准流程', category: 'finance', author: '财务部', updatedAt: '2026-07-13', summary: '日结现金清点、银行存缴、差异处理标准操作规范' },
      { id: 'doc-5', title: '消防安全检查清单', category: 'safety', author: '安监部', updatedAt: '2026-07-12', summary: '每日/每周/每月安全检查项目及标准' },
    ],
    totalDocuments: 83,
    totalViews: 15420,
  };
}

export default async function KnowledgePage() {
  const data = await loadKnowledge();

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="📚 知识库" subtitle="运营手册·设备指南·会员政策·财务规范·安全制度">
          <Suspense fallback={<LoadingSkeleton variant="card" rows={8} label="加载知识库..." />}>
            <KnowledgeClient data={data} />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
