/**
 * 配送追踪 — Delivery Tracking (storefront-web)
 */
'use client';
import React from 'react';
export default function DeliveryTrackingPage() {
  const items = [
    { id: 'DD20260712001', status: '配送中', eta: '30分钟', items: '派对套餐食材', address: '建国路88号' },
    { id: 'DD20260712002', status: '已送达', eta: '已签收', items: '游戏币×200', address: '建国路88号' },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>配送追踪</h1>
        {items.map(item => (
          <div key={item.id} style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 14 }}>{item.id}</span>
              <span style={{ color: item.status === '配送中' ? '#fbbf24' : '#34d399', fontSize: 13 }}>{item.status}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 2 }}>{item.items} → {item.address}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>预计{item.status === '配送中' ? ` ${item.eta}到达` : ' 已签收'}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
