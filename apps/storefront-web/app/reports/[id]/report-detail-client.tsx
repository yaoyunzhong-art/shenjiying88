/**
 * 销售报表详情客户端组件 — ReportDetailClient
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 功能: 编辑摘要、重新生成(状态流转)、导出 CSV、删除
 */
'use client';

import React from 'react';
import type { ReportStatus } from '../components/ReportStatusBadge';
import {
  REPORT_STATUS_LABEL, REPORT_STATUS_COLOR,
} from '../components/ReportStatusBadge';

/* ── 报表数据接口 ── */
interface ReportData {
  id: string;
  title: string;
  type: string;
  period: string;
  createdAt: string;
  status: ReportStatus;
  summary: string;
  metrics?: Record<string, string | number>;
}

/* ── 类型标签映射 ── */
const TYPE_LABEL: Record<string, string> = {
  daily: '日报', weekly: '周报', monthly: '月报',
  quarterly: '季报', yearly: '年报', custom: '自定义',
};

/* ── 状态可流转图 ── */
const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  generated: ['expired'],
  generating: ['generated', 'failed'],
  failed: ['generating'],
  expired: ['generating'],
};

/* ── Props ── */
interface ReportDetailClientProps {
  report: ReportData;
}

/* ── 格式化日期 ── */
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── 导出 CSV ── */
function exportToCsv(report: ReportData): void {
  const rows: string[][] = [['指标', '数值']];
  if (report.metrics) {
    Object.entries(report.metrics).forEach(([k, v]) => rows.push([k, String(v)]));
  }
  rows.push(['标题', report.title]);
  rows.push(['摘要', report.summary]);
  rows.push(['周期', report.period]);
  rows.push(['创建时间', report.createdAt]);
  const csvContent = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.title}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ── */
