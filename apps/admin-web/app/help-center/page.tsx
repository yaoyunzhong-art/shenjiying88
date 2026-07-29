/**
 * 帮助中心 — Help Center Page (Next.js App Router)
 *
 * 功能:
 * - 展示平台操作指南、常见问题和技术文档
 * - 按分类（入门指南 / 门店运营 / 设备维护 / 财务管理 / AI 功能）浏览
 * - 支持关键词搜索过滤
 * - 空状态 / 加载中 / 错误回退
 */
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { loadHelpCenterSnapshot } from './help-center-data';
import { HelpCenterClient } from './help-center-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** 加载占位 */
function HelpCenterLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <LoadingSkeleton variant="card" rows={1} label="加载搜索栏..." />
      <div style={{ height: 24 }} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              width: 80,
              height: 32,
              borderRadius: 8,
              background: 'rgba(148,163,184,0.08)',
            }}
          />
        ))}
      </div>
      <LoadingSkeleton variant="card" rows={5} label="加载文章列表..." />
    </div>
  );
}

function HelpCenterErrorFallback() {
  return (
    <EmptyState
      title="帮助文档加载异常"
      description="无法加载帮助中心文档数据，请稍后重试或联系技术支持。"
      action={<a href="/help-center">重试</a>}
    />
  );
}

function SearchNoResultsState() {
  return (
    <EmptyState
      title="未找到相关文档"
      description="尝试更换关键词，或浏览分类目录查找。"
      action={<a href="/help-center">浏览全部文档</a>}
    />
  );
}

export default async function HelpCenterPage() {
  const snapshot = await loadHelpCenterSnapshot();
  const articles = snapshot.articles;
  const articleCount = articles.length;

  return (
    <>
      {/* 页面顶部 */}
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '24px 32px 0',
        }}
      >
        <div
          style={{
            color: '#94a3b8',
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          总计 <strong style={{ color: '#f8fafc' }}>{articleCount}</strong> 篇文档
          · 最后更新: {snapshot.generatedAt}
        </div>
      </div>

      {/* 主内容 */}
      <ErrorBoundary fallback={<HelpCenterErrorFallback />}>
        <Suspense fallback={<HelpCenterLoadingFallback />}>
          {articleCount > 0 ? (
            <HelpCenterClient articles={articles} />
          ) : (
            <SearchNoResultsState />
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
