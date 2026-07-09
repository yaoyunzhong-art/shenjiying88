'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { QuickStats } from './QuickStats';
import { DataTable, type DataTableColumn } from './DataTable';
import type { QuickStatItem } from './QuickStats';

// ---- 类型定义 ----

/** 区域设备概况 */
export interface ZoneDeviceStatus {
  zoneId: string;
  zoneName: string;
  total: number;
  online: number;
  fault: number;
  utilizationRate: number; // 0-100
}

/** 实时客流统计 */
export interface VenueTraffic {
  currentVisitors: number;
  capacity: number;
  entryCount: number;
  exitCount: number;
  avgStayMinutes: number;
  peakTime: string;
}

/** 营收概况 */
export interface VenueRevenue {
  grossRevenue: number;
  ticketRevenue: number;
  gameRevenue: number;
  foodBeverage: number;
  otherRevenue: number;
  targetRevenue: number;
  completionRate: number;
}

/** 异常告警 */
export interface VenueAlert {
  id: string;
  type: 'device' | 'security' | 'staff' | 'revenue';
  typeLabel: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  zoneName: string;
  reportedAt: string;
  handler?: string;
  status: 'pending' | 'processing' | 'resolved';
}

/** 场地主管工作台 props */
export interface VenueSupervisorDashboardProps {
  zoneDevices: ZoneDeviceStatus[];
  traffic: VenueTraffic;
  revenue: VenueRevenue;
  alerts: VenueAlert[];
  shiftName: string;
  onViewZone?: (zoneId: string) => void;
  onViewTraffic?: () => void;
  onOpenReport?: () => void;
  onHandleAlert?: (alertId: string) => void;
  onStartPatrol?: () => void;
}

// ---- 内部组件 ----

function ZoneCard({ zone, onView }: { zone: ZoneDeviceStatus; onView?: (id: string) => void }) {
  const utilColor =
    zone.utilizationRate > 80 ? '#10b981' :
    zone.utilizationRate > 50 ? '#f59e0b' :
    zone.utilizationRate > 20 ? '#3b82f6' : '#94a3b8';

  return (
    <div
      onClick={() => onView?.(zone.zoneId)}
      style={{
        borderRadius: 16,
        padding: 16,
        background: 'rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        cursor: onView ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>{zone.zoneName}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#94a3b8' }}>
        <span>总数 <strong style={{ color: '#e2e8f0' }}>{zone.total}</strong></span>
        <span>在线 <strong style={{ color: '#4ade80' }}>{zone.online}</strong></span>
        <span>故障 <strong style={{ color: '#f87171' }}>{zone.fault}</strong></span>
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: 'rgba(148, 163, 184, 0.2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${zone.utilizationRate}%`,
              height: '100%',
              borderRadius: 3,
              background: utilColor,
              transition: 'width 0.3s',
            }}
          />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: utilColor }}>{zone.utilizationRate}%</span>
      </div>
    </div>
  );
}

const ALERT_COLUMNS: DataTableColumn<VenueAlert>[] = [
  {
    key: 'severity',
    header: '级别',
    width: '70',
    render: (row: VenueAlert) => {
      const map: Record<VenueAlert['severity'], { label: string; variant: 'danger' | 'warning' | 'info' }> = {
        critical: { label: '紧急', variant: 'danger' },
        warning: { label: '警告', variant: 'warning' },
        info: { label: '提示', variant: 'info' },
      };
      return <StatusBadge variant={map[row.severity].variant} label={map[row.severity].label} />;
    },
  },
  { key: 'typeLabel', header: '类型', width: '80' },
  { key: 'message', header: '告警内容', width: 'auto' },
  { key: 'zoneName', header: '区域', width: '100' },
  { key: 'reportedAt', header: '时间', width: '100' },
  {
    key: 'status',
    header: '状态',
    width: '80',
    render: (row: VenueAlert) => {
      const map: Record<VenueAlert['status'], { label: string; variant: 'warning' | 'info' | 'success' }> = {
        pending: { label: '待处理', variant: 'warning' },
        processing: { label: '处理中', variant: 'info' },
        resolved: { label: '已处理', variant: 'success' },
      };
      return <StatusBadge variant={map[row.status].variant} label={map[row.status].label} />;
    },
  },
  {
    key: 'handler',
    header: '负责人',
    width: '80',
    render: (row: VenueAlert) => row.handler ?? '-',
  },
];

