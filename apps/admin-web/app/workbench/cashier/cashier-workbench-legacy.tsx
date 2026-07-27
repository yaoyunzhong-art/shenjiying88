'use client'

import { useState, type CSSProperties } from 'react'

import { PageShell, StatusBadge } from '@m5/ui'

import type { CashierWorkbenchSnapshot } from './cashier-workbench-data'

const SHIFT_STATUS: Record<
  CashierWorkbenchSnapshot['session']['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
  open: { label: '营业中', variant: 'success' },
  closed: { label: '已结班', variant: 'warning' },
  pending_review: { label: '待审核', variant: 'warning' },
}

const TXN_TYPE = {
  sale: '销售',
  recharge: '充值',
  refund: '退款',
} as const

const TXN_COLOR = {
  sale: '#22c55e',
  recharge: '#3b82f6',
  refund: '#ef4444',
} as const

function fm(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export default function CashierWorkbenchLegacy({ snapshot }: { snapshot: CashierWorkbenchSnapshot }) {
  const [amount, setAmount] = useState('')
  const session = snapshot.session
  const roleEvidence = snapshot.backendRole ?? '未映射'

  return (
    <PageShell title="收银工作台" subtitle={SHIFT_STATUS[session.status]?.label ?? ''}>
      <div style={{ display: 'grid', gap: 20 }}>
        <div style={evidenceCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge
              label={`Delivery ${snapshot.deliveryMode}`}
              variant={snapshot.deliveryMode === 'api' ? 'success' : 'warning'}
              size="sm"
            />
            <span style={{ fontSize: 12, color: '#cbd5e1' }}>tenant-config 角色映射: {roleEvidence}</span>
          </div>
          <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 8, lineHeight: 1.7 }}>
            业务数据: {snapshot.businessDataSource}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
            {snapshot.usesOperatorBridge
              ? `${snapshot.note} 当前收银角色仍通过 operator 桥接到 tenant-config，属于 E54 M1 过渡态。`
              : snapshot.note}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <div style={cardStyle}>
            <div style={metricLabelStyle}>当班营收</div>
            <div style={{ ...metricValueStyle, color: '#22c55e' }}>{fm(session.expectedTotal)}</div>
            <div style={metricHintStyle}>{session.transactionCount} 笔</div>
          </div>
          <div style={cardStyle}>
            <div style={metricLabelStyle}>现金</div>
            <div style={{ ...metricValueStyle, color: '#fbbf24' }}>{fm(session.cashRevenue)}</div>
            <div style={metricHintStyle}>开柜: {fm(session.openingBalance)}</div>
          </div>
          <div style={cardStyle}>
            <div style={metricLabelStyle}>线上收款</div>
            <div style={{ ...metricValueStyle, color: '#60a5fa' }}>{fm(session.onlineRevenue)}</div>
            <div style={metricHintStyle}>微信 + 支付宝</div>
          </div>
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={metricLabelStyle}>差异</div>
              <div style={{ ...metricValueStyle, color: session.difference === 0 ? '#22c55e' : '#eab308' }}>
                {fm(session.difference)}
              </div>
            </div>
            <StatusBadge
              label={SHIFT_STATUS[session.status]?.label ?? ''}
              variant={SHIFT_STATUS[session.status]?.variant ?? 'warning'}
              size="md"
              dot
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>快速收银</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <div style={metricHintStyle}>金额</div>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="输入金额"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {['50', '100', '200', '50会员', '100会员', '200会员'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value.replace('会员', ''))}
                    style={quickButtonStyle}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
                <button
                  type="button"
                  style={{ ...actionButtonStyle, background: 'rgba(34, 197, 94, 0.14)', color: '#86efac' }}
                >
                  现金
                </button>
                <button
                  type="button"
                  style={{ ...actionButtonStyle, background: 'rgba(59, 130, 246, 0.14)', color: '#93c5fd' }}
                >
                  扫码
                </button>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={sectionTitleStyle}>最近交易</h3>
            <div style={{ display: 'grid', gap: 6 }}>
              {snapshot.recentTxns.map((txn) => (
                <div key={txn.id} style={transactionRowStyle}>
                  <span style={{ color: '#94a3b8', width: 48 }}>{txn.time}</span>
                  <span style={{ color: TXN_COLOR[txn.type], fontWeight: 600, width: 44 }}>{TXN_TYPE[txn.type]}</span>
                  <span style={{ fontWeight: 600, width: 88, textAlign: 'right', color: '#22c55e' }}>
                    {fm(txn.amount)}
                  </span>
                  <span style={{ color: '#cbd5e1', width: 64 }}>{txn.method}</span>
                  <span style={{ color: '#94a3b8', width: 64, textAlign: 'right', fontSize: 12 }}>{txn.customer}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" style={footerActionStyle('#3b82f6', '#93c5fd')}>
            会员查询
          </button>
          <button type="button" style={footerActionStyle('#22c55e', '#86efac')}>
            充值
          </button>
          <button type="button" style={footerActionStyle('#eab308', '#fbbf24')}>
            退款
          </button>
          <button type="button" style={footerActionStyle('#ef4444', '#fca5a5')}>
            交接班
          </button>
        </div>
      </div>
    </PageShell>
  )
}

const evidenceCardStyle: CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  padding: '12px 14px',
}

const cardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
}

const metricLabelStyle: CSSProperties = {
  fontSize: 13,
  color: '#cbd5e1',
}

const metricValueStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 28,
  fontWeight: 700,
}

const metricHintStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: '#94a3b8',
}

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 700,
}

const inputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '12px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 24,
  fontWeight: 700,
  textAlign: 'right',
  outline: 'none',
  boxSizing: 'border-box',
}

const quickButtonStyle: CSSProperties = {
  borderRadius: 8,
  padding: '10px',
  background: 'rgba(148, 163, 184, 0.1)',
  color: '#e2e8f0',
  border: '1px solid rgba(148, 163, 184, 0.15)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}

const actionButtonStyle: CSSProperties = {
  borderRadius: 10,
  padding: '14px',
  border: 'none',
  cursor: 'pointer',
  fontSize: 15,
  fontWeight: 700,
  textAlign: 'center',
}

const transactionRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 8,
  background: 'rgba(15, 23, 42, 0.3)',
  fontSize: 13,
}

function footerActionStyle(background: string, color: string): CSSProperties {
  return {
    borderRadius: 10,
    padding: '10px 18px',
    background: `${background}22`,
    color,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  }
}
