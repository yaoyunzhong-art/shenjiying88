'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 游戏机台状态 */
export type MachineStatus = 'online' | 'offline' | 'maintenance' | 'full';

/** 机台统计 */
export interface MachineStats {
  /** 机台ID */
  id: string;
  /** 机台名称 */
  name: string;
  /** 游戏类型 */
  category: '竞速' | '射击' | '格斗' | '音乐' | '抓物' | '运动' | '模拟' | '彩票';
  /** 状态 */
  status: MachineStatus;
  /** 今日收入 */
  todayRevenue: number;
  /** 今日游玩次数 */
  todayPlays: number;
  /** 7日总收入 */
  weekRevenue: number;
  /** 7日总游玩次数 */
  weekPlays: number;
  /** 币/次 */
  coinsPerPlay: number;
  /** 上座率百分比 */
  occupancyRate: number;
  /** 上次维护时间 ISO-8601 */
  lastService?: string;
  /** 故障次数(当月) */
  faultCount?: number;
}

/** ArcadeRevenueCard 属性 */
export interface ArcadeRevenueCardProps {
  /** 店铺名称 */
  storeName: string;
  /** 统计日期 */
  date: string;
  /** 机台列表 */
  machines: MachineStats[];
  /** 总目标收入 */
  dailyRevenueTarget?: number;
  /** 底部额外操作区 */
  footer?: React.ReactNode;
  /** 额外样式类 */
  className?: string;
}

// ==================== 辅助函数 ====================

/** 格式化金额 ($xx.xx) */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** 格式化播放次数 (1.2k 等) */
function formatPlays(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

/** 状态标签颜色 */
function statusColor(status: MachineStatus): string {
  switch (status) {
    case 'online': return '#4ade80';
    case 'offline': return '#f87171';
    case 'maintenance': return '#fbbf24';
    case 'full': return '#60a5fa';
    default: return '#94a3b8';
  }
}

/** 状态中文名 */
function statusLabel(status: MachineStatus): string {
  switch (status) {
    case 'online': return '运行中';
    case 'offline': return '离线';
    case 'maintenance': return '维护中';
    case 'full': return '满座';
    default: return '未知';
  }
}

// ==================== 机台行 ====================

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 0',
  borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
};

const machineNameStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: '#e2e8f0',
  fontWeight: 500,
};

const statusDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  display: 'inline-block',
};

const revenueColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 2,
};

const revenueValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#e2e8f0',
};

const subValueStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
};

const occupancyBarOuter: React.CSSProperties = {
  width: 60,
  height: 4,
  borderRadius: 2,
  background: 'rgba(148, 163, 184, 0.15)',
  overflow: 'hidden',
};

const occupancyBarInner = (pct: number): React.CSSProperties => ({
  width: `${Math.min(pct, 100)}%`,
  height: '100%',
  borderRadius: 2,
  background: pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171',
  transition: 'width 0.3s ease',
});

// ==================== 主组件 ====================

const containerStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 16,
  padding: 20,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 16,
};

const titleSection: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const storeTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#f1f5f9',
};

const dateStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
};

const targetBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  background: 'rgba(148, 163, 184, 0.06)',
  borderRadius: 10,
  marginBottom: 12,
};

const targetLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
};

const targetAmountStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#4ade80',
};

const targetProgressOuter: React.CSSProperties = {
  flex: 1,
  height: 6,
  borderRadius: 3,
  background: 'rgba(148, 163, 184, 0.12)',
  overflow: 'hidden',
};

const targetProgressInner = (pct: number): React.CSSProperties => ({
  width: `${Math.min(pct, 100)}%`,
  height: '100%',
  borderRadius: 3,
  background: pct >= 100 ? '#4ade80' : pct >= 60 ? '#fbbf24' : '#f87171',
  transition: 'width 0.4s ease',
});

const tableHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: 8,
  fontSize: 11,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 1,
  borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
};

