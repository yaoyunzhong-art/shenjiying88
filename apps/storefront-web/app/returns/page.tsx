/**
 * 退换货 — Returns (storefront-web)
 */
'use client';
import React from 'react';
export default function ReturnsPage() {
  const items = [
    { id: 'TH20260712001', product: '游戏币(袋装)', qty: 2, reason: '包装破损', status: '处理中', date: '2026-07-12' },
    { id: 'TH20260710003', product: '饮品-橙汁', qty: 1, reason: '临近保质期', status: '已完成', date: '2026-07-10' },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>退换货管理</h1>
        {items.map((item, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 6, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#e2e8f0' }}>{item.id}</span>
              <span style={{ color: item.status === '处理中' ? '#fbbf24' : '#34d399', fontSize: 13 }}>{item.status}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{item.product} × {item.qty}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>{item.reason} · {item.date}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
