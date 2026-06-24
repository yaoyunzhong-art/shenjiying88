"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
(0, node_test_1.default)('lyt connection manager returns configured connection for scoped store', async () => {
    const { LytConnectionManager } = require('./lyt-connection.manager');
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
    });
    const conn = await manager.getConnectionForStore('store-42', { tenantId: 'tenant-42', brandId: 'brand-42' });
    strict_1.default.equal(conn.tenantId, 'tenant-42');
    strict_1.default.equal(conn.brandId, 'brand-42');
    strict_1.default.equal(conn.storeId, 'store-42');
    strict_1.default.equal(conn.vendor, 'lyt-enterprise');
    strict_1.default.equal(conn.vendorTenantId, 'vendor-tenant-42');
    strict_1.default.equal(conn.vendorBrandId, 'vendor-brand-42');
    strict_1.default.equal(conn.vendorStoreId, 'vendor-store-42');
    strict_1.default.equal(conn.endpoint, 'https://lyt-store-42.example.com');
    strict_1.default.equal(conn.authMode, 'bearer-token');
    strict_1.default.equal(conn.hasCredential, true);
    strict_1.default.equal(conn.credentialRef, 'vault://lyt/store-42');
    strict_1.default.deepStrictEqual(conn.capabilities, ['member', 'payment', 'device']);
    strict_1.default.equal(conn.connectionStatus, 'configured');
    strict_1.default.equal(conn.source, 'prisma');
    strict_1.default.equal(conn.resolutionLevel, 'store');
    strict_1.default.equal(conn.resolutionKey, 'store-42');
    strict_1.default.deepStrictEqual(conn.resolutionChain, ['store:store-42', 'brand:brand-42', 'tenant:tenant-42']);
    strict_1.default.equal(conn.healthStatus, 'healthy');
});
(0, node_test_1.default)('lyt connection manager returns scoped fallback when store has no connection config', async () => {
    const { LytConnectionManager } = require('./lyt-connection.manager');
    const manager = new LytConnectionManager({
        store: {
            findFirst: async () => ({ id: 'store-abc', tenantId: 'tenant-abc', brandId: 'brand-abc' })
        },
        lytConnection: {
            findFirst: async () => null
        }
    });
    const conn = await manager.getConnectionForStore('store-abc', { tenantId: 'tenant-abc' });
    strict_1.default.equal(conn.tenantId, 'tenant-abc');
    strict_1.default.equal(conn.brandId, 'brand-abc');
    strict_1.default.equal(conn.storeId, 'store-abc');
    strict_1.default.equal(conn.vendor, 'lyt');
    strict_1.default.equal(conn.vendorTenantId, 'tenant-abc');
    strict_1.default.equal(conn.vendorBrandId, 'brand-abc');
    strict_1.default.equal(conn.vendorStoreId, 'store-abc');
    strict_1.default.equal(conn.endpoint, 'mock://lyt/tenant-abc/store-abc');
    strict_1.default.equal(conn.authMode, 'mock-token');
    strict_1.default.equal(conn.hasCredential, false);
    strict_1.default.deepStrictEqual(conn.capabilities, ['member', 'payment', 'order', 'device', 'gate']);
    strict_1.default.equal(conn.connectionStatus, 'pending-configuration');
    strict_1.default.equal(conn.source, 'fallback');
    strict_1.default.equal(conn.resolutionLevel, 'fallback');
    strict_1.default.equal(conn.healthStatus, 'pending-configuration');
});
(0, node_test_1.default)('lyt connection manager resolves brand default connection when store-specific config is absent', async () => {
    const { LytConnectionManager } = require('./lyt-connection.manager');
    const requestedKeys = [];
    const manager = new LytConnectionManager({
        store: {
            findFirst: async () => ({ id: 'store-brand', tenantId: 'tenant-brand', brandId: 'brand-brand' })
        },
        lytConnection: {
            findFirst: async ({ where }) => {
                requestedKeys.push(where.storeId);
                if (where.storeId === 'brand:brand-brand') {
                    return {
                        endpoint: 'https://lyt-brand.example.com',
                        authMode: 'api-key',
                        credential: null,
                        capabilities: ['member', 'gate'],
                        updatedAt: new Date('2026-05-01T00:00:00.000Z')
                    };
                }
                return null;
            }
        }
    });
    const conn = await manager.getConnectionForStore('store-brand', { tenantId: 'tenant-brand', brandId: 'brand-brand' });
    strict_1.default.deepStrictEqual(requestedKeys, ['store-brand', 'brand:brand-brand']);
    strict_1.default.equal(conn.endpoint, 'https://lyt-brand.example.com');
    strict_1.default.equal(conn.resolutionLevel, 'brand');
    strict_1.default.equal(conn.resolutionKey, 'brand:brand-brand');
    strict_1.default.deepStrictEqual(conn.capabilities, ['member', 'gate']);
    strict_1.default.equal(conn.connectionStatus, 'configured');
    strict_1.default.equal(conn.healthStatus, 'stale');
});
(0, node_test_1.default)('lyt connection manager resolves tenant default connection when brand config is absent', async () => {
    const { LytConnectionManager } = require('./lyt-connection.manager');
    const requestedKeys = [];
    const manager = new LytConnectionManager({
        store: {
            findFirst: async () => ({ id: 'store-tenant', tenantId: 'tenant-root', brandId: 'brand-root' })
        },
        lytConnection: {
            findFirst: async ({ where }) => {
                requestedKeys.push(where.storeId);
                if (where.storeId === 'tenant:tenant-root') {
                    return {
                        vendorTenantId: 'vendor-tenant-root',
                        endpoint: 'https://lyt-tenant.example.com',
                        authMode: 'signature',
                        credential: 'tenant-secret',
                        updatedAt: new Date()
                    };
                }
                return null;
            }
        }
    });
    const conn = await manager.getConnectionForStore('store-tenant', { tenantId: 'tenant-root', brandId: 'brand-root' });
    strict_1.default.deepStrictEqual(requestedKeys, ['store-tenant', 'brand:brand-root', 'tenant:tenant-root']);
    strict_1.default.equal(conn.endpoint, 'https://lyt-tenant.example.com');
    strict_1.default.equal(conn.resolutionLevel, 'tenant');
    strict_1.default.equal(conn.resolutionKey, 'tenant:tenant-root');
    strict_1.default.equal(conn.hasCredential, true);
    strict_1.default.equal(conn.vendorTenantId, 'vendor-tenant-root');
    strict_1.default.equal(conn.vendorStoreId, 'store-tenant');
    strict_1.default.deepStrictEqual(conn.capabilities, ['member', 'payment', 'order']);
});
//# sourceMappingURL=lyt-connection.manager.test.js.map