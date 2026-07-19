/**
 * structured-data.service.test.ts — 结构化数据生成器测试 (node:test)
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { StructuredDataService } from './structured-data.service'
import type { StoreForStructuredData, EventForStructuredData } from './structured-data.service'

describe('StructuredDataService', () => {
  const svc = new StructuredDataService()

  it('正例: 门店JSON-LD含三重类型', () => {
    const store: StoreForStructuredData = {
      id: 'S1', name: '旗舰店', description: '上海最好玩的电玩城',
      city: '上海', district: '徐汇', streetAddress: '徐家汇路100号',
      latitude: 31.19, longitude: 121.44, telephone: '021-12345678',
      openingHours: [{ dayOfWeek: ['Monday','Tuesday'], opens: '09:00', closes: '22:00' }],
      avgRating: 4.5, ratingCount: 200, priceRange: '¥¥', imageUrl: 'https://img.com/s1.jpg',
      url: 'https://domain.com/stores/s1',
    }
    const json = svc.generateStoreJsonLd(store)
    const parsed = JSON.parse(json)
    assert.deepEqual(parsed['@type'], ['LocalBusiness', 'EntertainmentBusiness'])
    assert.equal(parsed.name, '旗舰店')
    assert.equal(parsed.address.addressLocality, '上海')
  })

  it('正例: 门店含评级(当>0时)', () => {
    const store: StoreForStructuredData = {
      id: 'S1', name: '旗舰店', description: '描述', city: '上海', district: '徐汇',
      streetAddress: '路100号', latitude: 31.19, longitude: 121.44, telephone: '021-12345678',
      openingHours: [{ dayOfWeek: ['Monday'], opens: '09:00', closes: '22:00' }],
      avgRating: 4.5, ratingCount: 200, priceRange: '¥¥', imageUrl: 'https://img.com/s1.jpg',
      url: 'https://domain.com/stores/s1',
    }
    const parsed = JSON.parse(svc.generateStoreJsonLd(store))
    assert.ok(parsed.aggregateRating)
    assert.equal(parsed.aggregateRating.ratingValue, 4.5)
    assert.equal(parsed.aggregateRating.reviewCount, 200)
  })

  it('正例: 门店无评级时aggregateRating为undefined', () => {
    const store: StoreForStructuredData = {
      id: 'S2', name: '新店', description: '新开', city: '北京', district: '朝阳',
      streetAddress: '路1号', latitude: 39.93, longitude: 116.45, telephone: '010-12345678',
      openingHours: [], avgRating: 0, ratingCount: 0, priceRange: '¥¥',
      imageUrl: 'https://img.com/s2.jpg', url: 'https://domain.com/stores/s2',
    }
    const json = svc.generateStoreJsonLd(store)
    const parsed = JSON.parse(json)
    // aggregateRating 应为 undefined (JSON.stringify 会跳过 undefined)
    assert.equal(parsed.aggregateRating, undefined)
  })

  it('正例: 活动JSON-LD', () => {
    const event: EventForStructuredData = {
      id: 'E1', name: '暑期狂欢', description: '暑假特惠活动',
      startDate: '2026-07-20', endDate: '2026-08-31',
      location: { name: '旗舰店', address: '徐汇路100号' },
      imageUrl: 'https://img.com/e1.jpg', url: 'https://domain.com/events/e1',
      price: 99, currency: 'CNY',
    }
    const parsed = JSON.parse(svc.generateEventJsonLd(event))
    assert.equal(parsed['@type'], 'Event')
    assert.equal(parsed.name, '暑期狂欢')
    assert.equal(parsed.offers.price, 99)
  })

  it('正例: 活动无价格时不显示offers', () => {
    const event: EventForStructuredData = {
      id: 'E2', name: '免费体验', description: '免费', startDate: '2026-07-20',
      location: { name: '旗舰店', address: '路100号' },
      imageUrl: 'https://img.com/e2.jpg', url: 'https://domain.com/events/e2',
    }
    const parsed = JSON.parse(svc.generateEventJsonLd(event))
    assert.equal(parsed['@type'], 'Event')
    assert.equal(parsed.offers, undefined)
  })

  it('正例: 组织JSON-LD', () => {
    const json = svc.generateOrganizationJsonLd('品牌名称', 'https://domain.com', 'https://img.com/logo.png', '最好的娱乐场馆')
    const parsed = JSON.parse(json)
    assert.equal(parsed['@type'], 'Organization')
    assert.equal(parsed.name, '品牌名称')
    assert.ok(parsed.sameAs.length > 0)
  })

  it('正例: 页面结构化数据', () => {
    const json = svc.generatePageStructuredData('/stores/shanghai', '上海门店', '上海店描述')
    const parsed = JSON.parse(json)
    assert.equal(parsed['@type'], 'WebPage')
    assert.equal(parsed.name, '上海门店')
    assert.ok(parsed.isPartOf)
  })

  it('边界: 空门店名称', () => {
    const store: StoreForStructuredData = {
      id: '', name: '', description: '', city: '', district: '',
      streetAddress: '', latitude: 0, longitude: 0, telephone: '',
      openingHours: [], avgRating: 0, ratingCount: 0, priceRange: '',
      imageUrl: '', url: '',
    }
    const parsed = JSON.parse(svc.generateStoreJsonLd(store))
    assert.equal(parsed.name, '')
  })
})
