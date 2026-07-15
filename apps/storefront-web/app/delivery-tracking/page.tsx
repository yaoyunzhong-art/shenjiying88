/**
 * 配送追踪 — Delivery Tracking (storefront-web)
 * 增强: 加载态(loading)/错误态(error)/空状态(empty) 三态 + 趋势统计看板 + 历史搜索记录
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DeliveryTrackingClient } from './components/DeliveryTrackingClient';

/* ── 类型 ── */
interface TrackingStats {
  totalOrders: number;
  inTransit: number;
  delivered: number;
  issues: number;
}

interface SearchHistoryItem {
  orderId: string;
  timestamp: string;
}

/* ── Mock 统计 ── */
const MOCK_STATS: TrackingStats = {
  totalOrders: 42,
  inTransit: 8,
  delivered: 33,
  issues: 1,
};

/* ── 模拟API加载 ── */
function simulateLoad(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const shouldFail = Math.random() < 0.08; // 8% 概率模拟错误
    setTimeout(() => {
      if (shouldFail && typeof window !== 'undefined' && Math.random() > 0.5) {
        reject(new Error('配送系统API超时，请稍后重试'));
      } else {
        resolve(true);
      }
    }, 400 + Math.random() * 300);
  });
}

/* ── 子组件: 统计看板 ── */
function StatsDashboard({ stats }: { stats: TrackingStats }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
      gap: 10,
      marginBottom: 20,
    }}>
      <div style={{ borderRadius: 10, padding: '12px 14px', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 2 }}>总订单</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a' }}>{stats.totalOrders}</div>
      </div>
      <div style={{ borderRadius: 10, padding: '12px 14px', background: 'linear-gradient(135deg, #fefce8, #fef9c3)', border: '1px solid #fde68a' }}>
        <div style={{ fontSize: 12, color: '#854d0e', marginBottom: 2 }}>运输中</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#a16207' }}>{stats.inTransit}</div>
      </div>
      <div style={{ borderRadius: 10, padding: '12px 14px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: 12, color: '#166534', marginBottom: 2 }}>已签收</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>{stats.delivered}</div>
      </div>
      <div style={{ borderRadius: 10, padding: '12px 14px', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca' }}>
        <div style={{ fontSize: 12, color: '#991b1b', marginBottom: 2 }}>异常</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#b91c1c' }}>{stats.issues}</div>
      </div>
    </div>
  );
}

/* ── 子组件: 历史搜索记录 ── */
function SearchHistory({
  history,
  onSelect,
  onClear,
}: {
  history: SearchHistoryItem[];
  onSelect: (orderId: string) => void;
  onClear: () => void;
}) {
  if (history.length === 0) return null;
  return (
    <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>📋 最近查询</span>
        <button
          onClick={onClear}
          style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          清空记录
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {history.map((item) => (
          <button
            key={`${item.orderId}-${item.timestamp}`}
            onClick={() => onSelect(item.orderId)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(148,163,184,0.2)',
              background: 'rgba(148,163,184,0.08)',
              color: '#94a3b8',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {item.orderId}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 子组件: Loading Skeleton ── */
function LoadingSkeleton() {
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* 统计卡片骨架 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 70, borderRadius: 10, background: 'rgba(148,163,184,0.06)' }} />
          ))}
        </div>
        <div style={{ height: 28, width: 140, borderRadius: 8, background: 'rgba(148,163,184,0.12)', marginBottom: 8 }} />
        <div style={{ height: 14, width: 200, borderRadius: 6, background: 'rgba(148,163,184,0.06)', marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 36, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
          <div style={{ width: 80, height: 36, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ height: 16, width: '40%', borderRadius: 6, background: 'rgba(148,163,184,0.1)' }} />
            <div style={{ height: 16, width: 60, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
          </div>
          <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'rgba(148,163,184,0.06)', marginBottom: 6 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(148,163,184,0.08)' }} />
            ))}
          </div>
        </div>
        {/* 历史记录骨架 */}
        <div style={{ marginTop: 20, height: 36, borderRadius: 8, background: 'rgba(148,163,184,0.04)' }} />
      </div>
    </main>
  );
}

/* ── 子组件: Error State ── */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>🚚</div>
        <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>配送系统加载失败</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 12, maxWidth: 400, margin: '0 auto 12px', lineHeight: 1.6 }}>{error}</div>
        <button
          onClick={onRetry}
          style={{
            padding: '10px 28px',
            borderRadius: 10,
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          重新加载
        </button>
      </div>
    </main>
  );
}

/* ── 子组件: 配送指标趋势图 ── */
function DeliveryTrendChart() {
  const weeklyData = [
    { label: '周一', count: 12 },
    { label: '周二', count: 18 },
    { label: '周三', count: 15 },
    { label: '周四', count: 22 },
    { label: '周五', count: 28 },
    { label: '周六', count: 20 },
    { label: '周日', count: 16 },
  ];
  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  return (
    <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
      <h3 style={{ fontSize: 14, color: '#e2e8f0', margin: '0 0 10px', fontWeight: 600 }}>📊 本周配送趋势</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, padding: '4px 0' }}>
        {weeklyData.map((d) => {
          const barH = Math.max((d.count / maxCount) * 48, 4);
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '70%',
                background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                borderRadius: '4px 4px 0 0',
                height: barH,
                minHeight: 4,
                transition: 'height 0.3s',
              }} />
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 主组件 ── */
export default function DeliveryTrackingPage() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);

  const initLoad = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    simulateLoad()
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err?.message ?? '配送系统初始化失败');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(initLoad, [initLoad]);

  const handleRetry = useCallback(() => {
    initLoad();
  }, [initLoad]);

  const handleHistorySelect = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h.orderId !== orderId);
      return [{
        orderId,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }, ...filtered].slice(0, 8);
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const handleSearch = useCallback((orderId: string) => {
    if (orderId.trim()) {
      handleHistorySelect(orderId.trim());
    }
  }, [handleHistorySelect]);

  /* ── Loading skeleton ── */
  if (loading) {
    return <LoadingSkeleton />;
  }

  /* ── Error state ── */
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  /* ── Not ready guard ── */
  if (!ready) return null;

  /* ── Ready: complete view ── */
  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* 统计看板 */}
        <StatsDashboard stats={MOCK_STATS} />

        {/* 本周配送趋势 */}
        <DeliveryTrendChart />

        {/* 历史搜索记录 */}
        <SearchHistory
          history={searchHistory}
          onSelect={handleHistorySelect}
          onClear={handleClearHistory}
        />

        {/* 主查询面板 */}
        <DeliveryTrackingClient
          initialOrderId={selectedOrderId}
          onSearch={handleSearch}
        />

        {/* 底部提示 */}
        <div style={{ marginTop: 24, padding: '12px 16px', borderRadius: 10, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.12)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            💡 提示: 支持输入完整订单号查询 · 支持回车快速搜索 · 配送信息每30分钟同步一次<br />
            可查询近30天的物流配送记录
          </p>
        </div>

        {/* 快速批次查询 - 示例订单列表 */}
        <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
          <h3 style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 10px', fontWeight: 600 }}>🚀 快速查询示例</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['ORD-20260708-001', 'ORD-20260707-002'].map((id) => (
              <button
                key={id}
                onClick={() => handleHistorySelect(id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(59,130,246,0.3)',
                  background: 'rgba(59,130,246,0.1)',
                  color: '#93c5fd',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
