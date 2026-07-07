import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import 'reflect-metadata'
import {
  NavItemQueryDto,
  WorkbenchQueryDto,
  TenantContextDto,
  WorkbenchBootstrapRequestDto,
  CapabilityCheckDto,
  CapabilityBatchCheckDto,
  WorkbenchActionReplayDto,
  WorkbenchApprovalExecuteDto,
  WorkbenchHandlerCallbackDto,
  WorkbenchHandlerSyncDto,
  WorkbenchRuntimeReplaySubmitDto,
  WorkbenchSecretRotationDto
} from './workbench.dto'

describe('Workbench DTOs', () => {
  describe('NavItemQueryDto', () => {
    it('validates with optional fields', async () => {
      const dto = plainToInstance(NavItemQueryDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 0, 'empty dto should be valid (all fields optional)')
    })

    it('accepts role and channel filter', async () => {
      const dto = plainToInstance(NavItemQueryDto, {
        role: 'GUIDE',
        channel: 'PAD'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('accepts marketCode and capability', async () => {
      const dto = plainToInstance(NavItemQueryDto, {
        marketCode: 'cn-mainland',
        capability: 'member-crm'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('WorkbenchQueryDto', () => {
    it('validates with optional fields', async () => {
      const dto = plainToInstance(WorkbenchQueryDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('accepts boolean initialized', async () => {
      const dto = plainToInstance(WorkbenchQueryDto, {
        role: 'SUPER_ADMIN',
        initialized: true
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('TenantContextDto', () => {
    it('requires tenantId', async () => {
      const dto = plainToInstance(TenantContextDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
      assert.ok(errors.some(e => e.property === 'tenantId'))
    })

    it('accepts full tenant context', async () => {
      const dto = plainToInstance(TenantContextDto, {
        tenantId: 't-1',
        brandId: 'b-1',
        storeId: 's-1',
        marketCode: 'zh-cn'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('accepts minimal tenant context (only tenantId)', async () => {
      const dto = plainToInstance(TenantContextDto, {
        tenantId: 't-minimal'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('WorkbenchBootstrapRequestDto', () => {
    it('requires nested tenantContext', async () => {
      const dto = plainToInstance(WorkbenchBootstrapRequestDto, {})
      const errors = await validate(dto)
      assert.ok(errors.length > 0)
    })

    it('validates nested tenantContext', async () => {
      const dto = plainToInstance(WorkbenchBootstrapRequestDto, {
        tenantContext: { tenantId: 't-99' }
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('CapabilityCheckDto', () => {
    it('requires role and capability', async () => {
      const dto = plainToInstance(CapabilityCheckDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 2)
      assert.ok(errors.some(e => e.property === 'role'))
      assert.ok(errors.some(e => e.property === 'capability'))
    })

    it('validates with both fields', async () => {
      const dto = plainToInstance(CapabilityCheckDto, {
        role: 'GUIDE',
        capability: 'member-crm'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('CapabilityBatchCheckDto', () => {
    it('requires role and capabilities array', async () => {
      const dto = plainToInstance(CapabilityBatchCheckDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 2)
      assert.ok(errors.some(e => e.property === 'role'))
      assert.ok(errors.some(e => e.property === 'capabilities'))
    })

    it('validates batch check payload', async () => {
      const dto = plainToInstance(CapabilityBatchCheckDto, {
        role: 'STORE_MANAGER',
        capabilities: ['daily-report', 'field-scheduling']
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('accepts capabilities array with valid strings', async () => {
      const dto = plainToInstance(CapabilityBatchCheckDto, {
        role: 'GUIDE',
        capabilities: ['member-crm', 'promo-conversion']
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('accepts empty capabilities array', async () => {
      const dto = plainToInstance(CapabilityBatchCheckDto, {
        role: 'GUIDE',
        capabilities: []
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })

  describe('Workbench action DTOs', () => {
    it('approval execute dto requires approvalCode and idempotencyKey', async () => {
      const dto = plainToInstance(WorkbenchApprovalExecuteDto, {
        approvalCode: 'APP-001',
        idempotencyKey: 'approval:001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('secret rotation dto validates secret name and idempotency key', async () => {
      const dto = plainToInstance(WorkbenchSecretRotationDto, {
        secretName: 'db-password',
        idempotencyKey: 'secret:001',
        targetScope: 'tenant'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('runtime replay submit dto requires source receipt code', async () => {
      const dto = plainToInstance(WorkbenchRuntimeReplaySubmitDto, {
        sourceReceiptCode: 'REC-001',
        idempotencyKey: 'runtime:001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('handler sync dto requires ticket and idempotency key', async () => {
      const dto = plainToInstance(WorkbenchHandlerSyncDto, {
        ticketCode: 'TICKET-001',
        idempotencyKey: 'sync:001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('handler callback dto validates runtime callback enums', async () => {
      const dto = plainToInstance(WorkbenchHandlerCallbackDto, {
        callbackStatus: 'callback-recorded',
        ackToken: 'ACK-001',
        lastEvent: 'HANDLER_COMPLETED',
        summary: 'callback ok',
        idempotencyKey: 'callback:001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('action replay dto validates replay source enum', async () => {
      const dto = plainToInstance(WorkbenchActionReplayDto, {
        ledgerKey: 'LEDGER-001',
        requestedFrom: 'ADMIN_WEB_RUNTIME',
        ticketCode: 'TICKET-001',
        idempotencyKey: 'replay:001'
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })
  })
})
