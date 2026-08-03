/**
 * rls.service.test.ts
 * 圈梁五道箍: RlsService 单元测试
 * 覆盖: 正常路径4+ / 边界条件4+ / 错误处理4+ / 空值/空数组3+ / 并发/时序3+
 *
 * 注意: RlsService 依赖 prisma（作为 any 注入），所有数据库交互都 mock 掉。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RlsService, validateName } from './rls.helper'
import { generateRlsStatusSql, generateCreatePolicySql, generateEnableRlsSql, generateUpdatePolicySql } from './rls.helper'

// ─── Mock Prisma ────────────────────────────────────────────────

const mockPrisma = {
  $executeRawUnsafe: vi.fn(),
  $queryRawUnsafe: vi.fn(),
}

describe('RlsService', () => {
  let service: RlsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new RlsService(mockPrisma as any)
  })

  // ================================================================
  // 正常路径 (4 cases)
  // ================================================================

  describe('正常路径', () => {
    it('initTenantPool 应该初始化一个租户连接池', () => {
      service.initTenantPool('tenant-alpha')
      const snap = service.getTenantPoolSnapshot()
      expect(snap).toHaveLength(1)
      expect(snap[0].tenantId).toBe('tenant-alpha')
      expect(snap[0].queryCount).toBe(0)
    })

    it('getTenantPool 应该自动创建未初始化的池', () => {
      const pool = service.getTenantPool('tenant-beta')
      expect(pool.queryCount).toBe(1) // getTenantPool 触发 queryCount++
      const snap = service.getTenantPoolSnapshot()
      expect(snap).toHaveLength(1)
      expect(snap[0].tenantId).toBe('tenant-beta')
    })

    it('releaseTenantPool 应该释放指定租户连接池', () => {
      service.initTenantPool('t1')
      service.initTenantPool('t2')
      expect(service.getTenantPoolSnapshot()).toHaveLength(2)
      const released = service.releaseTenantPool('t1')
      expect(released).toBe(true)
      expect(service.getTenantPoolSnapshot()).toHaveLength(1)
    })

    it('buildTenantFilter 应该生成正确的 WHERE 子句', () => {
      const filter = service.buildTenantFilter('tenant-abc')
      expect(filter).toBe(`"tenantId" = 'tenant-abc'`)
    })

    it('buildTenantFilter 带别名应该生成带别名的子句', () => {
      const filter = service.buildTenantFilter('t-xyz', 'm')
      expect(filter).toBe(`"m"."tenantId" = 't-xyz'`)
    })

    it('buildTenantFilter 自定义列名应该使用指定列', () => {
      const filter = service.buildTenantFilter('t-env', undefined, 'org_id')
      expect(filter).toBe(`"org_id" = 't-env'`)
    })
  })

  // ================================================================
  // 边界条件 (4 cases)
  // ================================================================

  describe('边界条件', () => {
    it('initTenantPool 重复调用不应该覆盖已存在的池', () => {
      service.initTenantPool('tenant-double')
      service.initTenantPool('tenant-double') // 再次调用
      const snap = service.getTenantPoolSnapshot()
      expect(snap).toHaveLength(1)
    })

    it('releaseTenantPool 不存在的租户应该返回 false', () => {
      const released = service.releaseTenantPool('nonexistent')
      expect(released).toBe(false)
    })

    it('getTenantPoolSnapshot 当无租户时应该返回空数组', () => {
      expect(service.getTenantPoolSnapshot()).toEqual([])
    })

    it('listTenantPools 应该返回排序后的快照', () => {
      service.initTenantPool('z-tenant')
      service.initTenantPool('a-tenant')
      const pools = service.listTenantPools()
      expect(pools[0].tenantId).toBe('a-tenant')
      expect(pools[1].tenantId).toBe('z-tenant')
    })
  })

  // ================================================================
  // 错误处理 (4 cases)
  // ================================================================

  describe('错误处理', () => {
    it('verifyTenantAccess 空 tenantId 应该拒绝', async () => {
      const result = await service.verifyTenantAccess('', 'user1')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Missing')
    })

    it('verifyTenantAccess 空 userId 应该拒绝', async () => {
      const result = await service.verifyTenantAccess('t1', '')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Missing')
    })

    it('verifyTenantAccess 当 prisma 查询失败时回退到命名规则', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('Table not found'))
      const result = await service.verifyTenantAccess('t1', 'tenant_t1_user1')
      expect(result.allowed).toBe(true)
      expect(result.reason).toContain('naming convention')
    })

    it('enableRls 不合法的表名应该抛出错误', async () => {
      await expect(service.enableRls('orders; DROP TABLE users;')).rejects.toThrow('Invalid table name')
    })
  })

  // ================================================================
  // 空值/空数组 (3 cases)
  // ================================================================

  describe('空值/空数组', () => {
    it('getAuditLogs 无日志时应该返回空数组', () => {
      const logs = service.getAuditLogs()
      expect(logs).toEqual([])
    })

    it('getAuditLogs 按 tenantId 过滤无匹配时返回空数组', async () => {
      await service.logAudit('tenant-a', 'CREATE', 'users', null, 'create policy')
      const logs = service.getAuditLogs('tenant-b')
      expect(logs).toEqual([])
    })

    it('releaseTenantPool 删除不存在的租户连接池不应报错', () => {
      // 不应该抛出异常，返回 false
      const result = service.releaseTenantPool('non-existent-tenant')
      expect(result).toBe(false)
    })
  })

  // ================================================================
  // 并发/时序 (3 cases)
  // ================================================================

  describe('并发/时序', () => {
    it('多次 logAudit 应该累积审计日志', async () => {
      await service.logAudit('t1', 'CREATE', 'users', 'p1', 'created')
      await service.logAudit('t1', 'DROP', 'orders', null, 'dropped')
      await service.logAudit('t2', 'ALTER', 'items', 'p2', 'altered')

      const allLogs = service.getAuditLogs()
      expect(allLogs).toHaveLength(3)
    })

    it('getAuditLogs 按 tenantId 过滤应该只返回匹配日志', async () => {
      await service.logAudit('ta', 'CREATE', 'a', null, 'create a')
      await service.logAudit('tb', 'CREATE', 'b', null, 'create b')
      const logsA = service.getAuditLogs('ta')
      expect(logsA).toHaveLength(1)
      expect(logsA[0].tableName).toBe('a')
    })

    it('getTenantPool 应该在每次调用时递增 queryCount', () => {
      service.getTenantPool('pool1')
      expect(service.getTenantPool('pool1').queryCount).toBe(2)
      expect(service.getTenantPool('pool1').queryCount).toBe(3)
      expect(service.getTenantPool('pool1').queryCount).toBe(4)
    })
  })

  // ================================================================
  // validateName 辅助函数
  // ================================================================

  describe('validateName', () => {
    it('合法表名应该返回 true', () => {
      expect(validateName('users', 'table')).toBe(true)
      expect(validateName('orders_2024', 'table')).toBe(true)
    })

    it('含特殊字符的表名应该返回 false', () => {
      expect(validateName("users'; DROP", 'table')).toBe(false)
      expect(validateName('', 'table')).toBe(false)
    })

    it('合法列名应该返回 true', () => {
      expect(validateName('tenantId', 'column')).toBe(true)
      expect(validateName('org_id_1', 'column')).toBe(true)
    })

    it('以数字开头的列名应该返回 false', () => {
      expect(validateName('1tenant', 'column')).toBe(false)
      expect(validateName('123', 'column')).toBe(false)
    })
  })
})

// ================================================================
// 纯函数 SQL 生成器测试 (不依赖 service 实例)
// ================================================================

describe('RLS SQL 生成器 (纯函数)', () => {
  describe('generateRlsStatusSql', () => {
    it('不传参数应该生成查询所有表的 SQL', () => {
      const sql = generateRlsStatusSql()
      expect(sql).toContain('pg_class')
      expect(sql).toContain('pg_namespace')
      // 不应有 WHERE c.relname = 条件
      expect(sql.match(/WHERE c\.relname =/g)).toBeNull()
    })

    it('传表名应该生成对应表的查询', () => {
      const sql = generateRlsStatusSql('orders')
      expect(sql).toContain("c.relname = 'orders'")
    })
  })

  describe('generateEnableRlsSql', () => {
    it('应该生成正确的 ALTER TABLE 语句', () => {
      const sql = generateEnableRlsSql('users')
      expect(sql).toContain('ALTER TABLE')
      expect(sql).toContain('"public"."users"')
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY')
    })
  })

  describe('generateCreatePolicySql', () => {
    it('默认参数应该生成正确的策略 SQL', () => {
      const sql = generateCreatePolicySql('orders')
      expect(sql).toContain('CREATE POLICY')
      expect(sql).toContain('"tenant_isolation"')
      expect(sql).toContain('"public"."orders"')
      expect(sql).toContain('tenantId')
      expect(sql).toContain("current_setting('app.tenant_id')")
    })

    it('自定义参数应该使用指定值', () => {
      const sql = generateCreatePolicySql('items', 'org_isolation', 'org_id', 'billing')
      expect(sql).toContain('"org_isolation"')
      expect(sql).toContain('"billing"."items"')
      expect(sql).toContain('org_id')
    })
  })

  describe('generateUpdatePolicySql', () => {
    it('应该生成 DROP + CREATE 组合', () => {
      const sql = generateUpdatePolicySql('orders', 'tenant_isolation')
      expect(sql).toContain('DROP POLICY IF EXISTS')
      expect(sql).toContain('CREATE POLICY')
    })
  })

  describe('validateName', () => {
    it('含空格的表名不合法', () => {
      expect(validateName('my table', 'table')).toBe(false)
    })

    it('超长名称不合法', () => {
      const longName = 'a'.repeat(200)
      expect(validateName(longName, 'table')).toBe(false)
    })
  })
})
