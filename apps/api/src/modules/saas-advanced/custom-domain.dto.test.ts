import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import {
  AddDomainRequest,
  CurrentPrimaryDomainQueryRequest,
  CurrentPrimaryDomainResponse,
  DomainListQueryRequest,
  ValidateDomainRequest,
  ValidateDomainResponse,
  DomainVerifyHint,
  DomainListItem,
  DomainListResponse,
  DomainDetailResponse,
  ResolveHostRequest,
  ResolveHostResponse,
} from './custom-domain.dto'

describe('saas-advanced custom-domain dto', () => {
  it('AddDomainRequest 要求 domain 非空', () => {
    const dto = plainToInstance(AddDomainRequest, {})
    const errors = validateSync(dto)
    assert.ok(errors.length > 0)
  })

  it('ValidateDomainRequest 要求 domain 非空', () => {
    const dto = plainToInstance(ValidateDomainRequest, {})
    const errors = validateSync(dto)
    assert.ok(errors.length > 0)
  })

  it('ResolveHostRequest 要求 host 非空', () => {
    const dto = plainToInstance(ResolveHostRequest, {})
    const errors = validateSync(dto)
    assert.ok(errors.length > 0)
  })

  it('CurrentPrimaryDomainQueryRequest 支持 scope 与 brand/store 参数', () => {
    const dto = plainToInstance(CurrentPrimaryDomainQueryRequest, {
      scopeType: 'STORE',
      brandId: 'brand-001',
      storeId: 'store-001',
    })
    const errors = validateSync(dto)
    assert.equal(errors.length, 0)
    assert.equal(dto.scopeType, 'STORE')
    assert.equal(dto.brandId, 'brand-001')
    assert.equal(dto.storeId, 'store-001')
  })

  it('CurrentPrimaryDomainQueryRequest 拒绝非法 scope', () => {
    const dto = plainToInstance(CurrentPrimaryDomainQueryRequest, {
      scopeType: 'PORTAL',
    })
    const errors = validateSync(dto)
    assert.ok(errors.length > 0)
  })

  it('DomainListQueryRequest 支持状态筛选和分页转换', () => {
    const dto = plainToInstance(DomainListQueryRequest, {
      status: 'active',
      scopeType: 'BRAND',
      page: '2',
      pageSize: '5',
      sortBy: 'domain',
      sortOrder: 'asc',
      keyword: 'brand-http',
    })
    const errors = validateSync(dto)
    assert.equal(errors.length, 0)
    assert.equal(dto.status, 'active')
    assert.equal(dto.scopeType, 'BRAND')
    assert.equal(dto.page, 2)
    assert.equal(dto.pageSize, 5)
    assert.equal(dto.sortBy, 'domain')
    assert.equal(dto.sortOrder, 'asc')
  })

  it('DomainListQueryRequest 拒绝非法分页', () => {
    const dto = plainToInstance(DomainListQueryRequest, {
      page: 0,
      pageSize: 101,
    })
    const errors = validateSync(dto)
    assert.ok(errors.length > 0)
  })

  it('DomainListQueryRequest 拒绝非法排序字段', () => {
    const dto = plainToInstance(DomainListQueryRequest, {
      sortBy: 'tenantId',
      sortOrder: 'upward',
    })
    const errors = validateSync(dto)
    assert.ok(errors.length > 0)
  })

  it('ValidateDomainResponse 校验通过', () => {
    const resp: ValidateDomainResponse = { valid: true }
    assert.equal(resp.valid, true)
    assert.equal(resp.error, undefined)
  })

  it('ValidateDomainResponse 校验失败含错误', () => {
    const resp: ValidateDomainResponse = { valid: false, error: '域名格式不合法' }
    assert.equal(resp.valid, false)
    assert.equal(resp.error, '域名格式不合法')
  })

  it('DomainVerifyHint 完整字段', () => {
    const hint: DomainVerifyHint = {
      host: '_shenjiying-verify.acme.example.com',
      value: 'shenjiying-verify=abc123',
      type: 'TXT',
      instructions: '请在 DNS 服务商添加 TXT 记录',
    }
    assert.equal(hint.type, 'TXT')
    assert.ok(hint.host.startsWith('_shenjiying-verify'))
  })

  it('DomainListItem 基本字段', () => {
    const item: DomainListItem = {
      id: 'dom-001',
      scopeType: 'TENANT',
      tenantId: 'tenant-abc',
      domain: 'acme.example.com',
      status: 'active',
      verificationFailCount: 0,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      createdBy: 'user-001',
    }
    assert.equal(item.domain, 'acme.example.com')
    assert.equal(item.status, 'active')
  })

  it('DomainListItem 校验失败次数', () => {
    const item: DomainListItem = {
      id: 'dom-002',
      scopeType: 'BRAND',
      tenantId: 'tenant-abc',
      domain: 'failed.example.com',
      status: 'disabled',
      verificationFailCount: 3,
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: '2026-06-02T00:00:00Z',
      createdBy: 'user-001',
    }
    assert.equal(item.verificationFailCount, 3)
    assert.equal(item.status, 'disabled')
  })

  it('DomainListResponse 空列表', () => {
    const resp: DomainListResponse = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
    assert.equal(resp.total, 0)
    assert.equal(resp.items.length, 0)
  })

  it('DomainListResponse 含多个域名', () => {
    const item: DomainListItem = {
      id: 'dom-001',
      scopeType: 'TENANT',
      tenantId: 'tenant-abc',
      domain: 'a.example.com',
      status: 'active',
      verificationFailCount: 0,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      createdBy: 'user-001',
    }
    const resp: DomainListResponse = {
      items: [item],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      sortBy: 'domain',
      sortOrder: 'asc',
    }
    assert.equal(resp.total, 1)
    assert.equal(resp.items[0].domain, 'a.example.com')
    assert.equal(resp.sortBy, 'domain')
  })

  it('DomainDetailResponse 含 hint', () => {
    const resp: DomainDetailResponse = {
      id: 'dom-001',
      scopeType: 'TENANT',
      tenantId: 'tenant-abc',
      domain: 'acme.example.com',
      status: 'pending_verification',
      verificationFailCount: 0,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      createdBy: 'user-001',
      hint: {
        host: '_shenjiying-verify.acme.example.com',
        value: 'shenjiying-verify=token123',
        type: 'TXT',
        instructions: '添加 DNS TXT 记录',
      },
    }
    assert.equal(resp.status, 'pending_verification')
    assert.equal(resp.hint.type, 'TXT')
    assert.equal(resp.ssl, undefined)
  })

  it('DomainDetailResponse 含 SSL 信息', () => {
    const resp: DomainDetailResponse = {
      id: 'dom-001',
      scopeType: 'BRAND',
      tenantId: 'tenant-abc',
      domain: 'secure.example.com',
      status: 'active_ssl',
      verificationFailCount: 0,
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      createdBy: 'user-001',
      ssl: {
        provider: 'letsencrypt',
        expiresAt: '2026-09-29T00:00:00Z',
        fingerprint: 'abc123...',
        lastRenewedAt: '2026-06-30T00:00:00Z',
      },
      lastVerifiedAt: '2026-06-30T00:00:00Z',
      hint: {
        host: '_shenjiying-verify.secure.example.com',
        value: 'shenjiying-verify=token456',
        type: 'TXT',
        instructions: 'DNS TXT 记录',
      },
    }
    assert.equal(resp.status, 'active_ssl')
    assert.equal(resp.ssl!.provider, 'letsencrypt')
    assert.ok(resp.lastVerifiedAt != null)
  })

  it('ResolveHostResponse 已解析', () => {
    const resp: ResolveHostResponse = {
      host: 'acme.example.com',
      tenantId: 'tenant-abc',
      resolved: true,
    }
    assert.equal(resp.resolved, true)
    assert.equal(resp.tenantId, 'tenant-abc')
  })

  it('ResolveHostResponse 未解析', () => {
    const resp: ResolveHostResponse = {
      host: 'unknown.example.com',
      tenantId: null,
      resolved: false,
    }
    assert.equal(resp.resolved, false)
    assert.equal(resp.tenantId, null)
  })

  it('CurrentPrimaryDomainResponse 支持已解析主域名响应', () => {
    const resp: CurrentPrimaryDomainResponse = {
      scopeType: 'BRAND',
      tenantId: 'tenant-abc',
      brandId: 'brand-001',
      resolved: true,
      item: {
        id: 'dom-100',
        scopeType: 'BRAND',
        tenantId: 'tenant-abc',
        brandId: 'brand-001',
        domain: 'brand.example.com',
        status: 'active',
        verificationFailCount: 0,
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
        createdBy: 'user-001',
        isPrimary: true,
      },
    }
    assert.equal(resp.resolved, true)
    assert.equal(resp.item?.domain, 'brand.example.com')
  })

  it('CurrentPrimaryDomainResponse 支持未解析主域名响应', () => {
    const resp: CurrentPrimaryDomainResponse = {
      scopeType: 'TENANT',
      tenantId: 'tenant-abc',
      resolved: false,
      item: null,
    }
    assert.equal(resp.resolved, false)
    assert.equal(resp.item, null)
  })
})
