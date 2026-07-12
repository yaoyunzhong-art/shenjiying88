/**
 * 运营管理 — Operations (storefront-web)
 * 功能: 运营管理首页，含统计卡片、快捷入口、近期活动
 * 类型: B-工具箱页
 *
 * 增强内容:
 * - 运营数据概览统计卡片 (今日运营/异常/在途/已完结)
 * - 快捷操作入口区域
 * - 近期运营事件列表 (时间线)
 * - 搜索过滤
 * - 加载骨架屏
 */
'use client';
import React, { useState, useEffect, useMemo } from 'react';

/* ── 类型 ── */
interface QuickEntry {
  icon: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

interface RecentEvent {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

/* ── 数据 ── */
const STATS = [
  { label: '今日运营', value: 12, unit: '项', color: '#60a5fa', icon: '📊' },
  { label: '异常告警', value: 3, unit: '项', color: '#f97316', icon: '⚠️' },
  { label: '处理中', value: 5, unit: '项', color: '#eab308', icon: '🔄' },
  { label: '已完结', value: 24, unit: '项', color: '#22c55e', icon: '✅' },
];

const QUICK_ENTRIES: QuickEntry[] = [
  { icon: '📊', label: '运营日报', desc: '查看今日运营数据', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { icon: '🎯', label: '目标管理', desc: '门店KPI追踪', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { icon: '📋', label: '检查清单', desc: '每日巡检事项', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { icon: '📈', label: '数据洞察', desc: '趋势分析', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { icon: '🔧', label: '设备管理', desc: '机台运维与监控', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { icon: '👥', label: '排班管理', desc: '员工班次安排', color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)' },
];

const RECENT_EVENTS: RecentEvent[] = [
  { id: 'e1', title: '朝阳店早间巡检完成', desc: '全部设备正常运行', time: '30分钟前', type: 'success' },
  { id: 'e2', title: '海淀店库存预警', desc: '商品 SKU-1023 库存不足', time: '1小时前', type: 'warning' },
  { id: 'e3', title: '浦东店设备维护', desc: '3号机台已安排维修', time: '2小时前', type: 'info' },
  { id: 'e4', title: '天河店网络离线', desc: '已自动切换备线', time: '3小时前', type: 'error' },
  { id: 'e5', title: '南山店日终结算', desc: '今日营收 ¥41,230', time: '5小时前', type: 'success' },
];

const EVENT_TYPE_STYLES: Record<string, { icon: string; color: string; bg: string }> = {
  success: { icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  warning: { icon: '⚠️', color: '#eab308', bg: 'rgba(234,179,8,0.08)' },
  info: { icon: 'ℹ️', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  error: { icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};

/* ════════════════════════════════════════════════════════════
 * 骨架屏
 * ════════════════════════════════════════════════════════════ */
function SkeletonBlock() {
  return (
    <div
      style={{
        height: 72,
        borderRadius: 12,
        background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );
}

/* ════════════════════════════════════════════════════════════
 * 主组件
 * ════════════════════════════════════════════════════════════ */
export default function OperationsPage() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200 + Math.random() * 200);
    return () => clearTimeout(t);
  }, []);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return QUICK_ENTRIES;
    const q = search.toLowerCase();
    return QUICK_ENTRIES.filter(
      (e) => e.label.includes(q) || e.desc.includes(q),
    );
  }, [search]);

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return RECENT_EVENTS;
    const q = search.toLowerCase();
    return RECENT_EVENTS.filter(
      (e) => e.title.includes(q) || e.desc.includes(q),
    );
  }, [search]);

  /* ── 加载态 ── */
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <SkeletonBlock />
          <div style={{ height: 10 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SkeletonBlock /><SkeletonBlock />
          </div>
          <div style={{ height: 10 }} />
          <SkeletonBlock />
          <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
          🏪 运营管理
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>
          多门店运营中枢 · 数据驱动决策
        </p>

        {/* ── 搜索框 ── */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="🔍 搜索功能或事件..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.12)',
              background: 'rgba(15,23,42,0.6)',
              color: '#f1f5f9',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ── 统计卡片 ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '16px',
                borderRadius: 14,
                background: 'rgba(30,41,59,0.8)',
                border: `1px solid ${stat.color}20`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: `${stat.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 2 }}>
                    {stat.unit}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 快捷入口 ── */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
          快捷功能
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {filteredEntries.map((item) => (
            <div
              key={item.label}
              style={{
                padding: '20px 16px',
                borderRadius: 14,
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.12)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  margin: '0 auto 10px',
                }}
              >
                {item.icon}
              </div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{item.label}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* ── 搜索空状态 ── */}
        {search && filteredEntries.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 32,
              color: '#64748b',
            }}
          >
            未找到匹配的功能
          </div>
        )}

        {/* ── 近期事件 ── */}
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
          近期动态
        </h2>
        <div
          style={{
            background: 'rgba(30,41,59,0.6)',
            borderRadius: 14,
            border: '1px solid rgba(148,163,184,0.08)',
            padding: '4px 0',
            marginBottom: 48,
          }}
        >
          {filteredEvents.map((evt) => {
            const style = EVENT_TYPE_STYLES[evt.type];
            return (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(148,163,184,0.06)',
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{style.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{evt.title}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{evt.desc}</div>
                </div>
                <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>{evt.time}</span>
              </div>
            );
          })}
        </div>

        {/* ── 搜索事件空状态 ── */}
        {search && filteredEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
            未找到匹配的事件
          </div>
        )}
      </div>
    </main>
  );
}
