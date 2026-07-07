'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 培训运营指标 */
export interface TrainingDailyMetrics {
  totalSessions: number;
  totalAttendees: number;
  avgCompletionRate: number;
  avgRating: number;
  sessionsTrend: number;
  attendeesTrend: number;
  completionTrend: number;
  ratingTrend: number;
}

/** 培训课程 */
export interface TrainingSession {
  id: string;
  title: string;
  coach: string;
  type: 'skill' | 'safety' | 'sales' | 'service' | 'leadership';
  date: string;
  time: string;
  enrolled: number;
  capacity: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

/** 待认证学员 */
export interface PendingCertification {
  id: string;
  memberName: string;
  skillName: string;
  progress: number; // 0-100
  assignedCoach: string;
  deadline: string;
}

/** 设备培训需求 */
export interface TrainingNeed {
  deviceModel: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}

/** 培训经理工作台 Props */
export interface TrainingManagerDashboardProps {
  /** 培训运营指标 */
  dailyMetrics?: TrainingDailyMetrics;
  /** 今日培训课程 */
  todaySessions?: TrainingSession[];
  /** 待认证学员 */
  pendingCertifications?: PendingCertification[];
  /** 培训需求 */
  trainingNeeds?: TrainingNeed[];
  /** 门店/品牌名称 */
  brandName?: string;
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ---- 默认样式常量 ----

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 24,
};

const SECTION_HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#1a1a1a',
  margin: 0,
};

const CARD: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const TYPE_LABELS: Record<string, string> = {
  skill: '技能培训',
  safety: '安全培训',
  sales: '销售培训',
  service: '服务培训',
  leadership: '管理培训',
};

const TYPE_COLORS: Record<string, string> = {
  skill: '#1677ff',
  safety: '#52c41a',
  sales: '#fa8c16',
  service: '#722ed1',
  leadership: '#eb2f96',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: '已排期',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

// ---- 辅助组件 ----

function TrainingTypeBadge({ type }: { type: string }) {
  return (
    <span
      data-testid={`type-badge-${type}`}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        lineHeight: '20px',
        background: TYPE_COLORS[type] || '#999',
        color: '#fff',
        fontWeight: 500,
      }}
    >
      {TYPE_LABELS[type] || type}
    </span>
  );
}

// ---- 主组件 ----

