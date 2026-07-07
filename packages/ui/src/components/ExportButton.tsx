'use client';

import React, { useCallback, useState } from 'react';

// ==================== 类型定义 ====================

/** 导出格式 */
export type ExportFormat = 'csv' | 'json' | 'xlsx';

/** ExportButton 属性 */
export interface ExportButtonProps {
  /** 导出文件名（不含扩展名） */
  filename: string;
  /** 导出格式 */
  format?: ExportFormat;
  /** 生成导出数据的异步函数 */
  onExport: () => Promise<string | Record<string, unknown>[]>;
  /** 自定义按钮文本 */
  label?: string;
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** 禁用状态 */
  disabled?: boolean;
  /** 附加 className */
  className?: string;
  /** 成功回调 */
  onSuccess?: () => void;
  /** 失败回调 */
  onError?: (err: unknown) => void;
}

// ==================== 样式 ====================

const VARIANT_STYLE: Record<NonNullable<ExportButtonProps['variant']>, React.CSSProperties> = {
  primary: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: '1px solid #3b82f6',
  },
  secondary: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid transparent',
  },
};

const BASE_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s, background-color 0.15s',
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

// ==================== 工具函数 ====================

/** 将记录数组序列化为 CSV 字符串 */
export function serializeToCsv(records: Record<string, unknown>[]): string {
  if (records.length === 0) return '';
  const headers = Array.from(new Set(records.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const record of records) {
    lines.push(headers.map((h) => escape(record[h])).join(','));
  }
  return lines.join('\n');
}

/** 触发浏览器文件下载 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ==================== 组件 ====================

/**
 * ExportButton — 通用数据导出按钮，支持 CSV / JSON 格式。
 *
 * 用法：
 * ```tsx
 * <ExportButton
 *   filename="members-2026-06"
 *   format="csv"
 *   onExport={async () => fetchMembers()}
 *   onSuccess={() => toast('导出成功')}
 * />
 * ```
 */
export function ExportButton({
  filename,
  format = 'csv',
  onExport,
  label,
  variant = 'secondary',
  disabled = false,
  className,
  onSuccess,
  onError,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      const data = await onExport();

      if (format === 'json') {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        triggerDownload(content, `${filename}.json`, 'application/json');
      } else {
        // CSV / default
        const records = typeof data === 'string' ? JSON.parse(data) as Record<string, unknown>[] : data;
        const csv = serializeToCsv(records);
        triggerDownload(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      }

      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出失败，请稍后重试。';
      setError(msg);
      onError?.(err);
    } finally {
      setExporting(false);
    }
  }, [filename, format, onExport, onSuccess, onError]);

  const variantStyle = VARIANT_STYLE[variant];
  const finalStyle: React.CSSProperties = {
    ...BASE_STYLE,
    ...variantStyle,
    opacity: disabled || exporting ? 0.6 : undefined,
    cursor: disabled || exporting ? 'not-allowed' : 'pointer',
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <button
        type="button"
        style={finalStyle}
        className={className}
        disabled={disabled || exporting}
        onClick={handleExport}
        aria-busy={exporting}
        aria-label={label ?? `导出 ${format.toUpperCase()}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {exporting ? '导出中...' : (label ?? `导出 ${format.toUpperCase()}`)}
      </button>
      {error && (
        <span style={{ fontSize: 12, color: '#ef4444' }} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
