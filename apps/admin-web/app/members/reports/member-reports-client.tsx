"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { InfoRow, PageShell, Tabs } from '@m5/ui'

import {
  formatMemberReportMoney,
  type MemberReportsPageSnapshot,
} from './member-reports-data'

const cardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15,23,42,0.38)',
  border: '1px solid rgba(148,163,184,0.18)',
}

const btnStyle: React.CSSProperties = {
  borderRadius: 10,
  padding: '10px 18px',
  background: 'rgba(59,130,246,0.14)',
  color: '#93c5fd',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  color: '#94a3b8',
  fontSize: 12,
  borderBottom: '1px solid rgba(148,163,184,0.18)',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 13,
  borderBottom: '1px solid rgba(148,163,184,0.1)',
}

export default function MemberReportsClient({
  snapshot,
}: {
  snapshot: MemberReportsPageSnapshot
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [tab, setTab] = useState<'overview' | 'rfm' | 'trend'>('overview')
  const latest = snapshot.metrics[0]

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员数据报告"
        subtitle={`增长分析 · RFM分群 · 活跃度 · 留存与LTV · 当前快照：${snapshot.sourceLabel}`}
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
          <div style={{ color: '#94a3b8', fontSize: 13 }}>
            会员报表已切换为 `server wrapper + snapshot loader + client renderer`，
            刷新按钮仅通过 `router.refresh()` 触发服务端快照重拉。
          </div>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            style={btnStyle}
            disabled={isRefreshing}
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>当前会员总数</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                color: '#8b5cf6',
              }}
            >
              {latest.totalMembers.toLocaleString()}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#22c55e' }}>
              活跃: {latest.activeMembers.toLocaleString()} ({latest.activeRate}%)
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>总营收</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                color: '#22c55e',
              }}
            >
              {formatMemberReportMoney(snapshot.totals.totalRevenue)}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>近90天累计</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均留存率</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                color: snapshot.totals.avgChurn < 0.05 ? '#22c55e' : '#eab308',
              }}
            >
              {(100 - snapshot.totals.avgChurn * 100).toFixed(1)}%
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              流失率: {(snapshot.totals.avgChurn * 100).toFixed(1)}%
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均30日LTV</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 28,
                fontWeight: 700,
                color: '#3b82f6',
              }}
            >
              {formatMemberReportMoney(snapshot.totals.avgLtv30)}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
              90日: {formatMemberReportMoney(snapshot.totals.avgLtv90)}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Tabs
            items={[
              { key: 'overview', label: '概览' },
              { key: 'rfm', label: 'RFM分群' },
              { key: 'trend', label: '趋势' },
            ]}
            activeKey={tab}
            onChange={(value) => setTab(value as typeof tab)}
            variant="pills"
          />
        </div>

        {tab === 'overview' ? (
          <>
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                marginBottom: 20,
              }}
            >
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>日活跃(DAU)</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#3b82f6',
                  }}
                >
                  {snapshot.activity.dailyActive}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                  占总数{' '}
                  {((snapshot.activity.dailyActive / latest.totalMembers) * 100).toFixed(1)}%
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>周活跃(WAU)</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#8b5cf6',
                  }}
                >
                  {snapshot.activity.weeklyActive}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                  人均到店 {snapshot.activity.avgVisitsPerWeek}次/周
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>月活跃(MAU)</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 32,
                    fontWeight: 700,
                    color: '#22c55e',
                  }}
                >
                  {snapshot.activity.monthlyActive}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                  日均时长: {snapshot.activity.avgSessionMinutes}min
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: '1fr 1fr',
                marginBottom: 20,
              }}
            >
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>
                  会员行为洞察
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <InfoRow label="最活跃日" value={snapshot.activity.peakDay} />
                  <InfoRow label="最活跃时段" value={snapshot.activity.peakHour} />
                  <InfoRow
                    label="平均停留"
                    value={`${snapshot.activity.avgSessionMinutes}分钟`}
                  />
                  <InfoRow
                    label="周均到店"
                    value={`${snapshot.activity.avgVisitsPerWeek}次`}
                  />
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8 }}>
                  昨日数据
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  <InfoRow label="新增会员" value={`${latest.newMembers}人`} />
                  <InfoRow
                    label={`营收 (充值:${formatMemberReportMoney(latest.avgRecharge)})`}
                    value={formatMemberReportMoney(latest.totalRevenue)}
                  />
                  <InfoRow
                    label="客单价"
                    value={formatMemberReportMoney(latest.avgSpend)}
                  />
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: -8 }}>{`充值:${formatMemberReportMoney(latest.avgRecharge)}`}</div>
                  <InfoRow
                    label={`30日LTV (90日: ${formatMemberReportMoney(latest.ltv90)})`}
                    value={formatMemberReportMoney(latest.ltv30)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={btnStyle}>
                导出报告(PDF)
              </button>
              <button
                type="button"
                style={{ ...btnStyle, background: 'rgba(139,92,246,0.14)', color: '#c4b5fd' }}
              >
                RFM分群分析
              </button>
            </div>
          </>
        ) : null}

        {tab === 'rfm' ? (
          <>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px' }}>
              基于近90天数据的RFM分析 · 总会员{' '}
              {snapshot.rfm.reduce((sum, segment) => sum + segment.count, 0).toLocaleString()}
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {snapshot.rfm.map((segment) => (
                <div
                  key={segment.segment}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: 'rgba(15,23,42,0.3)',
                    border: `1px solid ${segment.color}33`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: segment.color,
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: 15 }}>
                        {segment.segment}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>
                        {segment.count.toLocaleString()}人
                      </span>
                    </div>
                    <span
                      style={{
                        color: segment.color,
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {formatMemberReportMoney(segment.totalValue)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#cbd5e1' }}>
                    <span>距离上次: {segment.avgRecency}天</span>
                    <span>频次: {segment.avgFrequency}次</span>
                    <span>客单价: {formatMemberReportMoney(segment.avgMonetary)}</span>
                    <span>营收占比: {segment.pctOfRevenue}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {tab === 'trend' ? (
          <>
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                marginBottom: 20,
              }}
            >
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>累计新增(90d)</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#22c55e',
                  }}
                >
                  {snapshot.totals.totalNewMembers.toLocaleString()}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
                  日均: {Math.round(snapshot.totals.totalNewMembers / 90)}
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>平均活跃率</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#3b82f6',
                  }}
                >
                  {snapshot.totals.avgActiveRate.toFixed(1)}%
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>最新活跃率</div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 24,
                    fontWeight: 700,
                    color: latest.activeRate > 55 ? '#22c55e' : '#eab308',
                  }}
                >
                  {latest.activeRate}%
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>日期</th>
                    <th style={thStyle}>新增</th>
                    <th style={thStyle}>总数</th>
                    <th style={thStyle}>活跃</th>
                    <th style={thStyle}>活跃率</th>
                    <th style={thStyle}>营收</th>
                    <th style={thStyle}>客单价</th>
                    <th style={thStyle}>流失率</th>
                    <th style={thStyle}>留存率</th>
                    <th style={thStyle}>LTV30</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.metrics.slice(0, 30).map((metric) => (
                    <tr key={metric.date}>
                      <td style={tdStyle}>{metric.date}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#22c55e' }}>
                        {metric.newMembers}
                      </td>
                      <td style={tdStyle}>{metric.totalMembers.toLocaleString()}</td>
                      <td style={tdStyle}>{metric.activeMembers.toLocaleString()}</td>
                      <td style={tdStyle}>{metric.activeRate}%</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#22c55e' }}>
                        {formatMemberReportMoney(metric.totalRevenue)}
                      </td>
                      <td style={tdStyle}>{formatMemberReportMoney(metric.avgSpend)}</td>
                      <td
                        style={{
                          ...tdStyle,
                          color: metric.churnRate > 0.05 ? '#ef4444' : '#22c55e',
                        }}
                      >
                        {(metric.churnRate * 100).toFixed(1)}%
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: metric.retentionRate > 95 ? '#22c55e' : '#eab308',
                        }}
                      >
                        {metric.retentionRate}%
                      </td>
                      <td style={tdStyle}>{formatMemberReportMoney(metric.ltv30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </PageShell>
    </main>
  )
}
