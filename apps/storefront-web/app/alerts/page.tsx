/**
 * 消息通知 — Alerts (storefront-web)
 */
'use client';

import React, { useState } from 'react';

export default function AlertsPage() {
  const [alerts] = useState([
    { id: '1', title: '充值成功', desc: '您已成功充值¥100，实际到账¥115', time: '10分钟前', type: 'success' },
    { id: '2', title: '预约提醒', desc: '您预定的VR体验将于明天14:00开始', time: '1小时前', type: 'info' },
    { id: '3', title: '积分变动', desc: '消费获得+168积分', time: '3小时前', type: 'points' },
    { id: '4', title: '会员升级', desc: '您已升级为黄金会员！', time: '昨天', type: 'upgrade' },
  ]);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 20 }}>消息通知</h1>
        {alerts.map(a => (
          <div key={a.id} style={{ padding: '16px 20px', borderRadius: 14, marginBottom: 10, background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{a.title}</span>
              <span style={{ color: '#64748b', fontSize: 12 }}>{a.time}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
