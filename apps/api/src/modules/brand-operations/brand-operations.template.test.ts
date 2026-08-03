/**
 * brand-operations.template.test.ts — P-47 品牌运营活动模板测试
 *
 * 覆盖:
 *   - 模板创建/查询/更新/删除 (正例 × 5)
 *   - 模板列表过滤 (正例 × 3)
 *   - 模板应用到活动 (正例 × 2, 反例 × 1)
 *   - 模板发布切换 (正例 × 2)
 *   - 模板搜索 (正例 × 2)
 *   - 跨租户隔离 (反例 × 1)
 *   - 统计包含模板 (正例 × 1)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BrandOperationsService, resetBrandOpsStoresForTests } from './brand-operations.service'

describe('BrandOperationsService — CampaignTemplate', () => {
  let service: BrandOperationsService

  beforeEach(() => {
    resetBrandOpsStoresForTests()
    service = new BrandOperationsService()
  })

  const T = { tenantId: 't-1', brandId: 'b-1' }

  // ── 模板 CRUD (5) ──────────────────────────────────────────

  it('应创建活动模板 → id以tpl-开头', () => {
    const tpl = service.createTemplate({
      ...T,
      name: '夏季促销模板',
      description: '适用于夏季场景的活动模板',
      tags: ['seasonal', 'promotion'],
      createdBy: 'u-1',
    })
    expect(tpl.id).toMatch(/^tpl-/)
    expect(tpl.name).toBe('夏季促销模板')
    expect(tpl.tags).toEqual(['seasonal', 'promotion'])
    expect(tpl.published).toBe(false)
  })

  it('应创建已发布的模板', () => {
    const tpl = service.createTemplate({
      ...T,
      name: '周年庆模板',
      description: '通用周年庆模板',
      published: true,
      createdBy: 'u-1',
    })
    expect(tpl.published).toBe(true)
  })

  it('应支持模板带默认门店和素材', () => {
    const tpl = service.createTemplate({
      ...T,
      name: '全门店模板',
      description: '覆盖所有门店',
      defaultStoreIds: ['s-1', 's-2', 's-3'],
      defaultAssets: ['ba-1', 'ba-2'],
      coverImageUrl: 'https://cdn.example.com/tpl-cover.jpg',
      defaultDurationDays: 30,
      createdBy: 'u-1',
    })
    expect(tpl.defaultStoreIds).toHaveLength(3)
    expect(tpl.defaultAssets).toHaveLength(2)
    expect(tpl.coverImageUrl).toBe('https://cdn.example.com/tpl-cover.jpg')
    expect(tpl.defaultDurationDays).toBe(30)
  })

  it('应通过getTemplate获取模板', () => {
    const created = service.createTemplate({
      ...T, name: '获取测试', description: 'desc', createdBy: 'u-1',
    })
    const found = service.getTemplate(created.id, T.tenantId)
    expect(found).toBeDefined()
    expect(found!.name).toBe('获取测试')
  })

  it('应删除模板', () => {
    const created = service.createTemplate({
      ...T, name: '删除测试', description: 'desc', createdBy: 'u-1',
    })
    expect(service.deleteTemplate(created.id, T.tenantId)).toBe(true)
    expect(service.getTemplate(created.id, T.tenantId)).toBeUndefined()
  })

  // ── 模板更新 (2) ────────────────────────────────────────────

  it('应更新模板字段', () => {
    const tpl = service.createTemplate({
      ...T, name: '旧名', description: '旧描述', createdBy: 'u-1',
    })
    const updated = service.updateTemplate(tpl.id, T.tenantId, {
      name: '新名',
      published: true,
    })
    expect(updated.name).toBe('新名')
    expect(updated.published).toBe(true)
    expect(updated.description).toBe('旧描述') // unchanged
  })

  it('更新不存在的模板应报错', () => {
    expect(() =>
      service.updateTemplate('nonexistent', T.tenantId, { name: 'New' })
    ).toThrow('BrandCampaignTemplate not found')
  })

  // ── 模板列表过滤 (3) ────────────────────────────────────────

  it('listTemplates 应返回租户下所有模板', () => {
    service.createTemplate({ ...T, name: 'A', description: 'A', createdBy: 'u-1' })
    service.createTemplate({ ...T, name: 'B', description: 'B', createdBy: 'u-1' })
    service.createTemplate({ tenantId: 'other', name: 'C', description: 'C', brandId: 'b-1', createdBy: 'u-1' })

    const list = service.listTemplates(T.tenantId)
    expect(list).toHaveLength(2)
  })

  it('listTemplates 应按标签过滤', () => {
    service.createTemplate({ ...T, name: '季节模板', description: 'D', tags: ['seasonal'], createdBy: 'u-1' })
    service.createTemplate({ ...T, name: '节日模板', description: 'D', tags: ['holiday'], createdBy: 'u-1' })

    const seasonal = service.listTemplates(T.tenantId, { tag: 'seasonal' })
    expect(seasonal).toHaveLength(1)
    expect(seasonal[0].name).toBe('季节模板')
  })

  it('listTemplates 应按发布状态过滤', () => {
    service.createTemplate({ ...T, name: '未发布', description: 'D', published: false, createdBy: 'u-1' })
    service.createTemplate({ ...T, name: '已发布', description: 'D', published: true, createdBy: 'u-1' })

    const published = service.listTemplates(T.tenantId, { published: true })
    expect(published).toHaveLength(1)
    expect(published[0].name).toBe('已发布')
  })

  // ── 模板搜索 (2) ─────────────────────────────────────────────

  it('listTemplates 应按名称搜索', () => {
    service.createTemplate({ ...T, name: '夏季狂欢', description: '夏季活动', createdBy: 'u-1' })
    service.createTemplate({ ...T, name: '冬季特惠', description: '冬季活动', createdBy: 'u-1' })

    const result = service.listTemplates(T.tenantId, { search: '夏季' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('夏季狂欢')
  })

  it('listTemplates 应按描述搜索', () => {
    service.createTemplate({ ...T, name: '模板A', description: '适用于圣诞节促销场景', createdBy: 'u-1' })
    service.createTemplate({ ...T, name: '模板B', description: '适用于春节促销场景', createdBy: 'u-1' })

    const result = service.listTemplates(T.tenantId, { search: '圣诞节' })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('模板A')
  })

  // ── 从模板创建活动 (3) ──────────────────────────────────────

  it('从模板创建活动应继承模板门店和素材', () => {
    const banner = service.createAsset({
      ...T, type: 'banner', url: 'https://cdn.example.com/banner.jpg', name: '模板Banner',
    })
    const tpl = service.createTemplate({
      ...T,
      name: '夏季模板',
      description: '模板说明',
      defaultStoreIds: ['s-1', 's-2'],
      defaultAssets: [banner.id],
      coverImageUrl: 'https://cdn.example.com/cover.jpg',
      createdBy: 'u-1',
    })

    const camp = service.applyTemplateToCampaign({
      templateId: tpl.id,
      tenantId: T.tenantId,
      brandId: T.brandId,
      title: '从模板创建的活动',
      description: '活动说明',
      startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-08-31T00:00:00Z',
      createdBy: 'u-2',
    })

    expect(camp.storeIds).toEqual(['s-1', 's-2'])
    expect(camp.assets).toEqual([banner.id])
    expect(camp.coverImageUrl).toBe('https://cdn.example.com/cover.jpg')
    expect(camp.createdBy).toBe('u-2')
  })

  it('从模板创建活动可覆盖门店列表', () => {
    const tpl = service.createTemplate({
      ...T,
      name: '模板',
      description: 'D',
      defaultStoreIds: ['s-1', 's-2'],
      createdBy: 'u-1',
    })

    const camp = service.applyTemplateToCampaign({
      templateId: tpl.id,
      tenantId: T.tenantId,
      brandId: T.brandId,
      title: '自定义门店的活动',
      description: 'D',
      startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-08-31T00:00:00Z',
      storeIds: ['s-3', 's-4'],
      createdBy: 'u-1',
    })

    // 应合并模板门店和自定义门店
    expect(camp.storeIds).toEqual(['s-1', 's-2', 's-3', 's-4'])
  })

  it('从不存在的模板创建活动应报错', () => {
    expect(() =>
      service.applyTemplateToCampaign({
        templateId: 'nonexistent',
        tenantId: T.tenantId,
        brandId: T.brandId,
        title: '失败活动',
        description: 'D',
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-31T00:00:00Z',
        createdBy: 'u-1',
      }),
    ).toThrow('BrandCampaignTemplate not found')
  })

  // ── 跨租户隔离 (1) ─────────────────────────────────────────

  it('模板跨租户隔离 — 不能访问其他租户的模板', () => {
    const tpl = service.createTemplate({
      tenantId: 't-other', brandId: 'b-1',
      name: '其他租户模板', description: 'D', createdBy: 'u-1',
    })
    const found = service.getTemplate(tpl.id, T.tenantId)
    expect(found).toBeUndefined()
  })

  // ── 统计包含模板 (1) ───────────────────────────────────────

  it('getMetrics 应包含模板统计', () => {
    service.createTemplate({ ...T, name: '已发布', description: 'D', published: true, createdBy: 'u-1' })
    service.createTemplate({ ...T, name: '草稿', description: 'D', published: false, createdBy: 'u-1' })

    const metrics = service.getMetrics(T.tenantId)
    expect(metrics.totalTemplates).toBe(2)
    expect(metrics.publishedTemplates).toBe(1)
  })
})
