import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TenantLLMController } from './llm-config.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TenantLLMController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, TenantLLMController)

describe('TenantLLMController metadata', () => {
  const readHandlers = [
    TenantLLMController.prototype.getConfigs,
    TenantLLMController.prototype.getConfig,
    TenantLLMController.prototype.getStats,
    TenantLLMController.prototype.getCallLogs,
    TenantLLMController.prototype.getAuditLogs,
  ]

  const writeHandlers = [
    TenantLLMController.prototype.createConfig,
    TenantLLMController.prototype.updateConfig,
    TenantLLMController.prototype.deleteConfig,
    TenantLLMController.prototype.applyConfig,
  ]

  it('controller should keep llm path, guard, and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', TenantLLMController), 'llm')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, TenantLLMController), undefined)
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, TenantLLMController), {})
    assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, TenantLLMController), ['llm:view'])

    const guards = Reflect.getMetadata('__guards__', TenantLLMController) as unknown[] | undefined
    assert.ok(guards)
    assert.equal(guards?.length, 1)
  })

  it('all routes should require tenant scope', () => {
    ;[
      ...readHandlers,
      ...writeHandlers,
      TenantLLMController.prototype.approveConfig,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TenantLLMController.prototype.getConfigs, 0, 'configs'],
      [TenantLLMController.prototype.getConfig, 0, 'configs/:id'],
      [TenantLLMController.prototype.createConfig, 1, 'configs'],
      [TenantLLMController.prototype.updateConfig, 2, 'configs/:id'],
      [TenantLLMController.prototype.deleteConfig, 3, 'configs/:id'],
      [TenantLLMController.prototype.applyConfig, 1, 'configs/:id/apply'],
      [TenantLLMController.prototype.approveConfig, 1, 'configs/:id/approve'],
      [TenantLLMController.prototype.getStats, 0, 'stats'],
      [TenantLLMController.prototype.getCallLogs, 0, 'logs'],
      [TenantLLMController.prototype.getAuditLogs, 0, 'audit-logs'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })

  it('read routes should reuse llm:view', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['llm:view'])
    })
  })

  it('write routes should reuse llm:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['llm:write'])
    })
  })

  it('approve route should reuse llm:approve', () => {
    assert.deepEqual(
      resolvePermissions(TenantLLMController.prototype.approveConfig),
      ['llm:approve'],
    )
  })
})