export function ReportDetailClient({ report }: ReportDetailClientProps): React.ReactElement {
  const [status, setStatus] = React.useState<ReportStatus>(report.status);
  const [summary, setSummary] = React.useState(report.summary);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleted, setDeleted] = React.useState(false);

  const transitions = STATUS_TRANSITIONS[status] || [];
  const color = REPORT_STATUS_COLOR[status] || { bg: '#f3f4f6', fg: '#374151' };

  /* ── 状态流转 ── */
  const handleTransition = (next: ReportStatus) => {
    setStatus(next);
    if (next === 'generating') {
      /* 模拟重新生成成功 */
      setTimeout(() => setStatus('generated'), 1500);
    }
  };

  /* ── 保存编辑 ── */
  const handleSaveEdit = () => {
    setIsEditing(false);
    /* 实际场景会调用 API */
  };

  /* ── 删除 ── */
  const handleDelete = () => {
    setIsDeleting(true);
    /* 实际场景会调用 API */
    setTimeout(() => {
      setDeleted(true);
    }, 800);
  };

  if (deleted) {
    return (
      <div data-testid="report-deleted" style={{
        maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 48,
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          报表已删除
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          「{report.title}」已被永久删除
        </p>
        <a
          href="/reports"
          style={{
            display: 'inline-block', padding: '10px 24px', borderRadius: 8,
            background: '#2563eb', color: '#fff', textDecoration: 'none',
            fontSize: 14, fontWeight: 600,
          }}
        >
          ← 返回报表列表
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }} data-testid="report-detail">
      {/* 导航面包屑 */}
      <div style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
        <a href="/reports" style={{ color: '#2563eb', textDecoration: 'none' }}>📊 销售报表</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: '#374151' }}>{report.title}</span>
      </div>

      {/* 头部 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
            {report.title}
          </h1>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#6b7280', alignItems: 'center' }}>
            <span>{TYPE_LABEL[report.type] || report.type}</span>
            <span>·</span>
            <span>📅 {report.period}</span>
            <span>·</span>
            <span>🕐 {formatDate(report.createdAt)}</span>
            <span
              style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                fontSize: 12, fontWeight: 600,
                background: color.bg, color: color.fg,
              }}
              data-testid={`report-detail-status-${status}`}
            >
              {REPORT_STATUS_LABEL[status] || status}
            </span>
          </div>
        </div>

        {/* 操作按钮组 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 导出 */}
          <button
            type="button"
            onClick={() => exportToCsv({ ...report, status })}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff',
              fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}
            data-testid="report-export-btn"
          >
            📥 导出 CSV
          </button>

          {/* 删除 */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid #fca5a5', background: '#fef2f2',
              fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#991b1b',
              opacity: isDeleting ? 0.6 : 1,
            }}
            data-testid="report-delete-btn"
          >
            {isDeleting ? '⌛ 删除中…' : '🗑️ 删除'}
          </button>
        </div>
      </div>

      {/* 摘要编辑区 */}
      <div style={{
        padding: 20, borderRadius: 12, background: '#f9fafb',
        border: '1px solid #e5e7eb', marginBottom: 24,
      }} data-testid="report-summary-section">
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 12,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
            📝 摘要
          </h2>
          <button
            type="button"
            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            style={{
              padding: '4px 12px', borderRadius: 6,
              border: '1px solid #d1d5db', background: isEditing ? '#2563eb' : '#fff',
              color: isEditing ? '#fff' : '#374151',
              fontSize: 12, cursor: 'pointer', fontWeight: 500,
            }}
            data-testid="report-edit-toggle"
          >
            {isEditing ? '💾 保存' : '✏️ 编辑'}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{
              width: '100%', minHeight: 80, padding: 12, borderRadius: 8,
              border: '1px solid #2563eb', fontSize: 14, lineHeight: 1.6,
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
            data-testid="report-summary-edit"
          />
        ) : (
          <p style={{
            fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0,
          }} data-testid="report-summary-text">
            {summary}
          </p>
        )}
      </div>

      {/* 关键指标卡片 */}
      {report.metrics && Object.keys(report.metrics).length > 0 && (
        <div style={{ marginBottom: 24 }} data-testid="report-metrics">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0, marginBottom: 12 }}>
            📊 关键指标
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
          }}>
            {Object.entries(report.metrics).map(([key, value]) => (
              <div
                key={key}
                style={{
                  padding: 16, borderRadius: 12, background: '#fff',
                  border: '1px solid #e5e7eb', textAlign: 'center',
                }}
                data-testid={`report-metric-${key}`}
              >
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                  {key}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 状态流转操作区 */}
      {transitions.length > 0 && (
        <div style={{
          padding: 20, borderRadius: 12, background: '#f0f9ff',
          border: '1px solid #bae6fd', marginBottom: 24,
        }} data-testid="report-status-transitions">
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0369a1', margin: 0, marginBottom: 12 }}>
            🔄 状态操作
          </h2>
          <p style={{ fontSize: 13, color: '#0369a1', marginBottom: 12 }}>
            当前状态：{REPORT_STATUS_LABEL[status]} — 可流转至：
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {transitions.map((next) => (
              <button
                key={next}
                type="button"
                onClick={() => handleTransition(next)}
                disabled={status === 'generating'}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  border: '1px solid #7dd3fc', background: '#fff',
                  fontSize: 13, cursor: status === 'generating' ? 'not-allowed' : 'pointer',
                  fontWeight: 500, color: '#0369a1',
                  opacity: status === 'generating' ? 0.5 : 1,
                }}
                data-testid={`report-transition-${next}`}
              >
                {next === 'generating' ? '🔄 重新生成' : `→ ${REPORT_STATUS_LABEL[next]}`}
              </button>
            ))}
          </div>
          {status === 'generating' && (
            <div style={{ marginTop: 12, fontSize: 13, color: '#0369a1' }} data-testid="report-generating-hint">
              ⏳ 报表正在生成中，请稍候…
            </div>
          )}
        </div>
      )}

      {/* 底部导航 */}
      <div style={{ marginTop: 24 }}>
        <a
          href="/reports"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '10px 20px', borderRadius: 8,
            background: '#f3f4f6', color: '#374151', textDecoration: 'none',
            fontSize: 14, fontWeight: 500,
          }}
        >
          ← 返回报表列表
        </a>
      </div>
    </div>
  );
}
