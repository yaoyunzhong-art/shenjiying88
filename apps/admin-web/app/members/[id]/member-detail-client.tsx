"use client"
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useState, useTransition } from 'react'

import {
  CopyToClipboard,
  DetailClosureBar,
  InfoRow,
  PageShell,
  StatCard,
  StatusBadge,
  Tabs,
  WorkspaceBreadcrumb,
} from '@m5/ui'

import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry'
import {
  STATUS_MAP,
  TIER_COLORS,
  TIER_LABELS,
  formatMemberCurrency,
  type MemberDetailPageSnapshot,
} from './member-detail-data'

const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 24,
  background: 'rgba(15,23,42,0.35)',
  border: '1px solid rgba(148,163,184,0.18)',
  marginBottom: 24,
}

const tag: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 6,
  background: 'rgba(59,130,246,0.12)',
  color: '#93c5fd',
  fontSize: 11,
  fontWeight: 600,
}

const row: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid rgba(148,163,184,0.08)',
  fontSize: 13,
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  color: '#94a3b8',
  fontSize: 12,
  borderBottom: '1px solid rgba(148,163,184,0.18)',
}

const td: React.CSSProperties = {
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 13,
  borderBottom: '1px solid rgba(148,163,184,0.1)',
}

export default function MemberDetailClient({
  snapshot,
}: {
  snapshot: MemberDetailPageSnapshot
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tab, setTab] = useState<'overview' | 'points' | 'recharge' | 'visits'>(
    'overview'
  )
  const member = snapshot.member

  return (
    <main style={{ maxWidth: 1020, margin: '24px auto', padding: '0 16px' }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'members', detailLabel: member.name })}
      />
      <PageShell
        title={member.name}
        subtitle={`${member.memberNo} · ${TIER_LABELS[member.tier]} · 当前快照：${snapshot.sourceLabel}`}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            会员详情已切换为 `server wrapper + snapshot loader + client renderer`，
            刷新按钮仅通过 `router.refresh()` 触发服务端快照重拉。
          </div>
          <button
            type="button"
            onClick={() => handleRefresh()}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(96, 165, 250, 0.35)',
              background: 'rgba(59, 130, 246, 0.14)',
              color: '#dbeafe',
              cursor: 'pointer',
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4,1fr)',
            marginBottom: 20,
          }}
        >
          <StatCard label="余额" value={formatMemberCurrency(member.balance)} />
          <StatCard label="充值" value={formatMemberCurrency(member.totalRecharge)} />
          <StatCard
            label="积分"
            value={member.availablePoints.toLocaleString()}
            helper={`累计: ${member.totalPoints.toLocaleString()}`}
          />
          <StatCard
            label="消费"
            value={formatMemberCurrency(member.totalSpent)}
            helper={`${member.visitCount}次`}
          />
        </div>

        <section style={card}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>基本信息</h3>
            <StatusBadge
              label={STATUS_MAP[member.status].label}
              variant={STATUS_MAP[member.status].variant}
              size="md"
              dot
            />
          </div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4,1fr)' }}>
            <InfoRow
              label="手机"
              value={
                <span>
                  {member.phone}
                  <CopyToClipboard text={member.phone} size="sm" iconOnly />
                </span>
              }
            />
            <InfoRow label="生日" value={member.birthday} />
            <InfoRow
              label="性别"
              value={
                member.gender === 'male'
                  ? '男'
                  : member.gender === 'female'
                    ? '女'
                    : '其他'
              }
            />
            <InfoRow label="邮箱" value={member.email} />
            <InfoRow label="微信" value={member.wechat} />
            <InfoRow
              label="等级"
              value={
                <span style={{ color: TIER_COLORS[member.tier], fontWeight: 700 }}>
                  {TIER_LABELS[member.tier]}
                </span>
              }
            />
            <InfoRow label="加入" value={member.joinDate} />
            <InfoRow label="最近活跃" value={member.lastActive} />
            <InfoRow label="推荐人" value={member.referrer} />
            <InfoRow label="客单价" value={formatMemberCurrency(member.avgSpend)} />
            <InfoRow label="到店" value={`${member.visitCount}次`} />
            <InfoRow label="会员号" value={member.memberNo} />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {member.tags.map((item) => (
              <span key={item} style={tag}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'overview', label: '概览' },
              { key: 'points', label: '积分' },
              { key: 'recharge', label: '充值' },
              { key: 'visits', label: '到店' },
            ]}
            activeKey={tab}
            onChange={(value) => setTab(value as typeof tab)}
            variant="pills"
          />
        </div>

        {tab === 'overview' ? (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            <section style={card}>
              <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>最近交易</h4>
              {snapshot.recharges.map((record) => (
                <div key={record.id} style={row}>
                  {record.date}
                  <span style={{ fontWeight: 600, color: '#22c55e' }}>
                    {formatMemberCurrency(record.amount)}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>
                    {record.paymentMethod}
                  </span>
                </div>
              ))}
            </section>
            <section style={card}>
              <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>最近积分</h4>
              {snapshot.points.map((record) => (
                <div key={record.id} style={row}>
                  {record.date}
                  <span
                    style={{
                      fontWeight: 600,
                      color: record.amount > 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {record.amount > 0 ? '+' : ''}
                    {record.amount.toLocaleString()}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>{record.source}</span>
                </div>
              ))}
            </section>
          </div>
        ) : null}

        {tab === 'points' ? (
          <>
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(3,1fr)',
                marginBottom: 16,
              }}
            >
              <StatCard label="总积分" value={member.totalPoints.toLocaleString()} />
              <StatCard label="可用" value={member.availablePoints.toLocaleString()} />
              <StatCard
                label="已消耗"
                value={(member.totalPoints - member.availablePoints).toLocaleString()}
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>日期</th>
                  <th style={th}>类型</th>
                  <th style={th}>变动</th>
                  <th style={th}>余额</th>
                  <th style={th}>来源</th>
                  <th style={th}>订单号</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.points.map((record) => (
                  <tr key={record.id}>
                    <td style={td}>{record.date}</td>
                    <td style={td}>
                      {record.type === 'earn'
                        ? '获得'
                        : record.type === 'redeem'
                          ? '兑换'
                          : record.type === 'expire'
                            ? '过期'
                            : '调整'}
                    </td>
                    <td
                      style={{
                        ...td,
                        color: record.amount > 0 ? '#22c55e' : '#ef4444',
                        fontWeight: 600,
                      }}
                    >
                      {record.amount > 0 ? '+' : ''}
                      {record.amount.toLocaleString()}
                    </td>
                    <td style={td}>{record.balance.toLocaleString()}</td>
                    <td style={td}>{record.source}</td>
                    <td style={{ ...td, fontSize: 11 }}>{record.orderNo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        {tab === 'recharge' ? (
          <>
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(3,1fr)',
                marginBottom: 16,
              }}
            >
              <StatCard label="充值次数" value={snapshot.recharges.length.toString()} />
              <StatCard
                label="充值总额"
                value={formatMemberCurrency(
                  snapshot.recharges.reduce((sum, record) => sum + record.amount, 0)
                )}
              />
              <StatCard
                label="赠金"
                value={formatMemberCurrency(
                  snapshot.recharges.reduce((sum, record) => sum + record.giftAmount, 0)
                )}
              />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>日期</th>
                  <th style={th}>金额</th>
                  <th style={th}>赠金</th>
                  <th style={th}>支付方式</th>
                  <th style={th}>单号</th>
                  <th style={th}>操作员</th>
                  <th style={th}>状态</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.recharges.map((record) => (
                  <tr key={record.id}>
                    <td style={td}>{record.date}</td>
                    <td style={{ ...td, fontWeight: 600, color: '#22c55e' }}>
                      {formatMemberCurrency(record.amount)}
                    </td>
                    <td style={{ ...td, color: '#eab308' }}>
                      {record.giftAmount > 0
                        ? formatMemberCurrency(record.giftAmount)
                        : '—'}
                    </td>
                    <td style={td}>{record.paymentMethod}</td>
                    <td style={{ ...td, fontSize: 11 }}>{record.paymentNo}</td>
                    <td style={td}>{record.operator}</td>
                    <td style={td}>
                      <StatusBadge
                        label={
                          record.status === 'completed'
                            ? '已完成'
                            : record.status === 'pending'
                              ? '待处理'
                              : '已退款'
                        }
                        variant={
                          record.status === 'completed'
                            ? 'success'
                            : record.status === 'pending'
                              ? 'warning'
                              : 'neutral'
                        }
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        {tab === 'visits' ? (
          <>
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(3,1fr)',
                marginBottom: 16,
              }}
            >
              <StatCard label="到店" value={member.visitCount.toString()} />
              <StatCard label="平均消费" value={formatMemberCurrency(member.avgSpend)} />
              <StatCard label="总消费" value={formatMemberCurrency(member.totalSpent)} />
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>日期</th>
                  <th style={th}>时长</th>
                  <th style={th}>消费</th>
                  <th style={th}>设备</th>
                  <th style={th}>服务</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.visits.map((visit) => (
                  <tr key={`${visit.date}-${visit.devices}`}>
                    <td style={td}>{visit.date}</td>
                    <td style={td}>{visit.duration}</td>
                    <td style={{ ...td, fontWeight: 600, color: '#22c55e' }}>
                      {formatMemberCurrency(visit.spend)}
                    </td>
                    <td style={td}>{visit.devices}</td>
                    <td style={td}>{visit.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        <DetailClosureBar
          links={buildStandardClosureLinks({
            workspace: 'members',
            detailId: snapshot.memberId,
          })}
        />
      </PageShell>
    </main>
  )
}
