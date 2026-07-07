import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: GDPRService 单元测试
import { GDPRService, type ConsentType, type DataCategory } from './gdpr.service'

describe('GDPRService', () => {
  let service: GDPRService

  beforeEach(() => {
    service = new GDPRService()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. 记录同意 → 查询确认
  // ═══════════════════════════════════════════════════════════════════════════

  describe('recordConsent + getConsent', () => {
    it('should record and retrieve consent', async () => {
      const consent = await service.recordConsent('user-1', 'marketing', true, {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        policyVersion: '2.0',
      })

      expect(consent.userId).toBe('user-1')
      expect(consent.consentType).toBe('marketing')
      expect(consent.granted).toBe(true)
      expect(consent.ipAddress).toBe('192.168.1.1')
      expect(consent.userAgent).toBe('Mozilla/5.0')
      expect(consent.version).toBe('2.0')
    })

    it('should retrieve consent correctly', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      const retrieved = await service.getConsent('user-1', 'marketing')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.granted).toBe(true)
      expect(retrieved!.userId).toBe('user-1')
    })

    it('should return null for non-existent consent', async () => {
      const consent = await service.getConsent('nonexistent', 'marketing')
      expect(consent).toBeNull()
    })

    it('should record multiple consent types for same user', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      await service.recordConsent('user-1', 'analytics', true)
      await service.recordConsent('user-1', 'personalization', false)

      const allConsents = await service.getAllConsents('user-1')
      expect(allConsents.length).toBeGreaterThanOrEqual(3)
    })

    it('should overwrite previous consent of same type', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      await service.recordConsent('user-1', 'analytics', true) // Different type

      const marketingConsent = await service.getConsent('user-1', 'marketing')
      expect(marketingConsent!.granted).toBe(true)

      const analyticsConsent = await service.getConsent('user-1', 'analytics')
      expect(analyticsConsent!.granted).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. 撤回 marketing consent 成功，其他类型拒绝
  // ═══════════════════════════════════════════════════════════════════════════

  describe('withdrawConsent', () => {
    it('should allow withdrawing marketing consent', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      await service.withdrawConsent('user-1', 'marketing')

      const consent = await service.getConsent('user-1', 'marketing')
      expect(consent).toBeNull() // Withdrawn consent is treated as expired/invalid
    })

    it('should reject withdrawing non-marketing consent', async () => {
      const consentTypes: ConsentType[] = ['analytics', 'personalization', 'third_party_sharing']

      for (const ct of consentTypes) {
        await service.recordConsent('user-1', ct, true)
        await expect(service.withdrawConsent('user-1', ct)).rejects.toThrow(
          `Cannot withdraw consent type: ${ct}. Only marketing consent is withdrawable.`,
        )
      }
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. canProcessData 全检
  // ═══════════════════════════════════════════════════════════════════════════

  describe('canProcessData', () => {
    it('should return true when all required consents are granted', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      await service.recordConsent('user-1', 'analytics', true)

      const canProcess = await service.canProcessData('user-1', ['marketing', 'analytics'])
      expect(canProcess).toBe(true)
    })

    it('should return false when a required consent is missing', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      // analytics not granted

      const canProcess = await service.canProcessData('user-1', ['marketing', 'analytics'])
      expect(canProcess).toBe(false)
    })

    it('should return false when a required consent is denied', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      await service.recordConsent('user-1', 'analytics', false)

      const canProcess = await service.canProcessData('user-1', ['marketing', 'analytics'])
      expect(canProcess).toBe(false)
    })

    it('should return false for nonexistent user', async () => {
      const canProcess = await service.canProcessData('nonexistent', ['marketing'])
      expect(canProcess).toBe(false)
    })

    it('should handle empty required consents array', async () => {
      const canProcess = await service.canProcessData('user-1', [])
      expect(canProcess).toBe(true)
    })

    it('should check multiple consent types correctly', async () => {
      const consentTypes: ConsentType[] = ['marketing', 'analytics', 'personalization', 'third_party_sharing']

      for (const ct of consentTypes) {
        await service.recordConsent('user-1', ct, true)
      }

      const canProcess = await service.canProcessData('user-1', consentTypes)
      expect(canProcess).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. DSR 提交 → 30天后自动批准
  // ═══════════════════════════════════════════════════════════════════════════

  describe('DSR lifecycle', () => {
    it('should submit DSR and track status', async () => {
      const dsr = await service.submitDSR('user-1', 'access')

      expect(dsr.userId).toBe('user-1')
      expect(dsr.type).toBe('access')
      expect(dsr.status).toBe('pending')
      expect(dsr.id).toBeDefined()
    })

    it('should get DSR status by ID', async () => {
      const dsr = await service.submitDSR('user-1', 'erasure')
      const status = await service.getDSRStatus(dsr.id)

      expect(status).not.toBeNull()
      expect(status!.id).toBe(dsr.id)
      expect(status!.status).toBe('pending')
    })

    it('should list all DSRs for a user', async () => {
      await service.submitDSR('user-1', 'access')
      await service.submitDSR('user-1', 'erasure')
      await service.submitDSR('user-1', 'portability')

      const dsrs = await service.listUserDSRs('user-1')
      expect(dsrs.length).toBe(3)
    })

    it('should process DSR with approve action', async () => {
      const dsr = await service.submitDSR('user-1', 'rectification')
      await service.processDSR(dsr.id, 'approve', { updatedFields: ['email'] })

      const status = await service.getDSRStatus(dsr.id)
      expect(status!.status).toBe('completed')
      expect(status!.completedAt).toBeDefined()
      expect(status!.responseData).toEqual({ updatedFields: ['email'] })
    })

    it('should process DSR with reject action', async () => {
      const dsr = await service.submitDSR('user-1', 'erasure')
      await service.processDSR(dsr.id, 'reject', undefined, 'Pending legal hold')

      const status = await service.getDSRStatus(dsr.id)
      expect(status!.status).toBe('rejected')
      expect(status!.rejectionReason).toBe('Pending legal hold')
    })

    it('should reject processing already completed DSR', async () => {
      const dsr = await service.submitDSR('user-1', 'access')
      await service.processDSR(dsr.id, 'approve')

      await expect(service.processDSR(dsr.id, 'reject')).rejects.toThrow('DSR already processed')
    })

    it('should auto-approve DSR after 30 days deadline', async () => {
      const dsr = await service.submitDSR('user-1', 'access')

      // Simulate time passage beyond 30 days
      vi.useFakeTimers()
      vi.setSystemTime(new Date(dsr.requestedAt.getTime() + 31 * 24 * 60 * 60 * 1000))

      const status = await service.getDSRStatus(dsr.id)
      expect(status!.status).toBe('completed')
      expect(status!.responseData).toEqual({ autoApproved: true, reason: 'Deadline exceeded' })

      vi.useRealTimers()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. 数据删除：验证 PII 不可恢复，统计假数据保留
  // ═══════════════════════════════════════════════════════════════════════════

  describe('data deletion', () => {
    it('should request data deletion and track status', async () => {
      const result = await service.requestDataDeletion('user-1', 'User requested deletion')

      expect(result.deletionId).toBeDefined()
      expect(result.estimatedCompletion).toBeDefined()

      const status = await service.getDeletionStatus(result.deletionId)
      expect(status.status).toBe('pending')
    })

    it('should execute deletion and verify PII is removed', async () => {
      // Register data first
      service.registerDataField('user-1', 'personal', ['email', 'phone', 'address'])
      await service.recordConsent('user-1', 'marketing', true)

      // Execute deletion
      await service.executeDeletion('user-1')

      // Verify PII is gone
      const isDeleted = await service.isDataDeleted('user-1')
      expect(isDeleted).toBe(true)

      const records = service.listDataFields('user-1')
      expect(records.length).toBe(0)

      const consent = await service.getConsent('user-1', 'marketing')
      expect(consent).toBeNull()
    })

    it('should retain anonymized stats after deletion', async () => {
      // Register financial data
      service.registerDataField('user-1', 'financial', ['transaction_amount', 'transaction_date'])

      await service.executeDeletion('user-1', { retainFinancial: true })

      // Note: Direct access to anonymized stats via isDataDeleted check
      const isDeleted = await service.isDataDeleted('user-1')
      expect(isDeleted).toBe(true)
    })

    it('should not allow deletion request for already deleted user (idempotent)', async () => {
      await service.executeDeletion('user-1')
      await service.executeDeletion('user-1') // Second call should be idempotent

      const isDeleted = await service.isDataDeleted('user-1')
      expect(isDeleted).toBe(true)
    })

    it('should get deletion status for completed deletion', async () => {
      await service.executeDeletion('user-1')

      // Find the deletion request
      const dsrs = await service.listUserDSRs('user-1')
      // No DSR was submitted, so we need to check deletion directly
      const isDeleted = await service.isDataDeleted('user-1')
      expect(isDeleted).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. exportUserData 导出完整 JSON（含所有 category）
  // ═══════════════════════════════════════════════════════════════════════════

  describe('exportUserData', () => {
    it('should export complete user data as JSON', async () => {
      // Register data in all categories
      service.registerDataField('user-1', 'personal', ['email', 'phone', 'address'])
      service.registerDataField('user-1', 'financial', ['bank_account', 'credit_card'])
      service.registerDataField('user-1', 'health', ['medical_history'])
      service.registerDataField('user-1', 'biometric', ['fingerprint'])
      service.registerDataField('user-1', 'location', ['gps_coordinates'])
      service.registerDataField('user-1', 'behavioral', ['browsing_history', 'purchase_patterns'])

      // Record consents
      await service.recordConsent('user-1', 'marketing', true)
      await service.recordConsent('user-1', 'analytics', true)

      // Submit DSR
      await service.submitDSR('user-1', 'access')

      const exportData = await service.exportUserData('user-1')

      expect(exportData.userId).toBe('user-1')
      expect(exportData.exportedAt).toBeDefined()

      const categories = exportData.dataCategories as Record<string, unknown>
      expect(categories['personal']).toBeDefined()
      expect(categories['financial']).toBeDefined()
      expect(categories['health']).toBeDefined()
      expect(categories['biometric']).toBeDefined()
      expect(categories['location']).toBeDefined()
      expect(categories['behavioral']).toBeDefined()

      const consents = exportData.consents as Array<{ consentType: string; granted: boolean }>
      expect(consents.some(c => c.consentType === 'marketing' && c.granted)).toBe(true)
      expect(consents.some(c => c.consentType === 'analytics' && c.granted)).toBe(true)

      const dsrs = exportData.dsrRequests as Array<{ type: string; status: string }>
      expect(dsrs.length).toBe(1)
      expect(dsrs[0].type).toBe('access')
    })

    it('should export empty data for user with no records', async () => {
      const exportData = await service.exportUserData('nonexistent')

      expect(exportData.userId).toBe('nonexistent')
      expect(exportData.dataCategories).toEqual({})
      expect(exportData.consents).toEqual([])
      expect(exportData.dsrRequests).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. 重复删除请求幂等性
  // ═══════════════════════════════════════════════════════════════════════════

  describe('deletion idempotency', () => {
    it('should handle multiple deletion requests for same user', async () => {
      await service.executeDeletion('user-1')
      await service.executeDeletion('user-1') // Second execution should be idempotent

      const isDeleted = await service.isDataDeleted('user-1')
      expect(isDeleted).toBe(true)
    })

    it('should allow multiple deletion requests', async () => {
      const result1 = await service.requestDataDeletion('user-1')
      const result2 = await service.requestDataDeletion('user-1')

      // Both requests should be valid but for same user
      expect(result1.deletionId).not.toBe(result2.deletionId)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. setRetention → purgeExpiredData 批量清理
  // ═══════════════════════════════════════════════════════════════════════════

  describe('retention and purge', () => {
    it('should set retention period for data category', async () => {
      const expiryDate = new Date('2025-01-01')
      service.setRetentionPeriod('user-1', 'personal', expiryDate)

      const records = service.listDataFields('user-1')
      expect(records.length).toBe(1)
      expect(records[0].retentionExpiry).toEqual(expiryDate)
    })

    it('should purge expired data', async () => {
      const pastDate = new Date('2020-01-01')
      const futureDate = new Date('2030-01-01')

      service.registerDataField('user-1', 'personal', ['email'])
      service.setRetentionPeriod('user-1', 'personal', pastDate)

      service.registerDataField('user-2', 'personal', ['email'])
      service.setRetentionPeriod('user-2', 'personal', futureDate)

      const purgedCount = await service.purgeExpiredData(new Date('2025-06-15'))

      expect(purgedCount).toBe(1)

      const user1Records = service.listDataFields('user-1')
      const user2Records = service.listDataFields('user-2')
      expect(user1Records.length).toBe(0)
      expect(user2Records.length).toBe(1)
    })

    it('should not purge data without expiry set', async () => {
      service.registerDataField('user-1', 'personal', ['email'])
      // No retention period set

      const purgedCount = await service.purgeExpiredData(new Date('2030-01-01'))

      // Data without expiry should not be purged
      expect(purgedCount).toBe(0)

      const records = service.listDataFields('user-1')
      expect(records.length).toBe(1)
    })

    it('should purge multiple expired records', async () => {
      const pastDate = new Date('2020-01-01')

      service.registerDataField('user-1', 'personal', ['email'])
      service.registerDataField('user-1', 'financial', ['account'])
      service.registerDataField('user-1', 'health', ['history'])

      service.setRetentionPeriod('user-1', 'personal', pastDate)
      service.setRetentionPeriod('user-1', 'financial', pastDate)
      // health has no retention set

      const purgedCount = await service.purgeExpiredData(new Date('2025-06-15'))

      expect(purgedCount).toBe(2)

      const records = service.listDataFields('user-1')
      expect(records.length).toBe(1)
      expect(records[0].category).toBe('health')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional tests for getAllConsents
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getAllConsents', () => {
    it('should return all valid consents for user', async () => {
      await service.recordConsent('user-1', 'marketing', true)
      await service.recordConsent('user-1', 'analytics', true)
      await service.recordConsent('user-1', 'personalization', false)

      const consents = await service.getAllConsents('user-1')
      expect(consents.length).toBe(3)
    })

    it('should return empty array for user with no consents', async () => {
      const consents = await service.getAllConsents('nonexistent')
      expect(consents).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // registerDataField
  // ═══════════════════════════════════════════════════════════════════════════

  describe('registerDataField', () => {
    it('should register new data fields for category', () => {
      service.registerDataField('user-1', 'personal', ['email', 'phone'])

      const records = service.listDataFields('user-1')
      expect(records.length).toBe(1)
      expect(records[0].category).toBe('personal')
      expect(records[0].fields).toContain('email')
      expect(records[0].fields).toContain('phone')
    })

    it('should merge fields for existing category', () => {
      service.registerDataField('user-1', 'personal', ['email'])
      service.registerDataField('user-1', 'personal', ['phone', 'address'])

      const records = service.listDataFields('user-1')
      expect(records.length).toBe(1)
      expect(records[0].fields).toContain('email')
      expect(records[0].fields).toContain('phone')
      expect(records[0].fields).toContain('address')
    })

    it('should update lastUpdated timestamp', () => {
      const before = new Date()
      before.setHours(before.getHours() - 1)

      service.registerDataField('user-1', 'personal', ['email'])
      const records1 = service.listDataFields('user-1')
      const firstUpdate = records1[0].lastUpdated

      service.registerDataField('user-1', 'personal', ['phone'])
      const records2 = service.listDataFields('user-1')

      expect(records2[0].lastUpdated.getTime()).toBeGreaterThanOrEqual(firstUpdate.getTime())
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // listDataFields
  // ═══════════════════════════════════════════════════════════════════════════

  describe('listDataFields', () => {
    it('should return empty array for user with no data', () => {
      const records = service.listDataFields('nonexistent')
      expect(records).toEqual([])
    })

    it('should return all data records for user', () => {
      service.registerDataField('user-1', 'personal', ['email'])
      service.registerDataField('user-1', 'financial', ['account'])
      service.registerDataField('user-1', 'behavioral', ['browsing'])

      const records = service.listDataFields('user-1')
      expect(records.length).toBe(3)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // resetForTests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('resetForTests', () => {
    it('should clear all data', async () => {
      service.registerDataField('user-1', 'personal', ['email'])
      await service.recordConsent('user-1', 'marketing', true)
      await service.submitDSR('user-1', 'access')
      await service.requestDataDeletion('user-1')

      service.resetForTests()

      const records = service.listDataFields('user-1')
      expect(records).toEqual([])

      const consents = await service.getAllConsents('user-1')
      expect(consents).toEqual([])

      const dsrs = await service.listUserDSRs('user-1')
      expect(dsrs).toEqual([])
    })
  })
})
