/**
 * 运营管理员 — Ops Manager (storefront-web)
 */
'use client';
import React from 'react';
export default function OpsManagerPage() {
  const tasks = [
    { title: '早间巡检', time: '10:00', done: true },
    { title: '设备检查', time: '12:00', done: true },
    { title: '库存确认', time: '15:00', done: false },
    { title: '日终结算', time: '21:00', done: false },
  ];
  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>运营任务</h1>
        {tasks.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10, marginBottom: 6, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)' }}>
            <span style={{ fontSize: 18 }}>{t.done ? '✅' : '⬜'}</span>
            <div style={{ flex: 1 }}><div style={{ color: '#e2e8f0' }}>{t.title}</div><div style={{ color: '#64748b', fontSize: 12 }}>{t.time}</div></div>
            {!t.done && <span style={{ color: '#fbbf24', fontSize: 12, padding: '2px 8px', borderRadius: 6, background: '#f59e0b20' }}>待完成</span>}
          </div>
        ))}
      </div>
    </main>
  );
}
