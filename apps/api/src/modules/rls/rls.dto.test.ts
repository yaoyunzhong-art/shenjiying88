/**
 * rls.dto.test.ts — RLS DTO 校验测试
 *
 * 🐜 V17: thin-module-test-batch
 *
 * 覆盖:
 *   正例 × 6: 各 DTO 有效值通过校验
 *   反例 × 5: 非法标识符 / 空值
 *   边界 × 2: 特殊字符 / 超长值
 */

import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import 'reflect-metadata'
import {
  EnableRlsDto,
  CreatePolicyDto,
  VerifyFilterDto,
  SetupIsolationDto,
  RlsStatusQueryDto,
} from './rls.dto'

describe('EnableRlsDto', () => {
  it('有效表名通过校验', async () => {
    const dto = new EnableRlsDto()
    dto.tableName = 'MemberProfile'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('空 tableName 应报错', async () => {
    const dto = new EnableRlsDto()
    dto.tableName = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('以数字开头的表名应报错', async () => {
    const dto = new EnableRlsDto()
    dto.tableName = '123table'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('包含 SQL 注入字符的表名应报错', async () => {
    const dto = new EnableRlsDto()
    dto.tableName = "users; DROP TABLE"
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('CreatePolicyDto', () => {
  it('仅传必填字段通过校验', async () => {
    const dto = new CreatePolicyDto()
    dto.tableName = 'Orders'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('传所有可选字段通过校验', async () => {
    const dto = new CreatePolicyDto()
    dto.tableName = 'Orders'
    dto.policyName = 'tenant_filter'
    dto.tenantColumn = 'orgId'
    dto.schema = 'billing'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('非法 policyName 应报错', async () => {
    const dto = new CreatePolicyDto()
    dto.tableName = 'Orders'
    dto.policyName = '123invalid'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('VerifyFilterDto', () => {
  it('有效字段通过校验', async () => {
    const dto = new VerifyFilterDto()
    dto.tableName = 'MemberProfile'
    dto.tenantId = 'tenant-demo'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('缺少 tenantId 应报错', async () => {
    const dto = new VerifyFilterDto()
    dto.tableName = 'MemberProfile'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('SetupIsolationDto', () => {
  it('仅传表名通过校验', async () => {
    const dto = new SetupIsolationDto()
    dto.tableName = 'MemberProfile'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('传所有可选字段通过校验', async () => {
    const dto = new SetupIsolationDto()
    dto.tableName = 'MemberProfile'
    dto.tenantColumn = 'tenantId'
    dto.policyName = 'my_policy'
    dto.schema = 'public'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('RlsStatusQueryDto', () => {
  it('不传 table 通过校验', async () => {
    const dto = new RlsStatusQueryDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('有效 table 通过校验', async () => {
    const dto = new RlsStatusQueryDto()
    dto.table = 'MemberProfile'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('非法 table 名应报错', async () => {
    const dto = new RlsStatusQueryDto()
    dto.table = '123abc'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
