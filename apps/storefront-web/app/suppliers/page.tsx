/**
 * 供应商 — Suppliers (storefront-web)
 */
'use client';
import React from 'react';
export default function SuppliersPage() {
  const suppliers = [
    { name: '华强游戏设备有限公司', contact: '张经理', phone: '13800001111', status: 'active' },
    { name: '欢乐谷礼品供应', contact: '李主管', phone: '13800002222', status: 'active' },
    { name: '饮品速配', contact: '王总', phone: '13800003333', status: 'active' },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>供应商管理</h1>
        {suppliers.map((s, i) => (
          <div key={i} style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{s.name}</span>
              <span style={{ padding: '2px 8px', borderRadius: 6, background: '#34d39920', color: '#34d399', fontSize: 11 }}>合作中</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{s.contact} · {s.phone}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
