import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildMemberActivity,
  buildMemberMetrics,
  buildRfmSegments,
  computeMemberReportsTotals,
  formatMemberReportMoney,
  loadMemberReportsPageSnapshot,
} from './member-reports-data'

describe('Member reports snapshot contract', () => {
  it('应返回 fallback 报表快照与来源态证据', async () => {
    const snapshot = await loadMemberReportsPageSnapshot()
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'member-reports-fallback-snapshot')
    assert.ok(snapshot.controlPlaneSource.includes('buildMemberMetrics'))
    assert.equal(snapshot.metrics.length, 90)
  })

  it('指标、RFM 与活跃度样本应稳定输出', () => {
    assert.equal(buildMemberMetrics(30).length, 30)
    assert.equal(buildRfmSegments().length, 8)
    assert.equal(buildMemberActivity().peakDay, '星期六')
  })

  it('统计聚合与金额格式化应正确', () => {
    const metrics = buildMemberMetrics(10)
    const totals = computeMemberReportsTotals(metrics)
    assert.equal(totals.totalNewMembers > 0, true)
    assert.equal(totals.avgActiveRate > 0, true)
    assert.equal(formatMemberReportMoney(1234.56), '¥1,234.56')
  })
})
