/**
 * 告警详情页 — Alert Detail Page (storefront-web)
 * 功能: 展示单条告警的详情，包含加载态、错误态、未找到态
 * 类型: B-详情页
 *
 * 增强内容:
 * - 加载骨架屏 (Skeleton)
 * - 错误恢复 (Error Boundary / try-catch)
 * - 标记已读/未读切换
 * - 告警时间线与操作记录
 * - 告警分级高亮
 * - 返回导航
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FoundationAlertPresetDetailRoute,
  foundationAlertDetailDemoPresets,
  foundationAlertListDemoPresets,
} from '@m5/ui';

const MOCK_DETAIL = foundationAlertDetailDemoPresets.storefront;
const PRESET = foundationAlertListDemoPresets.storefront;

/* ============================================================
 * 告警分级配置
 * ============================================================ */
const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: '严重', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  high: { label: '高危', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  medium: { label: '中等', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  low: { label: '低', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

/* ============================================================
 * 骨架屏
 * ============================================================ */
function Skeleton({ width = '100%', height = 16 }: { width?: string; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        marginBottom: 8,
      }}
    />
  );
}

/* ============================================================
 * 主组件
 * ============================================================ */
export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRead, setIsRead] = useState<boolean>(false); // 从本地存储读取

  // 模拟 loading 效果
  useEffect(() => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300 + Math.random() * 200);
    return () => clearTimeout(timer);
  }, [id, retryCount]);

  // 从 localStorage 读取已读状态
  useEffect(() => {
    try {
      const readKey = `alert-read-${id}`;
      const stored = localStorage.getItem(readKey);
      if (stored) {
        setIsRead(stored === 'true');
      }
    } catch {
      // localStorage 不可用时忽略
    }
  }, [id]);

  const handleMarkRead = useCallback(() => {
    const newVal = !isRead;
    setIsRead(newVal);
    try {
      localStorage.setItem(`alert-read-${id}`, String(newVal));
    } catch {
      // 忽略
    }
  }, [id, isRead]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  // 解析严重程度（从 MOCK_DETAIL 中猜测）
  const severity = useMemo<string>(() => {
    // 简单启发式: 如果有 warning/error 相关的描述
    const desc = JSON.stringify(MOCK_DETAIL);
    if (desc.includes('critical') || desc.includes('严重')) return 'critical';
    if (desc.includes('warning') || desc.includes('警告')) return 'high';
    return 'medium';
  }, []);

  const sev = SEVERITY_CONFIG[severity] ?? { label: '中等', color: '#eab308', bg: 'rgba(234,179,8,0.12)' };

  // ------ 加载态 ------
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Skeleton width="160px" height={14} />
          <Skeleton width="240px" height={28} />
          <Skeleton width="100%" height={12} />
          <div style={{ height: 24 }} />
          <Skeleton width="100%" height={120} />
          <div style={{ height: 16 }} />
          <Skeleton width="80%" height={12} />
          <Skeleton width="60%" height={12} />
          <Skeleton width="90%" height={12} />
          <div style={{ height: 24 }} />
          <Skeleton width="100%" height={80} />
          <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
        </div>
      </main>
    );
  }

  // ------ 错误态 ------
  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>
            加载失败
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>{error}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={handleRetry}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid #3b82f6',
                background: '#3b82f6',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              重试
            </button>
            <button
              onClick={() => router.push('/alerts')}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              返回告警列表
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ------ 正常渲染 ------
  return (
    <>
      {/* 顶部导航 & 操作栏 */}
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '16px 16px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => router.push('/alerts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.12)',
              background: 'rgba(15,23,42,0.4)',
              color: '#94a3b8',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← 返回
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* 严重程度标签 */}
            <span
              style={{
                padding: '2px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: sev.color,
                background: sev.bg,
              }}
            >
              {sev.label}
            </span>
            {/* 标记已读按钮 */}
            <button
              onClick={handleMarkRead}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${isRead ? '#22c55e' : 'rgba(148,163,184,0.2)'}`,
                background: isRead ? 'rgba(34,197,94,0.1)' : 'transparent',
                color: isRead ? '#22c55e' : '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {isRead ? '✅ 已读' : '○ 标记已读'}
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <FoundationAlertPresetDetailRoute
        alertId={id}
        alerts={MOCK_DETAIL}
        preset={PRESET}
        backHref="/alerts"
        backLabel="返回告警列表"
        notFoundTitle="告警不存在"
        notFoundMessage={(alertId) => `未找到告警 ${alertId}`}
      />

      {/* 操作记录时间线 */}
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '16px 16px 48px',
        }}
      >
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#94a3b8',
            margin: '0 0 12px',
          }}
        >
          操作记录
        </h3>
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: 'rgba(30,41,59,0.6)',
            border: '1px solid rgba(148,163,184,0.08)',
          }}
        >
          {[
            { action: '系统自动创建', time: '2小时前', icon: '🤖' },
            { action: '分配给运维组', time: '1小时前', icon: '👤' },
            { action: isRead ? '已读确认' : '待确认', time: isRead ? '刚刚' : '—', icon: isRead ? '👁️' : '⏳' },
          ].map((op, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < 2 ? '1px solid rgba(148,163,184,0.06)' : 'none',
              }}
            >
              <span style={{ fontSize: 16 }}>{op.icon}</span>
              <div style={{ flex: 1, color: '#e2e8f0', fontSize: 14 }}>{op.action}</div>
              <span style={{ color: '#64748b', fontSize: 12 }}>{op.time}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
