import React from 'react';

type TriStateRendererProps = {
  loading: boolean;
  empty: boolean;
  error: string | null;
  /** 数据加载中占位指示器 */
  loadingContent?: React.ReactNode;
  /** 空数据显示内容 */
  emptyContent?: React.ReactNode;
  /** 错误显示内容 */
  errorContent?: (error: string, onRetry?: () => void) => React.ReactNode;
  /** 重试回调 */
  onRetry?: () => void;
  /** 子渲染函数 — 仅在非 loading / non-empty / 无 error 时调用 */
  children: React.ReactNode | (() => React.ReactNode);
};

/**
 * 三态渲染器 — 统一处理 loading / empty / error 视图
 *
 * 优先级: loading > error > empty > children
 *
 * ```tsx
 * <TriStateRenderer loading={loading} empty={empty} error={error} onRetry={refetch}>
 *   <ActualContent />
 * </TriStateRenderer>
 * ```
 */
export function TriStateRenderer({
  loading,
  empty,
  error,
  loadingContent,
  emptyContent,
  errorContent,
  onRetry,
  children,
}: TriStateRendererProps) {
  // 1. Loading 态
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          gap: 16,
        }}
        data-testid="tri-state-loading"
      >
        {loadingContent ?? (
          <>
            <div
              style={{
                width: 40,
                height: 40,
                border: '3px solid #e5e7eb',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'tri-state-spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes tri-state-spin { to { transform: rotate(360deg) } }`}</style>
            <span style={{ fontSize: 14, color: '#6b7280' }}>加载中…</span>
          </>
        )}
      </div>
    );
  }

  // 2. Error 态
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          gap: 12,
        }}
        data-testid="tri-state-error"
      >
        {errorContent ? (
          errorContent(error, onRetry)
        ) : (
          <>
            <span style={{ fontSize: 36 }}>⚠️</span>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#dc2626', margin: 0 }}>加载失败</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0, textAlign: 'center', maxWidth: 400 }}>
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  marginTop: 8,
                  padding: '8px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                data-testid="tri-state-retry"
              >
                重新加载
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // 3. Empty 态
  if (empty) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px',
          gap: 8,
        }}
        data-testid="tri-state-empty"
      >
        {emptyContent ?? (
          <>
            <span style={{ fontSize: 40 }}>📭</span>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>暂无数据</p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>当前没有可显示的内容</p>
          </>
        )}
      </div>
    );
  }

  // 4. 正常渲染子内容
  return <>{typeof children === 'function' ? children() : children}</>;
}
