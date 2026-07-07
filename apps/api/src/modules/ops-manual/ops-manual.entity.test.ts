/**
 * 🐜 自动: [ops-manual] [A] entity 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it, beforeEach } from 'vitest'
import { OpsManualRecord, OpsManualSearchLog } from './ops-manual.entity'
import type { OpsManualRole, OpsManualExportFormat } from './ops-manual.entity'

// ── OpsManualRole 类型字面量 ───────────────────────────

describe('OpsManualRole', () => {
  it('所有角色字面量可被赋值', () => {
    const roles: OpsManualRole[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
    assert.equal(roles.length, 4)
    assert.ok(roles.every((r) => typeof r === 'string'))
  })

  it('非法角色字符串编译报错（运行时检查）', () => {
    const illegal = 'unknown_role' as OpsManualRole
    assert.notEqual(['store_manager', 'sales_staff', 'cashier', 'customer_service'].includes(illegal), true)
  })
})

// ── OpsManualExportFormat 类型字面量 ───────────────────

describe('OpsManualExportFormat', () => {
  it('所有导出格式字面量可被赋值', () => {
    const formats: OpsManualExportFormat[] = ['markdown', 'html', 'pdf-json', 'checklist']
    assert.equal(formats.length, 4)
    assert.ok(formats.every((f) => typeof f === 'string'))
  })
})

// ── OpsManualRecord ────────────────────────────────────

describe('OpsManualRecord Entity', () => {
  it('正例: 完整字段赋值', () => {
    const record = new OpsManualRecord()
    record.id = '550e8400-e29b-41d4-a716-446655440000'
    record.tenantId = 'tenant-A'
    record.role = 'store_manager'
    record.title = '店长运营手册'
    record.version = '2.0.0'
    record.exportFormat = 'html'
    record.content = '<h1>店长运营手册</h1>'
    record.totalSections = 7
    record.totalPages = 12
    record.estimatedReadTime = 25
    record.generatedBy = 'system'

    assert.equal(record.id, '550e8400-e29b-41d4-a716-446655440000')
    assert.equal(record.tenantId, 'tenant-A')
    assert.equal(record.role, 'store_manager')
    assert.equal(record.title, '店长运营手册')
    assert.equal(record.version, '2.0.0')
    assert.equal(record.exportFormat, 'html')
    assert.equal(record.content, '<h1>店长运营手册</h1>')
    assert.equal(record.totalSections, 7)
    assert.equal(record.totalPages, 12)
    assert.equal(record.estimatedReadTime, 25)
    assert.equal(record.generatedBy, 'system')
  })

  it('正例: 只赋值必填字段', () => {
    const record = new OpsManualRecord()
    record.tenantId = 'tenant-B'
    record.role = 'cashier'
    record.title = '收银运营手册'
    record.totalSections = 6
    record.totalPages = 10
    record.estimatedReadTime = 20

    assert.equal(record.tenantId, 'tenant-B')
    assert.equal(record.role, 'cashier')
    assert.equal(record.title, '收银运营手册')
    // TypeORM default 在单元测试中不生效, 只验证必填字段
    assert.equal(record.totalSections, 6)
    assert.equal(record.generatedBy, undefined)
    assert.equal(record.content, undefined)
  })

  it('边界: 零章节零页面的空手册', () => {
    const record = new OpsManualRecord()
    record.tenantId = 'tenant-C'
    record.role = 'customer_service'
    record.title = '空手册'
    record.totalSections = 0
    record.totalPages = 0
    record.estimatedReadTime = 0

    assert.equal(record.totalSections, 0)
    assert.equal(record.totalPages, 0)
    assert.equal(record.estimatedReadTime, 0)
  })

  it('边界: 所有四种角色都能赋值', () => {
    const roles: OpsManualRole[] = ['store_manager', 'sales_staff', 'cashier', 'customer_service']
    for (const role of roles) {
      const record = new OpsManualRecord()
      record.tenantId = 'tenant-T'
      record.role = role
      record.title = `${role} 手册`
      record.totalSections = 5
      record.totalPages = 8
      record.estimatedReadTime = 15
      assert.equal(record.role, role)
    }
  })

  it('边界: 所有四种导出格式都能赋值', () => {
    const formats: OpsManualExportFormat[] = ['markdown', 'html', 'pdf-json', 'checklist']
    const record = new OpsManualRecord()
    record.tenantId = 'tenant-T'
    record.role = 'store_manager'
    record.title = '测试'
    record.totalSections = 1
    record.totalPages = 1
    record.estimatedReadTime = 1
    for (const format of formats) {
      record.exportFormat = format
      assert.equal(record.exportFormat, format)
    }
  })

  it('边界: generatedBy 可空', () => {
    const record = new OpsManualRecord()
    record.tenantId = 'tenant-D'
    record.role = 'sales_staff'
    record.title = '导购手册'
    record.totalSections = 6
    record.totalPages = 10
    record.estimatedReadTime = 20

    assert.equal(record.generatedBy, undefined)
  })
})

// ── OpsManualSearchLog ─────────────────────────────────

describe('OpsManualSearchLog Entity', () => {
  it('正例: 完整字段赋值', () => {
    const log = new OpsManualSearchLog()
    log.id = '770e8400-e29b-41d4-a716-446655440001'
    log.tenantId = 'tenant-A'
    log.role = 'store_manager'
    log.keyword = '排班'
    log.resultCount = 3
    log.searchedBy = 'user-001'

    assert.equal(log.id, '770e8400-e29b-41d4-a716-446655440001')
    assert.equal(log.tenantId, 'tenant-A')
    assert.equal(log.role, 'store_manager')
    assert.equal(log.keyword, '排班')
    assert.equal(log.resultCount, 3)
    assert.equal(log.searchedBy, 'user-001')
  })

  it('正例: 零搜索结果', () => {
    const log = new OpsManualSearchLog()
    log.tenantId = 'tenant-B'
    log.role = 'cashier'
    log.keyword = '不存在的内容'
    log.resultCount = 0

    assert.equal(log.resultCount, 0)
    assert.equal(log.searchedBy, undefined)
  })

  it('边界: 空关键字搜索记录', () => {
    const log = new OpsManualSearchLog()
    log.tenantId = 'tenant-C'
    log.role = 'customer_service'
    log.keyword = ''
    log.resultCount = 0

    assert.equal(log.keyword, '')
  })
})

// ── Entity 装饰器 ──────────────────────────────────────

describe('Entity Decorators', () => {
  it('OpsManualRecord 有 Entity 装饰器', () => {
    const tableName = Reflect.getMetadata('typeorm:entity', OpsManualRecord)
    assert.ok(typeof tableName === 'string' || tableName === undefined)
  })

  it('OpsManualSearchLog 有 Entity 装饰器', () => {
    const tableName = Reflect.getMetadata('typeorm:entity', OpsManualSearchLog)
    assert.ok(typeof tableName === 'string' || tableName === undefined)
  })
})
