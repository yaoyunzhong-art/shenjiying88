'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';

// ---- 类型定义 ----

/** 收银员状态 */
export type CashierStatus = 'active' | 'break' | 'offline';

/** 班次类型 */
export type ShiftType = 'morning' | 'afternoon' | 'full_day';

/** 班次信息 */
export interface ShiftInfo {
  /** 班次类型 */
  type: ShiftType;
  /** 开始时间 */
  startAt: string;
  /** 结束时间 (预计) */
  endAt: string;
  /** 时长 (小时) */
  duration: number;
}

/** 收银当班统计 */
export interface CashierShiftMetrics {
  /** 当班收银单数 */
  transactionCount: number;
  /** 当班收款总额 */
  totalRevenue: number;
  /** 现金收款 */
  cashAmount: number;
  /** 移动支付收款 */
  mobileAmount: number;
  /** 现金交班应缴 */
  expectedCashRemit: number;
  /** 找零开支 */
  changeFloatUsed: number;
  /** 刷单/退款次数 */
  refundCount: number;
  /** 退款总额 */
  refundTotal: number;
}

/** 当前班次操作记录 */
export interface TransactionLog {
  id: string;
  /** 流水号 */
  receiptNo: string;
  /** 时间 */
  time: string;
  /** 类型: sale收款, refund退款, void作废 */
  type: 'sale' | 'refund' | 'void';
  /** 金额 */
  amount: number;
  /** 支付方式 */
  payment: string;
  /** 会员名(可选) */
  memberName?: string;
}

/** 收银终端状态 */
export interface TillStatus {
  /** 终端编号 */
  tillNo: string;
  /** 系统版本 */
  version: string;
  /** 打印机 */
  printerOnline: boolean;
  /** 钱箱 */
  cashDrawerOpen: boolean;
  /** 扫码枪 */
  scannerOnline: boolean;
  /** 网络 */
  networkOnline: boolean;
  /** 收银员名称 */
  cashierName?: string;
}

/** 收银面板 Props */
export interface CashierPanelProps {
  /** 面板标题 */
  title?: string;
  /** 收银员名称 */
  cashierName?: string;
  /** 收银员状态 */
  cashierStatus?: CashierStatus;
  /** 班次信息 */
  shiftInfo?: ShiftInfo;
  /** 收银当班统计 */
  metrics?: CashierShiftMetrics;
  /** 操作记录 */
  transactions?: TransactionLog[];
  /** 终端状态 */
  tillStatus?: TillStatus;
  /** 加载中 */
  loading?: boolean;
  /** 错误 */
  error?: string;
  /** 上班打卡回调 */
  onClockIn?: () => void;
  /** 交班回调 */
  onShiftHandover?: () => void;
  /** 退款回调 */
  onRefund?: (receiptNo: string) => void;
  /** 打印小票回调 */
  onPrint?: (receiptNo: string) => void;
  /** 自定义类名 */
  className?: string;
}

// ---- 样式常量 ----

const PANEL_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 16,
  padding: 20,
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.45)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  color: '#f8fafc',
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 12,
  borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f1f5f9',
};

const SECTION_STYLE: React.CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.28)',
  border: '1px solid rgba(148, 163, 184, 0.08)',
  padding: 14,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#cbd5e1',
  marginBottom: 10,
};

const STATUS_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
};

const STATUS_BOX: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 10px',
  borderRadius: 8,
  background: 'rgba(15, 23, 42, 0.2)',
  fontSize: 12,
  color: '#94a3b8',
};

const STATUS_DOT_ONLINE: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#4ade80',
  flexShrink: 0,
};

const STATUS_DOT_OFFLINE: React.CSSProperties = {
  ...STATUS_DOT_ONLINE,
  background: '#ef4444',
};

const LOG_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid rgba(148,163,184,0.06)',
  fontSize: 12,
};

const ACTION_BTN: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.15)',
  background: 'rgba(15,23,42,0.3)',
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  flex: 1,
};

const PRIMARY_BTN: React.CSSProperties = {
  ...ACTION_BTN,
  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  border: 'none',
  color: '#ffffff',
};

// ---- 格式化工具 ----

function fmtCurrency(v: number): string {
  return `¥${v.toFixed(2)}`;
}

function shiftTypeLabel(t: ShiftType): string {
  const map: Record<ShiftType, string> = {
    morning: '早班',
    afternoon: '晚班',
    full_day: '全日班',
  };
  return map[t];
}

