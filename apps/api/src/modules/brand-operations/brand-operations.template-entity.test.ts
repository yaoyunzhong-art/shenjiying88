/**
 * brand-operations.template-entity.test.ts — P-47 模板实体类型测试
 */
import { describe, it, expect } from 'vitest'
import type { BrandCampaignTemplate, BrandOperationsMetrics } from './brand-operations.entity'

describe('BrandCampaignTemplate Entity Types', () => {
  it('应创建最小模板对象', () => {
    const tpl: BrandCampaignTemplate = {
      id: 'tpl-1',
      tenantId: 't-1',
      brandId: 'b-1',
      name: '夏季促销模板',
      description: '夏季场景活动模板',
      defaultStoreIds: [],
      defaultAssets: [],
      tags: [],
      published: false,
      createdBy: 'u-1',
      createdAt: '2026-07-20T00:00:00Z',
      updatedAt: '2026-07-20T00:00:00Z',
    }
    expect(tpl.name).toBe('夏季促销模板')
    expect(tpl.published).toBe(false)
    expect(tpl.coverImageUrl).toBeUndefined()
    expect(tpl.defaultDurationDays).toBeUndefined()
  })

  it('应创建完整模板对象', () => {
    const tpl: BrandCampaignTemplate = {
      id: 'tpl-2',
      tenantId: 't-1',
      brandId: 'b-1',
      name: '周年庆模板',
      description: '品牌周年庆活动模板',
      defaultStoreIds: ['s-1', 's-2', 's-3'],
      defaultAssets: ['ba-1', 'ba-2'],
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      defaultDurationDays: 30,
      tags: ['anniversary', 'promotion'],
      published: true,
      createdBy: 'u-2',
      createdAt: '2026-07-20T00:00:00Z',
      updatedAt: '2026-07-21T00:00:00Z',
    }
    expect(tpl.defaultStoreIds).toHaveLength(3)
    expect(tpl.defaultAssets).toHaveLength(2)
    expect(tpl.defaultDurationDays).toBe(30)
    expect(tpl.tags).toContain('anniversary')
    expect(tpl.published).toBe(true)
  })

  it('Metrics 应包含模板字段', () => {
    const metrics: BrandOperationsMetrics = {
      totalAssets: 5,
      activeAssets: 3,
      totalCampaigns: 2,
      activeCampaigns: 1,
      totalStoreAssignments: 4,
      syncedStores: 3,
      totalTemplates: 3,
      publishedTemplates: 2,
    }
    expect(metrics.totalTemplates).toBe(3)
    expect(metrics.publishedTemplates).toBe(2)
  })
})
