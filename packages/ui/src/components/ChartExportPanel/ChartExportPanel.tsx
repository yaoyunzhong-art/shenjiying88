'use client';

import React, { useCallback, useRef, useState } from 'react';

// ==================== 类型定义 ====================

export interface ChartExportPanelProps {
  /** 图表标题 */
  title: string;
  /** 子组件（图表区域） */
  children: React.ReactNode;
  /** CSV 导出数据（可选，若提供则显示导出 CSV 按钮） */
  csvData?: Array<Record<string, string | number>>;
  /** CSV 文件名（不含后缀） */
  csvFilename?: string;
  /** 支持全屏 */
  enableFullscreen?: boolean;
  /** 支持刷新 */
  enableRefresh?: boolean;
  /** 时间范围选择 */
  timeRange?: TimeRangeOption[];
  /** 当前选中的时间范围 */
  activeTimeRange?: string;
  /** 时间范围变更回调 */
  onTimeRangeChange?: (value: string) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 右侧额外操作区 */
  extraActions?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

export interface TimeRangeOption {
  label: string;
  value: string;
}

// ==================== 内联样式 ====================

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#fff',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f3f4f6',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
    whiteSpace: 'nowrap' as const,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  body: {
    padding: 16,
    position: 'relative' as const,
  },
  bodyFullscreen: {
    padding: 24,
  },
  select: {
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid #d1d5db',
    fontSize: 13,
    background: '#fff',
    cursor: 'pointer' as const,
    color: '#374151',
  },
  iconBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    cursor: 'pointer' as const,
    fontSize: 14,
    lineHeight: 1,
    color: '#6b7280',
    transition: 'background 0.15s',
  },
  iconBtnHover: {
    background: '#f3f4f6',
  },
};

// ==================== 工具函数 ====================

function downloadCSV(data: Array<Record<string, string | number>>, filename: string): void {
  if (!data.length) return;
  const first = data[0] as Record<string, string | number>;
  const headers = Object.keys(first);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    csvRows.push(
      headers
        .map(h => {
          const val = row[h];
          const str = String(val ?? '');
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(','),
    );
  }
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _html2canvas: any = null;

async function getHtml2canvas(): Promise<any> {
  if (_html2canvas) return _html2canvas;
  try {
    // Dynamic import — html2canvas is optional peer dependency; use type assertion
    const mod: any = await (Function('return import("html2canvas")')() as Promise<any>);
    _html2canvas = mod.default || mod;
    return _html2canvas;
  } catch {
    return null;
  }
}

async function downloadImage(element: HTMLElement, filename: string): Promise<void> {
  const h2c = await getHtml2canvas();
  if (!h2c) {
    console.warn('[ChartExportPanel] html2canvas not available, PNG export skipped');
    return;
  }
  try {
    const canvas = await h2c(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch {
    console.warn('[ChartExportPanel] PNG export failed');
  }
}

// ==================== 小型内联按钮组件 ====================

function ActionButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={hover ? { ...styles.iconBtn, ...styles.iconBtnHover } : styles.iconBtn}
    >
      {children}
    </button>
  );
}

// ==================== 主组件 ====================

export function ChartExportPanel({
  title,
  children,
  csvData,
  csvFilename = 'chart-export',
  enableFullscreen = true,
  enableRefresh = true,
  timeRange,
  activeTimeRange,
  onTimeRangeChange,
  onRefresh,
  extraActions,
  className,
}: ChartExportPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExportCSV = useCallback(() => {
    if (!csvData || csvData.length === 0) return;
    downloadCSV(csvData, csvFilename);
  }, [csvData, csvFilename]);

  const handleExportPNG = useCallback(() => {
    if (!chartRef.current) return;
    downloadImage(chartRef.current, csvFilename);
  }, [csvFilename]);

  const handleToggleFullscreen = useCallback(() => {
    if (!enableFullscreen) return;
    setIsFullscreen(prev => !prev);
  }, [enableFullscreen]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return (
    <div
      className={className}
      style={{
        ...styles.wrapper,
        ...(isFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, borderRadius: 0 } : {}),
      }}
    >
      {/* 头部工具栏 */}
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.actions}>
          {/* 时间范围选择 */}
          {timeRange && timeRange.length > 0 && (
            <select
              value={activeTimeRange ?? (timeRange[0] ? timeRange[0].value : '')}
              onChange={e => onTimeRangeChange?.(e.target.value)}
              style={styles.select}
            >
              {timeRange.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {/* 刷新 */}
          {enableRefresh && (
            <ActionButton label="刷新数据" onClick={handleRefresh}>
              🔄
            </ActionButton>
          )}

          {/* 导出 CSV */}
          {csvData && csvData.length > 0 && (
            <ActionButton label="导出 CSV" onClick={handleExportCSV}>
              📊
            </ActionButton>
          )}

          {/* 导出 PNG */}
          <ActionButton label="导出图片" onClick={handleExportPNG}>
            🖼️
          </ActionButton>

          {/* 全屏切换 */}
          {enableFullscreen && (
            <ActionButton
              label={isFullscreen ? '退出全屏' : '全屏查看'}
              onClick={handleToggleFullscreen}
            >
              ⛶
            </ActionButton>
          )}

          {/* 关闭全屏 */}
          {isFullscreen && (
            <ActionButton label="关闭全屏" onClick={() => setIsFullscreen(false)}>
              ✕
            </ActionButton>
          )}

          {/* 外部自定义操作 */}
          {extraActions}
        </div>
      </div>

      {/* 图表区域 */}
      <div
        ref={chartRef}
        style={{
          ...styles.body,
          ...(isFullscreen ? styles.bodyFullscreen : {}),
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default ChartExportPanel;
