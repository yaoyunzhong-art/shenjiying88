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

describe('EnableRlsDto 边界', () => {
  it('包含下划线的表名通过校验', async () => {
    const dto = new EnableRlsDto()
    dto.tableName = 'Member_Profile'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('超长表名应报错', async () => {
    const dto = new EnableRlsDto()
    dto.tableName = 'A' + 'b'.repeat(200)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('以 _ 开头的表名应报错', async () => {
    const dto = new EnableRlsDto()
    dto.tableName = '_Private' as any
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('CreatePolicyDto 边界', () => {
  it('超长 policyName 应报错', async () => {
    const dto = new CreatePolicyDto()
    dto.tableName = 'Orders'
    dto.policyName = 'x'.repeat(130)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('包含 SQL 注入的 tableName 应报错', async () => {
    const dto = new CreatePolicyDto()
    dto.tableName = "Orders; DELETE FROM users"
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('超长 schema 名应报错（@MaxLength 128）', async () => {
    const dto = new CreatePolicyDto()
    dto.tableName = 'Orders'
    dto.schema = 'a'.repeat(200)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('VerifyFilterDto 边界', () => {
  it('超长 tenantId 应报错', async () => {
    const dto = new VerifyFilterDto()
    dto.tableName = 'MemberProfile'
    dto.tenantId = 'x'.repeat(300)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('非法 tableName 应报错', async () => {
    const dto = new VerifyFilterDto()
    dto.tableName = '123abc'
    dto.tenantId = 'tenant-1'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('SetupIsolationDto 边界', () => {
  it('超长 tenantColumn 名应报错', async () => {
    const dto = new SetupIsolationDto()
    dto.tableName = 'Orders'
    dto.tenantColumn = 'a'.repeat(200)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('包含特殊字符的 policyName 应报错', async () => {
    const dto = new SetupIsolationDto()
    dto.tableName = 'Orders'
    dto.policyName = "policy' OR '1'='1"
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('RlsStatusQueryDto 边界', () => {
  it('包含 SQL 注入字符的 table 名应报错', async () => {
    const dto = new RlsStatusQueryDto()
    dto.table = "t; SELECT pg_sleep(10)"
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('空字符串 table 应报错（@IsString 不允许空字符串）', async () => {
    const dto = new RlsStatusQueryDto()
    dto.table = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