export function TrainingManagerDashboard({
  dailyMetrics,
  todaySessions,
  pendingCertifications,
  trainingNeeds,
  brandName,
  lastSyncAt,
  loading,
  compact,
  className,
}: TrainingManagerDashboardProps) {
  // ── 加载态 ──
  if (loading) {
    return (
      <div data-testid="training-dashboard-loading" style={{ padding: 24 }}>
        <div
          style={{
            width: '60%',
            height: 24,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: 6,
            marginBottom: 20,
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                background: '#f5f5f5',
                borderRadius: 12,
              }}
            />
          ))}
        </div>
        <p style={{ color: '#999', textAlign: 'center', marginTop: 12 }}>
          正在加载培训数据...
        </p>
      </div>
    );
  }

  // ── 指标卡 ──
  const statItems: QuickStatItem[] = dailyMetrics
    ? [
        {
          label: '今日培训场次',
          value: String(dailyMetrics.totalSessions),
          trend: dailyMetrics.sessionsTrend,
        },
        {
          label: '参训人数',
          value: String(dailyMetrics.totalAttendees),
          trend: dailyMetrics.attendeesTrend,
        },
        {
          label: '平均完成率',
          value: `${dailyMetrics.avgCompletionRate}%`,
          trend: dailyMetrics.completionTrend,
        },
        {
          label: '平均评分',
          value: dailyMetrics.avgRating.toFixed(1),
          trend: dailyMetrics.ratingTrend,
        },
      ]
    : [];

  // ── 课程表格列 ──
  const sessionColumns: DataTableColumn<TrainingSession>[] = [
    { key: 'title', title: '课程名称', sortable: true, dataKey: 'title' },
    {
      key: 'type',
      title: '类型',
      dataKey: 'type',
      render: (row: TrainingSession) => (
        <TrainingTypeBadge type={row.type} />
      ),
    },
    { key: 'coach', title: '教练', dataKey: 'coach' },
    {
      key: 'date',
      title: '日期',
      dataKey: 'date',
      render: (row: TrainingSession) => (
        <span style={{ whiteSpace: 'nowrap' }}>{row.date}</span>
      ),
    },
    {
      key: 'enrolled',
      title: '报名/容量',
      sortable: true,
      dataKey: 'enrolled',
      render: (row: TrainingSession) => {
        const pct = Math.round((row.enrolled / Math.max(row.capacity, 1)) * 100);
        const color = pct >= 90 ? '#ff4d4f' : pct >= 60 ? '#fa8c16' : '#52c41a';
        return (
          <span style={{ color, fontWeight: 500 }}>
            {row.enrolled}/{row.capacity}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
    },
  ];

  const compactSessionColumns: DataTableColumn<TrainingSession>[] = [
    { key: 'title', title: '课程', dataKey: 'title' },
    { key: 'coach', title: '教练', dataKey: 'coach' },
    {
      key: 'enrolled',
      title: '报名',
      dataKey: 'enrolled',
      render: (row: TrainingSession) => {
        const pct = Math.round((row.enrolled / Math.max(row.capacity, 1)) * 100);
        const color = pct >= 90 ? '#ff4d4f' : pct >= 60 ? '#fa8c16' : '#52c41a';
        return (
          <span style={{ color, fontWeight: 500 }}>
            {row.enrolled}/{row.capacity}
          </span>
        );
      },
    },
  ];

  // ── 渲染 ──
  return (
    <div
      data-testid="training-dashboard"
      className={className}
      style={{ padding: compact ? 12 : 24 }}
    >
      {/* 标题区 */}
      <div
        data-testid="training-dashboard-title"
        style={{
          ...SECTION_HEADER,
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
          {brandName ? `${brandName} 培训管理` : '培训经理工作台'}
        </h1>
        {lastSyncAt && (
          <span style={{ fontSize: 12, color: '#999' }}>
            最后同步: {lastSyncAt}
          </span>
        )}
      </div>

      {/* 指标 */}
      {statItems.length > 0 && (
        <div style={SECTION_STYLE}>
          <QuickStats items={statItems} columns={compact ? 2 : 4} />
        </div>
      )}

      {/* 今日培训课程 */}
      {todaySessions && todaySessions.length > 0 && (
        <div style={{ ...SECTION_STYLE, ...CARD }}>
          <div style={SECTION_HEADER}>
            <h2 style={SECTION_TITLE}>📋 今日培训课程</h2>
            <span style={{ fontSize: 12, color: '#999' }}>
              共 {todaySessions.length} 场
            </span>
          </div>
          <DataTable
            columns={compact ? compactSessionColumns : sessionColumns}
            data={todaySessions}
            rowKey={(s: TrainingSession) => s.id}
            compact={compact}
          />
        </div>
      )}

      {/* 待认证学员 */}
      {pendingCertifications && pendingCertifications.length > 0 && (
        <div style={{ ...SECTION_STYLE, ...CARD }}>
          <div style={SECTION_HEADER}>
            <h2 style={SECTION_TITLE}>🏅 待认证学员</h2>
            <span style={{ fontSize: 12, color: '#999' }}>
              {pendingCertifications.length} 人待跟进
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingCertifications.map((cert) => (
              <div
                key={cert.id}
                data-testid={`cert-${cert.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>
                    {cert.memberName}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {cert.skillName} · 教练: {cert.assignedCoach}
                  </div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    截止: {cert.deadline}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: cert.progress >= 80 ? '#52c41a' : cert.progress >= 50 ? '#fa8c16' : '#ff4d4f',
                    }}
                  >
                    {cert.progress}%
                  </div>
                  <div
                    style={{
                      width: 60,
                      height: 4,
                      background: '#f0f0f0',
                      borderRadius: 2,
                      marginTop: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${cert.progress}%`,
                        height: '100%',
                        background: cert.progress >= 80 ? '#52c41a' : cert.progress >= 50 ? '#fa8c16' : '#ff4d4f',
                        borderRadius: 2,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 设备培训需求 */}
      {trainingNeeds && trainingNeeds.length > 0 && (
        <div style={{ ...SECTION_STYLE, ...CARD }}>
          <div style={SECTION_HEADER}>
            <h2 style={SECTION_TITLE}>🔧 设备培训需求</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {trainingNeeds.map((need, index) => (
              <span
                key={index}
                data-testid={`need-${need.deviceModel.replace(/\s+/g, '-')}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 13,
                  background:
                    need.priority === 'high'
                      ? '#fff2f0'
                      : need.priority === 'medium'
                        ? '#fffbe6'
                        : '#f6ffed',
                  color:
                    need.priority === 'high'
                      ? '#ff4d4f'
                      : need.priority === 'medium'
                        ? '#faad14'
                        : '#52c41a',
                  border: `1px solid ${
                    need.priority === 'high'
                      ? '#ffccc7'
                      : need.priority === 'medium'
                        ? '#ffe58f'
                        : '#b7eb8f'
                  }`,
                }}
              >
                <strong>{need.deviceModel}</strong>
                <span>{need.count}人</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                  {PRIORITY_LABELS[need.priority]}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
