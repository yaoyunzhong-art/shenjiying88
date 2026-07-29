import { DonutChart, GaugeChart, PageShell, StatCard } from '@m5/ui'
import {
  SEGMENTS,
  buildResultSlices,
  buildSourceSlices,
  computeAiDecisionSummary,
  computeStats,
  loadAiDecisionStatsSnapshot,
  sortRulesByLift,
} from './ai-decision-stats-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AiDecisionStatsPage() {
  const snapshot = await loadAiDecisionStatsSnapshot()
  const stats = computeStats(snapshot.rules)
  const aiSummary = computeAiDecisionSummary(snapshot.rules)
  const resultSlices = buildResultSlices(snapshot.rules)
  const sourceSlices = buildSourceSlices(snapshot.rules)
  const topLift = sortRulesByLift(snapshot.rules)

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
      <PageShell
        title="AI 决策统计分析"
        subtitle="决策执行效果总览 — 成功率、来源构成、规则排名与性能监控"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard label="总执行次数" value={stats.total.toLocaleString()} variant="info" />
          <StatCard
            label="综合成功率"
            value={`${stats.successRate}%`}
            variant={stats.successRate >= 85 ? 'success' : 'warning'}
          />
          <StatCard label="平均响应" value={`${stats.avgResp} ms`} variant="default" />
          <StatCard
            label="平均提升率"
            value={`+${stats.avgLift}%`}
            variant="success"
            trend={{ value: '+2.1%', positive: true }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <StatCard
            label="AI 决策总数"
            value={aiSummary.totalDecisions.toLocaleString()}
            variant="info"
          />
          <StatCard label="已采纳" value={aiSummary.adoptedCount.toLocaleString()} variant="success" />
          <StatCard label="已拒绝" value={aiSummary.rejectedCount.toLocaleString()} variant="error" />
          <StatCard
            label="待审核"
            value={aiSummary.pendingReviewCount.toLocaleString()}
            variant="warning"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
              决策结果分布
            </h3>
            <DonutChart
              data={resultSlices}
              size={180}
              thickness={32}
              showCenterLabel
              centerFormatter={(total) =>
                `${(((resultSlices[0]?.value ?? 0) / total) * 100).toFixed(0)}%`
              }
              showLegend
              minPercent={2}
              animationDuration={600}
            />
          </div>

          <div
            style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
              决策来源构成
            </h3>
            <DonutChart
              data={sourceSlices}
              size={180}
              thickness={32}
              showCenterLabel
              centerFormatter={() => `${sourceSlices.length} 来源`}
              showLegend
              minPercent={2}
              animationDuration={600}
            />
          </div>

          <div
            style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
              综合成功率
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GaugeChart
                value={stats.successRate}
                label="成功率"
                suffix="%"
                segments={SEGMENTS}
                size={180}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 20,
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
            规则效果排行 (按提升率)
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>
                  规则名称
                </th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>
                  执行次数
                </th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>
                  成功率
                </th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>
                  平均响应
                </th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#94a3b8', fontWeight: 500 }}>
                  提升率
                </th>
              </tr>
            </thead>
            <tbody>
              {topLift.map((rule, index) => {
                const successRate =
                  rule.executionCount > 0
                    ? ((rule.successCount / rule.executionCount) * 100).toFixed(1)
                    : '0.0'

                return (
                  <tr key={rule.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                    <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background:
                            index === 0
                              ? '#fbbf24'
                              : index === 1
                                ? '#94a3b8'
                                : index === 2
                                  ? '#c0846e'
                                  : 'rgba(148,163,184,0.15)',
                          color: index < 3 ? '#0f172a' : '#94a3b8',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{rule.name}</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>
                      {rule.executionCount.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: '#4ade80' }}>
                      {successRate}%
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 12px', color: '#94a3b8' }}>
                      {rule.avgResponseMs} ms
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        padding: '10px 12px',
                        color: '#4ade80',
                        fontWeight: 600,
                      }}
                    >
                      +{rule.liftPercent}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </PageShell>
    </main>
  )
}
