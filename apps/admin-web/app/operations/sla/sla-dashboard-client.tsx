/**
 * SLA Dashboard Client — SLA 监控看板客户端组件
 *
 * 功能:
 * - SLA 达成率三卡片 (99.9%/99.5%/99% 分位)
 * - 响应时间趋势表格 (最近24h 平均/中位/P99)
 * - 服务可用性状态一览 (绿/黄/红)
 * - 告警列表 (时间/来源/级别/状态)
 * - 自动修复率统计
 * - 筛选: 告警级别/状态 过滤
 * - 状态管理: empty / loading (Suspense 中处理)
 */
'use client';

import React, { useState, useMemo } from 'react';
import { StatusBadge, StatCard } from '@m5/ui';
import type {
  SLADashboardSnapshot,
  ServiceStatus,
  AlertLevel,
  AlertStatus,
  ServiceAvailability,
  AlertRecord,
} from '../../sla-types';
import {
  SERVICE_STATUS_LABEL,
  SERVICE_STATUS_COLOR,
  ALERT_LEVEL_LABEL,
  ALERT_LEVEL_COLOR,
  ALERT_STATUS_LABEL,
  ALERT_STATUS_COLOR,
} from '../../sla-types';
import {
  formatMs,
  formatPercent,
  summarizeServiceStatuses,
  filterAlerts,
  computeOverallCompliance,
  getActiveAlertCount,
  getCriticalAlertCount,
} from '../../sla-view-model';

interface Props {
  snapshot: SLADashboardSnapshot;
}

// ── 子组件 ────────────────────────────────────────────────────────────────────

/** SLA 达成率卡片 */
function SLAOverallRateCard({
  label,
  rate,
  color,
}: {
  label: string;
  rate: number;
  color: string;
}) {
  const achieved = rate >= 99.9;
  return (
    <div
      data-testid="sla-overall-card"
      style={{
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginBottom: 2 }}>
        {label} 分位
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>
        {rate.toFixed(2)}%
      </div>
      <div style={{ fontSize: 11, color: achieved ? '#52c41a' : '#faad14' }}>
        {achieved ? '✓ 达标' : '⚠ 未达标'}
      </div>
    </div>
  );
}

/** 响应时间趋势行 */
function TrendRow({ point, index }: { point: { timestamp: string; avgMs: number; medianMs: number; p99Ms: number }; index: number }) {
  const hour = new Date(point.timestamp).getHours();
  return (
    <tr data-testid={`trend-row-${index}`}>
      <td style={tdStyle}>{`${String(hour).padStart(2, '0')}:00`}</td>
      <td style={tdStyle}>{formatMs(point.avgMs)}</td>
      <td style={tdStyle}>{formatMs(point.medianMs)}</td>
      <td style={tdStyle}>
        <span style={{ color: point.p99Ms > 500 ? '#ff4d4f' : point.p99Ms > 200 ? '#faad14' : '#52c41a', fontWeight: 600 }}>
          {formatMs(point.p99Ms)}
        </span>
      </td>
    </tr>
  );
}

/** 服务可用性行 */
function ServiceRow({ svc }: { svc: ServiceAvailability }) {
  return (
    <tr data-testid={`service-row-${svc.serviceId}`}>
      <td style={tdStyle}>
        <span style={{ fontWeight: 600 }}>{svc.serviceName}</span>
      </td>
      <td style={tdStyle}>
        <StatusBadge
          variant={svc.status === 'green' ? 'success' : svc.status === 'yellow' ? 'warning' : 'danger'}
          label={SERVICE_STATUS_LABEL[svc.status]}
        />
      </td>
      <td style={tdStyle}>{formatPercent(svc.uptimePercent, 2)}</td>
      <td style={tdStyle}>{formatMs(svc.avgLatencyMs)}</td>
      <td style={tdStyle}>{formatMs(svc.p99LatencyMs)}</td>
      <td style={tdStyle}>
        {svc.lastDowntimeAt
          ? `${svc.lastDowntimeDurationMinutes} 分钟`
          : '—'}
      </td>
    </tr>
  );
}

