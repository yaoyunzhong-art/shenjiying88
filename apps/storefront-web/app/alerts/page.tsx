/**
 * 消息通知 — Alerts (storefront-web)
 * 增强: 模拟API加载(loading/error/empty三态) + 筛选/标记已读/删除
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

/* ── Types ── */
type AlertType = 'success' | 'info' | 'points' | 'upgrade' | 'warning' | 'system';
type FilterKey = 'all' | AlertType;

interface AlertItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: AlertType;
  read: boolean;
}

/* ── Mock data ── */
const MOCK_ALERTS: AlertItem[] = [
  { id: '1', title: '充值成功', desc: '您已成功充值¥100，实际到账¥115', time: '10分钟前', type: 'success', read: false },
  { id: '2', title: '预约提醒', desc: '您预定的VR体验将于明天14:00开始', time: '1小时前', type: 'info', read: false },
  { id: '3', title: '积分变动', desc: '消费获得+168积分', time: '3小时前', type: 'points', read: true },
  { id: '4', title: '会员升级', desc: '您已升级为黄金会员！', time: '昨天', type: 'upgrade', read: true },
  { id: '5', title: '系统维护通知', desc: '7月15日02:00-05:00系统停机维护', time: '2天前', type: 'warning', read: false },
  { id: '6', title: '设备离线告警', desc: '3号机台网络连接断开，已自动重连', time: '3天前', type: 'system', read: true },
];

const TYPE_LABELS: Record<FilterKey, string> = {
  all: '全部',
  success: '成功',
  info: '提醒',
  points: '积分',
  upgrade: '会员',
  warning: '警告',
  system: '系统',
};

const TYPE_ICONS: Record<AlertType, string> = {
  success: '✅',
  info: 'ℹ️',
  points: '⭐',
  upgrade: '👑',
  warning: '⚠️',
  system: '🔧',
};

/* ── Helpers ── */
function simulateFetch(): Promise<AlertItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_ALERTS]), 600 + Math.random() * 400);
  });
}

/* ── Component ── */
export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    simulateFetch().then((data) => {
      if (!cancelled) {
        setAlerts(data);
        setLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err?.message ?? '加载失败');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const markRead = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const deleteAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const filteredAlerts = useMemo(
    () => filter === 'all' ? alerts : alerts.filter((a) => a.type === filter),
    [alerts, filter],
  );

  const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ height: 28, width: 120, borderRadius: 8, background: 'rgba(148,163,184,0.12)', marginBottom: 24 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ height: 16, width: `${60 + i * 10}%`, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
                <div style={{ height: 12, width: 60, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
              </div>
              <div style={{ height: 14, width: '80%', borderRadius: 6, background: 'rgba(148,163,184,0.06)' }} />
            </div>
          ))}
        </div>
      </main>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>⚠️</div>
          <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>加载失败</div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
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

  /* ── Main content ── */
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>消息通知</h1>
            <span style={{ color: '#64748b', fontSize: 12 }}>
              {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
            </span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(59,130,246,0.1)',
                color: '#93c5fd',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              全部标为已读
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(Object.entries(TYPE_LABELS) as [FilterKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: filter === key ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(148,163,184,0.15)',
                background: filter === key ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: filter === key ? '#93c5fd' : '#64748b',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredAlerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🔔</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>暂无通知</div>
            <div style={{ fontSize: 13 }}>当前筛选条件下没有消息</div>
          </div>
        )}

        {/* Alert list */}
        {filteredAlerts.map((a) => (
          <div
            key={a.id}
            style={{
              padding: '14px 18px',
              borderRadius: 14,
              marginBottom: 10,
              background: a.read ? 'rgba(30,41,59,0.6)' : 'rgba(30,41,59,0.85)',
              border: a.read
                ? '1px solid rgba(148,163,184,0.08)'
                : '1px solid rgba(59,130,246,0.2)',
              position: 'relative',
              opacity: a.read ? 0.7 : 1,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onClick={() => markRead(a.id)}
          >
            {/* Unread dot */}
            {!a.read && (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: -6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#3b82f6',
                }}
              />
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>
                {TYPE_ICONS[a.type]} {a.title}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>{a.time}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAlert(a.id); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}>{a.desc}</div>
          </div>
        ))}

        {/* Summary */}
        {filteredAlerts.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 20, color: '#475569', fontSize: 12 }}>
            共 {filteredAlerts.length} 条通知{filter !== 'all' ? ` (${TYPE_LABELS[filter]})` : ''}
          </div>
        )}
      </div>
    </main>
  );
}
