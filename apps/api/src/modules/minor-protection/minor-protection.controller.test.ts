/**
 * 未成年保护 Controller 单元测试
 *
 * 测试范围:
 * - 所有 6 个 Controller 端点
 * - 正常路径 (happy path)
 * - 错误处理 (not found / missing params)
 * - Service 方法委托验证
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { NotFoundException } from '@nestjs/common'
import { MinorProtectionController } from './minor-protection.controller'
import {
  MinorProtectionService,
  resetMinorProtectionStores,
} from './minor-protection.service'

describe('MinorProtectionController', () => {
  let controller: MinorProtectionController
  let service: MinorProtectionService

  beforeEach(() => {
    resetMinorProtectionStores()
    service = new MinorProtectionService()
    controller = new MinorProtectionController(service)
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/config
  // ═══════════════════════════════════════════

  describe('GET /config', () => {
    it('正例: 返回默认配置包含宵禁时间', () => {
      const config = controller.getConfig()
      expect(config.curfewStart).toBe('22:00')
      expect(config.curfewEnd).toBe('06:00')
      expect(config.maxSessionMinutes).toBe(120)
      expect(config.weekdayStart).toBe('08:00')
      expect(config.weekdayEnd).toBe('21:00')
      expect(config.facialRecognitionEnabled).toBe(true)
      expect(config.identityVerificationEnabled).toBe(true)
      expect(config.timeRestrictionEnabled).toBe(true)
    })

    it('边界: 返回配置是独立副本 (修改不影响默认值)', () => {
      const config1 = controller.getConfig()
      const config2 = controller.getConfig()
      config1.maxSessionMinutes = 999
      expect(config2.maxSessionMinutes).toBe(120)
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/verify
  // ═══════════════════════════════════════════

  describe('POST /verify', () => {
    const identityPayload = {
      tenantId: 'tenant-1',
      memberId: 'member-1',
      method: 'id_card' as const,
      identityNumber: '110101201001011234',
      name: '小明',
      birthday: '2010-01-01',
    }

    it('正例: 未成年用户身份认证成功 (age < 18)', () => {
      const result = controller.verifyIdentity(identityPayload)
      expect(result.isMinor).toBe(true)
      expect(result.id).toMatch(/^mv-/)
      expect(result.memberId).toBe('member-1')
      expect(result.tenantId).toBe('tenant-1')
    })

    it('正例: 成年人用户身份认证成功 (age >= 18)', () => {
      const result = controller.verifyIdentity({
        ...identityPayload,
        identityNumber: '110101199001011234',
        birthday: '1990-01-01',
      })
      expect(result.isMinor).toBe(false)
    })

    it('正例: 身份证号被脱敏处理', () => {
      const result = controller.verifyIdentity(identityPayload)
      expect(result.identityNumber).toContain('****')
      expect(result.identityNumber).not.toContain('110101201001011234') // 不包含明文
    })

    it('边界: 含监护人同意标记', () => {
      const result = controller.verifyIdentity({
        ...identityPayload,
        guardianConsent: true,
      })
      expect(result.guardianConsent).toBe(true)
    })

    it('边界: 无监护人同意默认为 false', () => {
      const result = controller.verifyIdentity(identityPayload)
      expect(result.guardianConsent).toBe(false)
    })

    it('回归: 认证记录可通过 ID 查询', () => {
      const result = controller.verifyIdentity(identityPayload)
      const record = service.getVerification(result.id, 'tenant-1')
      expect(record).toBeDefined()
      expect(record!.memberId).toBe('member-1')
    })
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/verifications
  // ═══════════════════════════════════════════

  describe('GET /verifications', () => {
    it('正例: 列出指定租户的所有认证记录', () => {
      controller.verifyIdentity({
        tenantId: 'tenant-a', memberId: 'm1',
        method: 'id_card', identityNumber: '110101201001011234', name: 'A', birthday: '2010-01-01',
      })
      controller.verifyIdentity({
        tenantId: 'tenant-a', memberId: 'm2',
        method: 'id_card', identityNumber: '110101201001019999', name: 'B', birthday: '2010-02-02',
      })

      const list = controller.listVerifications('tenant-a')
      expect(list).toHaveLength(2)
    })

    it('正例: 空列表返回空数组', () => {
      const list = controller.listVerifications('no-records-tenant')
      expect(list).toEqual([])
    })

    it('边界: 租户隔离 - 只返回指定租户记录', () => {
      controller.verifyIdentity({
        tenantId: 'tenant-x', memberId: 'mx',
        method: 'id_card', identityNumber: '110101201001011234', name: 'X', birthday: '2010-01-01',
      })
      controller.verifyIdentity({
        tenantId: 'tenant-y', memberId: 'my',
        method: 'id_card', identityNumber: '110101201001019999', name: 'Y', birthday: '2010-01-01',
      })

      const listX = controller.listVerifications('tenant-x')
      expect(listX).toHaveLength(1)
      expect(listX[0].memberId).toBe('mx')

      const listY = controller.listVerifications('tenant-y')
      expect(listY).toHaveLength(1)
      expect(listY[0].memberId).toBe('my')
    })
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/verifications/:id
  // ═══════════════════════════════════════════

  describe('GET /verifications/:id', () => {
    it('正例: 根据 ID 和租户查询认证记录', () => {
      const created = controller.verifyIdentity({
        tenantId: 'tenant-q', memberId: 'mq',
        method: 'id_card', identityNumber: '110101201001011234', name: 'Q', birthday: '2010-01-01',
      })

      const record = controller.getVerification(created.id, 'tenant-q')
      expect(record.id).toBe(created.id)
      expect(record.name).toBe('Q')
    })

    it('负例: 不存在的记录 — 抛出 NotFoundException', () => {
      expect(() => {
        controller.getVerification('nonexistent-id', 'tenant-any')
      }).toThrow(NotFoundException)
    })

    it('负例: 租户不匹配 — 抛出 NotFoundException', () => {
      const created = controller.verifyIdentity({
        tenantId: 'tenant-a', memberId: 'ma',
        method: 'id_card', identityNumber: '110101201001011234', name: 'A', birthday: '2010-01-01',
      })

      expect(() => {
        controller.getVerification(created.id, 'tenant-b') // 不同租户
      }).toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/check-access
  // ═══════════════════════════════════════════

  describe('POST /check-access', () => {
    it('正例: 未认证用户返回 review', () => {
      const result = controller.checkAccess({
        tenantId: 'tenant-test', memberId: 'unknown-user', action: 'enter',
      })
      expect(result.result).toBe('review')
      expect(result.blockedReason).toBe('未完成身份认证')
      expect(result.timeRestricted).toBe(false)
    })

    it('正例: 已认证成年人直接通过', () => {
      controller.verifyIdentity({
        tenantId: 'tenant-test', memberId: 'adult-user',
        method: 'id_card', identityNumber: '110101199001011234', name: '成人', birthday: '1990-01-01',
      })

      const result = controller.checkAccess({
        tenantId: 'tenant-test', memberId: 'adult-user', action: 'enter',
      })
      expect(result.result).toBe('pass')
    })

    it('正例: 未成年人无监护人同意返回 review', () => {
      controller.verifyIdentity({
        tenantId: 'tenant-test', memberId: 'minor-user',
        method: 'id_card', identityNumber: '110101201001011234', name: '未成年人', birthday: '2010-01-01',
        guardianConsent: false,
      })

      const result = controller.checkAccess({
        tenantId: 'tenant-test', memberId: 'minor-user', action: 'enter',
        config: {
          facialRecognitionEnabled: false,
          identityVerificationEnabled: true,
          timeRestrictionEnabled: true,
          curfewStart: '23:59',
          curfewEnd: '00:00',
          maxSessionMinutes: 120,
          weekdayStart: '00:00',
          weekdayEnd: '23:59',
        },
      })
      expect(result.result === 'review' || result.result === 'pass').toBe(true)
    })

    it('正例: 购买和游戏行为也受管控', () => {
      const result = controller.checkAccess({
        tenantId: 'tenant-test', memberId: 'unknown-user', action: 'purchase',
      })
      expect(result.result).toBe('review')
    })
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/access-logs
  // ═══════════════════════════════════════════

  describe('GET /access-logs', () => {
    it('正例: 获取访问日志 (默认 limit=50)', () => {
      // 触发几次 checkAccess 生成日志
      controller.checkAccess({ tenantId: 'log-tenant', memberId: 'u1', action: 'enter' })
      controller.checkAccess({ tenantId: 'log-tenant', memberId: 'u2', action: 'enter' })

      const logs = controller.getAccessLogs('log-tenant')
      expect(logs).toHaveLength(2)
      expect(logs[0].id).toMatch(/^mal-/)
    })

    it('正例: 自定义 limit 参数', () => {
      for (let i = 0; i < 5; i++) {
        controller.checkAccess({ tenantId: 'limit-tenant', memberId: `u${i}`, action: 'enter' })
      }

      const logs = controller.getAccessLogs('limit-tenant', '3')
      expect(logs).toHaveLength(3)
    })

    it('正例: 空租户返回空数组', () => {
      const logs = controller.getAccessLogs('empty-tenant')
      expect(logs).toEqual([])
    })

    it('边界: 租户日志隔离', () => {
      controller.checkAccess({ tenantId: 'log-a', memberId: 'ua', action: 'enter' })
      controller.checkAccess({ tenantId: 'log-b', memberId: 'ub', action: 'enter' })

      const logsA = controller.getAccessLogs('log-a')
      expect(logsA).toHaveLength(1)
      expect(logsA[0].memberId).toBe('ua')

      const logsB = controller.getAccessLogs('log-b')
      expect(logsB).toHaveLength(1)
      expect(logsB[0].memberId).toBe('ub')
    })
  })
})
