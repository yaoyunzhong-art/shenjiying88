import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  CheckLicenseQueryDto,
  ListLicenseQueryDto,
  CreateLicenseDto,
  SuspendLicenseDto,
  LicenseResponseDto,
  CheckLicenseResponseDto,
  LicenseListResponseDto,
  AuditLogResponseDto,
  AuditLogListResponseDto,
} from './license.dto'

// ============================================================
// 1. CheckLicenseQueryDto
// ============================================================
describe('license.dto: CheckLicenseQueryDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new CheckLicenseQueryDto()
    assert.equal(dto.scope, undefined)
    assert.equal(dto.storeId, undefined)
  })

  it('设置 scope', () => {
    const dto = new CheckLicenseQueryDto()
    dto.scope = 'ai.capability'
    assert.equal(dto.scope, 'ai.capability')
  })

  it('设置 storeId', () => {
    const dto = new CheckLicenseQueryDto()
    dto.storeId = 'store-001'
    assert.equal(dto.storeId, 'store-001')
  })

  it('设置所有字段', () => {
    const dto = new CheckLicenseQueryDto()
    dto.scope = 'ai.knowledge'
    dto.storeId = 'store-002'
    assert.equal(dto.scope, 'ai.knowledge')
    assert.equal(dto.storeId, 'store-002')
  })

  it('instanceof 检查', () => {
    assert.ok(new CheckLicenseQueryDto() instanceof CheckLicenseQueryDto)
  })
})

// ============================================================
// 2. CreateLicenseDto
// ============================================================
describe('license.dto: CreateLicenseDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new CreateLicenseDto()
    assert.equal(dto.tenantId, undefined)
    assert.equal(dto.scope, undefined)
    assert.equal(dto.level, undefined)
    assert.equal(dto.quota, undefined)
  })

  it('设置完整创建请求', () => {
    const dto = new CreateLicenseDto()
    dto.tenantId = 'tenant-A'
    dto.storeId = 'store-001'
    dto.scope = 'ai.capability'
    dto.level = 'tenant'
    dto.validFrom = '2026-01-01T00:00:00.000Z'
    dto.validUntil = '2027-01-01T00:00:00.000Z'
    dto.quota = 100000
    dto.priceCents = 99900
    dto.autoRenew = true
    dto.activationSource = 'paid'
    dto.createdBy = 'admin'

    assert.equal(dto.tenantId, 'tenant-A')
    assert.equal(dto.scope, 'ai.capability')
    assert.equal(dto.level, 'tenant')
    assert.equal(dto.quota, 100000)
    assert.equal(dto.priceCents, 99900)
    assert.equal(dto.autoRenew, true)
    assert.equal(dto.activationSource, 'paid')
    assert.equal(dto.createdBy, 'admin')
  })

  it('不设置可选字段', () => {
    const dto = new CreateLicenseDto()
    dto.tenantId = 'tenant-B'
    dto.scope = 'ai.capability'
    dto.level = 'store'
    dto.validFrom = '2026-06-01T00:00:00.000Z'
    dto.validUntil = '2026-12-31T00:00:00.000Z'
    dto.activationSource = 'trial'
    dto.createdBy = 'system'

    assert.equal(dto.storeId, undefined)
    assert.equal(dto.quota, undefined)
    assert.equal(dto.priceCents, undefined)
    assert.equal(dto.autoRenew, undefined)
  })

  it('支持所有激活源类型', () => {
    const sources: Array<CreateLicenseDto['activationSource']> = ['paid', 'trial', 'tier-match', 'whitelist']
    for (const source of sources) {
      const dto = new CreateLicenseDto()
      dto.activationSource = source
      assert.equal(dto.activationSource, source)
    }
  })
})