const footerDivider: React.CSSProperties = {
  borderTop: '1px solid rgba(148, 163, 184, 0.08)',
  marginTop: 12,
  paddingTop: 12,
};

/**
 * ArcadeRevenueCard — 街机店机台营收卡
 *
 * 展示每家店铺下各机台的今日/7日收入、游玩次数、上座率、状态
 * 含日营收目标进度条
 */
export function ArcadeRevenueCard({
  storeName,
  date,
  machines,
  dailyRevenueTarget,
  footer,
  className,
}: ArcadeRevenueCardProps) {
  // 汇总
  const onlineCount = machines.filter(m => m.status === 'online' || m.status === 'full').length;
  const totalTodayRevenue = machines.reduce((s, m) => s + m.todayRevenue, 0);
  const totalTodayPlays = machines.reduce((s, m) => s + m.todayPlays, 0);

  // 目标完成百分比
  const targetPct = dailyRevenueTarget && dailyRevenueTarget > 0
    ? (totalTodayRevenue / dailyRevenueTarget) * 100
    : 0;

  return (
    <div
      style={containerStyle}
      className={className}
      data-testid="arcade-revenue-card"
    >
      {/* 头部：店名+日期 */}
      <div style={headerStyle}>
        <div style={titleSection}>
          <div style={storeTitleStyle}>{storeName}</div>
          <div style={dateStyle}>{date}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#94a3b8' }}>
          <span>{onlineCount}/{machines.length} 在线</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
            {formatCurrency(totalTodayRevenue)}
          </span>
        </div>
      </div>

      {/* 日目标进度 */}
      {dailyRevenueTarget != null && dailyRevenueTarget > 0 && (
        <div style={targetBarStyle}>
          <span style={targetLabelStyle}>目标</span>
          <span style={targetAmountStyle}>{formatCurrency(totalTodayRevenue)}</span>
          <div style={targetProgressOuter}>
            <div style={targetProgressInner(targetPct)} />
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 44, textAlign: 'right' }}>
            {targetPct.toFixed(0)}%
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>/ {formatCurrency(dailyRevenueTarget)}</span>
        </div>
      )}

      {/* 表格头 */}
      <div style={tableHeaderStyle}>
        <span>机台</span>
        <span style={{ marginRight: 120 }}>今日</span>
      </div>

      {/* 机台行 */}
      {machines.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          暂无机台数据
        </div>
      )}
      {machines.map((m, idx) => (
        <div key={m.id || idx} style={rowStyle} data-testid={`machine-row-${idx}`}>
          {/* 左侧：名称+状态 */}
          <div style={machineNameStyle}>
            <span style={{ ...statusDotStyle, background: statusColor(m.status) }} />
            <span>{m.name}</span>
            <span style={{ fontSize: 10, color: statusColor(m.status), marginLeft: 4 }}>
              {statusLabel(m.status)}
            </span>
          </div>

          {/* 右侧：收入 + 次数 + 上座率 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={revenueColStyle}>
              <span style={revenueValueStyle}>{formatCurrency(m.todayRevenue)}</span>
              <span style={subValueStyle}>{formatPlays(m.todayPlays)} 次</span>
            </div>
            {/* 上座率 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <div style={occupancyBarOuter}>
                <div style={occupancyBarInner(m.occupancyRate)} />
              </div>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{m.occupancyRate.toFixed(0)}% 上座</span>
            </div>
          </div>
        </div>
      ))}

      {/* 底部汇总 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: '#94a3b8',
        paddingTop: 8,
      }}>
        <span>今日总计: {formatPlays(totalTodayPlays)} 次</span>
        <span>7日总: {formatCurrency(machines.reduce((s, m) => s + m.weekRevenue, 0))}</span>
      </div>

      {/* 尾部操作区 */}
      {footer && <div style={footerDivider}>{footer}</div>}
    </div>
  );
}

// ==================== 导出辅助函数（便于测试） ====================
export const __utils = {
  formatCurrency,
  formatPlays,
  statusColor,
  statusLabel,
};
