import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatMemberCount,
  formatCurrency,
  formatPercent,
  campaignStatusLabel,
  campaignChannelLabel,
  type MarketingCampaign,
} from './marketing-view-model'

describe('marketing-view-model', () => {
  describe('formatMemberCount', () => {
    it('formats numbers under 10000 with locale', () => {
      assert.equal(formatMemberCount(0), '0')
      assert.equal(formatMemberCount(9999), '9,999')
      assert.equal(formatMemberCount(1234), '1,234')
    })

    it('formats 10000+ as 万', () => {
      assert.equal(formatMemberCount(10000), '1万')
      assert.equal(formatMemberCount(18420), '1.8万')
      assert.equal(formatMemberCount(100000), '10万')
      assert.equal(formatMemberCount(999999), '100万')
    })

    it('strips trailing .0 for exact 万', () => {
      assert.equal(formatMemberCount(20000), '2万')
      assert.equal(formatMemberCount(150000), '15万')
    })

    it('handles very large numbers', () => {
      assert.equal(formatMemberCount(1_000_000_000), '100000万')
      assert.equal(formatMemberCount(1000000), '100万')
    })

    it('handles decimal rounding for values around threshold', () => {
      assert.equal(formatMemberCount(10001), '1万')
      assert.equal(formatMemberCount(10050), '1万')
      assert.equal(formatMemberCount(123), '123')
    })
  })

  describe('formatCurrency', () => {
    it('formats small values with yuan suffix', () => {
      assert.equal(formatCurrency(0), '0元')
      assert.equal(formatCurrency(9999), '9,999元')
      assert.equal(formatCurrency(500), '500元')
    })

    it('formats large values as 万元', () => {
      assert.equal(formatCurrency(10000), '1万元')
      assert.equal(formatCurrency(158000), '15.8万元')
      assert.equal(formatCurrency(10000000), '1000万元')
    })

    it('handles fractional yuan', () => {
      assert.equal(formatCurrency(0.5), '0.5元')
      assert.equal(formatCurrency(99.99), '99.99元')
    })

    it('preserves exact yuan display for large round numbers', () => {
      assert.equal(formatCurrency(20000), '2万元')
      assert.equal(formatCurrency(990000), '99万元')
    })
  })

  describe('formatPercent', () => {
    it('formats with one decimal and percent sign', () => {
      assert.equal(formatPercent(12.5), '12.5%')
      assert.equal(formatPercent(0), '0.0%')
      assert.equal(formatPercent(100), '100.0%')
      assert.equal(formatPercent(3.14159), '3.1%')
    })

    it('handles negative percentages', () => {
      assert.equal(formatPercent(-5.5), '-5.5%')
      assert.equal(formatPercent(-0.1), '-0.1%')
    })

    it('handles extreme values', () => {
      assert.equal(formatPercent(Infinity), 'Infinity%')
      assert.equal(formatPercent(999.99), '1000.0%')
    })
  })

  describe('campaignStatusLabel', () => {
    it('returns Chinese label for each status', () => {
      assert.equal(campaignStatusLabel('running'), '进行中')
      assert.equal(campaignStatusLabel('ended'), '已结束')
      assert.equal(campaignStatusLabel('scheduled'), '已排期')
      assert.equal(campaignStatusLabel('draft'), '草稿')
    })

    it('covers exactly 4 status values', () => {
      const statuses: MarketingCampaign['status'][] = ['running', 'ended', 'scheduled', 'draft']
      for (const s of statuses) {
        assert.ok(campaignStatusLabel(s).length > 0, `${s} 应有标签`)
      }
    })
  })

  describe('campaignChannelLabel', () => {
    it('returns Chinese label for each channel', () => {
      assert.equal(campaignChannelLabel('wechat'), '微信')
      assert.equal(campaignChannelLabel('app_push'), 'App推送')
      assert.equal(campaignChannelLabel('sms'), '短信')
      assert.equal(campaignChannelLabel('douyin'), '抖音')
      assert.equal(campaignChannelLabel('xiaohongshu'), '小红书')
    })

    it('covers all 5 channel values', () => {
      const channels: MarketingCampaign['channel'][] = ['wechat', 'app_push', 'sms', 'douyin', 'xiaohongshu']
      for (const c of channels) {
        assert.ok(campaignChannelLabel(c).length > 0, `${c} 应有标签`)
      }
    })
  })

  describe('MarketingCampaign type structure', () => {
    it('supports a full campaign object', () => {
      const campaign: MarketingCampaign = {
        id: 'camp-1',
        name: '618大促',
        channel: 'wechat',
        status: 'running',
        targetSegment: 'all',
        reachCount: 50000,
        conversionRate: 3.2,
        cost: 10000,
        roi: 2.5,
        startAt: '2026-06-01T00:00:00Z',
      }
      assert.equal(campaign.name, '618大促')
      assert.equal(campaign.reachCount, 50000)
    })

    it('supports optional endAt', () => {
      const campaign: MarketingCampaign = {
        id: 'camp-2',
        name: '夏季促销',
        channel: 'sms',
        status: 'ended',
        targetSegment: 'vip',
        reachCount: 10000,
        conversionRate: 5.0,
        cost: 5000,
        roi: 3.0,
        startAt: '2026-05-01T00:00:00Z',
        endAt: '2026-05-31T00:00:00Z',
      }
      assert.ok(campaign.endAt !== undefined)
      assert.equal(campaign.roi, 3.0)
    })
  })
})
