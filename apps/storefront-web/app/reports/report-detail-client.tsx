'use client';

import React from 'react';
import { EmptyState, ErrorBoundary } from '@m5/ui';

interface ReportDetailClientProps {
  report: {
    id: string;
    title: string;
    type: string;
    summary: string;
    metrics?: Record<string, string | number>;
    status: string;
  };
}

const METRIC_STYLE: React.CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(148,163,184,0.08)',
};

const METRIC_VALUE_STYLE: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#e2e8f0',
  marginTop: 4,
};

const METRIC_LABEL_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#cbd5e1',
  margin: '0 0 12px',
};

/**
 * 报表详情客户端组件 — 展示报表指标和摘要
 */
export function ReportDetailClient({ report }: ReportDetailClientProps) {
  const { summary, metrics } = report;

  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <EmptyState
        title="暂无报表数据"
        description="当前报表没有可展示的指标数据，请重新生成。"
      />
    );
  }

  const entries = Object.entries(metrics);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* 指标卡片网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {entries.slice(0, 6).map(([key, value]) => (
          <div key={key} style={METRIC_STYLE}>
            <div style={METRIC_LABEL_STYLE}>{key}</div>
            <div style={METRIC_VALUE_STYLE}>{String(value)}</div>
          </div>
        ))}
      </div>

      {/* 摘要 */}
      <ErrorBoundary>
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(148,163,184,0.06)',
            marginBottom: 24,
          }}
        >
          <h3 style={SECTION_TITLE_STYLE}>摘要</h3>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            {summary}
          </p>
        </div>
      </ErrorBoundary>
    </div>
  );
}
