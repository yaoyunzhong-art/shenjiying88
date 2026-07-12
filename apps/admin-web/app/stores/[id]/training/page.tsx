// 📚 培训管理 — 培训计划/课程/考核

'use client';

import { PageShell } from '@m5/ui';

export default function TrainingPage() {
  return (
    <PageShell>
      <div style={{
        padding: 24, background: '#1e293b', borderRadius: 12,
        border: '1px solid rgba(148, 163, 184, 0.12)',
      }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>📚</div>
        <h2 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          培训管理
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
          培训计划/课程/考核
        </p>
        <div style={{
          marginTop: 24, padding: 20, borderRadius: 8,
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(148, 163, 184, 0.08)',
          color: '#64748b', fontSize: 14, textAlign: 'center',
        }}>
          功能开发中 · 树哥正在施工 🐜
        </div>
      </div>
    </PageShell>
  );
}
