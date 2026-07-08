import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 合约测试：Session 跨模块合约映射
 *
 * 验证:
 *   - toSessionContract 映射所有必填字段
 *   - toDeviceInfoContract 映射设备字段
 *   - toSessionContracts 批量映射
 *   - 合约字段不泄露内部细节
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  toSessionContract,
  toDeviceInfoContract,
  toSessionContracts,
  type SessionContract,
  type DeviceInfoContract,
} from './session.contract'
import type { Session, DeviceInfo } from './session.entity'

describe('Session Contract', () => {
  const mockSession: Session = {
    sessionId: 'sess-001',
    userId: 'u-001',
    tenantId: 't-001',
    deviceInfo: {
      deviceId: 'dev-001',
      deviceType: 'mobile',
      browser: 'Chrome 120',
      os: 'iOS 17',
      userAgent: 'Mozilla/5.0 ...',
    },
    createdAt: 1700000000000,
    lastActiveAt: 1700000100000,
    expiresAt: 1700001800000,
    status: 'active',
  }

  const mockDeviceInfo: DeviceInfo = {
    deviceId: 'dev-001',
    deviceType: 'mobile',
    browser: 'Chrome 120',
    os: 'iOS 17',
    userAgent: 'Mozilla/5.0 ...',
  }

  describe('toSessionContract', () => {
    it('should map all required fields from Session', () => {
      const contract = toSessionContract(mockSession)

      assert.equal(contract.sessionId, 'sess-001')
      assert.equal(contract.userId, 'u-001')
      assert.equal(contract.tenantId, 't-001')
      assert.equal(contract.deviceType, 'mobile')
      assert.equal(contract.createdAt, 1700000000000)
      assert.equal(contract.lastActiveAt, 1700000100000)
      assert.equal(contract.expiresAt, 1700001800000)
      assert.equal(contract.status, 'active')
    })

    it('should not leak internal fields', () => {
      const contract = toSessionContract(mockSession)
      const keys = Object.keys(contract) as (keyof SessionContract)[]

      // contract 应该只包含合约字段, 不包含 deviceInfo 完整对象
      assert.ok(!('deviceInfo' in contract))
      assert.ok(keys.includes('deviceType'))
      assert.equal(keys.length, 8) // sessionId, userId, tenantId, deviceType, createdAt, lastActiveAt, expiresAt, status
    })

    it('should map expired status correctly', () => {
      const expired: Session = { ...mockSession, status: 'expired' }
      const contract = toSessionContract(expired)
      assert.equal(contract.status, 'expired')
    })

    it('should map revoked status correctly', () => {
      const revoked: Session = { ...mockSession, status: 'revoked' }
      const contract = toSessionContract(revoked)
      assert.equal(contract.status, 'revoked')
    })
  })

  describe('toDeviceInfoContract', () => {
    it('should map device fields', () => {
      const contract = toDeviceInfoContract(mockDeviceInfo)

      assert.equal(contract.deviceId, 'dev-001')
      assert.equal(contract.deviceType, 'mobile')
      assert.equal(contract.browser, 'Chrome 120')
      assert.equal(contract.os, 'iOS 17')
    })

    it('should not include userAgent in contract', () => {
      const contract = toDeviceInfoContract(mockDeviceInfo)
      assert.ok(!('userAgent' in contract))

      // 合约字段数量 = deviceId, deviceType, browser, os
      assert.equal(Object.keys(contract).length, 4)
    })

    it('should handle minimal device info', () => {
      const minimal: DeviceInfo = { deviceId: 'dev-min', deviceType: 'web' }
      const contract = toDeviceInfoContract(minimal)
      assert.equal(contract.deviceId, 'dev-min')
      assert.equal(contract.deviceType, 'web')
      assert.equal(contract.browser, undefined)
      assert.equal(contract.os, undefined)
    })
  })

  describe('toSessionContracts (batch)', () => {
    it('should map multiple sessions', () => {
      const sessions: Session[] = [
        mockSession,
        { ...mockSession, sessionId: 'sess-002', userId: 'u-002' },
      ]

      const contracts = toSessionContracts(sessions)
      assert.equal(contracts.length, 2)
      assert.equal(contracts[0].sessionId, 'sess-001')
      assert.equal(contracts[1].sessionId, 'sess-002')
      assert.equal(contracts[1].userId, 'u-002')
    })

    it('should return empty array for empty input', () => {
      const contracts = toSessionContracts([])
      assert.deepEqual(contracts, [])
    })
  })
})
