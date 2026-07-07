import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { MockLytAdapter } from './adapters/mock-lyt.adapter';
import { RealLytAdapter } from './adapters/real-lyt.adapter';
import { SandboxLytAdapter } from './adapters/sandbox-lyt.adapter';
import { LytAdapterRegistry } from './lyt-adapter.registry';

it('LytAdapterRegistry resolves mock adapter for fallback connection', () => {
  const configService = new ConfigService();
  const registry = new LytAdapterRegistry(new MockLytAdapter(), new SandboxLytAdapter(configService), new RealLytAdapter(configService));

  const selection = registry.resolveAdapterSelection({
    vendor: 'lyt',
    tenantId: 'tenant-1',
    vendorTenantId: 'tenant-1',
    storeId: 'store-1',
    vendorStoreId: 'store-1',
    endpoint: 'mock://lyt/tenant-1/store-1',
    authMode: 'mock-token',
    hasCredential: false,
    capabilities: ['member', 'payment'],
    connectionStatus: 'pending-configuration',
    source: 'fallback'
  });

  assert.equal(selection.adapterName, 'MockLytAdapter');
  assert.equal(selection.adapterMode, 'mock');
});

it('LytAdapterRegistry resolves sandbox adapter for sandbox endpoint', () => {
  const configService = new ConfigService();
  const registry = new LytAdapterRegistry(new MockLytAdapter(), new SandboxLytAdapter(configService), new RealLytAdapter(configService));

  const selection = registry.resolveAdapterSelection({
    vendor: 'lyt',
    tenantId: 'tenant-2',
    vendorTenantId: 'tenant-2',
    storeId: 'store-2',
    vendorStoreId: 'vendor-store-2',
    endpoint: 'https://sandbox.lyt.example.com',
    authMode: 'sandbox-signature',
    hasCredential: true,
    capabilities: ['member', 'device'],
    connectionStatus: 'configured',
    source: 'prisma'
  });

  assert.equal(selection.adapterName, 'SandboxLytAdapter');
  assert.equal(selection.adapterMode, 'sandbox');
});

it('LytAdapterRegistry resolves real adapter for production endpoint', () => {
  const configService = new ConfigService();
  const registry = new LytAdapterRegistry(new MockLytAdapter(), new SandboxLytAdapter(configService), new RealLytAdapter(configService));

  const selection = registry.resolveAdapterSelection({
    vendor: 'lyt',
    tenantId: 'tenant-3',
    vendorTenantId: 'tenant-3',
    storeId: 'store-3',
    vendorStoreId: 'vendor-store-3',
    endpoint: 'https://api.lyt.example.com',
    authMode: 'signature',
    hasCredential: true,
    capabilities: ['payment', 'order'],
    connectionStatus: 'configured',
    source: 'prisma'
  });

  assert.equal(selection.adapterName, 'RealLytAdapter');
  assert.equal(selection.adapterMode, 'real');
});
