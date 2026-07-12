/**
 * 盘点 — Stocktaking (storefront-web)
 */
'use client';
import React, { useState } from 'react';
export default function StocktakingPage() {
  const [items] = useState([
    { name: '游戏币', expected: 5000, actual: 4980, diff: -20 },
    { name: '饮料(箱)', expected: 120, actual: 120, diff: 0 },
    { name: '礼品玩偶', expected: 50, actual: 48, diff: -2 },
    { name: 'VR手柄', expected: 10, actual: 10, diff: 0 },
  ]);
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>库存盘点</h1>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, marginBottom: 6, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <span style={{ color: '#e2e8f0' }}>{item.name}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.actual}/{item.expected}</span>
              {item.diff !== 0 && <span style={{ color: item.diff < 0 ? '#f87171' : '#34d399', fontSize: 12, marginLeft: 8 }}>{item.diff > 0 ? '+' : ''}{item.diff}</span>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