// ============================================================
// 3. SuspendLicenseDto
// ============================================================
describe('license.dto: SuspendLicenseDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new SuspendLicenseDto()
    assert.equal(dto.reason, undefined)
  })

  it('设置 reason', () => {
    const dto = new SuspendLicenseDto()
    dto.reason = '逾期未付款'
    assert.equal(dto.reason, '逾期未付款')
  })

  it('设置为空字符串 reason', () => {
    const dto = new SuspendLicenseDto()
    dto.reason = ''
    assert.equal(dto.reason, '')
  })
})

// ============================================================
// 4. LicenseResponseDto
// ============================================================
describe('license.dto: LicenseResponseDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new LicenseResponseDto()
    assert.equal(dto.id, undefined)
    assert.equal(dto.storeId, undefined)
    assert.equal(dto.quota, undefined)
    assert.equal(dto.usedQuota, undefined)
  })

  it('设置完整响应数据', () => {
    const dto = new LicenseResponseDto()
    dto.id = 'lic-001'
    dto.tenantId = 'tenant-A'
    dto.scope = 'ai.capability'
    dto.level = 'tenant'
    dto.status = 'active'
    dto.activationSource = 'paid'
    dto.validFrom = '2026-01-01T00:00:00.000Z'
    dto.validUntil = '2027-01-01T00:00:00.000Z'
    dto.autoRenew = true
    dto.createdBy = 'admin'
    dto.createdAt = '2026-01-01T00:00:00.000Z'
    dto.updatedAt = '2026-06-01T00:00:00.000Z'

    assert.equal(dto.id, 'lic-001')
    assert.equal(dto.status, 'active')
    assert.equal(dto.autoRenew, true)
  })

  it('支持所有授权状态', () => {
    const statuses: Array<LicenseResponseDto['status']> = ['active', 'expired', 'suspended', 'pending']
    for (const status of statuses) {
      const dto = new LicenseResponseDto()
      dto.status = status
      assert.equal(dto.status, status)
    }
  })

  it('支持所有授权范围', () => {
    const scopes: Array<LicenseResponseDto['scope']> = ['ai.capability', 'ai.knowledge', 'ai.industry', 'integration.open']
    for (const scope of scopes) {
      const dto = new LicenseResponseDto()
      dto.scope = scope
      assert.equal(dto.scope, scope)
    }
  })
})

// ============================================================
// 5. CheckLicenseResponseDto
// ============================================================
describe('license.dto: CheckLicenseResponseDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new CheckLicenseResponseDto()
    assert.equal(dto.allowed, undefined)
    assert.equal(dto.license, undefined)
    assert.equal(dto.reason, undefined)
    assert.equal(dto.trialDaysRemaining, undefined)
    assert.equal(dto.quotaRemaining, undefined)
  })

  it('设置允许响应', () => {
    const dto = new CheckLicenseResponseDto()
    dto.allowed = true
    dto.license = new LicenseResponseDto()
    dto.license.id = 'lic-001'
    dto.license.scope = 'ai.capability'
    dto.quotaRemaining = 5000

    assert.equal(dto.allowed, true)
    assert.equal(dto.license.id, 'lic-001')
    assert.equal(dto.quotaRemaining, 5000)
  })

  it('设置拒绝响应', () => {
    const dto = new CheckLicenseResponseDto()
    dto.allowed = false
    dto.reason = 'License expired'

    assert.equal(dto.allowed, false)
    assert.equal(dto.reason, 'License expired')
  })

  it('设置试用剩余天数', () => {
    const dto = new CheckLicenseResponseDto()
    dto.allowed = true
    dto.trialDaysRemaining = 25

    assert.equal(dto.trialDaysRemaining, 25)
    assert.equal(dto.allowed, true)
  })
})

