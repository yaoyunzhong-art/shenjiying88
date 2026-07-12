/**
 * 公告列表 — Announcements (storefront-web)
 * 增强: 模拟API加载(loading/error二态) + 深色主题 + 搜索 + 展开详情 + 无数据空态
 */
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';

/* ── Types ── */
interface Announcement {
  id: string;
  title: string;
  desc: string;
  detail: string;
  date: string;
  badge: string;
  badgeColor: string;
}

/* ── Mock data ── */
const MOCK_ITEMS: Announcement[] = [
  { id: 'a1', title: '新店开业优惠', desc: '充值满100送15，限时一周', detail: '为庆祝新店开业，凡是7月12日至7月19日期间充值满100元即送15元，多充多送。活动仅限新店使用。', date: '2026-07-12', badge: 'NEW', badgeColor: '#22c55e' },
  { id: 'a2', title: '设备升级通知', desc: 'VR体验区已全面升级为最新设备', detail: 'VR体验区已完成设备更新，搭载最新高通XR2+ Gen 2芯片，支持4K分辨率、120Hz刷新率，带来沉浸式体验。', date: '2026-07-10', badge: '更新', badgeColor: '#3b82f6' },
  { id: 'a3', title: '会员日特惠', desc: '每月15日会员双倍积分', detail: '每月15日为会员日，当日消费享双倍积分。黄金及以上会员额外赠送小礼品一份。', date: '2026-07-08', badge: '会员', badgeColor: '#f59e0b' },
  { id: 'a4', title: '暑期学生特惠', desc: '凭学生证享8折优惠', detail: '7月15日至8月31日，在校学生凭有效学生证可享全场8折优惠（含游戏币、套餐、饮品）。', date: '2026-07-06', badge: '优惠', badgeColor: '#ec4899' },
  { id: 'a5', title: '停车优惠调整', desc: '商场停车新规通知', detail: '自8月1日起，凭消费小票可享免费停车2小时（原为3小时），超出部分按商场标准收费。', date: '2026-07-05', badge: '通知', badgeColor: '#6366f1' },
];

const ALL_BADGES = Array.from(new Set(MOCK_ITEMS.map((i) => i.badge)));

/* ── Helpers ── */
function simulateFetch(): Promise<Announcement[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_ITEMS]), 500 + Math.random() * 500);
  });
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const parts = dateStr.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${year}年${parseInt(month, 10)}月${parseInt(day, 10)}日`;
  } catch {
    return dateStr;
  }
}

/* ── Component ── */
export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<string>('全部');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    simulateFetch().then((data) => {
      if (!cancelled) {
        setItems(data);
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

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !search
        || item.title.toLowerCase().includes(search.toLowerCase())
        || item.desc.toLowerCase().includes(search.toLowerCase());
      const matchBadge = badgeFilter === '全部' || item.badge === badgeFilter;
      return matchSearch && matchBadge;
    });
  }, [items, search, badgeFilter]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => prev === id ? null : id);
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ height: 28, width: 100, borderRadius: 8, background: 'rgba(148,163,184,0.12)', marginBottom: 20 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: 28, width: 48, borderRadius: 20, background: 'rgba(148,163,184,0.08)' }} />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ height: 16, width: `${50 + i * 15}%`, borderRadius: 6, background: 'rgba(148,163,184,0.1)' }} />
                <div style={{ height: 20, width: 40, borderRadius: 6, background: 'rgba(148,163,184,0.08)' }} />
              </div>
              <div style={{ height: 14, width: '70%', borderRadius: 6, background: 'rgba(148,163,184,0.06)', marginBottom: 6 }} />
              <div style={{ height: 12, width: 80, borderRadius: 6, background: 'rgba(148,163,184,0.05)' }} />
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
          <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>公告加载失败</div>
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
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>公告</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          共 {items.length} 条公告 · {filteredItems.length} 条匹配
        </p>

        {/* Search */}
        <input
          placeholder="搜索公告…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(30,41,59,0.8)',
            color: '#f8fafc',
            fontSize: 14,
            outline: 'none',
            marginBottom: 14,
            boxSizing: 'border-box',
          }}
        />

        {/* Badge filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['全部', ...ALL_BADGES].map((b) => (
            <button
              key={b}
              onClick={() => setBadgeFilter(b)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: badgeFilter === b ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(148,163,184,0.15)',
                background: badgeFilter === b ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: badgeFilter === b ? '#93c5fd' : '#64748b',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📢</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>暂无公告</div>
            <div style={{ fontSize: 13 }}>当前筛选条件下没有匹配的公告</div>
          </div>
        )}

        {/* Announcement list */}
        {filteredItems.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              style={{
                padding: '16px 20px',
                borderRadius: 14,
                marginBottom: 10,
                background: isExpanded ? 'rgba(30,41,59,0.9)' : 'rgba(30,41,59,0.8)',
                border: isExpanded
                  ? '1px solid rgba(59,130,246,0.25)'
                  : '1px solid rgba(148,163,184,0.12)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => toggleExpand(item.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{item.title}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: `${item.badgeColor}20`,
                  color: item.badgeColor,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {item.badge}
                </span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>{item.desc}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>
                {formatDate(item.date)}
                {isExpanded && ' · 点击收起'}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTop: '1px solid rgba(148,163,184,0.12)',
                  color: '#cbd5e1',
                  fontSize: 14,
                  lineHeight: 1.7,
                }}>
                  {item.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
