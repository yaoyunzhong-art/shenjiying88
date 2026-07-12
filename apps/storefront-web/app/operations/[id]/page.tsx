'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RuntimeOperationPresetDetailRoute,
  runtimeOperationDetailDemoPresets,
  runtimeOperationListDemoPresets,
} from '@m5/ui';

const MOCK_OPS = runtimeOperationDetailDemoPresets.storefront;
const PRESET = runtimeOperationListDemoPresets.storefront;

/* ============================================================
 * 操作模拟阶段
 * ============================================================ */
const OPERATION_STAGES = [
  { key: 'created', label: '已创建', icon: '📋' },
  { key: 'processing', label: '处理中', icon: '⚙️' },
  { key: 'review', label: '审核中', icon: '🔍' },
  { key: 'completed', label: '已完成', icon: '✅' },
];

/* ============================================================
 * 骨架屏
 * ============================================================ */
function Skeleton({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height,
        borderRadius: 6,
        background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        marginBottom: 8,
      }}
    />
  );
}

/* ============================================================
 * 主组件
 * ============================================================ */
export default function OperationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentStage, setCurrentStage] = useState(1); // 当前进度阶段

  // 模拟加载
  useEffect(() => {
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      // 随机模拟加载失败 (5%)
      if (Math.random() < 0.05) {
        setError('网络连接异常，请重试');
      }
      setLoading(false);
    }, 200 + Math.random() * 300);
    return () => clearTimeout(t);
  }, [id, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  // ------ 加载态 ------
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '32px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Skeleton width={120} height={14} />
          <Skeleton width={200} height={26} />
          <div style={{ height: 20 }} />
          <Skeleton width="100%" height={100} />
          <div style={{ height: 24 }} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="75%" height={12} />
          <Skeleton width="85%" height={12} />
          <div style={{ height: 24 }} />
          <Skeleton width="100%" height={60} />
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>
            操作详情加载失败
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px', maxWidth: 400, marginInline: 'auto' }}>
            {error}
          </p>
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
              onClick={() => router.push('/operations')}
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
              返回运营管理
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ------ 正常渲染 ------
  return (
    <>
      {/* 顶部导航 */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 0' }}>
        <button
          onClick={() => router.push('/operations')}
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
            marginBottom: 16,
          }}
        >
          ← 返回运营管理
        </button>
      </div>

      {/* 主内容 */}
      <RuntimeOperationPresetDetailRoute
        operationId={id}
        operations={MOCK_OPS}
        preset={PRESET}
        backHref="/operations"
        notFoundTitle="Operation Not Found"
        notFoundMessage={(operationId) => `Operation ${operationId} not found`}
      />

      {/* 操作进度阶段 */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 48px' }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#94a3b8',
            margin: '0 0 16px',
          }}
        >
          操作进度
        </h3>
        <div
          style={{
            display: 'flex',
            gap: 0,
            alignItems: 'flex-start',
            background: 'rgba(30,41,59,0.6)',
            border: '1px solid rgba(148,163,184,0.08)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          {OPERATION_STAGES.map((stage, i) => {
            const active = i <= currentStage;
            return (
              <div
                key={stage.key}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* 连接线 */}
                {i < OPERATION_STAGES.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 18,
                      right: '-50%',
                      width: '100%',
                      height: 2,
                      background: active ? '#3b82f6' : 'rgba(148,163,184,0.15)',
                      zIndex: 0,
                    }}
                  />
                )}
                {/* 圆点 */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    background: active ? 'rgba(59,130,246,0.2)' : 'rgba(30,41,59,0.8)',
                    border: `2px solid ${active ? '#3b82f6' : 'rgba(148,163,184,0.2)'}`,
                    fontSize: 16,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {stage.icon}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: active ? '#e2e8f0' : '#475569',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* 操作日志摘要 */}
        <div style={{ marginTop: 16 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#94a3b8',
              margin: '0 0 12px',
            }}
          >
            操作日志
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
              { user: '系统', action: '运营操作已创建', time: '2026-07-13 01:00' },
              { user: '张经理', action: '已分配处理人', time: '2026-07-13 01:15' },
              { user: '李处理', action: '正在进行中', time: '2026-07-13 01:20' },
            ].map((log, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: i < 2 ? '1px solid rgba(148,163,184,0.06)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(59,130,246,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: '#60a5fa',
                    flexShrink: 0,
                  }}
                >
                  {log.user.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontSize: 14 }}>
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{log.user}</span>
                    {' · '}
                    {log.action}
                  </div>
                  <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
