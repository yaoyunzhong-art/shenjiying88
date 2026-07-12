/**
 * 公告 — Announcements (storefront-web)
 */
'use client';
import React from 'react';
export default function AnnouncementsPage() {
  const items = [
    { title: '新店开业优惠', desc: '充值满100送15，限时一周', date: '2026-07-12', badge: 'NEW' },
    { title: '设备升级通知', desc: 'VR体验区已全面升级为最新设备', date: '2026-07-10', badge: '更新' },
    { title: '会员日特惠', desc: '每月15日会员双倍积分', date: '2026-07-08', badge: '会员' },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>公告</h1>
        {items.map((item, i) => (
          <div key={i} style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{item.title}</span>
              <span style={{ padding: '2px 8px', borderRadius: 6, background: '#f59e0b20', color: '#fbbf24', fontSize: 11 }}>{item.badge}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4 }}>{item.desc}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{item.date}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
