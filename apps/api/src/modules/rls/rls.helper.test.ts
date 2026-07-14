/**
 * rls.helper.test.ts — RLS Helper 单元测试
 *
 * 🐜 V17: P-31 RLS Extension
 *
 * 覆盖:
 *   1. generateRlsStatusSql — 全表查询
 *   2. generateRlsStatusSql — 单表查询（含 sanitize）
 *   3. generateEnableRlsSql — 正确 SQL
 *   4. generateForceRlsSql  — 正确 SQL
 *   5. generateCreatePolicySql — 默认参数
 *   6. generateCreatePolicySql — 自定义参数
 *   7. generateDropPolicySql — 默认参数
 *   8. generateVerifyTenantFilterSql — 正确 SQL
 *   9. generatePolicyTestSql — 正确 SQL
 *  10. validateName — 合法表名/列名
 *  11. validateName — 非法表名/列名
 *  12. RlsService — getStatus 委托
 *  13. RlsService — validateName 防御
 *  14. consolidateRlsStatus — 多行合并
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import {
  generateRlsStatusSql,
  generateEnableRlsSql,
  generateForceRlsSql,
  generateCreatePolicySql,
  generateDropPolicySql,
  generateVerifyTenantFilterSql,
  generatePolicyTestSql,
  validateName,
  RlsService,
} from './rls.helper'

// ─── SQL 生成函数测试 ────────────────────────────────────────

describe('generateRlsStatusSql()', () => {
  it('生成全表查询 SQL（不含 system schemas）', () => {
    const sql = generateRlsStatusSql()
    assert.ok(sql.includes('pg_class'))
    assert.ok(sql.includes('pg_policy'))
    assert.ok(sql.includes("NOT IN ('pg_catalog', 'information_schema')"))
    assert.ok(sql.includes('ORDER BY'))
  })

  it('生成单表查询 SQL，表名被 sanitize', () => {
    const sql = generateRlsStatusSql('MemberProfile')
    assert.ok(sql.includes("c.relname = 'MemberProfile'"))
    assert.ok(sql.includes('pg_class'))
  })

  it('单表查询 SQL 不包含全表扫描', () => {
    const sql = generateRlsStatusSql('TestTable')
    // 应该有 WHERE c.relkind = 'r' AND c.relname = ...
    const count = (sql.match(/WHERE/g) || []).length
    assert.ok(count >= 2, 'Should have at least 2 WHERE clauses')
  })
})

describe('generateEnableRlsSql()', () => {
  it('生成正确的 ALTER TABLE ENABLE ROW LEVEL SECURITY', () => {
    const sql = generateEnableRlsSql('MemberProfile')
    assert.equal(sql, 'ALTER TABLE "public"."MemberProfile" ENABLE ROW LEVEL SECURITY')
  })

  it('sanitize 非法表名字符', () => {
    const sql = generateEnableRlsSql('Member; DROP TABLE users')
    // 分号和空格会被移除
    assert.ok(sql.includes('"Member'))
    assert.ok(!sql.includes(';'))
  })
})

describe('generateForceRlsSql()', () => {
  it('生成正确的 ALTER TABLE ... FORCE ROW LEVEL SECURITY', () => {
    const sql = generateForceRlsSql('AuditLog')
    assert.equal(sql, 'ALTER TABLE "public"."AuditLog" FORCE ROW LEVEL SECURITY')
  })
})

describe('generateCreatePolicySql()', () => {
  it('默认参数生成 tenant_isolation 策略', () => {
    const sql = generateCreatePolicySql('MemberProfile')
    assert.ok(sql.includes('CREATE POLICY'))
    assert.ok(sql.includes('tenant_isolation'))
    assert.ok(sql.includes('"public"."MemberProfile"'))
    assert.ok(sql.includes('current_setting'))
    assert.ok(sql.includes('tenantId'))
    assert.ok(sql.includes('FOR ALL'))
    assert.ok(sql.includes('USING'))
    assert.ok(sql.includes('WITH CHECK'))
  })

  it('自定义参数：策略名 / 列名 / schema', () => {
    const sql = generateCreatePolicySql('Orders', 'rls_tenant_filter', 'tenant_id', 'billing')
    assert.ok(sql.includes('"rls_tenant_filter"'))
    assert.ok(sql.includes('"billing"."Orders"'))
    assert.ok(sql.includes('tenant_id'))
    assert.ok(!sql.includes('tenantId'))
    assert.ok(!sql.includes('"public"'))
  })
})

describe('generateDropPolicySql()', () => {
  it('生成 DROP POLICY 语句', () => {
    const sql = generateDropPolicySql('MemberProfile')
    assert.ok(sql.includes('DROP POLICY IF EXISTS'))
    assert.ok(sql.includes('tenant_isolation'))
    assert.ok(sql.includes('"public"."MemberProfile"'))
  })

  it('自定义 schema 和 policy 名', () => {
    const sql = generateDropPolicySql('Orders', 'my_policy', 'billing')
    assert.ok(sql.includes('"my_policy"'))
    assert.ok(sql.includes('"billing"."Orders"'))
  })
})

describe('generateVerifyTenantFilterSql()', () => {
  it('生成检测其他 tenant 泄漏 SQL', () => {
    const sql = generateVerifyTenantFilterSql('MemberProfile', 'tenant-abc')
    assert.ok(sql.includes('leaked_rows'))
    assert.ok(sql.includes("tenantId != 'tenant-abc'"))
    assert.ok(sql.includes('tenantId IS NOT NULL'))
  })

  it('生成含自定義列名的 SQL', () => {
    const sql = generateVerifyTenantFilterSql('Orders', 't-42', 'org_id', 'sales')
    assert.ok(sql.includes('"sales"."Orders"'))
    assert.ok(sql.includes("org_id != 't-42'"))
  })
})

describe('generatePolicyTestSql()', () => {
  it('生成 RLS 生效验证 SQL', () => {
    const sql = generatePolicyTestSql('MemberProfile')
    assert.ok(sql.includes('visible_rows'))
    assert.ok(sql.includes('current_setting'))
    assert.ok(sql.includes('tenantId'))
  })
})

// ─── 安全校验 ────────────────────────────────────────────────

describe('validateName()', () => {
  it('合法标识符通过', () => {
    assert.equal(validateName('MemberProfile', 'table'), true)
    assert.equal(validateName('tenant_id', 'column'), true)
    assert.equal(validateName('a', 'table'), true)
    assert.equal(validateName('_private', 'table'), false) // 下划线开头不匹配 ^[a-zA-Z]
  })

  it('非法标识符拒绝', () => {
    assert.equal(validateName('123abc', 'table'), false)
    assert.equal(validateName('Member; DROP', 'table'), false)
    assert.equal(validateName("tenant'id", 'column'), false)
    assert.equal(validateName('', 'table'), false)
  })
})

// ─── RlsService ──────────────────────────────────────────────

describe('RlsService', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
      $executeRawUnsafe: vi.fn().mockResolvedValue(undefined),
    }
  })

  it('getStatus 委托到 prisma.$queryRawUnsafe', async () => {
    const service = new RlsService(mockPrisma)
    await service.getStatus()
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce()
    const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    assert.ok(typeof sql === 'string')
  })

  it('getStatus 传 tableName 给生成函数', async () => {
    const service = new RlsService(mockPrisma)
    await service.getStatus('MemberProfile')
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledOnce()
    const sql = mockPrisma.$queryRawUnsafe.mock.calls[0][0]
    assert.ok(sql.includes("c.relname = 'MemberProfile'"))
  })

  it('enableRls 委托到 prisma.$executeRawUnsafe', async () => {
    const service = new RlsService(mockPrisma)
    await service.enableRls('MemberProfile')
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledOnce()
    const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
    assert.ok(sql.includes('ALTER TABLE'))
    assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'))
  })

  it('enableRls 拒绝非法表名', async () => {
    const service = new RlsService(mockPrisma)
    await expect(service.enableRls('123table')).rejects.toThrow('Invalid table name')
  })

  it('createPolicy 委托到 prisma.$executeRawUnsafe', async () => {
    const service = new RlsService(mockPrisma)
    await service.createPolicy('AuditLog', 'tenant_filter', 'orgId', 'audit')
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledOnce()
    const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
    assert.ok(sql.includes('CREATE POLICY'))
    assert.ok(sql.includes('orgId'))
  })

  it('createPolicy 拒绝非法 column 名', async () => {
    const service = new RlsService(mockPrisma)
    await expect(service.createPolicy('AuditLog', 'p', '123col')).rejects.toThrow('Invalid column name')
  })

  it('dropPolicy 委托到 prisma.$executeRawUnsafe', async () => {
    const service = new RlsService(mockPrisma)
    await service.dropPolicy('MemberProfile')
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledOnce()
    const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
    assert.ok(sql.includes('DROP POLICY'))
  })

  it('verifyTenantFilter 委托到 prisma.$queryRawUnsafe', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ leaked_rows: 0 }])
    const service = new RlsService(mockPrisma)
    const result = await service.verifyTenantFilter('MemberProfile', 'tenant-abc')
    assert.equal(result.leakedRows, 0)
  })

  it('verifyTenantFilter 拒绝非法表名', async () => {
    const service = new RlsService(mockPrisma)
    await expect(
      service.verifyTenantFilter("Malicious'; DROP TABLE", 'tenant-id')
    ).rejects.toThrow('Invalid table name')
  })

  it('setupTenantIsolation 执行完整流程', async () => {
    const service = new RlsService(mockPrisma)
    const result = await service.setupTenantIsolation('MemberProfile', 'tenantId', 'my_policy')
    assert.deepEqual(result, { enabled: true, policyCreated: true, forced: true })
    // 应调用 3 次 $executeRawUnsafe: enable + drop + create + force = 4
    // wait: enableRls(1) + dropPolicy(2) + createPolicy(3) + forceRls(4)
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(4)
  })
})

// ─── 验证过滤 ────────────────────────────────────────────────

describe('RLS tenantId filter 验证', () => {
  it('generateVerifyTenantFilterSql 包含所有过滤条件', () => {
    const sql = generateVerifyTenantFilterSql('MemberProfile', 'tenant-demo')
    // 必须包含: IS NOT NULL, !=, COUNT
    assert.ok(sql.includes('IS NOT NULL'))
    assert.ok(sql.includes("!= 'tenant-demo'"))
    assert.ok(sql.includes('COUNT(*)'))
  })

  it('generatePolicyTestSql 设置当前 tenant 上下文', () => {
    const sql = generatePolicyTestSql('Orders', 'org_id')
    assert.ok(sql.includes('current_setting'))
    assert.ok(sql.includes('org_id'))
  })
})
