/**
 * dispatch-result-badge.tsx — 共享的 CampaignDispatch 结果类型徽章组件
 * 积分发放 / 标签推荐 / 优惠券发放 / 盲盒发放 / 执行回执 / 无回执
 */
import React from 'react'
import type { DispatchResultKind } from './campaigns-service'

export type { DispatchResultKind }

const RESULT_KIND_STYLES: Record<DispatchResultKind, { bg: string; color: string; icon: string }> = {
  points:  { bg: 'rgba(234,179,8,0.12)',  color: '#eab308', icon: '✦' },
  tag:     { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', icon: '#' },
  coupon:  { bg: 'rgba(14,165,233,0.12)', color: '#38bdf8', icon: '◈' },
  blindbox:{ bg: 'rgba(236,72,153,0.12)', color: '#f472b6', icon: '◉' },
  unknown: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', icon: '◆' },
  none:    { bg: 'rgba(148,163,184,0.08)', color: '#64748b', icon: '—' },
}

export function ResultKindBadge({ kind, typeLabel, detailLabel }: {
  kind: DispatchResultKind
  typeLabel: string
  detailLabel: string
}) {
  const style = RESULT_KIND_STYLES[kind] ?? RESULT_KIND_STYLES.unknown
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 10,
        border: `1px solid ${style.color}30`,
        background: style.bg,
        padding: '8px 14px',
        flex: '1 1 180px',
        minWidth: 180,
      }}
    >
      <span style={{ fontSize: 16, color: style.color }}>{style.icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, color: style.color, fontWeight: 600, letterSpacing: '0.05em' }}>
          {typeLabel}
        </span>
        <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>
          {detailLabel}
        </span>
      </div>
    </div>
  )
}
