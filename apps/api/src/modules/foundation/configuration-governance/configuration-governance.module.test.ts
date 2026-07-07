import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { ConfigurationGovernanceModule } from './configuration-governance.module'
import { ConfigurationGovernanceController } from './configuration-governance.controller'
import { ConfigurationGovernanceService } from './configuration-governance.service'

describe('ConfigurationGovernanceModule', () => {
  it('module class should be defined', () => {
    assert.ok(ConfigurationGovernanceModule !== undefined)
    assert.ok(typeof ConfigurationGovernanceModule === 'function')
  })

  it('module should register controller and service in metadata', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', ConfigurationGovernanceModule) || []
    const providers: unknown[] = Reflect.getMetadata('providers', ConfigurationGovernanceModule) || []
    const exports: unknown[] = Reflect.getMetadata('exports', ConfigurationGovernanceModule) || []

    assert.ok(Array.isArray(controllers))
    assert.ok(controllers.includes(ConfigurationGovernanceController))
    assert.ok(Array.isArray(providers))
    assert.ok(providers.includes(ConfigurationGovernanceService))
    assert.ok(Array.isArray(exports))
    assert.ok(exports.includes(ConfigurationGovernanceService))
  })

  it('controller should have all expected endpoints', () => {
    const proto = ConfigurationGovernanceController.prototype
    assert.equal(typeof proto.getManagementMetadata, 'function')
    assert.equal(typeof proto.getOperationsOverview, 'function')
    assert.equal(typeof proto.getSnapshot, 'function')
    assert.equal(typeof proto.getFeatureFlags, 'function')
    assert.equal(typeof proto.getFeatureFlagRecords, 'function')
    assert.equal(typeof proto.getFeatureFlag, 'function')
    assert.equal(typeof proto.saveFeatureFlag, 'function')
    assert.equal(typeof proto.getConfigEntries, 'function')
    assert.equal(typeof proto.saveConfigEntry, 'function')
    assert.equal(typeof proto.getAudit, 'function')
    assert.equal(typeof proto.getAuditSummary, 'function')
    assert.equal(typeof proto.getApprovals, 'function')
    assert.equal(typeof proto.getApprovalSummary, 'function')
    assert.equal(typeof proto.getApprovalDetail, 'function')
    assert.equal(typeof proto.getApprovalTimeline, 'function')
    assert.equal(typeof proto.getSecrets, 'function')
    assert.equal(typeof proto.getSecret, 'function')
    assert.equal(typeof proto.rotateSecret, 'function')
    assert.equal(typeof proto.registerSecret, 'function')
    assert.equal(typeof proto.getCertificates, 'function')
    assert.equal(typeof proto.getCertificate, 'function')
    assert.equal(typeof proto.getSecretsCertificatePosture, 'function')
  })

  it('service getGovernanceBaselines returns 3 baselines (no DI)', () => {
    // getGovernanceBaselines uses only inline data, no prisma dependency
    const service = new ConfigurationGovernanceService(
      { $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}) } as any,
      {} as any
    )
    const baselines = service.getGovernanceBaselines()
    assert.ok(Array.isArray(baselines))
    assert.equal(baselines.length, 3)
    assert.ok(baselines.some((b: { key: string }) => b.key === 'data-tiering'))
    assert.ok(baselines.some((b: { key: string }) => b.key === 'secrets-certificate-rotation'))
    assert.ok(baselines.some((b: { key: string }) => b.key === 'multi-cloud-iac-environment-isolation'))
  })

  it('service getDescriptor returns correct descriptor (no DI)', () => {
    const service = new ConfigurationGovernanceService(
      { $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}) } as any,
      {} as any
    )
    const descriptor = service.getDescriptor()
    assert.equal(descriptor.key, 'configuration-governance')
    assert.equal(descriptor.name, 'Configuration Governance Module')
    assert.ok(Array.isArray(descriptor.capabilities))
    assert.ok(descriptor.capabilities.length >= 4)
    assert.ok(descriptor.capabilities.some((c: { key: string }) => c.key === 'config-center'))
    assert.ok(descriptor.capabilities.some((c: { key: string }) => c.key === 'feature-flags'))
    assert.ok(descriptor.capabilities.some((c: { key: string }) => c.key === 'secrets-certificates'))
  })

  it('service getManagementMetadata returns 4 entries (no DB needed)', () => {
    const service = new ConfigurationGovernanceService(
      { $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}) } as any,
      {} as any
    )
    const metadata = service.getManagementMetadata()
    assert.ok(Array.isArray(metadata))
    assert.equal(metadata.length, 4)
    assert.ok(metadata.every((m: any) => typeof m.operation === 'string'))
    assert.ok(metadata.every((m: any) => typeof m.rbac === 'object'))
  })

  it('service evaluateFeatureFlag works with default context', async () => {
    const mockPrisma = {
      featureFlag: { findMany: () => Promise.resolve([]) },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)
    }
    const service = new ConfigurationGovernanceService(mockPrisma as any, {} as any)
    const result = await service.evaluateFeatureFlag('new-checkout', {
      tenantId: 'tenant-premium'
    })
    assert.equal(result.key, 'new-checkout')
    assert.equal(result.enabled, true)
    assert.ok(typeof result.reason === 'string')
    assert.ok(typeof result.rolloutPercentage === 'number')
    assert.equal(result.source, 'in-memory')
  })

  it('service getSecretMetadata returns fallback secrets', async () => {
    const mockPrisma = {
      secretAsset: { findMany: () => Promise.resolve([]) },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)
    }
    const service = new ConfigurationGovernanceService(mockPrisma as any, {} as any)
    const secrets = await service.getSecretMetadata()
    assert.ok(Array.isArray(secrets))
    assert.ok(secrets.length >= 1)
    assert.ok(secrets.every((s: any) => typeof s.name === 'string'))
    const lytSecret = secrets.find((s: any) => s.name === 'lyt-webhook-signing-secret')
    assert.ok(lytSecret)
    assert.equal(lytSecret.type, 'webhook-signing')
  })

  it('service resolveConfigSnapshot returns snapshot shape', async () => {
    const mockPrisma = {
      configEntry: { findMany: () => Promise.resolve([]) },
      featureFlag: { findMany: () => Promise.resolve([]) },
      secretAsset: { findMany: () => Promise.resolve([]) },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)
    }
    const service = new ConfigurationGovernanceService(mockPrisma as any, {} as any)
    const snapshot = await service.resolveConfigSnapshot({
      tenantId: 'tenant-demo',
      brandId: 'brand-default',
      storeId: 'store-default'
    })
    assert.ok(typeof snapshot.snapshotId === 'string')
    assert.ok(snapshot.snapshotId.startsWith('snapshot'))
    assert.ok(typeof snapshot.generatedAt === 'string')
    assert.ok(Array.isArray(snapshot.scopeChain))
    assert.equal(snapshot.context.tenantId, 'tenant-demo')
    assert.ok(typeof snapshot.config === 'object')
    assert.ok(typeof snapshot.checksum === 'string')
  })
})
