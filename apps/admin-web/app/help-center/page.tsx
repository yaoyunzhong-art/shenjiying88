/**
 * 帮助中心 — Help Center Page (Next.js App Router)
 *
 * 功能:
 * - 展示平台操作指南、常见问题和技术文档
 * - 按分类（入门指南 / 门店运营 / 设备维护 / 财务管理 / AI 功能）浏览
 * - 支持关键词搜索过滤
 * - 热门文章置顶 + 最新更新提示
 * - 空状态 / 加载中 / 搜索无结果
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { getHelpArticles } from './help-center-data';
import { HelpCenterClient } from './help-center-client';

export const metadata: Metadata = {
  title: '帮助中心 - M5 指挥台',
  description:
    '平台操作指南、常见问题和技术文档。按分类浏览或搜索关键词快速定位帮助文档。',
  openGraph: {
    title: '帮助中心 | M5 指挥台文档',
    description: '平台操作指南、常见问题和技术文档',
    type: 'website',
  },
};

/** 帮助文档分类配置 */
const HELP_CATEGORIES = [
  { key: 'getting-started', label: '入门指南', icon: '🚀', count: 5 },
  { key: 'store-operations', label: '门店运营', icon: '🏪', count: 8 },
  { key: 'device-maintenance', label: '设备维护', icon: '🔧', count: 6 },
  { key: 'financial-management', label: '财务管理', icon: '💰', count: 4 },
  { key: 'ai-features', label: 'AI 功能', icon: '🤖', count: 7 },
  { key: 'troubleshooting', label: '故障排查', icon: '⚠️', count: 3 },
];

/** 加载占位 */
function HelpCenterLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      {/* 搜索栏骨架 */}
      <LoadingSkeleton variant="card" rows={1} label="加载搜索栏..." />
      <div style={{ height: 24 }} />

      {/* 分类标签骨架 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            style={{
              width: 80,
              height: 32,
              borderRadius: 8,
              background: 'rgba(148,163,184,0.08)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* 文章列表骨架 */}
      <LoadingSkeleton variant="card" rows={5} label="加载文章列表..." />
    </div>
  );
}

/** 错误回退 */
function HelpCenterErrorFallback() {
  return (
    <EmptyState
      title="帮助文档加载异常"
      description="无法加载帮助中心文档数据，请稍后重试或联系技术支持。"
      actionLabel="重试"
      actionHref="/help-center"
    />
  );
}

/** 搜索无结果 */
function SearchNoResultsState() {
  return (
    <EmptyState
      title="未找到相关文档"
      description="尝试更换关键词，或浏览分类目录查找。如果您的问题仍未解决，可以联系在线客服。"
      actionLabel="浏览全部文档"
      actionHref="/help-center"
    />
  );
}

export default function HelpCenterPage() {
  const articles = getHelpArticles();
  const articleCount = articles?.length ?? 0;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '帮助中心',
            applicationCategory: 'BusinessApplication',
            description:
              '平台操作指南、常见问题和技术文档。按分类浏览或搜索关键词快速定位帮助文档。',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY',
            },
          }),
        }}
      />

      {/* 页面顶部 — 分类导航 + 统计概览 */}
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '24px 32px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>
              总计 <strong style={{ color: '#f8fafc' }}>{articleCount}</strong> 篇文档
              · 最后更新: 2026-07-12
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {HELP_CATEGORIES.map((cat) => (
              <div
                key={cat.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(148,163,184,0.1)',
                  fontSize: 12,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)';
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span style={{ color: '#64748b', fontSize: 11 }}>({cat.count})</span>
              </div>
            ))}
          </div>
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

      {/* 底部 — 联系支持 */}
      <div
        style={{
          marginTop: 32,
          padding: '16px 24px',
          borderRadius: 8,
          background: 'rgba(59,130,246,0.04)',
          border: '1px solid rgba(59,130,246,0.12)',
          fontSize: 13,
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: 1000,
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
        }}
      >
        <strong style={{ color: '#60a5fa' }}>没有找到答案？</strong>
        <br />
        您可以联系在线客服 (工作日 9:00-22:00) 或提交工单，技术团队将在 2 小时内响应。
      </div>
    </>
  );
}
