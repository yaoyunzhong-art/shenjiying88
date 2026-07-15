/**
 * 教练工作台页 — Coach Dashboard (Next.js App Router Page)
 * 角色: 教练/导玩员视角，展示接待指标、推广任务、待跟进会员
 * 功能: 数据面板/指标卡/会员跟进表格/推广任务进度/个人排名
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { PageShell, StatusBadge } from '@m5/ui';
import type {
  CoachDailyMetrics,
  FollowUpMember,
  PromoTask,
} from '@m5/ui';

// ============================================================
// Mock 教练工作台数据
// ============================================================

const MOCK_METRICS: CoachDailyMetrics = {
  servedCount: 68,
  newMembers: 12,
  promoConversions: 23,
  followUps: 8,
  servedTrend: 5.2,
  memberTrend: 8.0,
  promoTrend: 12.3,
  followUpTrend: -2.1,
};

const MOCK_FOLLOW_UPS: FollowUpMember[] = [
  {
    id: 'fu-1',
    name: '王小刚',
    tier: 'GOLD',
    lastContactAt: '2026-06-25',
    status: 'pending',
    note: '对高端体验套餐感兴趣，需跟进报价',
    phone: '138****1234',
  },
  {
    id: 'fu-2',
    name: '李丽华',
    tier: 'PLATINUM',
    lastContactAt: '2026-06-24',
    status: 'contacted',
    phone: '139****5678',
  },
  {
    id: 'fu-3',
    name: '陈志强',
    tier: 'SILVER',
    lastContactAt: '2026-06-23',
    status: 'converted',
    note: '已购买季卡套餐',
  },
  {
    id: 'fu-4',
    name: '张倩',
    tier: 'DIAMOND',
    lastContactAt: '2026-06-20',
    status: 'pending',
    note: '询问家庭年卡优惠',
    phone: '136****9012',
  },
  {
    id: 'fu-5',
    name: '刘强',
    tier: 'GOLD',
    lastContactAt: '2026-06-18',
    status: 'lost',
  },
];

const MOCK_PROMO_TASKS: PromoTask[] = [
  {
    id: 'pt-1',
    title: '扫码分享有礼',
    type: 'share',
    target: 50,
    completed: 32,
    deadline: '2026-06-30',
  },
  {
    id: 'pt-2',
    title: '老带新裂变活动',
    type: 'referral',
    target: 30,
    completed: 18,
    deadline: '2026-07-05',
  },
  {
    id: 'pt-3',
    title: '门店周年庆促销',
    type: 'event',
    target: 200,
    completed: 145,
    deadline: '2026-07-10',
  },
  {
    id: 'pt-4',
    title: '夏日特惠券派发',
    type: 'coupon',
    target: 100,
    completed: 67,
    deadline: '2026-07-03',
  },
];

// ============================================================
// 子组件：指标统计卡片
// ============================================================

function MetricCard({
  label,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon: string;
  color: string;
}) {
  const isPositive = trend !== undefined && trend >= 0;
  return (
    <div
      style={{
        flex: 1,
        minWidth: 160,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}{unit && <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>{unit}</span>}</div>
      {trend !== undefined && (
        <div
          style={{
            fontSize: 12,
            marginTop: 6,
            color: isPositive ? '#059669' : '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{isPositive ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%</span>
          {trendLabel && <span style={{ color: '#9ca3af' }}>{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 子组件：带跟进状态徽章的会员行
// ============================================================

const FOLLOWUP_STATUS_LABEL: Record<string, string> = {
  pending: '待跟进',
  contacted: '已联系',
  converted: '已转化',
  lost: '已流失',
};
const FOLLOWUP_STATUS_VARIANT: Record<string, string> = {
  pending: 'warning',
  contacted: 'info',
  converted: 'success',
  lost: 'danger',
};
const TIER_LABEL: Record<string, string> = {
  DIAMOND: '💎 钻石',
  PLATINUM: '🏆 铂金',
  GOLD: '🥇 金卡',
  SILVER: '🥈 银卡',
  BRONZE: '🥉 铜卡',
};
const TIER_COLOR: Record<string, string> = {
  DIAMOND: '#b3a5ff',
  PLATINUM: '#60a5fa',
  GOLD: '#f59e0b',
  SILVER: '#9ca3af',
  BRONZE: '#d97706',
};

// ============================================================
// 子组件：推广任务进度条
// ============================================================

function PromoTaskCard({
  task,
  onView,
}: {
  task: PromoTask;
  onView: (task: PromoTask) => void;
}) {
  const pct = Math.min(100, Math.round((task.completed / task.target) * 100));
  const needsAttention = pct < 50 && new Date(task.deadline) < new Date(Date.now() + 3 * 86400000);
  return (
    <div
      style={{
        padding: '14px 16px',
        background: '#fff',
        borderRadius: 10,
        border: needsAttention ? '1px solid #fca5a5' : '1px solid #e5e7eb',
        flex: '1 1 220px',
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</span>
        <span style={{ fontSize: 11, color: needsAttention ? '#dc2626' : '#6b7280' }}>
          {needsAttention ? '⚠️ 即将到期' : `截止 ${task.deadline}`}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: '#e5e7eb',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 6,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: pct >= 80 ? '#059669' : pct >= 50 ? '#f59e0b' : '#ef4444',
            borderRadius: 4,
            transition: 'width 0.3s',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: '#6b7280',
        }}
      >
        <span>{task.completed}/{task.target} ({pct}%)</span>
        <button
          onClick={() => onView(task)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#2563eb',
            cursor: 'pointer',
            fontSize: 12,
            padding: 0,
          }}
        >
          查看 →
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 子组件：会员跟进明细弹窗
// ============================================================

function FollowUpDetailModal({
  member,
  onClose,
  onUpdateStatus,
}: {
  member: FollowUpMember;
  onClose: () => void;
  onUpdateStatus: (id: string, status: FollowUpMember['status']) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          width: 440,
          maxWidth: '90vw',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>
          跟进会员 — {member.name}
        </h3>
        <div style={{ fontSize: 14, lineHeight: 1.8, display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px 12px' }}>
          <span style={{ color: '#6b7280' }}>姓名</span><span style={{ fontWeight: 600 }}>{member.name}</span>
          <span style={{ color: '#6b7280' }}>等级</span>
          <span style={{ color: TIER_COLOR[member.tier] || '#6b7280', fontWeight: 600 }}>
            {TIER_LABEL[member.tier] || member.tier}
          </span>
          <span style={{ color: '#6b7280' }}>手机</span><span>{member.phone || '未记录'}</span>
          <span style={{ color: '#6b7280' }}>上次联系</span><span>{member.lastContactAt}</span>
          <span style={{ color: '#6b7280' }}>状态</span>
          <span>
            <StatusBadge
              variant={FOLLOWUP_STATUS_VARIANT[member.status] as 'warning' | 'info' | 'success' | 'danger'}
              label={FOLLOWUP_STATUS_LABEL[member.status] ?? member.status}
            />
          </span>
          {member.note && (
            <>
              <span style={{ color: '#6b7280' }}>备注</span>
              <span style={{ color: '#374151' }}>{member.note}</span>
            </>
          )}
        </div>
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            borderTop: '1px solid #e5e7eb',
            paddingTop: 16,
          }}
        >
          {member.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(member.id, 'contacted')}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              标记已联系
            </button>
          )}
          {member.status === 'contacted' && (
            <button
              onClick={() => onUpdateStatus(member.id, 'converted')}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: '#059669',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              标记已转化
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 教练工作台页面
// ============================================================

export default function CoachPage() {
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpMember[]>(MOCK_FOLLOW_UPS);
  const [detailMember, setDetailMember] = useState<FollowUpMember | null>(null);
  const [selectedTask, setSelectedTask] = useState<PromoTask | null>(null);

  /** 模拟刷新数据 */
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  /** 更新跟进状态 */
  const handleUpdateStatus = useCallback((id: string, status: FollowUpMember['status']) => {
    setFollowUps((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    setDetailMember(null);
  }, []);

  /** 待处理数与转化率 */
  const followUpStats = useMemo(() => {
    const pending = followUps.filter((m) => m.status === 'pending').length;
    const contacted = followUps.filter((m) => m.status === 'contacted').length;
    const converted = followUps.filter((m) => m.status === 'converted').length;
    const lost = followUps.filter((m) => m.status === 'lost').length;
    const total = followUps.length;
    return { pending, contacted, converted, lost, total };
  }, [followUps]);

  /** 推广总进度 */
  const promoStats = useMemo(() => {
    const totalTarget = MOCK_PROMO_TASKS.reduce((s, t) => s + t.target, 0);
    const totalCompleted = MOCK_PROMO_TASKS.reduce((s, t) => s + t.completed, 0);
    return { totalTarget, totalCompleted, rate: totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0 };
  }, []);

  return (
    <PageShell
      title="教练工作台"
      description="教练/导玩员日常工作台 — 接待指标、推广任务与会员跟进"
    >
      <div style={{ padding: 24 }}>
        {/* 头部信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🏋️ 教练工作台</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              张教练 · 朝阳旗舰店 · 工号 EMP-0032 · 排名 {3}/{12}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>上次同步: {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: loading ? '#f3f4f6' : '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {loading ? '⏳ 刷新中…' : '🔄 刷新'}
            </button>
          </div>
        </div>

        {/* 指标卡片区 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <MetricCard label="接待人次" value={MOCK_METRICS.servedCount} icon="👥" color="#2563eb" trend={MOCK_METRICS.servedTrend} trendLabel="vs 昨日" />
          <MetricCard label="新增会员" value={MOCK_METRICS.newMembers} icon="🆕" color="#059669" trend={MOCK_METRICS.memberTrend} trendLabel="vs 昨日" />
          <MetricCard label="推广转化" value={MOCK_METRICS.promoConversions} icon="📣" color="#d97706" trend={MOCK_METRICS.promoTrend} trendLabel="vs 昨日" />
          <MetricCard label="跟进回访" value={MOCK_METRICS.followUps} icon="📞" color="#7c3aed" trend={MOCK_METRICS.followUpTrend} trendLabel="vs 昨日" />
          <MetricCard label="待处理跟进" value={followUpStats.pending} icon="⏳" color="#dc2626" />
        </div>

        {/* 推广任务区 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>📢 推广任务进度</h3>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              总进度 {promoStats.totalCompleted}/{promoStats.totalTarget} ({promoStats.rate}%)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {MOCK_PROMO_TASKS.map((task) => (
              <PromoTaskCard key={task.id} task={task} onView={setSelectedTask} />
            ))}
          </div>
        </div>

        {/* 待跟进会员详情面板 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              📋 待跟进会员
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginLeft: 8 }}>
                {followUpStats.pending} 待跟进 · {followUpStats.contacted} 已联系 · {followUpStats.converted} 已转化 · {followUpStats.lost} 已流失
              </span>
            </h3>
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
              background: '#fff',
              borderRadius: 10,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>会员</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>等级</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>手机</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>上次联系</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>状态</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>备注</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '10px 14px', color: TIER_COLOR[m.tier] || '#6b7280', fontWeight: 600 }}>
                    {TIER_LABEL[m.tier] || m.tier}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{m.phone || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{m.lastContactAt}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge
                      variant={FOLLOWUP_STATUS_VARIANT[m.status] as 'warning' | 'info' | 'success' | 'danger'}
                      label={FOLLOWUP_STATUS_LABEL[m.status] ?? m.status}
                    />
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.note || '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <button
                      onClick={() => setDetailMember(m)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      跟进
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 排名与小计 */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            padding: 16,
            background: '#f9fafb',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          <span>🏅 本月业绩排名: 第 3 名 / 共 12 名</span>
          <span>📊 跟进转化率: {followUpStats.total > 0 ? Math.round((followUpStats.converted / followUpStats.total) * 100) : 0}%</span>
          <span>📅 推广完成率: {promoStats.rate}%</span>
        </div>
      </div>

      {/* 会员跟进详情弹窗 */}
      {detailMember && (
        <FollowUpDetailModal
          member={detailMember}
          onClose={() => setDetailMember(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* 推广任务详情弹窗 */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 28,
              width: 400,
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 700 }}>
              📢 {selectedTask.title}
            </h3>
            <div style={{ fontSize: 14, lineHeight: 2 }}>
              <div>类型：{selectedTask.type === 'share' ? '分享' : selectedTask.type === 'referral' ? '裂变' : selectedTask.type === 'event' ? '活动' : '优惠券'}</div>
              <div>目标：{selectedTask.target}</div>
              <div>已完成：{selectedTask.completed}</div>
              <div>完成率：{Math.round((selectedTask.completed / selectedTask.target) * 100)}%</div>
              <div>截止日期：{selectedTask.deadline}</div>
            </div>
            <div style={{ marginTop: 16, height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((selectedTask.completed / selectedTask.target) * 100))}%`,
                  background: '#2563eb',
                  borderRadius: 5,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              style={{
                marginTop: 16,
                padding: '8px 20px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