/** 告警行 */
function AlertRow({ alert }: { alert: AlertRecord }) {
  const levelColor = ALERT_LEVEL_COLOR[alert.level];
  const statusColor = ALERT_STATUS_COLOR[alert.status];
  return (
    <tr data-testid={`alert-row-${alert.id}`}>
      <td style={tdStyle}>{new Date(alert.occurredAt).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })}</td>
      <td style={tdStyle}>{alert.source}</td>
      <td style={tdStyle}>
        <span style={{ color: levelColor, fontWeight: 600 }}>
          {ALERT_LEVEL_LABEL[alert.level]}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{ color: statusColor, fontWeight: 500 }}>
          {ALERT_STATUS_LABEL[alert.status]}
        </span>
      </td>
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: '#cbd5e1' }}>{alert.message}</span>
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  color: '#e2e8f0',
  borderBottom: '1px solid rgba(148,163,184,0.1)',
};

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function SLADashboardClient({ snapshot }: Props) {
  const [levelFilter, setLevelFilter] = useState<AlertLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | ''>('');

  const overallRate = snapshot.overallRate;
  const trend = snapshot.responseTimeTrend;
  const services = snapshot.services;
  const alerts = snapshot.alerts;
  const autoHeal = snapshot.autoHeal;

  const serviceSummary = useMemo(
    () => summarizeServiceStatuses(services),
    [services],
  );

  const filteredAlerts = useMemo(
    () => filterAlerts(
      alerts,
      levelFilter ? (levelFilter as AlertLevel) : undefined,
      statusFilter ? (statusFilter as AlertStatus) : undefined,
    ),
    [alerts, levelFilter, statusFilter],
  );

  const activeAlertCount = useMemo(() => getActiveAlertCount(alerts), [alerts]);
  const criticalAlertCount = useMemo(() => getCriticalAlertCount(alerts), [alerts]);

  // 空状态判定
  if (services.length === 0 && alerts.length === 0) {
    return (
      <div
        data-testid="sla-dashboard-empty"
        style={{
          padding: 48,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 14,
        }}
      >
        暂无 SLA 监控数据
      </div>
    );
  }

  return (
    <div data-testid="sla-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── 1) SLA 达成率卡片 ── */}
      <div>
        <h3 style={sectionTitle}>SLA 达成率</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <SLAOverallRateCard label="99.9%" rate={overallRate.p999} color="#52c41a" />
          <SLAOverallRateCard label="99.5%" rate={overallRate.p995} color="#1677ff" />
          <SLAOverallRateCard label="99.0%" rate={overallRate.p99} color="#faad14" />
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          <span>综合达标率: {computeOverallCompliance(overallRate).toFixed(2)}%</span>
          <span>24h 请求: {overallRate.totalRequests24h.toLocaleString()}</span>
          <span>违规: {overallRate.breachedRequests24h.toLocaleString()}</span>
        </div>
      </div>

      {/* ── 2) 响应时间趋势 ── */}
      <div>
        <h3 style={sectionTitle}>响应时间趋势 (最近 24 小时)</h3>
        <div style={tableContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>时间</th>
                <th style={thStyle}>平均响应</th>
                <th style={thStyle}>中位响应</th>
                <th style={thStyle}>P99 响应</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((pt, idx) => (
                <TrendRow key={pt.timestamp} point={pt} index={idx} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3) 服务可用性 + 自动修复 (并行) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 服务可用性 */}
        <div>
          <h3 style={sectionTitle}>
            服务可用性
            <span style={{ marginLeft: 12, fontSize: 11, color: '#94a3b8' }}>
              绿 {serviceSummary.green} / 黄 {serviceSummary.yellow} / 红 {serviceSummary.red}
            </span>
          </h3>
          <div style={tableContainerStyle}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>服务</th>
                  <th style={thStyle}>状态</th>
                  <th style={thStyle}>可用率</th>
                  <th style={thStyle}>平均延迟</th>
                  <th style={thStyle}>P99</th>
                  <th style={thStyle}>最近宕机</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <ServiceRow key={svc.serviceId} svc={svc} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 自动修复 */}
        <div>
          <h3 style={sectionTitle}>自动修复统计</h3>
          <div
            data-testid="auto-heal-panel"
            style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={healRowStyle}>
              <span style={healLabelStyle}>自动修复率</span>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: autoHeal.healRatePercent >= 80 ? '#52c41a' : '#faad14',
                }}
              >
                {formatPercent(autoHeal.healRatePercent, 1)}
              </span>
            </div>
            <div style={healRowStyle}>
              <span style={healLabelStyle}>总事件</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>{autoHeal.totalIncidents}</span>
            </div>
            <div style={healRowStyle}>
              <span style={healLabelStyle}>自动修复</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>{autoHeal.autoHealed}</span>
            </div>
            <div style={healRowStyle}>
              <span style={healLabelStyle}>人工介入</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#ff4d4f' }}>{autoHeal.manualIntervention}</span>
            </div>
            <div style={healRowStyle}>
              <span style={healLabelStyle}>平均修复时间</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>{formatMs(autoHeal.averageHealTimeSeconds * 1000)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4) 告警列表 ── */}
      <div>
        <h3 style={sectionTitle}>
          最近告警
          <span style={{ marginLeft: 12, fontSize: 11, color: '#94a3b8' }}>
            活跃 {activeAlertCount} / 严重 {criticalAlertCount} / 共 {alerts.length}
          </span>
        </h3>

        {/* 操作栏: 筛选 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#94a3b8' }}>告警级别:</label>
          <select
            data-testid="alert-level-filter"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as AlertLevel | '')}
            style={selectStyle}
          >
            <option value="">全部</option>
            <option value="critical">严重</option>
            <option value="warning">警告</option>
            <option value="info">信息</option>
          </select>

          <label style={{ fontSize: 12, color: '#94a3b8' }}>状态:</label>
          <select
            data-testid="alert-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AlertStatus | '')}
            style={selectStyle}
          >
            <option value="">全部</option>
            <option value="firing">触发中</option>
            <option value="acknowledged">已确认</option>
            <option value="resolved">已解决</option>
          </select>
        </div>

        <div style={tableContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>时间</th>
                <th style={thStyle}>来源</th>
                <th style={thStyle}>级别</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>消息</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>
                    无匹配告警
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── 样式常量 ───────────────────────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: '#f1f5f9',
  marginBottom: 12,
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.12)',
  background: 'rgba(15,23,42,0.3)',
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  textAlign: 'left',
  borderBottom: '1px solid rgba(148,163,184,0.15)',
  background: 'rgba(15,23,42,0.4)',
};

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15,23,42,0.5)',
  color: '#e2e8f0',
  fontSize: 12,
};

const healRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 8,
  borderBottom: '1px solid rgba(148,163,184,0.08)',
};

const healLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
};
