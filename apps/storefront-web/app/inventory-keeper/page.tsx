/**
 * 库存管理 — Inventory Keeper (storefront-web)
 */
'use client';
import React from 'react';
export default function InventoryKeeperPage() {
  const items = [
    { name: '游戏币', stock: 4980, unit: '枚', min: 1000, status: 'normal' },
    { name: '饮料', stock: 56, unit: '箱', min: 20, status: 'normal' },
    { name: '礼品', stock: 48, unit: '个', min: 10, status: 'normal' },
    { name: '打印纸', stock: 3, unit: '箱', min: 5, status: 'low' },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>库存管理</h1>
        {items.map((item, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, marginBottom: 6, background: 'rgba(30,41,59,0.6)', border: `1px solid ${item.status === 'low' ? 'rgba(248,113,113,0.3)' : 'rgba(148,163,184,0.08)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#e2e8f0' }}>{item.name}</span>
              <span style={{ color: item.status === 'low' ? '#f87171' : '#94a3b8', fontWeight: 600 }}>{item.stock} {item.unit}</span>
            </div>
            {item.status === 'low' && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>⚠️ 库存低于安全值 (最低 {item.min})</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
