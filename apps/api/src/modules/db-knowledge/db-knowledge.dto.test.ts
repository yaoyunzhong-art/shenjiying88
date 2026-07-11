/**
 * db-knowledge.dto.test.ts — DTO 校验测试
 *
 * 验证 class-validator 装饰器正确拒绝非法参数。
 */
import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import 'reflect-metadata'
import { SearchQueryDto, KindQueryDto, CityQueryDto, PatternFilterDto } from './db-knowledge.dto'

describe('SearchQueryDto', () => {
  it('有效的搜索请求通过校验', async () => {
    const dto = new SearchQueryDto()
    dto.query = '示例查询'
    dto.limit = 10
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('缺少 query 应报错', async () => {
    const dto = new SearchQueryDto()
    dto.limit = 10
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('query')
  })

  it('limit 为负数应报错', async () => {
    const dto = new SearchQueryDto()
    dto.query = 'test'
    dto.limit = -1
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('limit 超过 100 应报错', async () => {
    const dto = new SearchQueryDto()
    dto.query = 'test'
    dto.limit = 200
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('kind 为可选', async () => {
    const dto = new SearchQueryDto()
    dto.query = 'test'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('KindQueryDto', () => {
  it('有效种类通过校验', async () => {
    const dto = new KindQueryDto()
    dto.kind = 'guide'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('缺少 kind 应报错', async () => {
    const dto = new KindQueryDto()
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('CityQueryDto', () => {
  it('有效城市通过校验', async () => {
    const dto = new CityQueryDto()
    dto.city = '上海'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('缺少 city 应报错', async () => {
    const dto = new CityQueryDto()
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('PatternFilterDto', () => {
  it('有效类型通过校验', async () => {
    const dto = new PatternFilterDto()
    dto.type = 'anti-pattern'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('无效类型值应报错', async () => {
    const dto = new PatternFilterDto()
    ;(dto as any).type = 'invalid-type'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('type 为可选', async () => {
    const dto = new PatternFilterDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})
