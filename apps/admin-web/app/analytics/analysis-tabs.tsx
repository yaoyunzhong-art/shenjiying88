/**
 * AnalysisTabs — 分析分类标签组件
 * 筛选: 概览/趋势/对比/明细
 * 使用 URL searchParams 驱动，保持 SSR 友好
 */

'use client';

import type { AnalysisFilter } from './page';

const TABS: { key: AnalysisFilter; label: string; icon: string; description: string }[] = [
  { key: 'overview', label: '概览', icon: '📊', description: '全局数据总览' },
  { key: 'trend', label: '趋势', icon: '📈', description: '营收与客流趋势' },
  { key: 'compare', label: '对比', icon: '📋', description: '同比环比对比' },
  { key: 'detail', label: '明细', icon: '🔍', description: '商品与品类明细' },
];

export default function AnalysisTabs({ activeFilter }: { activeFilter: AnalysisFilter }) {
  return (
    <nav
      role="tablist"
      aria-label="分析分类筛选"
      style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        padding: 4,
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeFilter;
        const searchParams = new URLSearchParams();
        if (tab.key !== 'overview') {
          searchParams.set('filter', tab.key);
        }
        const href = `?${searchParams.toString()}`;

        return (
          <a
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            href={href}
            title={tab.description}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#f8fafc' : '#94a3b8',
              background: isActive ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            <span>{tab.label}</span>
            {!isActive && (
              <span style={{ fontSize: 11, color: '#64748b', display: 'none' }} className="tab-desc">
                {tab.description}
              </span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
