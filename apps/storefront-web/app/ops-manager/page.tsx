/**
 * 运营管理员 — Ops Manager (storefront-web)
 * 功能: 运营任务概览、进度汇总、任务筛选
 * 类型: B-工具箱页
 *
 * 增强内容:
 * - 完工统计卡片 (完成率/总任务/待完成)
 * - 进度条指示
 * - 分类筛选 (全部/待完成/已完成)
 * - 时间分组 (今日/本周)
 * - 模拟动态加载效果
 */
'use client';
import React, { useState, useMemo, useEffect } from 'react';

/* ── 类型 ── */
type TaskFilter = 'all' | 'pending' | 'done';

/* ── 模拟数据 ── */
const ALL_TASKS = [
  { title: '早间巡检', time: '10:00', done: true, date: '2026-07-13', category: '巡检' },
  { title: '设备检查', time: '12:00', done: true, date: '2026-07-13', category: '设备' },
  { title: '库存确认', time: '15:00', done: false, date: '2026-07-13', category: '库存' },
  { title: '日终结算', time: '21:00', done: false, date: '2026-07-13', category: '财务' },
  { title: '消防安全检查', time: '09:30', done: true, date: '2026-07-12', category: '安全' },
  { title: '员工排班确认', time: '14:00', done: false, date: '2026-07-12', category: '人事' },
  { title: '设备清洁保养', time: '11:00', done: true, date: '2026-07-12', category: '设备' },
  { title: '促销物料更新', time: '16:00', done: false, date: '2026-07-11', category: '营销' },
];

const FILTER_OPTIONS: { key: TaskFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待完成' },
  { key: 'done', label: '已完成' },
];

/* ════════════════════════════════════════════════════════════
 * 组件
 * ════════════════════════════════════════════════════════════ */
export default function OpsManagerPage() {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [loading, setLoading] = useState(true);

  // 模拟加载效果
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200 + Math.random() * 150);
    return () => clearTimeout(t);
  }, []);

  /* ── 统计 ── */
  const total = ALL_TASKS.length;
  const doneCount = ALL_TASKS.filter((t) => t.done).length;
  const pendingCount = total - doneCount;
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // 新增: 类别统计
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    ALL_TASKS.forEach(t => {
      if (!map[t.category]) map[t.category] = { total: 0, done: 0 };
      const entry = map[t.category]!;
      entry.total++;
      if (t.done) entry.done++;
    });
    return map;
  }, []);

  /* ── 过滤 ── */
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'done':
        return ALL_TASKS.filter((t) => t.done);
      case 'pending':
        return ALL_TASKS.filter((t) => !t.done);
      default:
        return ALL_TASKS;
    }
  }, [filter]);

  /* ── 按日期分组 ── */
  const groupedTasks = useMemo(() => {
    const groups: Record<string, typeof ALL_TASKS> = {};
    for (const task of filteredTasks) {
      if (!groups[task.date]) groups[task.date] = [];
      (groups[task.date] as typeof ALL_TASKS).push(task);
    }
    return groups;
  }, [filteredTasks]);

  const dateLabels: Record<string, string> = {
    '2026-07-13': '📅 今天',
    '2026-07-12': '📅 昨天',
    '2026-07-11': '📅 前天',
  };

  /* ── 骨架屏 ── */
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 52,
                borderRadius: 10,
                marginBottom: 6,
                background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          ))}
          <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* ── 标题 ── */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
          📋 运营任务
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>
          今日共计 {total} 项任务 · 已完成 {doneCount} 项
        </p>

        {/* ── 完成统计卡片 ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            { label: '总任务', value: total, color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
            { label: '已完成', value: doneCount, color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
            { label: '待完成', value: pendingCount, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '16px 12px',
                borderRadius: 12,
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(148,163,184,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── 类别分布 ── */}
        {Object.keys(categoryStats).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>类别分布</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
              {Object.entries(categoryStats).map(([cat, st]) => (
                <div key={cat} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{cat}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: st.done === st.total ? '#22c55e' : '#fbbf24', marginTop: 2 }}>{st.done}/{st.total}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 进度条 ── */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#64748b',
              marginBottom: 6,
            }}
          >
            <span>完成进度</span>
            <span>{completionRate}%</span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(30,41,59,0.8)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${completionRate}%`,
                borderRadius: 4,
                background: 'linear-gradient(90deg, #3b82f6, #22c55e)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* ── 分类筛选 ── */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                border: `1px solid ${filter === opt.key ? '#3b82f6' : 'rgba(148,163,184,0.15)'}`,
                background: filter === opt.key ? 'rgba(59,130,246,0.15)' : 'rgba(15,23,42,0.3)',
                color: filter === opt.key ? '#60a5fa' : '#94a3b8',
                fontSize: 13,
                fontWeight: filter === opt.key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
              {opt.key === 'all' && ` (${total})`}
              {opt.key === 'done' && ` (${doneCount})`}
              {opt.key === 'pending' && ` (${pendingCount})`}
            </button>
          ))}
        </div>

        {/* ── 按日期分组的任务列表 ── */}
        {Object.entries(groupedTasks).map(([date, tasks]) => (
          <div key={date} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#64748b',
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              {dateLabels[date] ?? date}
            </div>

            {tasks.map((t, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 10,
                  marginBottom: 6,
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(148,163,184,0.08)',
                  transition: 'all 0.15s',
                  opacity: t.done ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 18 }}>{t.done ? '✅' : '⬜'}</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: '#e2e8f0',
                      textDecoration: t.done ? 'line-through' : 'none',
                    }}
                  >
                    {t.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{t.time}</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: 11,
                        color: '#64748b',
                        background: 'rgba(148,163,184,0.1)',
                      }}
                    >
                      {t.category}
                    </span>
                  </div>
                </div>
                {!t.done && (
                  <span
                    style={{
                      color: '#fbbf24',
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#f59e0b20',
                    }}
                  >
                    待完成
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* ── 空状态 ── */}
        {filteredTasks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: '#64748b',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 14 }}>没有匹配的任务</div>
          </div>
        )}
      </div>
    </main>
  );
}