// ============================================================
// 6. LicenseListResponseDto
// ============================================================
describe('license.dto: LicenseListResponseDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new LicenseListResponseDto()
    assert.equal(dto.data, undefined)
    assert.equal(dto.total, undefined)
  })

  it('设置空列表', () => {
    const dto = new LicenseListResponseDto()
    dto.data = []
    dto.total = 0

    assert.deepEqual(dto.data, [])
    assert.equal(dto.total, 0)
  })

  it('设置包含 2 个授权的列表', () => {
    const dto = new LicenseListResponseDto()
    const l1 = new LicenseResponseDto()
    l1.id = 'lic-001'
    const l2 = new LicenseResponseDto()
    l2.id = 'lic-002'
    dto.data = [l1, l2]
    dto.total = 2

    assert.equal(dto.data.length, 2)
    assert.equal(dto.total, 2)
    assert.equal(dto.data[0].id, 'lic-001')
    assert.equal(dto.data[1].id, 'lic-002')
  })
})

// ============================================================
// 7. AuditLogResponseDto
// ============================================================
describe('license.dto: AuditLogResponseDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new AuditLogResponseDto()
    assert.equal(dto.id, undefined)
    assert.equal(dto.context, undefined)
    assert.equal(dto.reason, undefined)
  })

  it('设置完整审计日志', () => {
    const dto = new AuditLogResponseDto()
    dto.id = 'audit-001'
    dto.licenseId = 'lic-001'
    dto.tenantId = 'tenant-A'
    dto.action = 'consume'
    dto.scope = 'ai.capability'
    dto.operator = 'admin'
    dto.result = 'success'
    dto.timestamp = '2026-06-28T06:00:00.000Z'

    assert.equal(dto.id, 'audit-001')
    assert.equal(dto.action, 'consume')
    assert.equal(dto.result, 'success')
  })

  it('设置审计日志含 context', () => {
    const dto = new AuditLogResponseDto()
    dto.id = 'audit-002'
    dto.licenseId = 'lic-002'
    dto.tenantId = 'tenant-A'
    dto.action = 'reject'
    dto.scope = 'ai.industry'
    dto.operator = 'system'
    dto.result = 'denied'
    dto.reason = '无效授权范围'
    dto.context = { requestId: 'req-001' }
    dto.timestamp = '2026-06-28T06:00:00.000Z'

    assert.deepEqual(dto.context, { requestId: 'req-001' })
    assert.equal(dto.reason, '无效授权范围')
  })

  it('支持所有 actions', () => {
    const actions: Array<AuditLogResponseDto['action']> = ['create', 'activate', 'suspend', 'expire', 'consume', 'reject']
    for (const action of actions) {
      const dto = new AuditLogResponseDto()
      dto.action = action
      assert.equal(dto.action, action)
    }
  })
})

// ============================================================
// 8. AuditLogListResponseDto
// ============================================================
describe('license.dto: AuditLogListResponseDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new AuditLogListResponseDto()
    assert.equal(dto.data, undefined)
    assert.equal(dto.total, undefined)
  })

  it('设置包含 3 条审计日志', () => {
    const dto = new AuditLogListResponseDto()
    dto.data = [
      Object.assign(new AuditLogResponseDto(), { id: 'audit-1' }),
      Object.assign(new AuditLogResponseDto(), { id: 'audit-2' }),
      Object.assign(new AuditLogResponseDto(), { id: 'audit-3' }),
    ]
    dto.total = 3

    assert.equal(dto.data.length, 3)
    assert.equal(dto.total, 3)
  })
})

// ============================================================
// 9. ListLicenseQueryDto
// ============================================================
describe('license.dto: ListLicenseQueryDto', () => {
  it('默认属性为 undefined', () => {
    const dto = new ListLicenseQueryDto()
    assert.equal(dto.storeId, undefined)
    assert.equal(dto.limit, undefined)
  })

  it('设置 storeId', () => {
    const dto = new ListLicenseQueryDto()
    dto.storeId = 'store-001'
    assert.equal(dto.storeId, 'store-001')
  })

  it('设置 limit', () => {
    const dto = new ListLicenseQueryDto()
    dto.limit = '50'
    assert.equal(dto.limit, '50')
  })
})
