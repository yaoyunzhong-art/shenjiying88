import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
it('lyt connection manager returns configured connection for scoped store', async () => {
  const { LytConnectionManager } = require('./lyt-connection.manager')
  const manager = new LytConnectionManager({
    store: {
      findFirst: async () => ({ id: 'store-42', tenantId: 'tenant-42', brandId: 'brand-42' })
    },
    lytConnection: {
      findFirst: async () => ({
        vendor: 'lyt-enterprise',
        vendorTenantId: 'vendor-tenant-42',
        vendorBrandId: 'vendor-brand-42',
        vendorStoreId: 'vendor-store-42',
        endpoint: 'https://lyt-store-42.example.com',
        authMode: 'bearer-token',
        credential: 'secret-token',
        credentialRef: 'vault://lyt/store-42',
        capabilities: ['member', 'payment', 'device'],
        // Use a recent updatedAt so the 7-day staleness threshold in
        // LytConnectionManager.computeHealthStatus treats the connection
        // as 'healthy'. A fixed historical date would flip it to 'stale'
        // and make the test time-bomb across long-running CI runs.
        updatedAt: new Date(Date.now() - 60 * 1000)
      })
    }
  })

  const conn = await manager.getConnectionForStore('store-42', { tenantId: 'tenant-42', brandId: 'brand-42' })

  assert.equal(conn.tenantId, 'tenant-42')
  assert.equal(conn.brandId, 'brand-42')
  assert.equal(conn.storeId, 'store-42')
  assert.equal(conn.vendor, 'lyt-enterprise')
  assert.equal(conn.vendorTenantId, 'vendor-tenant-42')
  assert.equal(conn.vendorBrandId, 'vendor-brand-42')
  assert.equal(conn.vendorStoreId, 'vendor-store-42')
  assert.equal(conn.endpoint, 'https://lyt-store-42.example.com')
  assert.equal(conn.authMode, 'bearer-token')
  assert.equal(conn.hasCredential, true)
  assert.equal(conn.credentialRef, 'vault://lyt/store-42')
  assert.deepStrictEqual(conn.capabilities, ['member', 'payment', 'device'])
  assert.equal(conn.connectionStatus, 'configured')
  assert.equal(conn.source, 'prisma')
  assert.equal(conn.resolutionLevel, 'store')
  assert.equal(conn.resolutionKey, 'store-42')
  assert.deepStrictEqual(conn.resolutionChain, ['store:store-42', 'brand:brand-42', 'tenant:tenant-42'])
  assert.equal(conn.healthStatus, 'healthy')
})

it('lyt connection manager returns scoped fallback when store has no connection config', async () => {
  const { LytConnectionManager } = require('./lyt-connection.manager')
  const manager = new LytConnectionManager({
    store: {
      findFirst: async () => ({ id: 'store-abc', tenantId: 'tenant-abc', brandId: 'brand-abc' })
    },
    lytConnection: {
      findFirst: async () => null
    }
  })

  const conn = await manager.getConnectionForStore('store-abc', { tenantId: 'tenant-abc' })

  assert.equal(conn.tenantId, 'tenant-abc')
  assert.equal(conn.brandId, 'brand-abc')
  assert.equal(conn.storeId, 'store-abc')
  assert.equal(conn.vendor, 'lyt')
  assert.equal(conn.vendorTenantId, 'tenant-abc')
  assert.equal(conn.vendorBrandId, 'brand-abc')
  assert.equal(conn.vendorStoreId, 'store-abc')
  assert.equal(conn.endpoint, 'mock://lyt/tenant-abc/store-abc')
  assert.equal(conn.authMode, 'mock-token')
  assert.equal(conn.hasCredential, false)
  assert.deepStrictEqual(conn.capabilities, ['member', 'payment', 'order', 'device', 'gate'])
  assert.equal(conn.connectionStatus, 'pending-configuration')
  assert.equal(conn.source, 'fallback')
  assert.equal(conn.resolutionLevel, 'fallback')
  assert.equal(conn.healthStatus, 'pending-configuration')
})

it('lyt connection manager resolves brand default connection when store-specific config is absent', async () => {
  const { LytConnectionManager } = require('./lyt-connection.manager')
  const requestedKeys: string[] = []
  const manager = new LytConnectionManager({
    store: {
      findFirst: async () => ({ id: 'store-brand', tenantId: 'tenant-brand', brandId: 'brand-brand' })
    },
    lytConnection: {
      findFirst: async ({ where }: { where: { storeId: string } }) => {
        requestedKeys.push(where.storeId)
        if (where.storeId === 'brand:brand-brand') {
          return {
            endpoint: 'https://lyt-brand.example.com',
            authMode: 'api-key',
            credential: null,
            capabilities: ['member', 'gate'],
            updatedAt: new Date('2026-05-01T00:00:00.000Z')
          }
        }

        return null
      }
    }
  })

  const conn = await manager.getConnectionForStore('store-brand', { tenantId: 'tenant-brand', brandId: 'brand-brand' })

  assert.deepStrictEqual(requestedKeys, ['store-brand', 'brand:brand-brand'])
  assert.equal(conn.endpoint, 'https://lyt-brand.example.com')
  assert.equal(conn.resolutionLevel, 'brand')
  assert.equal(conn.resolutionKey, 'brand:brand-brand')
  assert.deepStrictEqual(conn.capabilities, ['member', 'gate'])
  assert.equal(conn.connectionStatus, 'configured')
  assert.equal(conn.healthStatus, 'stale')
})

it('lyt connection manager resolves tenant default connection when brand config is absent', async () => {
  const { LytConnectionManager } = require('./lyt-connection.manager')
  const requestedKeys: string[] = []
  const manager = new LytConnectionManager({
    store: {
      findFirst: async () => ({ id: 'store-tenant', tenantId: 'tenant-root', brandId: 'brand-root' })
    },
    lytConnection: {
      findFirst: async ({ where }: { where: { storeId: string } }) => {
        requestedKeys.push(where.storeId)
        if (where.storeId === 'tenant:tenant-root') {
          return {
            vendorTenantId: 'vendor-tenant-root',
            endpoint: 'https://lyt-tenant.example.com',
            authMode: 'signature',
            credential: 'tenant-secret',
            updatedAt: new Date()
          }
        }

        return null
      }
    }
  })

  const conn = await manager.getConnectionForStore('store-tenant', { tenantId: 'tenant-root', brandId: 'brand-root' })

  assert.deepStrictEqual(requestedKeys, ['store-tenant', 'brand:brand-root', 'tenant:tenant-root'])
  assert.equal(conn.endpoint, 'https://lyt-tenant.example.com')
  assert.equal(conn.resolutionLevel, 'tenant')
  assert.equal(conn.resolutionKey, 'tenant:tenant-root')
  assert.equal(conn.hasCredential, true)
  assert.equal(conn.vendorTenantId, 'vendor-tenant-root')
  assert.equal(conn.vendorStoreId, 'store-tenant')
  assert.deepStrictEqual(conn.capabilities, ['member', 'payment', 'order'])
})
