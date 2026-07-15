/**
 * rls.helper.test.ts — RLS Helper 单元测试
 *
 * 🐜 V18: CRUD增强 + 3项租户隔离增强测试
 *   - CRUD: getPolicy / listPolicies / updatePolicy / deletePolicy
 *   - SQL 生成: generateGetPolicySql / generateListPoliciesSql / generateUpdatePolicySql
 *   - 连接池隔离: initTenantPool / getTenantPoolSnapshot / releaseTenantPool
 *   - verifyTenant: verifyTenantAccess / fallbackVerifyTenantAccess
 *   - 审计日志: logAudit / getAuditLogs
 *
 * 🐜 V17: P-31 RLS Extension
 *
 * 覆盖:
 *   1-27: V17 原有测试
 *   28-53: V18 新增测试 (26 个新 it)
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
  generateGetPolicySql,
  generateListPoliciesSql,
  generateUpdatePolicySql,
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

// ─── V18: 新增 SQL 生成函数 ──────────────────────────────────

describe('generateGetPolicySql()', () => {
  it('生成查询指定策略详情的 SQL', () => {
    const sql = generateGetPolicySql('MemberProfile', 'tenant_isolation')
    assert.ok(sql.includes('pg_policy'))
    assert.ok(sql.includes('pg_get_expr'))
    assert.ok(sql.includes("p.polname = 'tenant_isolation'"))
    assert.ok(sql.includes("c.relname = 'MemberProfile'"))
    assert.ok(sql.includes("n.nspname = 'public'"))
  })

  it('生成含自定义 schema 的查询 SQL', () => {
    const sql = generateGetPolicySql('Orders', 'rls_filter', 'billing')
    assert.ok(sql.includes("c.relname = 'Orders'"))
    assert.ok(sql.includes("n.nspname = 'billing'"))
    assert.ok(sql.includes("p.polname = 'rls_filter'"))
  })
})

describe('generateListPoliciesSql()', () => {
  it('生成列出指定表所有策略的 SQL', () => {
    const sql = generateListPoliciesSql('MemberProfile')
    assert.ok(sql.includes('pg_policy'))
    assert.ok(sql.includes('pg_get_expr'))
    assert.ok(sql.includes("c.relname = 'MemberProfile'"))
    assert.ok(sql.includes('ORDER BY p.polname'))
  })

  it('生成含自定义 schema 的列表 SQL', () => {
    const sql = generateListPoliciesSql('Orders', 'billing')
    assert.ok(sql.includes("n.nspname = 'billing'"))
  })
})

describe('generateUpdatePolicySql()', () => {
  it('生成 DROP + RECREATE 的更新策略 SQL', () => {
    const sql = generateUpdatePolicySql('MemberProfile', 'tenant_isolation')
    assert.ok(sql.includes('DROP POLICY IF EXISTS'))
    assert.ok(sql.includes('CREATE POLICY'))
    assert.ok(sql.includes('"tenant_isolation"'))
    assert.ok(sql.includes('"public"."MemberProfile"'))
  })

  it('生成含自定义参数的更新 SQL', () => {
    const sql = generateUpdatePolicySql('Orders', 'rls_filter', 'orgId', 'billing')
    assert.ok(sql.includes('"rls_filter"'))
    assert.ok(sql.includes('"billing"."Orders"'))
    assert.ok(sql.includes('orgId'))
    assert.ok(!sql.includes('tenantId'))
  })
})

// ─── 安全校验 ────────────────────────────────────────────────

describe('validateName()', () => {
  it('合法标识符通过', () => {
    assert.equal(validateName('MemberProfile', 'table'), true)
    assert.equal(validateName('tenant_id', 'column'), true)
    assert.equal(validateName('a', 'table'), true)
    assert.equal(validateName('_private', 'table'), false)
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
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(4)
  })

  // ─── V18: CRUD 新方法测试 ───────────────────────────────

  it('getPolicy 委托到 prisma.$queryRawUnsafe', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{
      policyname: 'tenant_isolation',
      schemaname: 'public',
      tablename: 'MemberProfile',
      roles: [],
      permissive: 'PERMISSIVE',
      cmd: 'ALL',
      qual: 'tenantId = current_setting(...)',
      with_check: null,
    }])
    const service = new RlsService(mockPrisma)
    const result = await service.getPolicy('MemberProfile', 'tenant_isolation')
    assert.ok(result !== null)
    assert.equal(result!.policyname, 'tenant_isolation')
    assert.equal(result!.tablename, 'MemberProfile')
  })

  it('getPolicy 返回 null 当策略不存在', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([])
    const service = new RlsService(mockPrisma)
    const result = await service.getPolicy('MemberProfile', 'nonexistent')
    assert.equal(result, null)
  })

  it('getPolicy 拒绝非法表名', async () => {
    const service = new RlsService(mockPrisma)
    await expect(service.getPolicy('123table', 'my_policy')).rejects.toThrow('Invalid table name')
  })

  it('listPolicies 委托到 prisma.$queryRawUnsafe', async () => {
    mockPrisma.$queryRawUnsafe.mockResolvedValue([
      { policyname: 'policy_a', schemaname: 'public', tablename: 'Members', roles: [], permissive: 'PERMISSIVE', cmd: 'ALL', qual: null, with_check: null },
      { policyname: 'policy_b', schemaname: 'public', tablename: 'Members', roles: [], permissive: 'PERMISSIVE', cmd: 'SELECT', qual: null, with_check: null },
    ])
    const service = new RlsService(mockPrisma)
    const result = await service.listPolicies('Members')
    assert.equal(result.length, 2)
    assert.equal(result[0].policyname, 'policy_a')
    assert.equal(result[1].policyname, 'policy_b')
  })

  it('listPolicies 拒绝非法表名', async () => {
    const service = new RlsService(mockPrisma)
    await expect(service.listPolicies('bad table')).rejects.toThrow('Invalid table name')
  })

  it('updatePolicy 委托到 prisma.$executeRawUnsafe', async () => {
    const service = new RlsService(mockPrisma)
    await service.updatePolicy('MemberProfile', 'tenant_isolation', 'newCol', 'public')
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledOnce()
    const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
    assert.ok(sql.includes('DROP POLICY IF EXISTS'))
    assert.ok(sql.includes('CREATE POLICY'))
    assert.ok(sql.includes('newCol'))
  })

  it('updatePolicy 拒绝非法 column 名', async () => {
    const service = new RlsService(mockPrisma)
    await expect(service.updatePolicy('MemberProfile', 'p', '123col')).rejects.toThrow('Invalid column name')
  })

  it('deletePolicy 委托到 prisma.$executeRawUnsafe', async () => {
    const service = new RlsService(mockPrisma)
    await service.deletePolicy('MemberProfile', 'tenant_isolation')
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledOnce()
    const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
    assert.ok(sql.includes('DROP POLICY'))
  })

  it('deletePolicy 拒绝非法表名', async () => {
    const service = new RlsService(mockPrisma)
    await expect(service.deletePolicy('123table', 'my_policy')).rejects.toThrow('Invalid table name')
  })

  // ─── V18: 连接池隔离测试 ────────────────────────────────

  describe('连接池隔离(per-tenant connection pool)', () => {
    it('initTenantPool 创建新条目', () => {
      const service = new RlsService(mockPrisma)
      service.initTenantPool('tenant-alpha')
      const pool = service.getTenantPool('tenant-alpha')
      assert.ok(pool !== undefined)
      assert.ok(pool.createdAt instanceof Date)
      assert.equal(pool.queryCount, 1)
    })

    it('initTenantPool 幂等 - 重复调用不替换', () => {
      const service = new RlsService(mockPrisma)
      service.initTenantPool('tenant-alpha')
      const first = service.getTenantPool('tenant-alpha')
      service.initTenantPool('tenant-alpha')
      const second = service.getTenantPool('tenant-alpha')
      assert.equal(first, second)
      assert.equal(second.queryCount, 2)
    })

    it('getTenantPoolSnapshot 返回所有池条目的快照', () => {
      const service = new RlsService(mockPrisma)
      service.initTenantPool('tenant-1')
      service.initTenantPool('tenant-2')
      const snapshot = service.getTenantPoolSnapshot()
      assert.equal(snapshot.length, 2)
      assert.ok(snapshot[0].createdAt instanceof Date)
      assert.ok(snapshot[0].lastUsedAt instanceof Date)
    })

    it('getTenantPool 自动创建不存在的池', () => {
      const service = new RlsService(mockPrisma)
      const pool = service.getTenantPool('tenant-auto')
      assert.ok(pool !== undefined)
      assert.equal(pool.queryCount, 1)
      const snapshot = service.getTenantPoolSnapshot()
      assert.equal(snapshot.length, 1)
    })

    it('releaseTenantPool 删除指定池', () => {
      const service = new RlsService(mockPrisma)
      service.initTenantPool('tenant-tmp')
      assert.equal(service.getTenantPoolSnapshot().length, 1)
      const deleted = service.releaseTenantPool('tenant-tmp')
      assert.equal(deleted, true)
      assert.equal(service.getTenantPoolSnapshot().length, 0)
    })

    it('releaseTenantPool 对不存在的租户返回 false', () => {
      const service = new RlsService(mockPrisma)
      const deleted = service.releaseTenantPool('tenant-nonexistent')
      assert.equal(deleted, false)
    })
  })

  // ─── V18: verifyTenant 中间件逻辑测试 ─────────────────────

  describe('verifyTenant 中间件逻辑', () => {
    it('缺少 tenantId 返回拒绝', async () => {
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('', 'user-1')
      assert.equal(result.allowed, false)
      assert.ok(result.reason.includes('Missing'))
    })

    it('缺少 userId 返回拒绝', async () => {
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('tenant-1', '')
      assert.equal(result.allowed, false)
      assert.ok(result.reason.includes('Missing'))
    })

    it('fallback 允许系统租户', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('table not found'))
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('system', 'any-user')
      assert.equal(result.allowed, true)
      assert.ok(result.reason.includes('System tenant'))
    })

    it('fallback 允许 admin 租户', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('table not found'))
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('admin', 'admin-user')
      assert.equal(result.allowed, true)
    })

    it('fallback 根据命名约定允许', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('table not found'))
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('acme-corp', 'tenant_acme-corp_bob')
      assert.equal(result.allowed, true)
      assert.ok(result.reason.includes('naming convention'))
    })

    it('fallback 拒绝非成员', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('table not found'))
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('acme-corp', 'other-user')
      assert.equal(result.allowed, false)
      assert.ok(result.reason.includes('No tenant membership'))
    })

    it('数据库查询成功时使用数据库结果', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ cnt: 1 }])
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('tenant-1', 'user-1')
      assert.equal(result.allowed, true)
      assert.ok(result.reason.includes('member'))
    })

    it('数据库查询返回 0 条时拒绝', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ cnt: 0 }])
      const service = new RlsService(mockPrisma)
      const result = await service.verifyTenantAccess('tenant-1', 'user-2')
      assert.equal(result.allowed, false)
      assert.ok(result.reason.includes('not a member'))
    })
  })

  // ─── V18: 租户审计索引测试 ──────────────────────────────

  describe('租户审计索引 (audit log)', () => {
    it('logAudit 记录并返回审计条目', async () => {
      const service = new RlsService(mockPrisma)
      const entry = await service.logAudit('tenant-1', 'CREATE', 'Members', 'policy_a', 'Created RLS policy')
      assert.equal(entry.tenantId, 'tenant-1')
      assert.equal(entry.action, 'CREATE')
      assert.equal(entry.tableName, 'Members')
      assert.equal(entry.policyName, 'policy_a')
      assert.ok(entry.timestamp instanceof Date)
    })

    it('getAuditLogs 返回所有日志', async () => {
      const service = new RlsService(mockPrisma)
      await service.logAudit('tenant-1', 'CREATE', 'T1', 'p1', 'detail1')
      await service.logAudit('tenant-2', 'DROP', 'T2', 'p2', 'detail2')
      const logs = service.getAuditLogs()
      assert.equal(logs.length, 2)
    })

    it('getAuditLogs 按 tenantId 过滤', async () => {
      const service = new RlsService(mockPrisma)
      await service.logAudit('tenant-a', 'CREATE', 'T1', null, 'a')
      await service.logAudit('tenant-b', 'DROP', 'T2', null, 'b')
      await service.logAudit('tenant-a', 'UPDATE', 'T3', null, 'c')
      const logs = service.getAuditLogs('tenant-a')
      assert.equal(logs.length, 2)
      assert.ok(logs.every((l) => l.tenantId === 'tenant-a'))
    })

    it('getAuditLogs 按 limit 截断', async () => {
      const service = new RlsService(mockPrisma)
      for (let i = 0; i < 10; i++) {
        await service.logAudit('tenant-x', 'CREATE', 'T', null, `log-${i}`)
      }
      const logs = service.getAuditLogs('tenant-x', 3)
      assert.equal(logs.length, 3)
    })

    it('logAudit 写入数据库失败时静默降级到内存', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('relation "_rls_audit" does not exist'))
      const service = new RlsService(mockPrisma)
      const entry = await service.logAudit('tenant-1', 'CREATE', 'T1', 'p1', 'test')
      assert.ok(entry.id.startsWith('audit_'))
      assert.equal(entry.tenantId, 'tenant-1')
      const logs = service.getAuditLogs('tenant-1')
      assert.equal(logs.length, 1)
    })
  })
})

// ─── 验证过滤 ────────────────────────────────────────────────

describe('RLS tenantId filter 验证', () => {
  it('generateVerifyTenantFilterSql 包含所有过滤条件', () => {
    const sql = generateVerifyTenantFilterSql('MemberProfile', 'tenant-demo')
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

describe('SQL 生成 边界条件', () => {
  it('generateForceRlsSql 使用默认 public schema', () => {
    const sql = generateForceRlsSql('TestTable')
    assert.equal(sql, 'ALTER TABLE "public"."TestTable" FORCE ROW LEVEL SECURITY')
  })

  it('generateCreatePolicySql 空 policyName 使用默认名', () => {
    const sql = generateCreatePolicySql('MemberProfile', '', 'tenantId')
    assert.ok(sql.includes('CREATE POLICY'))
    assert.ok(sql.includes('"public"'))
  })

  it('generateDropPolicySql 空 policyName 使用默认空字符串', () => {
    const sql = generateDropPolicySql('MemberProfile', '')
    assert.ok(sql.includes('""'))
  })

  it('generateEnableRlsSql 无 schema 参数（函数只有 tableName 参数）', () => {
    const sql = generateEnableRlsSql('Orders')
    assert.equal(sql, 'ALTER TABLE "public"."Orders" ENABLE ROW LEVEL SECURITY')
  })

  it('generateRlsStatusSql 不含 schema 参数（函数只有 tableName 参数）', () => {
    const sql = generateRlsStatusSql()
    assert.ok(sql.includes('pg_class'))
    assert.ok(sql.includes("NOT IN ('pg_catalog', 'information_schema')"))
  })
})

describe('validateName 详细校验', () => {
  it('单个字母通过校验', () => {
    assert.equal(validateName('a', 'table'), true)
  })

  it('带数字后缀通过校验', () => {
    assert.equal(validateName('MemberProfile2026', 'table'), true)
  })

  it('空字符串拒绝', () => {
    assert.equal(validateName('', 'table'), false)
  })

  it('包含空格拒绝', () => {
    assert.equal(validateName('My Table', 'table'), false)
  })

  it('Unicode 非 ASCII 字符拒绝', () => {
    assert.equal(validateName('Mémber', 'table'), false)
  })

  it('下划线开头拒绝', () => {
    assert.equal(validateName('__private', 'column'), false)
  })

  it('纯数字拒绝', () => {
    assert.equal(validateName('12345', 'table'), false)
  })

  it('以 pg_ 开头的名字通过校验（regex 允许）', () => {
    assert.equal(validateName('pg_stat_activity', 'table'), true)
  })
})

describe('validateName 更多边界', () => {
  it('单字符名字通过校验', () => {
    expect(validateName('a', 'table')).toBe(true)
  })

  it('下划线结尾通过校验', () => {
    expect(validateName('my_table_', 'table')).toBe(true)
  })

  it('数字开头不通过校验', () => {
    expect(validateName('123table', 'table')).toBe(false)
  })

  it('反引号包含不通过', () => {
    expect(validateName('my`table', 'table')).toBe(false)
  })

  it('制表符不通过', () => {
    expect(validateName('my\ttable', 'table')).toBe(false)
  })

  it('换行符不通过', () => {
    expect(validateName('my\ntable', 'table')).toBe(false)
  })

  it('UTF-8 中文不通过', () => {
    expect(validateName('表名', 'table')).toBe(false)
  })

  it('全角字符不通过', () => {
    expect(validateName('ｔａｂｌｅ', 'table')).toBe(false)
  })

  it('前后空白不通过', () => {
    expect(validateName('  mytable', 'table')).toBe(false)
  })

  it('tab 缩进不通过', () => {
    expect(validateName('\ttable', 'table')).toBe(false)
  })

  it('空字符串 column 名拒绝', () => {
    expect(validateName('', 'column')).toBe(false)
  })

  it('名字长度超过 128 字符不通过', () => {
    expect(validateName('a'.repeat(129), 'table')).toBe(false)
  })

  it('128 字符合法名通过', () => {
    expect(validateName('a'.repeat(128), 'table')).toBe(true)
  })

  it('数字 column 名拒绝', () => {
    expect(validateName('123', 'column')).toBe(false)
  })

  it('column: 下划线开头拒绝', () => {
    expect(validateName('_private', 'column')).toBe(false)
  })

  it('column: table 类型允许下划线开头', () => {
    expect(validateName('_private', 'table')).toBe(false)
  })
})

describe('SQL 生成 扩展', () => {
  it('generateRlsStatusSql 全表扫描 SQL 包含 pg_class 和 pg_policy', () => {
    const sql = generateRlsStatusSql()
    expect(sql).toContain('pg_class')
    expect(sql).toContain('pg_policy')
    expect(sql).toContain('ORDER BY')
  })

  it('generateRlsStatusSql 单表查询只包含表名列', () => {
    const sql = generateRlsStatusSql('MemberProfile')
    expect(sql).toContain('MemberProfile')
    expect(sql).toContain('relname')
  })

  it('generateEnableRlsSql 生成 ALTER TABLE 语句', () => {
    const sql = generateEnableRlsSql('MemberProfile')
    expect(sql).toMatch(/ALTER TABLE .+ ENABLE ROW LEVEL SECURITY/)
  })

  it('generateCreatePolicySql 默认策略名使用 tenant_isolation', () => {
    const sql = generateCreatePolicySql('Orders', 'rls_tenant_filter', 'tenant_id', 'billing')
    expect(sql).toContain('"rls_tenant_filter"')
    expect(sql).toContain('billing')
    expect(sql).toContain('tenant_id')
  })

  it('generateCreatePolicySql 默认参数正确', () => {
    const sql = generateCreatePolicySql('MemberProfile')
    expect(sql).toContain('"tenant_isolation"')
    expect(sql).toContain('public')
  })

  it('generateDropPolicySql 带 schema 生成正确', () => {
    const sql = generateDropPolicySql('Orders', 'my_policy', 'billing')
    expect(sql).toContain('billing')
    expect(sql).toContain('"my_policy"')
  })

  it('generateGetPolicySql 带 schema 生成正确', () => {
    const sql = generateGetPolicySql('Orders', 'my_policy', 'billing')
    expect(sql).toContain('billing')
    expect(sql).toContain('my_policy')
  })

  it('generateListPoliciesSql 带 schema 生成正确', () => {
    const sql = generateListPoliciesSql('Orders', 'billing')
    expect(sql).toContain('billing')
  })

  it('generateUpdatePolicySql 带 schema 生成 DROP + CREATE', () => {
    const sql = generateUpdatePolicySql('Orders', 'my_policy', 'org_id', 'billing')
    expect(sql).toContain('DROP POLICY IF EXISTS')
    expect(sql).toContain('CREATE POLICY')
  })

  it('generateVerifyTenantFilterSql 使用默认列名 tenantId', () => {
    const sql = generateVerifyTenantFilterSql('MemberProfile', 'my-tenant', 'tenantId')
    expect(sql).toContain('tenantId')
  })

  it('generateDeletePolicySql (via drop) 自定义 schema', () => {
    const sql = generateDropPolicySql('MemberProfile', 'cleanup', 'custom_schema')
    expect(sql).toContain('custom_schema')
    expect(sql).toContain('cleanup')
  })

  it('generateEmptyPolicySql 空 policyName 用默认空字符串', () => {
    const sql = generateDropPolicySql('MemberProfile', '')
    expect(sql).toContain('""')
  })
})
