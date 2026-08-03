import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildMockMember,
  buildPointRecords,
  buildRechargeRecords,
  buildVisitRecords,
  formatMemberCurrency,
  loadMemberDetailPageSnapshot,
} from './member-detail-data'

describe('Member detail snapshot contract', () => {
  it('应返回 fallback 详情快照与来源态证据', async () => {
    const snapshot = await loadMemberDetailPageSnapshot('m-001')
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'member-detail-fallback-snapshot')
    assert.equal(snapshot.member.id, 'm-001')
    assert.ok(snapshot.refreshPath.includes('loadMemberDetailPageSnapshot'))
  })

  it('会员档案与积分/充值/到店样本应完整输出', () => {
    const member = buildMockMember('m-002')
    assert.equal(member.memberNo, 'M5-m-002')
    assert.equal(buildPointRecords().length > 0, true)
    assert.equal(buildRechargeRecords().length > 0, true)
    assert.equal(buildVisitRecords().length > 0, true)
  })

  it('金额格式化应保留两位小数', () => {
    assert.equal(formatMemberCurrency(3520), '¥3,520.00')
  })
})
