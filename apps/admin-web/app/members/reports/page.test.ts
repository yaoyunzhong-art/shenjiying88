import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'

import {
  buildMemberActivity,
  buildMemberMetrics,
  buildRfmSegments,
  computeMemberReportsTotals,
  formatMemberReportMoney,
  loadMemberReportsPageSnapshot,
} from './member-reports-data'

const originalFetch = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = originalFetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('Member reports snapshot contract', () => {
  it('应在会员持久化接口可用时返回部分 api 快照', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      assert.ok(url.includes('/members/persistent'))
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              memberId: 'm001',
              tenantContext: { tenantId: 'tenant-demo', storeId: 'store-001', marketCode: 'cn-mainland' },
              nickname: '张伟',
              mobile: '+86-138-0001-0001',
              level: 'DIAMOND',
              status: 'ACTIVE',
              points: 185000,
              registeredAt: '2026-07-01T00:00:00.000Z',
              lastActiveAt: '2026-07-26T00:00:00.000Z',
              persisted: true,
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }) as typeof fetch

    const snapshot = await loadMemberReportsPageSnapshot()
    assert.equal(snapshot.deliveryMode, 'api')
    assert.equal(snapshot.sourceLabel, 'member-reports-api-partial')
    assert.ok(snapshot.controlPlaneSource.includes('members/persistent'))
    assert.ok(snapshot.apiBackedFields.includes('members/persistent current overview'))
    assert.ok(snapshot.fallbackFields.includes('trend metrics'))
    assert.equal(snapshot.metrics.length, 90)
  })

  it('接口失败时应回退到 fallback 报表快照', async () => {
    globalThis.fetch = (async () => {
      throw new Error('member api down')
    }) as typeof fetch

    const snapshot = await loadMemberReportsPageSnapshot()
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'member-reports-fallback-snapshot')
    assert.ok(snapshot.controlPlaneSource.includes('buildMemberMetrics'))
    assert.ok(snapshot.error?.includes('已切换到 fallback 报表样本'))
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
