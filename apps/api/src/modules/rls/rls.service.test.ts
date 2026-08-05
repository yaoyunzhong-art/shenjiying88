/**
 * rls.service.spec.ts — RLS Row-Level Security Service 单元测试
 *
 * 覆盖:
 *   租户连接池管理     — initTenantPool / getTenantPool / releaseTenantPool / snapshot
 *   RLS CRUD 操作     — enableRls / forceRls / createPolicy / getPolicy / listPolicies
 *                       updatePolicy / dropPolicy / deletePolicy / setupTenantIsolation
 *   tenantId 过滤      — buildTenantFilter / tenantAwareQuery / withTenant / setTenantContext
 *   审计日志           — logAudit / getAuditLogs
 *   多租户验证         — verifyTenantAccess / verifyTenantFilter / verifyMultitenantStatus
 *   校验工具           — validateName
 *   异常场景           — 非法表名/列名 / 空参数 / prisma 查询失败
 *
 * Mock: prisma.$executeRawUnsafe / $queryRawUnsafe
 * 原则: 无 as any (除 prisma mock) · 无 ts-ignore · 无 describe.skip · 无 it.only
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RlsService, validateName } from './rls.helper'
import {
  generateRlsStatusSql,
  generateEnableRlsSql,
  generateForceRlsSql,
  generateCreatePolicySql,
  generateGetPolicySql,
  generateListPoliciesSql,
  generateUpdatePolicySql,
  generateDropPolicySql,
} from './rls.helper'

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

  // ═══════════════════════════════════════════════════════════════
  //  租户连接池管理
  // ═══════════════════════════════════════════════════════════════

  describe('租户连接池', () => {
    it('initTenantPool 应初始化新池', () => {
      service.initTenantPool('tenant-alpha')
      const snap = service.getTenantPoolSnapshot()
      expect(snap).toHaveLength(1)
      expect(snap[0].tenantId).toBe('tenant-alpha')
      expect(snap[0].queryCount).toBe(0)
    })

    it('getTenantPool 应自动创建未初始化的池', () => {
      const pool = service.getTenantPool('tenant-beta')
      expect(pool.queryCount).toBe(1) // getTenantPool 触发 queryCount++
      expect(service.getTenantPoolSnapshot()).toHaveLength(1)
    })

    it('releaseTenantPool 应释放指定池', () => {
      service.initTenantPool('t1')
      service.initTenantPool('t2')
      expect(service.getTenantPoolSnapshot()).toHaveLength(2)
      const released = service.releaseTenantPool('t1')
      expect(released).toBe(true)
      expect(service.getTenantPoolSnapshot()).toHaveLength(1)
    })

    it('releaseTenantPool 不存在的租户应返回 false', () => {
      expect(service.releaseTenantPool('nonexist')).toBe(false)
    })

    it('getTenantPoolSnapshot 无租户时应返回空数组', () => {
      expect(service.getTenantPoolSnapshot()).toEqual([])
    })

    it('listTenantPools 应返回排序后的快照', () => {
      service.initTenantPool('z-pool')
      service.initTenantPool('a-pool')
      const pools = service.listTenantPools()
      expect(pools[0].tenantId).toBe('a-pool')
      expect(pools).toHaveLength(2)
    })

    it('getTenantPool 应在每次调用时递增 queryCount', () => {
      service.getTenantPool('t1')
      service.getTenantPool('t1')
      service.getTenantPool('t1')
      const pool = service.getTenantPool('t1')
      expect(pool.queryCount).toBe(4) // 1(init) + 3 gets
    })

    it('initTenantPool 重复调用不应覆盖', () => {
      service.initTenantPool('t1')
      const pool1 = service.getTenantPool('t1')
      const count1 = pool1.queryCount
      service.initTenantPool('t1') // 重复
      const pool2 = service.getTenantPool('t1')
      expect(pool2.queryCount).toBe(count1 + 1) // queryCount 只增不减
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  buildTenantFilter
  // ═══════════════════════════════════════════════════════════════

  describe('buildTenantFilter', () => {
    it('应生成正确的 WHERE 子句', () => {
      const filter = service.buildTenantFilter('tenant-abc')
      expect(filter).toBe(`"tenantId" = 'tenant-abc'`)
    })

    it('带别名应生成带别名的子句', () => {
      const filter = service.buildTenantFilter('tenant-abc', 'm')
      expect(filter).toBe(`"m"."tenantId" = 'tenant-abc'`)
    })

    it('自定义列名应使用指定列', () => {
      const filter = service.buildTenantFilter('t1', undefined, 'orgId')
      expect(filter).toBe(`"orgId" = 't1'`)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  RLS CRUD 操作
  // ═══════════════════════════════════════════════════════════════

  describe('RLS CRUD', () => {
    it('enableRls 应调用 prisma.$executeRawUnsafe', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      await service.enableRls('users')
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
      const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
      expect(sql).toContain('ALTER TABLE')
      expect(sql).toContain('users')
    })

    it('enableRls 非法表名应抛异常', async () => {
      await expect(service.enableRls('invalid table!')).rejects.toThrow('Invalid table name')
    })

    it('forceRls 应调用 prisma.$executeRawUnsafe', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      await service.forceRls('orders')
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
      const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
      expect(sql).toContain('FORCE ROW LEVEL SECURITY')
      expect(sql).toContain('orders')
    })

    it('forceRls 非法表名应抛异常', async () => {
      await expect(service.forceRls('')).rejects.toThrow('Invalid table name')
    })

    it('createPolicy 应生成正确的 CREATE POLICY SQL', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      await service.createPolicy('users', 'tenant_isolation', 'tenantId', 'public')
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
      const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
      expect(sql).toContain('CREATE POLICY')
      expect(sql).toContain('tenant_isolation')
    })

    it('createPolicy 非法列名应抛异常', async () => {
      await expect(service.createPolicy('users', 'policy', 'invalid column!')).rejects.toThrow('Invalid column name')
    })

    it('getPolicy 应返回策略信息', async () => {
      const mockPolicy = { policyname: 'tenant_isolation', schemaname: 'public', tablename: 'users', roles: ['public'], permissive: 'PERMISSIVE', cmd: 'ALL', qual: '(tenant_id = current_setting(...))', with_check: null }
      mockPrisma.$queryRawUnsafe.mockResolvedValue([mockPolicy])
      const result = await service.getPolicy('users', 'tenant_isolation')
      expect(result).not.toBeNull()
      expect(result!.policyname).toBe('tenant_isolation')
    })

    it('getPolicy 不存在应返回 null', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([])
      const result = await service.getPolicy('users', 'nonexist')
      expect(result).toBeNull()
    })

    it('getPolicy 非法表名应抛异常', async () => {
      await expect(service.getPolicy('invalid!', 'p')).rejects.toThrow('Invalid table name')
    })

    it('listPolicies 应返回策略列表', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { policyname: 'p1' },
        { policyname: 'p2' },
      ] as any[])
      const result = await service.listPolicies('users')
      expect(result).toHaveLength(2)
    })

    it('listPolicies 非法表名应抛异常', async () => {
      await expect(service.listPolicies('')).rejects.toThrow('Invalid table name')
    })

    it('updatePolicy 应生成 DROP + CREATE SQL', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      await service.updatePolicy('users', 'tenant_isolation', 'orgId', 'public')
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
      const sql = mockPrisma.$executeRawUnsafe.mock.calls[0][0]
      expect(sql).toContain('DROP POLICY')
      expect(sql).toContain('CREATE POLICY')
    })

    it('dropPolicy 应调用 prisma.$executeRawUnsafe', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      await service.dropPolicy('users', 'tenant_isolation')
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
    })

    it('deletePolicy 是 dropPolicy 的别名', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      await service.deletePolicy('users', 'tenant_isolation')
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(1)
    })

    it('setupTenantIsolation 一键设置', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      const result = await service.setupTenantIsolation('orders', 'orgId', 'custom_policy', 'public')
      expect(result.enabled).toBe(true)
      expect(result.policyCreated).toBe(true)
      expect(result.forced).toBe(true)
      // enableRls + dropPolicy + createPolicy + forceRls
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled()
    })

    it('getStatus 应调用 prisma.$queryRawUnsafe', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { schemaname: 'public', tablename: 'users', rowsecurity: true, forcerowsecurity: true, policyname: 'tenant_isolation' },
      ])
      const result = await service.getStatus('users')
      expect(result).toHaveLength(1)
      expect(result[0].rlsEnabled).toBe(true)
      expect(result[0].forceRls).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  tenant 上下文与隔离查询
  // ═══════════════════════════════════════════════════════════════

  describe('tenant 上下文与隔离查询', () => {
    it('setTenantContext 应调用 prisma set_config', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      await service.setTenantContext('tenant-abc')
      const calls = mockPrisma.$executeRawUnsafe.mock.calls
      const calls2: unknown[][] = mockPrisma.$executeRawUnsafe.mock.calls
      const configCall = calls2.find((c) => c[0] && (c[0] as string).includes('set_config'))
      expect(configCall).toBeTruthy()
      expect((configCall![0] as string)).toContain('tenant-abc')
    })

    it('tenantAwareQuery 应设置上下文后执行查询', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 1 }])
      const result = await service.tenantAwareQuery('SELECT * FROM users', 't1')
      expect(result).toHaveLength(1)
      // 应调用两次 $executeRawUnsafe (set_config + audit) 和一次 $queryRawUnsafe
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled()
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT * FROM users')
    })

    it('withTenant 应在 tenant 上下文中执行回调', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(undefined)
      const fn = vi.fn().mockResolvedValue('done')
      const result = await service.withTenant('t1', fn)
      expect(result).toBe('done')
      expect(fn).toHaveBeenCalledWith('t1')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  审计日志
  // ═══════════════════════════════════════════════════════════════

  describe('审计日志', () => {
    it('logAudit 应创建审计条目', async () => {
      // 让数据库写入失败，回退到内存
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('table not found'))
      const entry = await service.logAudit('t1', 'CREATE', 'users', 'p1', 'created policy')
      expect(entry.tenantId).toBe('t1')
      expect(entry.action).toBe('CREATE')
      expect(entry.tableName).toBe('users')
    })

    it('getAuditLogs 无日志时应返回空数组', () => {
      expect(service.getAuditLogs()).toEqual([])
    })

    it('多次 logAudit 应累积审计日志', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('table not found'))
      await service.logAudit('t1', 'CREATE', 'users', 'p1', 'created')
      await service.logAudit('t1', 'DROP', 'orders', null, 'dropped')
      await service.logAudit('t2', 'ALTER', 'items', 'p2', 'altered')
      expect(service.getAuditLogs()).toHaveLength(3)
    })

    it('getAuditLogs 按 tenantId 过滤', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('table not found'))
      await service.logAudit('ta', 'CREATE', 'a', null, 'create a')
      await service.logAudit('tb', 'CREATE', 'b', null, 'create b')
      const logs = service.getAuditLogs('ta')
      expect(logs).toHaveLength(1)
      expect(logs[0].tenantId).toBe('ta')
    })

    it('getAuditLogs 支持 limit 参数', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('table not found'))
      for (let i = 0; i < 10; i++) {
        await service.logAudit('t1', 'CREATE', 't', null, `entry ${i}`)
      }
      expect(service.getAuditLogs(undefined, 3)).toHaveLength(3)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  verifyTenantAccess
  // ═══════════════════════════════════════════════════════════════

  describe('verifyTenantAccess', () => {
    it('空 tenantId 应拒绝', async () => {
      const result = await service.verifyTenantAccess('', 'u1')
      expect(result.allowed).toBe(false)
    })

    it('空 userId 应拒绝', async () => {
      const result = await service.verifyTenantAccess('t1', '')
      expect(result.allowed).toBe(false)
    })

    it('当 prisma 查询成功且匹配应允许', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ cnt: 1 }])
      const result = await service.verifyTenantAccess('t1', 'u1')
      expect(result.allowed).toBe(true)
    })

    it('当 prisma 查询成功但不匹配应拒绝', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ cnt: 0 }])
      const result = await service.verifyTenantAccess('t1', 'u1')
      expect(result.allowed).toBe(false)
    })

    it('当 prisma 查询失败应回退到命名规则', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('table not found'))
      const result = await service.verifyTenantAccess('t1', 'tenant_t1_user')
      expect(result.allowed).toBe(true)
    })

    it('回退规则: 系统租户始终允许', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('table not found'))
      const result = await service.verifyTenantAccess('system', 'anyone')
      expect(result.allowed).toBe(true)
    })

    it('回退规则: 不匹配命名约定的拒绝', async () => {
      mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('table not found'))
      const result = await service.verifyTenantAccess('t1', 'stranger')
      expect(result.allowed).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  verifyTenantFilter / verifyMultitenantStatus
  // ═══════════════════════════════════════════════════════════════

  describe('多租户验证', () => {
    it('verifyTenantFilter 应返回泄露行数', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ leaked_rows: 0 }])
      const result = await service.verifyTenantFilter('users', 't1')
      expect(result.leakedRows).toBe(0)
    })

    it('verifyTenantFilter 非法表名应抛异常', async () => {
      await expect(service.verifyTenantFilter('bad name!', 't1')).rejects.toThrow('Invalid table name')
    })

    it('verifyMultitenantStatus 应返回验证报告', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { table_name: 'users', schema_name: 'public', has_tenant_id: true },
        { table_name: 'orders', schema_name: 'public', has_tenant_id: true },
      ])
      const result = await service.verifyMultitenantStatus()
      expect(result.isolated).toBe(true)
      expect(result.totalTables).toBe(2)
      expect(result.missingTenantIdTables).toEqual([])
    })

    it('verifyMultitenantStatus 应报告缺失 tenantId 的表', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { table_name: 'users', schema_name: 'public', has_tenant_id: true },
        { table_name: 'legacy', schema_name: 'public', has_tenant_id: false },
      ])
      const result = await service.verifyMultitenantStatus()
      expect(result.isolated).toBe(false)
      expect(result.missingTenantIdTables).toContain('public.legacy')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  validateName 工具函数
  // ═══════════════════════════════════════════════════════════════

  describe('validateName', () => {
    it('合法表名应返回 true', () => {
      expect(validateName('users', 'table')).toBe(true)
      expect(validateName('user_profiles', 'table')).toBe(true)
    })

    it('含特殊字符的表名应返回 false', () => {
      expect(validateName('users!', 'table')).toBe(false)
      expect(validateName('user table', 'table')).toBe(false)
    })

    it('合法列名应返回 true', () => {
      expect(validateName('tenant_id', 'column')).toBe(true)
      expect(validateName('orgId', 'column')).toBe(true)
    })

    it('以数字开头的列名应返回 false', () => {
      expect(validateName('1column', 'column')).toBe(false)
    })

    it('空字符串应返回 false', () => {
      expect(validateName('', 'table')).toBe(false)
      expect(validateName('', 'column')).toBe(false)
    })

    it('超长名称应返回 false', () => {
      expect(validateName('a'.repeat(129), 'table')).toBe(false)
    })
  })
})
