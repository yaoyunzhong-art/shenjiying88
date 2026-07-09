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
  })

  describe('formatPercent', () => {
    it('formats with one decimal and percent sign', () => {
      assert.equal(formatPercent(12.5), '12.5%')
      assert.equal(formatPercent(0), '0.0%')
      assert.equal(formatPercent(100), '100.0%')
      assert.equal(formatPercent(3.14159), '3.1%')
    })
  })

  describe('campaignStatusLabel', () => {
    it('returns Chinese label for each status', () => {
      assert.equal(campaignStatusLabel('running'), '进行中')
      assert.equal(campaignStatusLabel('ended'), '已结束')
      assert.equal(campaignStatusLabel('scheduled'), '已排期')
      assert.equal(campaignStatusLabel('draft'), '草稿')
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
  })
})
