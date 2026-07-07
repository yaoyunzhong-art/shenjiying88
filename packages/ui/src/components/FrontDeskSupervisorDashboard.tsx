'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { QuickStats } from './QuickStats';
import { DataTable, type DataTableColumn } from './DataTable';
import { StatTrend } from './StatTrend';
import type { QuickStatItem } from './QuickStats';


// ---- 类型定义 ----

/** 前台班次信息 */
export interface StaffShiftInfo {
  date: string;
  shiftName: string;
  staffCount: number;
  onDuty: number;
  onBreak: number;
  shiftLeadName: string;
}

/** 排队队列概览 */
export interface QueueOverview {
  queueType: 'service' | 'pickup' | 'return' | 'consult';
  queueTypeLabel: string;
  waitingCount: number;
  avgWaitMinutes: number;
  maxWaitMinutes: number;
  trend: number; // 与上一时段百分比变化
}

/** 前台服务指标 */
export interface FrontDeskMetrics {
  totalVisitors: number;
  servedCount: number;
  avgServiceMinutes: number;
  satisfactionScore: number;
  peakHourRevenue: number;
}

/** 实时接待记录 */
export interface ServiceRecord {
  id: string;
  visitorName: string;
  serviceType: string;
  staffName: string;
  startTime: string;
  durationMinutes: number;
  status: 'in_progress' | 'completed' | 'awaiting' | 'transferred';
  notes?: string;
}

/** 前台主管工作台 props */
export interface FrontDeskSupervisorDashboardProps {
  shiftInfo: StaffShiftInfo;
  queueOverview: QueueOverview[];
  metrics: FrontDeskMetrics;
  serviceRecords: ServiceRecord[];
  onViewQueue?: () => void;
  onAssignShift?: () => void;
  onCallNext?: () => void;
  onOpenQuickCheck?: () => void;
  onViewServiceRecord?: (id: string) => void;
}

// ---- 内部组件 ----

function QueueCard({
  queue,
}: {
  queue: QueueOverview;
}) {
  const borderColor =
    queue.avgWaitMinutes > 15
      ? '#fca5a5'
      : queue.avgWaitMinutes > 8
        ? '#fcd34d'
        : '#86efac';

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 16,
        border: `1px solid ${borderColor}`,
        background: 'rgba(15, 23, 42, 0.35)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{queue.queueTypeLabel}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{queue.waitingCount}</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>位等待</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: '#cbd5e1' }}>
        均等 <strong>{queue.avgWaitMinutes}</strong> 分钟 · 最长 {queue.maxWaitMinutes} 分钟
      </div>
      <StatTrend direction={queue.trend >= 0 ? 'up' : 'down'} value={`${queue.trend}%`} label="环比" />
    </div>
  );
}

const SERVICE_RECORD_COLUMNS: DataTableColumn<ServiceRecord>[] = [
  { key: 'visitorName', header: '访客', width: "120" },
  { key: 'serviceType', header: '服务类型', width: "100" },
  { key: 'staffName', header: '接待人员', width: "100" },
  { key: 'startTime', header: '开始时间', width: "100" },
  { key: 'durationMinutes', header: '时长(min)', width: "80", render: (row: ServiceRecord) => `${row.durationMinutes}min` },
  {
    key: 'status',
    header: '状态',
    width: "100",
    render: (row: ServiceRecord) => {
      const v = row.status
      const map: Record<ServiceRecord['status'], { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
        in_progress: { label: '进行中', variant: 'info' },
        completed: { label: '已完成', variant: 'success' },
        awaiting: { label: '待接洽', variant: 'warning' },
        transferred: { label: '已转交', variant: 'neutral' },
      };
      return <StatusBadge variant={map[v].variant} label={map[v].label} />;
    },
  },
];

// ---- 主组件 ----

export function FrontDeskSupervisorDashboard({
  shiftInfo,
  queueOverview,
  metrics,
  serviceRecords,
  onViewQueue,
  onAssignShift,
  onCallNext,
  onOpenQuickCheck,
  onViewServiceRecord,
}: FrontDeskSupervisorDashboardProps) {
  const statItems: QuickStatItem[] = [
    { label: '今日客流', value: `${metrics.totalVisitors}` },
    { label: '已接待', value: `${metrics.servedCount}` },
    { label: '平均服务时长', value: `${metrics.avgServiceMinutes}min` },
    { label: '满意度', value: `${metrics.satisfactionScore}` },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* 头部：班次信息 + 操作按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderRadius: 24,
          padding: 24,
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: '#f8fafc',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>
            {shiftInfo.date} · {shiftInfo.shiftName}
          </div>
          <h2 style={{ margin: 0 }}>前台主管工作台</h2>
          <div style={{ marginTop: 8, color: '#cbd5e1', fontSize: 14 }}>
            当班 {shiftInfo.onDuty} 人 · 休息 {shiftInfo.onBreak} 人 · 领班 {shiftInfo.shiftLeadName}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={onViewQueue}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            查看排队
          </button>
          <button
            onClick={onCallNext}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: '#10b981',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            叫号下一位
          </button>
          <button
            onClick={onOpenQuickCheck}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'rgba(148, 163, 184, 0.2)',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            快速登记
          </button>
          <button
            onClick={onAssignShift}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: 'rgba(148, 163, 184, 0.2)',
              color: '#e2e8f0',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            排班调整
          </button>
        </div>
      </div>

      {/* 快速统计 */}
      <QuickStats items={statItems} />

      {/* 排队队列概览 */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ color: '#1e293b', marginBottom: 16 }}>排队队列</h3>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {queueOverview.map((q) => (
            <QueueCard key={q.queueType} queue={q} />
          ))}
        </div>
      </div>

      {/* 实时接待记录 */}
      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ color: '#1e293b', margin: 0 }}>实时接待记录</h3>
          <span style={{ color: '#64748b', fontSize: 14 }}>
            高峰时段营收 ¥{metrics.peakHourRevenue.toLocaleString()}
          </span>
        </div>
        <DataTable<ServiceRecord>
          columns={SERVICE_RECORD_COLUMNS}
          data={serviceRecords}
          rowKey={(r: ServiceRecord) => r.id}
          onRowClick={(r: ServiceRecord) => onViewServiceRecord?.(r.id)}
          emptyText="暂无接待记录"
        />
      </div>
    </div>
  );
}
