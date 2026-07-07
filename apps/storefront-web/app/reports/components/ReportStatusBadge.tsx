/**
 * 报表状态/类型标签组件 — ReportStatusBadge
 */

export type ReportStatus = 'generated' | 'generating' | 'failed' | 'expired';
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

/* ── 报表类型列表 ── */
export const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'daily', label: '日报' },
  { value: 'weekly', label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'quarterly', label: '季报' },
  { value: 'yearly', label: '年报' },
  { value: 'custom', label: '自定义' },
];

/* ── 类型标签 ── */
export const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  daily: '日报',
  weekly: '周报',
  monthly: '月报',
  quarterly: '季报',
  yearly: '年报',
  custom: '自定义',
};

/* ── 状态标签 ── */
export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  generated: '已生成',
  generating: '生成中',
  failed: '失败',
  expired: '已过期',
};

/* ── 状态颜色 ── */
export const REPORT_STATUS_COLOR: Record<ReportStatus, { bg: string; fg: string }> = {
  generated: { bg: '#dcfce7', fg: '#166534' },
  generating: { bg: '#dbeafe', fg: '#1e40af' },
  failed: { bg: '#fef2f2', fg: '#991b1b' },
  expired: { bg: '#f3f4f6', fg: '#6b7280' },
};

/* ── 状态徽章组件 ── */
export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const color = REPORT_STATUS_COLOR[status] || { bg: '#f3f4f6', fg: '#374151' };
  return (
    <span
      style={{
        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
        fontSize: 12, fontWeight: 600, background: color.bg, color: color.fg,
      }}
      data-testid={`report-status-badge-${status}`}
    >
      {REPORT_STATUS_LABEL[status] || status}
    </span>
  );
}