// ---- 主组件 ----

export function VenueSupervisorDashboard({
  zoneDevices,
  traffic,
  revenue,
  alerts,
  shiftName,
  onViewZone,
  onViewTraffic,
  onOpenReport,
  onHandleAlert,
  onStartPatrol,
}: VenueSupervisorDashboardProps) {
  const capacityPercent = Math.round((traffic.currentVisitors / traffic.capacity) * 100);
  const capacityColor =
    capacityPercent > 90 ? '#f87171' :
    capacityPercent > 70 ? '#f59e0b' :
    capacityPercent > 40 ? '#3b82f6' : '#10b981';

  const statItems: QuickStatItem[] = [
    { label: '当前客流', value: `${traffic.currentVisitors}` },
    { label: '今日入场', value: `${traffic.entryCount}` },
    { label: '总收入 ¥', value: `${revenue.grossRevenue.toLocaleString()}` },
    { label: '目标完成率', value: `${revenue.completionRate}%` },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* 头部 */}
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
            当前班次 · {shiftName}
          </div>
          <h2 style={{ margin: 0 }}>场地主管工作台</h2>
          <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 14 }}>
            <span>容量 <strong style={{ color: capacityColor }}>{traffic.currentVisitors}</strong> / {traffic.capacity}</span>
            <span>均停留 <strong>{traffic.avgStayMinutes}</strong> 分钟</span>
            <span>高峰 <strong>{traffic.peakTime}</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={onViewTraffic}
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
            客流分析
          </button>
          <button
            onClick={onStartPatrol}
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
            开始巡检
          </button>
          <button
            onClick={onOpenReport}
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
            生成报表
          </button>
        </div>
      </div>

      {/* 快速统计 */}
      <QuickStats items={statItems} />

      {/* 容量指示条 */}
      <div
        style={{
          marginTop: 20,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#334155', minWidth: 60 }}>场馆容量</span>
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(capacityPercent, 100)}%`,
              height: '100%',
              borderRadius: 4,
              background: capacityColor,
              transition: 'width 0.5s',
            }}
          />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#334155', minWidth: 60, textAlign: 'right' }}>
          {capacityPercent}%
        </span>
      </div>

      {/* 区域设备概况 */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ color: '#1e293b', marginBottom: 16 }}>区域设备概况</h3>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {zoneDevices.map((z) => (
            <ZoneCard key={z.zoneId} zone={z} onView={onViewZone} />
          ))}
        </div>
      </div>

      {/* 营收概览 */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ color: '#1e293b', marginBottom: 16 }}>今日营收 ¥{revenue.grossRevenue.toLocaleString()}</h3>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {[
            { label: '门票', value: revenue.ticketRevenue },
            { label: '游戏', value: revenue.gameRevenue },
            { label: '餐饮', value: revenue.foodBeverage },
            { label: '其他', value: revenue.otherRevenue },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 12,
                padding: 16,
                background: 'rgba(15, 23, 42, 0.2)',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
                ¥{item.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        {revenue.targetRevenue > 0 && (
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              color: revenue.completionRate >= 100 ? '#10b981' : '#f59e0b',
              fontWeight: 500,
            }}
          >
            目标 ¥{revenue.targetRevenue.toLocaleString()} · 完成 {revenue.completionRate}%
          </div>
        )}
      </div>

      {/* 异常告警列表 */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#1e293b', margin: 0 }}>
            异常告警
            {alerts.filter((a) => a.status !== 'resolved').length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 13, color: '#f87171' }}>
                ({alerts.filter((a) => a.status !== 'resolved').length} 条未处理)
              </span>
            )}
          </h3>
        </div>
        <DataTable<VenueAlert>
          columns={ALERT_COLUMNS}
          data={alerts}
          rowKey={(r) => r.id}
          onRowClick={(r) => onHandleAlert?.(r.id)}
          emptyText="暂无告警，运营一切正常"
        />
      </div>
    </div>
  );
}
