'use client';

import React from 'react';
import type { StoreDetailData } from './page';

// ---- 样式常量 ----

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(15,23,42,0.5)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 12,
  padding: 20,
};

const KPI_CARD_STYLE: React.CSSProperties = {
  background: 'rgba(15,23,42,0.4)',
  borderRadius: 10,
  padding: '14px 16px',
  border: '1px solid rgba(148,163,184,0.08)',
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#f1f5f9',
  marginBottom: 16,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  operating: { label: '营业中', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  paused: { label: '暂停营业', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  closed_today: { label: '今日歇业', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  renovation: { label: '装修中', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};

const ALERT_VARIANTS: Record<string, { color: string; label: string }> = {
  critical: { color: '#f87171', label: '严重' },
  warning: { color: '#fbbf24', label: '警告' },
  info: { color: '#60a5fa', label: '提示' },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  device: '设备',
  inventory: '库存',
  member: '会员',
  security: '安全',
};

// ---- 子组件 ----

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid rgba(148,163,184,0.06)',
        fontSize: 14,
      }}
    >
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#94a3b8', bg: 'transparent' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function KpiCard({
  label,
  value,
  unit,
  trend,
  trendPositive,
}: {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  trendPositive?: boolean;
}) {
  return (
    <div style={KPI_CARD_STYLE} data-testid={`kpi-${label}`}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
        {value}
        {unit && <span style={{ fontSize: 13, color: '#64748b', marginLeft: 4 }}>{unit}</span>}
      </div>
      {trend !== undefined && (
        <div
          style={{
            fontSize: 12,
            marginTop: 4,
            color: trendPositive ? '#4ade80' : '#f87171',
          }}
        >
          {trendPositive ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  );
}

// ---- 主组件 ----

export interface StoreManagerDetailProps {
  detail: StoreDetailData;
}

export function StoreManagerDetail({ detail }: StoreManagerDetailProps) {
  const statusCfg = STATUS_CONFIG[detail.status] || STATUS_CONFIG.operating;

  return (
    <div
      style={{
        padding: '24px 32px',
        maxWidth: 1200,
        margin: '0 auto',
      }}
      data-testid="store-manager-detail"
    >
      {/* ---- 头部信息 ---- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
        data-testid="detail-header"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#f8fafc',
              }}
              data-testid="store-name"
            >
              {detail.name}
            </h1>
            <StatusBadge status={detail.status} />
          </div>
          <div style={{ color: '#94a3b8', fontSize: 14 }}>
            {detail.address} · {detail.region}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,0.18)',
              background: 'rgba(15,23,42,0.38)',
              color: '#cbd5e1',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            ✏️ 编辑
          </button>
          {detail.status !== 'closed_today' && (
            <button
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: detail.status === 'operating'
                  ? 'rgba(248,113,113,0.15)'
                  : 'rgba(74,222,128,0.15)',
                color: detail.status === 'operating' ? '#f87171' : '#4ade80',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {detail.status === 'operating' ? '暂停营业' : '恢复营业'}
            </button>
          )}
        </div>
      </div>

      {/* ---- 核心KPI指标 ---- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
        data-testid="kpi-grid"
      >
        <KpiCard
          label="今日营收"
          value={`¥${(detail.kpi.todayRevenue / 10000).toFixed(1)}`}
          unit="万"
          trend={`${detail.kpi.revenueTrend >= 0 ? '+' : ''}${detail.kpi.revenueTrend.toFixed(1)}%`}
          trendPositive={detail.kpi.revenueTrend >= 0}
        />
        <KpiCard
          label="今日订单"
          value={String(detail.kpi.todayOrders)}
          unit="单"
          trend={`${detail.kpi.orderTrend >= 0 ? '+' : ''}${detail.kpi.orderTrend.toFixed(1)}%`}
          trendPositive={detail.kpi.orderTrend >= 0}
        />
        <KpiCard
          label="客单价"
          value={`¥${detail.kpi.avgOrderValue.toFixed(1)}`}
          trend={`${detail.kpi.avgValueTrend >= 0 ? '+' : ''}${detail.kpi.avgValueTrend.toFixed(1)}%`}
          trendPositive={detail.kpi.avgValueTrend >= 0}
        />
        <KpiCard
          label="月度KPI达成率"
          value={`${detail.kpi.monthlyKpiRate}%`}
          trend={`${detail.kpi.monthlyKpiTrend >= 0 ? '+' : ''}${detail.kpi.monthlyKpiTrend.toFixed(1)}%`}
          trendPositive={detail.kpi.monthlyKpiTrend >= 0}
        />
        <KpiCard
          label="客户满意度"
          value={String(detail.kpi.customerSatisfaction)}
          unit="分"
          trend={`${detail.kpi.satisfactionTrend >= 0 ? '+' : ''}${detail.kpi.satisfactionTrend.toFixed(1)}`}
          trendPositive={detail.kpi.satisfactionTrend >= 0}
        />
      </div>

      {/* ---- 两栏布局: 基本信息 + 告警 ---- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* 基本信息 */}
        <div style={CARD_STYLE} data-testid="info-card">
          <h3 style={SECTION_TITLE_STYLE}>基本信息</h3>
          <InfoRow label="门店编号" value={detail.id} />
          <InfoRow label="负责人" value={detail.managerName} />
          <InfoRow label="联系电话" value={detail.phone} />
          <InfoRow label="开业时间" value={detail.openSince} />
          <InfoRow label="门店面积" value={`${detail.area} m²`} />
          <InfoRow label="员工人数" value={`${detail.staffCount} 人`} />
        </div>

        {/* 告警列表 */}
        <div style={CARD_STYLE} data-testid="alerts-card">
          <h3 style={SECTION_TITLE_STYLE}>
            最近告警
            {detail.recentAlerts.length > 0 && (
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                ({detail.recentAlerts.length})
              </span>
            )}
          </h3>
          {detail.recentAlerts.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
              暂无告警 ✓
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detail.recentAlerts.map((alert) => {
                const alertVar = ALERT_VARIANTS[alert.severity] || ALERT_VARIANTS.info;
                return (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(15,23,42,0.3)',
                      border: `1px solid ${alertVar.color}22`,
                    }}
                    data-testid={`alert-${alert.id}`}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: alertVar.color,
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          [{ALERT_TYPE_LABELS[alert.type] || alert.type}]
                        </span>
                        <span style={{ fontSize: 11, color: '#475569' }}>
                          {alert.time}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#e2e8f0' }}>
                        {alert.message}
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 4,
                          fontSize: 11,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: `${alertVar.color}18`,
                          color: alertVar.color,
                        }}
                      >
                        {alertVar.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ---- 操作按钮组 ---- */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: 16,
          borderRadius: 12,
          background: 'rgba(15,23,42,0.3)',
          border: '1px solid rgba(148,163,184,0.08)',
        }}
        data-testid="action-bar"
      >
        <button
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📊 查看完整报表
        </button>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.38)',
            color: '#cbd5e1',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          📋 排班管理
        </button>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.38)',
            color: '#cbd5e1',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          📦 库存盘点
        </button>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.18)',
            background: 'rgba(15,23,42,0.38)',
            color: '#cbd5e1',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          🔄 操作日志
        </button>
      </div>
    </div>
  );
}
