/**
 * 三态组件（Loading / Empty / Error）
 * Taro 兼容 — 仅使用 @tarojs/components 中的 View / Text / Button
 */
import { View, Text, Button } from '@tarojs/components';
import type { CSSProperties, ReactNode } from 'react';
import { useTriState } from '../hooks/useTriState';
export { useTriState };

/* ==================== 骨架屏 ==================== */

interface SkeletonBlockProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBlockProps) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      } as CSSProperties}
    />
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonBlock width="60%" height={24} />
      <SkeletonBlock width="40%" height={14} />
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148,163,184,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <SkeletonBlock width="70%" height={16} />
          <SkeletonBlock width="50%" height={12} />
          <SkeletonBlock width="30%" height={12} />
        </View>
      ))}
    </View>
  );
}

export function CardSkeleton() {
  return (
    <View style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <View style={{ display: 'flex', gap: 8 }}>
        <SkeletonBlock height={80} borderRadius={10} />
        <SkeletonBlock height={80} borderRadius={10} />
        <SkeletonBlock height={80} borderRadius={10} />
      </View>
      <SkeletonBlock width="50%" height={18} />
      <SkeletonBlock height={60} borderRadius={10} />
      <SkeletonBlock height={60} borderRadius={10} />
      <SkeletonBlock height={60} borderRadius={10} />
    </View>
  );
}

export function DetailSkeleton() {
  return (
    <View style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletonBlock width="80%" height={22} />
      <View style={{ height: 12 }} />
      <View style={{ padding: 16, borderRadius: 12, background: 'rgba(15,23,42,0.4)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={{ paddingTop: 8, paddingBottom: 8, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
            <SkeletonBlock width="40%" height={14} />
            <View style={{ height: 4 }} />
            <SkeletonBlock width="60%" height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

/* ==================== 空态 ==================== */

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon = '📭',
  title = '暂无数据',
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? 24 : 48,
        textAlign: 'center',
      }}
    >
      <Text style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>{icon}</Text>
      <Text style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>{title}</Text>
      {description && (
        <Text
          style={{
            fontSize: 13,
            color: '#64748b',
            marginTop: 8,
            maxWidth: 280,
            display: 'block',
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          style={{
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 8,
            background: '#2563eb',
            color: '#fff',
            fontSize: 14,
            border: 'none',
          }}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

/* ==================== 错误态 ==================== */

interface ErrorStateProps {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  title = '加载失败',
  message,
  retryLabel = '重试',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? 24 : 48,
        textAlign: 'center',
      }}
    >
      <Text style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>⚠️</Text>
      <Text style={{ fontSize: 16, fontWeight: 600, color: '#fca5a5' }}>{title}</Text>
      {message && (
        <Text
          style={{
            fontSize: 13,
            color: '#64748b',
            marginTop: 8,
            maxWidth: 280,
            display: 'block',
          }}
        >
          {message}
        </Text>
      )}
      {onRetry && (
        <Button
          style={{
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 8,
            background: '#ef4444',
            color: '#fff',
            fontSize: 14,
            border: 'none',
          }}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </View>
  );
}

/* ==================== 三态容器 ==================== */

type LoadStatus = 'loading' | 'error' | 'empty' | 'success';

interface TriStateContainerProps {
  status: LoadStatus;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onAction: () => void };
}

/**
 * 三态容器 — 根据 status 自动显示 Loading / Error / Empty / 正常内容
 */
export function TriStateContainer({
  status,
  children,
  loadingComponent,
  errorTitle,
  errorMessage,
  onRetry,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: TriStateContainerProps) {
  if (status === 'loading') {
    return <>{loadingComponent ?? <PageSkeleton />}</>;
  }

  if (status === 'error') {
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage}
        retryLabel="重试"
        onRetry={onRetry}
      />
    );
  }

  if (status === 'empty') {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyAction?.label}
        onAction={emptyAction?.onAction}
      />
    );
  }

  return <>{children}</>;
}