// ---- 主组件 ----

/**
 * CashierPanel — 收银员工作面板
 *
 * 收银员每日工作台 - 班次管理、交班核算、终端监控。
 * 与 FrontDeskPanel（面向顾客的收银/购物篮）不同，
 * CashierPanel 面向收银员自身的排班、日结、设备状态。
 *
 * @example
 * <CashierPanel
 *   title="收银员面板"
 *   cashierName="张丽"
 *   cashierStatus="active"
 *   shiftInfo={{ type: 'morning', startAt: '08:00', endAt: '14:00', duration: 6 }}
 *   metrics={{
 *     transactionCount: 87,
 *     totalRevenue: 28650,
 *     cashAmount: 12300,
 *     mobileAmount: 16350,
 *     expectedCashRemit: 12000,
 *     changeFloatUsed: 300,
 *     refundCount: 2,
 *     refundTotal: 598,
 *   }}
 *   tillStatus={{
 *     tillNo: 'POS-01',
 *     version: 'v3.2.1',
 *     printerOnline: true,
 *     cashDrawerOpen: false,
 *     scannerOnline: true,
 *     networkOnline: true,
 *   }}
 * />
 */
export function CashierPanel({
  title = '收银员工作台',
  cashierName,
  cashierStatus = 'active',
  shiftInfo,
  metrics,
  transactions = [],
  tillStatus,
  loading = false,
  error,
  onClockIn,
  onShiftHandover,
  onRefund,
  onPrint,
  className,
}: CashierPanelProps) {
  // ==================== 加载态 ====================
  if (loading) {
    return (
      <div className={className} style={PANEL_STYLE} data-testid="cashier-loading">
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          正在加载收银员工作台...
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 80,
                borderRadius: 8,
                background: 'rgba(15,23,42,0.2)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ==================== 错误态 ====================
  if (error) {
    return (
      <div className={className} style={PANEL_STYLE} data-testid="cashier-error">
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: '#f87171',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
            {error}
          </div>
          <button
            type="button"
            data-testid="cashier-retry"
            style={{
              marginTop: 8,
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // ==================== 状态映射 ====================
  const cashierStatusLabel: Record<CashierStatus, string> = {
    active: '在班',
    break: '休息中',
    offline: '离线',
  };
  const cashierStatusVariant: Record<CashierStatus, 'success' | 'warning' | 'error'> = {
    active: 'success',
    break: 'warning',
    offline: 'error',
  };

  // ---- 快捷统计 ----
  const statItems: QuickStatItem[] = metrics
    ? [
        { label: '收银单数', value: `${metrics.transactionCount} 单` },
        { label: '收款总额', value: fmtCurrency(metrics.totalRevenue), valueColor: '#4ade80' },
        { label: '应缴现金', value: fmtCurrency(metrics.expectedCashRemit), valueColor: '#fbbf24' },
        { label: '退款单数', value: `${metrics.refundCount} 单`, valueColor: metrics.refundCount > 5 ? '#f87171' : undefined },
      ]
    : [];

  // ==================== 渲染头部 ====================
  const renderHeader = () => (
    <div style={HEADER_STYLE}>
      <div>
        <span style={TITLE_STYLE}>{title}</span>
        {cashierName && (
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 12 }}>
            {cashierName}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {cashierStatus && (
          <StatusBadge
            label={cashierStatusLabel[cashierStatus]}
            variant={cashierStatusVariant[cashierStatus]}
            size="sm"
            dot
          />
        )}
        {shiftInfo && (
          <span style={{ fontSize: 12, color: '#64748b' }}>
            {shiftTypeLabel(shiftInfo.type)} {shiftInfo.startAt}-{shiftInfo.endAt}
          </span>
        )}
      </div>
    </div>
  );

  // ==================== 终端状态 ====================
  const renderTillStatus = () => {
    if (!tillStatus) return null;
    return (
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>
          终端状态
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
            {tillStatus.tillNo}
          </span>
        </div>
        <div style={STATUS_GRID}>
          {[
            { label: '打印机', ok: tillStatus.printerOnline },
            { label: '钱箱', ok: !tillStatus.cashDrawerOpen },
            { label: '扫码枪', ok: tillStatus.scannerOnline },
            { label: '网络', ok: tillStatus.networkOnline },
          ].map((s) => (
            <div key={s.label} style={STATUS_BOX}>
              <div style={s.ok ? STATUS_DOT_ONLINE : STATUS_DOT_OFFLINE} />
              <span>{s.label}</span>
              <span style={{ color: s.ok ? '#4ade80' : '#f87171', marginLeft: 'auto', fontWeight: 600 }}>
                {s.ok ? '正常' : '异常'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ==================== 操作按钮 ====================
  const renderActions = () => (
    <div style={{ display: 'flex', gap: 8 }}>
      {onClockIn && (
        <button
          type="button"
          data-testid="cashier-clockin"
          style={PRIMARY_BTN}
          onClick={onClockIn}
        >
          🕐 上班打卡
        </button>
      )}
      {onShiftHandover && (
        <button
          type="button"
          data-testid="cashier-handover"
          style={ACTION_BTN}
          onClick={onShiftHandover}
        >
          🔄 交班结算
        </button>
      )}
    </div>
  );

  // ==================== 班次明细 ====================
  const renderShiftDetail = () => {
    if (!shiftInfo && !metrics) return null;
    return (
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>班次详情</div>
        {shiftInfo && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
            <span>班次: {shiftTypeLabel(shiftInfo.type)}</span>
            <span>时段: {shiftInfo.startAt} ~ {shiftInfo.endAt}</span>
            <span>时长: {shiftInfo.duration} 小时</span>
          </div>
        )}
        {metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b' }}>现金收款</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>{fmtCurrency(metrics.cashAmount)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b' }}>移动支付</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#93c5fd' }}>{fmtCurrency(metrics.mobileAmount)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b' }}>找零备用</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#cbd5e1' }}>{fmtCurrency(metrics.changeFloatUsed)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748b' }}>退款总额</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: metrics.refundTotal > 0 ? '#f87171' : '#cbd5e1' }}>
                {fmtCurrency(metrics.refundTotal)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== 操作日志 ====================
  const renderTransactions = () => {
    const typeLabel: Record<string, string> = { sale: '收款', refund: '退款', void: '作废' };
    const typeColor: Record<string, string> = { sale: '#4ade80', refund: '#f87171', void: '#94a3b8' };

    return (
      <div style={{ ...SECTION_STYLE, flex: 1 }}>
        <div style={SECTION_TITLE_STYLE}>
          当班流水
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
            {transactions.length} 笔
          </span>
        </div>
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 12 }}>
            暂无流水记录
          </div>
        ) : (
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {transactions.map((log) => (
              <div key={log.id} style={LOG_ROW}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
                  <StatusBadge
                    label={typeLabel[log.type] ?? log.type}
                    variant={log.type === 'refund' ? 'error' : log.type === 'void' ? 'neutral' : 'success'}
                    size="sm"
                  />
                </div>
                <div style={{ flex: 1, color: '#cbd5e1' }}>
                  {log.receiptNo}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 11, marginRight: 12 }}>
                  {log.time}
                </div>
                {log.memberName && (
                  <div style={{ color: '#64748b', fontSize: 11, marginRight: 12 }}>
                    {log.memberName}
                  </div>
                )}
                <div style={{ fontWeight: 600, color: typeColor[log.type] ?? '#e2e8f0', marginRight: 8 }}>
                  {fmtCurrency(log.amount)}
                </div>
                {onPrint && log.type === 'sale' && (
                  <button
                    type="button"
                    onClick={() => onPrint(log.receiptNo)}
                    title="打印"
                    style={{
                      background: 'none', border: 'none', color: '#64748b',
                      cursor: 'pointer', fontSize: 14,
                    }}
                  >
                    🖨
                  </button>
                )}
                {onRefund && log.type === 'sale' && (
                  <button
                    type="button"
                    onClick={() => onRefund(log.receiptNo)}
                    title="退款"
                    style={{
                      background: 'none', border: 'none', color: '#f87171',
                      cursor: 'pointer', fontSize: 14, marginLeft: 4,
                    }}
                  >
                    ↩
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ==================== 主渲染 ====================
  return (
    <div className={className} style={PANEL_STYLE}>
      {renderHeader()}
      {statItems.length > 0 && <QuickStats items={statItems} columns={4} />}
      {renderActions()}
      {renderTillStatus()}
      {renderShiftDetail()}
      {renderTransactions()}
    </div>
  );
}
