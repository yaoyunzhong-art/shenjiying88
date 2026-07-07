/**
 * compliance.service.spec.ts — 合规模块 Service 深层单元测试
 *
 * 覆盖：
 *  - AuditLogService:  正例（append/appendBatch/hash chain verify）/ 反例（tamper 检测）/ 边界（空链起点/去重）
 *  - AuditQueryService: 正例（export CSV/JSON/quickQuery/statsByAction/topActors/exportWithVerification）/ 边界（空/保留期/分页）
 *  - PIIDetectorService: 正例（phone/email/idCard/creditCard/ip）/ 反例（无效格式）/ 边界（空/单字符/混合文本）
 *  - PIIMaskerService:   正例（maskPhone/maskEmail/maskIdCard/maskCreditCard/maskIP/maskText/maskBatch/maskRatio）/ 边界（短字符串）
 *  - GDPRErasureService: 正例（requestErasure/cancelErasure/hardDelete/cascadeHook/listReadyForHardDelete/processScheduledDeletions）/ 反例（重复取消/非PENDING硬删）/ 边界（grace period 到期）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuditLogService } from './audit-log.service'
import { AuditQueryService } from './audit-query.service'
import { PIIDetectorService } from './pii-detector.service'
import { PIIMaskerService } from './pii-masker.service'
import { GDPRErasureService } from './gdpr-erasure.service'
import type { AuditAppendInput, AuditAction } from './audit-log.service'

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const mockAppendInput = (overrides: Partial<AuditAppendInput> = {}): AuditAppendInput => ({
  tenantId: 'tenant_001',
  actorId: 'user_001',
  action: 'CREATE',
  resource: 'order',
  resourceId: 'ord_001',
  ...overrides,
})

// ═══════════════════════════════════════════════════════════════
// AuditLogService
// ═══════════════════════════════════════════════════════════════

describe('AuditLogService', () => {
  let svc: AuditLogService

  beforeEach(() => {
    svc = new AuditLogService()
    svc.resetForTests()
  })

  describe('append', () => {
    it('✅ 正例: 追加单条审计记录返回 hash', () => {
      const entry = svc.append(mockAppendInput())
      expect(entry.seq).toBe(1)
      expect(entry.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(entry.prevHash).toBe('0'.repeat(64))
      expect(entry.action).toBe('CREATE')
    })

    it('✅ 正例: 追加第二条自动链接 hash 链', () => {
      const e1 = svc.append(mockAppendInput())
      const e2 = svc.append(mockAppendInput({ action: 'UPDATE', resourceId: 'ord_002' }))
      expect(e2.prevHash).toBe(e1.hash)
      expect(e2.seq).toBe(2)
    })

    it('✅ 正例: CUSTOM action 携带 customAction', () => {
      const e = svc.append(mockAppendInput({ action: 'CUSTOM', customAction: 'EXPORT_REPORT' }))
      expect(e.customAction).toBe('EXPORT_REPORT')
    })

    it('✅ 正例: 记录 before/after 快照', () => {
      const e = svc.append(mockAppendInput({
        before: { status: 'pending' },
        after: { status: 'paid' },
      }))
      expect(e.before).toEqual({ status: 'pending' })
      expect(e.after).toEqual({ status: 'paid' })
    })
  })

  describe('appendBatch', () => {
    it('✅ 正例: 批量追加 3 条', () => {
      const entries = svc.appendBatch([
        mockAppendInput(),
        mockAppendInput({ action: 'UPDATE', resourceId: 'ord_002' }),
        mockAppendInput({ action: 'DELETE', resourceId: 'ord_003' }),
      ])
      expect(entries).toHaveLength(3)
      expect(svc.size()).toBe(3)
      // hash 链连续
      expect(entries[1].prevHash).toBe(entries[0].hash)
      expect(entries[2].prevHash).toBe(entries[1].hash)
    })
  })

  describe('query / filter', () => {
    beforeEach(() => {
      svc.append(mockAppendInput())
      svc.append(mockAppendInput({ action: 'UPDATE', resourceId: 'ord_002', actorId: 'user_002' }))
      svc.append(mockAppendInput({ action: 'DELETE', resourceId: 'ord_003' }))
    })

    it('✅ 正例: filterByTenant', () => {
      const res = svc.filterByTenant('tenant_001')
      expect(res).toHaveLength(3)
    })

    it('✅ 正例: filterByActor', () => {
      const res = svc.filterByActor('user_002')
      expect(res).toHaveLength(1)
    })

    it('✅ 正例: query 复合过滤', () => {
      const res = svc.query({ action: 'CREATE', limit: 10 })
      expect(res).toHaveLength(1)
    })

    it('🔲 边界: 不存在的 tenant 返回空', () => {
      expect(svc.filterByTenant('nonexistent')).toHaveLength(0)
    })
  })

  describe('verify (hash chain integrity)', () => {
    it('✅ 正例: 空链验证通过', () => {
      const result = svc.verify()
      expect(result.valid).toBe(true)
      expect(result.totalChecked).toBe(0)
    })

    it('✅ 正例: 完整链条验证通过', () => {
      svc.appendBatch([mockAppendInput(), mockAppendInput(), mockAppendInput()])
      const result = svc.verify()
      expect(result.valid).toBe(true)
      expect(result.totalChecked).toBe(3)
    })

    it('❌ 反例: 篡改后验证失败', () => {
      svc.appendBatch([mockAppendInput(), mockAppendInput(), mockAppendInput()])
      svc.__tamper(2) // 修改 seq=2 的 after
      const result = svc.verify()
      expect(result.valid).toBe(false)
      expect(result.brokenAtSeq).toBe(2)
    })
  })

  describe('tail / getBySeq', () => {
    it('✅ 正例: tail 取最后 N 条', () => {
      svc.appendBatch([mockAppendInput(), mockAppendInput(), mockAppendInput()])
      const last2 = svc.tail(2)
      expect(last2).toHaveLength(2)
      expect(last2[0].seq).toBe(2)
    })

    it('✅ 正例: getBySeq 返回指定 seq', () => {
      svc.append(mockAppendInput())
      const found = svc.getBySeq(1)
      expect(found).toBeDefined()
      expect(found!.seq).toBe(1)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// AuditQueryService
// ═══════════════════════════════════════════════════════════════

describe('AuditQueryService', () => {
  let log: AuditLogService
  let query: AuditQueryService

  beforeEach(() => {
    log = new AuditLogService()
    log.resetForTests()
    query = new AuditQueryService(log)
  })

  describe('export', () => {
    it('✅ 正例: JSON 导出', () => {
      log.append(mockAppendInput())
      const result = query.export({ format: 'json' })
      expect(result.format).toBe('json')
      expect(result.rowCount).toBe(1)
      const parsed = JSON.parse(result.content)
      expect(parsed[0].tenantId).toBe('tenant_001')
    })

    it('✅ 正例: CSV 导出', () => {
      log.append(mockAppendInput())
      log.append(mockAppendInput({ action: 'UPDATE', resourceId: 'ord_002' }))
      const result = query.export({ format: 'csv' })
      expect(result.format).toBe('csv')
      expect(result.content).toContain('seq,ts,tenantId')
      expect(result.content.split('\n').filter(Boolean).length).toBe(3) // header + 2 rows
    })

    it('✅ 正例: 导出包含保留期信息', () => {
      const result = query.export({ format: 'json', retentionDays: 30 })
      expect(result.retentionDays).toBe(30)
      expect(result.retentionExpiresAt).toBeDefined()
    })

    it('🔲 边界: 空日志导出 rows=0', () => {
      const result = query.export({ format: 'json' })
      expect(result.rowCount).toBe(0)
      expect(result.content).toBe('[]')
    })
  })

  describe('quickQuery', () => {
    it('✅ 正例: 快速查询全部', () => {
      log.append(mockAppendInput())
      const res = query.quickQuery({})
      expect(res).toHaveLength(1)
    })
  })

  describe('statsByAction', () => {
    it('✅ 正例: 按 action 统计', () => {
      log.append(mockAppendInput({ action: 'CREATE' }))
      log.append(mockAppendInput({ action: 'CREATE' }))
      log.append(mockAppendInput({ action: 'UPDATE' }))
      const stats = query.statsByAction()
      expect(stats.CREATE).toBe(2)
      expect(stats.UPDATE).toBe(1)
      expect(stats.READ).toBe(0)
    })
  })

  describe('topActors', () => {
    it('✅ 正例: Top N actor 排序', () => {
      log.append(mockAppendInput({ actorId: 'a' }))
      log.append(mockAppendInput({ actorId: 'a' }))
      log.append(mockAppendInput({ actorId: 'b' }))
      const top = query.topActors('tenant_001')
      expect(top[0].actorId).toBe('a')
      expect(top[0].count).toBe(2)
    })
  })

  describe('exportWithVerification', () => {
    it('✅ 正例: 验证通过后可导出', () => {
      log.append(mockAppendInput())
      const result = query.exportWithVerification({ format: 'json' })
      expect(result.integrity.valid).toBe(true)
      expect(result.export.rowCount).toBe(1)
    })

    it('❌ 反例: 完整性被破坏时拒绝导出', () => {
      log.append(mockAppendInput())
      log.append(mockAppendInput())
      log.__tamper(1)
      expect(() => query.exportWithVerification({ format: 'json' })).toThrow('integrity broken')
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// PIIDetectorService
// ═══════════════════════════════════════════════════════════════

describe('PIIDetectorService', () => {
  let detector: PIIDetectorService

  beforeEach(() => {
    detector = new PIIDetectorService()
  })

  describe('detect', () => {
    it('✅ 正例: 检测到手机号', () => {
      const matches = detector.detect('contact: 13812345678')
      expect(matches.some(m => m.kind === 'phone' && m.value === '13812345678')).toBe(true)
    })

    it('✅ 正例: 检测到邮箱', () => {
      const matches = detector.detect('email: test@example.com')
      expect(matches.some(m => m.kind === 'email')).toBe(true)
    })

    it('✅ 正例: 检测到身份证', () => {
      const matches = detector.detect('id: 110101199001011237')
      expect(matches.some(m => m.kind === 'idCard')).toBe(true)
    })

    it('✅ 正例: 检测到信用卡 (Luhn 有效)', () => {
      const matches = detector.detect('card: 4111111111111111')
      expect(matches.some(m => m.kind === 'creditCard')).toBe(true)
    })

    it('✅ 正例: 检测到 IPv4', () => {
      const matches = detector.detect('ip: 192.168.1.1')
      expect(matches.some(m => m.kind === 'ip')).toBe(true)
    })

    it('❌ 反例: 无效信用卡不通过 Luhn 置信度 < 0.8', () => {
      const matches = detector.detect('card: 1234567890123456')
      // 不过 Luhn => confidence 0.4 < 0.8 => 排除
      // 但正则可能先匹配空白分隔的变体,确保整体无匹配
      expect(matches.filter(m => m.kind === 'creditCard').length).toBe(0)
    })

    it('🔲 边界: 空字符串返回空', () => {
      expect(detector.detect('')).toHaveLength(0)
    })

    it('🔲 边界: 单字符文本', () => {
      expect(detector.detect('a')).toHaveLength(0)
    })

    it('✅ 正例: 混合文本检测多类型 PII', () => {
      const text = 'User: 13800138000, email: a@b.com'
      const matches = detector.detect(text)
      expect(matches.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('detectGrouped', () => {
    it('✅ 正例: 按 kind 分组', () => {
      const text = 'phone: 13812345678, email: t@t.com'
      const grouped = detector.detectGrouped(text)
      expect(grouped.phone.length).toBe(1)
      expect(grouped.email.length).toBe(1)
    })
  })

  describe('hasPII / count', () => {
    it('✅ 正例: hasPII 返回 true', () => {
      expect(detector.hasPII('phone: 13812345678')).toBe(true)
    })

    it('✅ 正例: hasPII 无 PII 返回 false', () => {
      expect(detector.hasPII('hello world')).toBe(false)
    })

    it('✅ 正例: count 统计各类型数量', () => {
      const c = detector.count('phone: 13812345678; email: a@b.com')
      expect(c.phone).toBe(1)
      expect(c.email).toBe(1)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// PIIMaskerService
// ═══════════════════════════════════════════════════════════════

describe('PIIMaskerService', () => {
  let masker: PIIMaskerService

  beforeEach(() => {
    masker = new PIIMaskerService(new PIIDetectorService())
  })

  describe('maskPhone', () => {
    it('✅ 正例: 脱敏手机号', () => {
      expect(masker.maskPhone('13812345678')).toBe('138****5678')
    })

    it('🔲 边界: 不足 7 位不处理', () => {
      expect(masker.maskPhone('12345')).toBe('12345')
    })
  })

  describe('maskEmail', () => {
    it('✅ 正例: 脱敏邮箱', () => {
      expect(masker.maskEmail('test@example.com')).toBe('t***@example.com')
    })

    it('🔲 边界: 无 @ 符号不处理', () => {
      expect(masker.maskEmail('invalid')).toBe('invalid')
    })
  })

  describe('maskIdCard', () => {
    it('✅ 正例: 脱敏身份证', () => {
      const masked = masker.maskIdCard('110101199001011234')
      expect(masked.startsWith('110101')).toBe(true)
      expect(masked.endsWith('1234')).toBe(true)
      expect(masked.length).toBe(18)
    })

    it('🔲 边界: 不足 10 位不处理', () => {
      expect(masker.maskIdCard('12345')).toBe('12345')
    })
  })

  describe('maskCreditCard', () => {
    it('✅ 正例: 脱敏信用卡', () => {
      const masked = masker.maskCreditCard('4111111111111111')
      expect(masked.startsWith('411111')).toBe(true)
      expect(masked.endsWith('1111')).toBe(true)
    })

    it('🔲 边界: 不足 13 位不处理', () => {
      expect(masker.maskCreditCard('1234')).toBe('1234')
    })
  })

  describe('maskIP', () => {
    it('✅ 正例: 脱敏 IPv4', () => {
      expect(masker.maskIP('192.168.1.100')).toBe('192.168.*.*')
    })

    it('🔲 边界: 非 4 段 IP 不处理', () => {
      expect(masker.maskIP('not-a-ip')).toBe('not-a-ip')
    })
  })

  describe('maskText', () => {
    it('✅ 正例: 全文脱敏 PII', () => {
      const result = masker.maskText('contact phone is 13812345678')
      expect(result).not.toContain('13812345678')
      expect(result).toContain('****')
    })

    it('🔲 边界: 纯文本不变', () => {
      expect(masker.maskText('hello world')).toBe('hello world')
    })
  })

  describe('maskBatch / maskRatio', () => {
    it('✅ 正例: 批量脱敏', () => {
      const results = masker.maskBatch(['phone:13812345678', 'hello'])
      expect(results[0]).not.toContain('13812345678')
      expect(results[1]).toBe('hello')
    })

    it('✅ 正例: maskRatio 返回比例', () => {
      const ratio = masker.maskRatio('phone: 13812345678')
      expect(ratio).toBeGreaterThan(0)
    })

    it('🔲 边界: 空文本 ratio = 0', () => {
      expect(masker.maskRatio('')).toBe(0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// GDPRErasureService
// ═══════════════════════════════════════════════════════════════

describe('GDPRErasureService', () => {
  let gdpr: GDPRErasureService

  beforeEach(() => {
    gdpr = new GDPRErasureService()
    gdpr.resetForTests()
  })

  describe('requestErasure', () => {
    it('✅ 正例: 请求删除用户标记 PENDING_ERASURE', () => {
      const record = gdpr.requestErasure({ userId: 'u1', tenantId: 't1' })
      expect(record.status).toBe('PENDING_ERASURE')
      expect(record.deletionRequestedAt).toBeDefined()
      expect(record.erasureDeadlineAt).toBeDefined()
    })

    it('✅ 正例: isActive 返回 false', () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1' })
      expect(gdpr.isActive('u1')).toBe(false)
    })
  })

  describe('cancelErasure', () => {
    it('✅ 正例: 取消删除后恢复 ACTIVE', () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1' })
      const record = gdpr.cancelErasure('u1')
      expect(record.status).toBe('ACTIVE')
      expect(record.restoredAt).toBeDefined()
    })

    it('✅ 正例: isActive 恢复 true', () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1' })
      gdpr.cancelErasure('u1')
      expect(gdpr.isActive('u1')).toBe(true)
    })

    it('❌ 反例: 重复取消报错', () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1' })
      gdpr.cancelErasure('u1')
      expect(() => gdpr.cancelErasure('u1')).toThrow()
    })
  })

  describe('hardDelete', () => {
    it('✅ 正例: 硬删除标记 ERASED', async () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: 1 })
      await new Promise(r => setTimeout(r, 2))
      const ready = gdpr.listReadyForHardDelete()
      expect(ready.length).toBe(1)
      const result = await gdpr.hardDelete('u1')
      expect(result.userId).toBe('u1')
      expect(gdpr.getRecord('u1')!.status).toBe('ERASED')
    })

    it('❌ 反例: 非 PENDING_ERASURE 状态执行硬删报错', async () => {
      await expect(gdpr.hardDelete('nonexistent')).rejects.toThrow()
    })

    it('✅ 正例: cascade hook 被调用', async () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: 1 })
      let hookCalled = false
      gdpr.registerCascadeHook('member', async () => { hookCalled = true; return 1 })
      await new Promise(r => setTimeout(r, 2))
      await gdpr.hardDelete('u1')
      expect(hookCalled).toBe(true)
    })
  })

  describe('processScheduledDeletions', () => {
    it('✅ 正例: 批量处理到期硬删除', async () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1', gracePeriodMs: 1 })
      gdpr.requestErasure({ userId: 'u2', tenantId: 't2', gracePeriodMs: 1 })
      await new Promise(r => setTimeout(r, 2))
      const results = await gdpr.processScheduledDeletions()
      expect(results.length).toBe(2)
    })
  })

  describe('listAuditTrail', () => {
    it('✅ 正例: 按租户列出审计轨迹', () => {
      gdpr.requestErasure({ userId: 'u1', tenantId: 't1' })
      gdpr.requestErasure({ userId: 'u2', tenantId: 't2' })
      const trail = gdpr.listAuditTrail('t1')
      expect(trail).toHaveLength(1)
    })
  })
})
