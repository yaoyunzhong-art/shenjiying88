/**
 * 补货管理 — Replenishment (storefront-web)
 */
'use client';
import React from 'react';
export default function ReplenishmentPage() {
  const items = [
    { name: '打印纸', qty: 5, unit: '箱', status: 'pending', priority: '高' },
    { name: '饮品-可乐', qty: 20, unit: '箱', status: 'pending', priority: '中' },
    { name: '游戏币', qty: 2000, unit: '枚', status: 'ordered', priority: '中' },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>补货管理</h1>
        {items.map((item, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 6, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#e2e8f0' }}>{item.name}</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{item.qty} {item.unit}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
              <span style={{ color: item.priority === '高' ? '#f87171' : '#fbbf24' }}>[{item.priority}优先级]</span>
              <span style={{ color: item.status === 'pending' ? '#fbbf24' : '#34d399' }}>
                {item.status === 'pending' ? '待采购' : '已下单'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
