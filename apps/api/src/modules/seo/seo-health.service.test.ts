import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SeoService } from './seo.service'
import { SeoHealthService } from './seo-health.service'

describe('SeoHealthService', () => {
  let svc: SeoService
  let health: SeoHealthService

  beforeEach(() => {
    svc = new SeoService()
    health = new SeoHealthService(svc)
  })

  it('正例: 健康报告含预期结构', () => {
    const report = health.generateHealthReport('t1')
    assert.ok(report.totalPages > 0)
    assert.ok(typeof report.avgMetadataScore === 'number')
    assert.ok(report.issues.length >= 0)
  })

  it('正例: 有metadata时coverage更高', () => {
    svc.upsertMetadata('/', { title: '首页', description: '描述', keywords: [], canonical: 'https://', tenantId: 't1' })
    svc.upsertMetadata('/about', { title: '关于', description: '描述', keywords: [], canonical: 'https://', tenantId: 't1' })
    const report = health.generateHealthReport('t1')
    assert.ok(report.pagesWithMetadata >= 2)
  })

  it('正例: 页面评分', () => {
    const score = health.scorePage('/stores/shanghai', '上海旗舰店 - 最好玩', '上海旗舰店是上海最好的娱乐场所，亲子活动、朋友聚会')
    assert.ok(score > 50)
  })

  it('反例: 空标题低分', () => {
    const score = health.scorePage('/bad', '', '')
    assert.equal(score, 0)
  })

  it('边界: 标题长度边界', () => {
    const s70 = 'a'.repeat(70)
    const s71 = 'a'.repeat(71)
    assert.ok(health.scorePage('/ok', s70, 'x'.repeat(50)) > health.scorePage('/too-long', s71, ''))
  })

  it('反例: 无数据时报告仍有基础值', () => {
    const report = health.generateHealthReport('no-tenant')
    assert.equal(report.totalPages, 10)
    assert.equal(report.pagesWithMetadata, 0)
    assert.equal(report.pagesWithSitemap, 0)
  })
})
