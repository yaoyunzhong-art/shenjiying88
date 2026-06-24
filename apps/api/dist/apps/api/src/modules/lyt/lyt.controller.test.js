"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
(0, node_test_1.describe)('LytController', () => {
    const { LytController } = require('./lyt.controller');
    // ── 元数据测试 ──
    (0, node_test_1.default)('controller path metadata is set to "lyt"', () => {
        const path = Reflect.getMetadata('path', LytController);
        strict_1.default.equal(path, 'lyt');
    });
    (0, node_test_1.default)('getBootstrap route has GET metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getBootstrap);
        const path = Reflect.getMetadata('path', LytController.prototype.getBootstrap);
        strict_1.default.equal(method, 0); // GET
        strict_1.default.equal(path, 'bootstrap');
    });
    (0, node_test_1.default)('getFixtures route has GET metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getFixtures);
        const path = Reflect.getMetadata('path', LytController.prototype.getFixtures);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'fixtures');
    });
    (0, node_test_1.default)('getFixture route has GET metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getFixture);
        const path = Reflect.getMetadata('path', LytController.prototype.getFixture);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'fixtures/:key');
    });
    (0, node_test_1.default)('compareFixture route has POST metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.compareFixture);
        const path = Reflect.getMetadata('path', LytController.prototype.compareFixture);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'fixtures/:key/compare');
    });
    (0, node_test_1.default)('importFixturePreview route has POST metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.importFixturePreview);
        const path = Reflect.getMetadata('path', LytController.prototype.importFixturePreview);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'fixtures/:key/import-preview');
    });
    (0, node_test_1.default)('importFixturePlan route has POST metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.importFixturePlan);
        const path = Reflect.getMetadata('path', LytController.prototype.importFixturePlan);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'fixtures/:key/import-plan');
    });
    (0, node_test_1.default)('getFixtureSummary route has GET metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getFixtureSummary);
        const path = Reflect.getMetadata('path', LytController.prototype.getFixtureSummary);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'fixtures/summary');
    });
    (0, node_test_1.default)('getConnection route has GET metadata with :storeId param', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getConnection);
        const path = Reflect.getMetadata('path', LytController.prototype.getConnection);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'connection/:storeId');
    });
    (0, node_test_1.default)('getConnectionCapabilityReadiness route has GET metadata with :storeId param', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getConnectionCapabilityReadiness);
        const path = Reflect.getMetadata('path', LytController.prototype.getConnectionCapabilityReadiness);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'connection/:storeId/readiness');
    });
    (0, node_test_1.default)('getStoreCapabilityAccessView route has GET metadata with :storeId param', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getStoreCapabilityAccessView);
        const path = Reflect.getMetadata('path', LytController.prototype.getStoreCapabilityAccessView);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'connection/:storeId/access-view');
    });
    (0, node_test_1.default)('getAdapterSelection route has GET metadata with :storeId param', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getAdapterSelection);
        const path = Reflect.getMetadata('path', LytController.prototype.getAdapterSelection);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'connection/:storeId/adapter');
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary route has GET metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getConnectionGovernanceSummary);
        const path = Reflect.getMetadata('path', LytController.prototype.getConnectionGovernanceSummary);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'connection/governance-summary');
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts route has GET metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getConnectionGovernanceAlerts);
        const path = Reflect.getMetadata('path', LytController.prototype.getConnectionGovernanceAlerts);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'connection/governance-alerts');
    });
    (0, node_test_1.default)('getDeviceHealthSummary route has POST metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getDeviceHealthSummary);
        const path = Reflect.getMetadata('path', LytController.prototype.getDeviceHealthSummary);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'devices/health-summary');
    });
    (0, node_test_1.default)('getDeviceStatus route has GET metadata with :deviceId param', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.getDeviceStatus);
        const path = Reflect.getMetadata('path', LytController.prototype.getDeviceStatus);
        strict_1.default.equal(method, 0);
        strict_1.default.equal(path, 'devices/:deviceId/status');
    });
    (0, node_test_1.default)('acceptWebhook route has POST metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.acceptWebhook);
        const path = Reflect.getMetadata('path', LytController.prototype.acceptWebhook);
        strict_1.default.equal(method, 1); // POST
        strict_1.default.equal(path, 'webhooks/callback');
    });
    (0, node_test_1.default)('drillWebhook route has POST metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.drillWebhook);
        const path = Reflect.getMetadata('path', LytController.prototype.drillWebhook);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'webhooks/drill');
    });
    (0, node_test_1.default)('replayWebhookFixture route has POST metadata', () => {
        const method = Reflect.getMetadata('method', LytController.prototype.replayWebhookFixture);
        const path = Reflect.getMetadata('path', LytController.prototype.replayWebhookFixture);
        strict_1.default.equal(method, 1);
        strict_1.default.equal(path, 'webhooks/replay-fixture');
    });
    // ── getBootstrap 正例 ──
    (0, node_test_1.default)('getBootstrap delegates to LytService.getBootstrap', () => {
        const mockLytService = {
            getBootstrap: () => ({
                adapter: 'MockLytAdapter',
                foundationDependencies: ['identity-access'],
                foundationContracts: ['lyt-adapter:v1']
            }),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.getBootstrap();
        strict_1.default.equal(result.adapter, 'MockLytAdapter');
        strict_1.default.deepStrictEqual(result.foundationDependencies, ['identity-access']);
        strict_1.default.deepStrictEqual(result.foundationContracts, ['lyt-adapter:v1']);
    });
    (0, node_test_1.default)('getFixtures delegates to LytService.getFixtures', () => {
        const mockLytService = {
            getFixtures: (filters) => [
                {
                    key: 'payment-success-webhook',
                    transport: 'webhook',
                    eventType: 'payment.success',
                    filters
                }
            ],
            getBootstrap: () => ({}),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.getFixtures('webhook', 'payment');
        strict_1.default.equal(result.length, 1);
        strict_1.default.equal(result[0].key, 'payment-success-webhook');
        strict_1.default.deepEqual(result[0].filters, { transport: 'webhook', capability: 'payment' });
    });
    (0, node_test_1.default)('getFixtureSummary delegates to LytService.getFixtureSummary', () => {
        const mockLytService = {
            getFixtureSummary: (filters) => ({
                totalFixtures: 2,
                filters
            }),
            getFixtures: () => [],
            getBootstrap: () => ({}),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.getFixtureSummary('webhook', 'payment');
        strict_1.default.equal(result.totalFixtures, 2);
        strict_1.default.deepEqual(result.filters, { transport: 'webhook', capability: 'payment' });
    });
    (0, node_test_1.default)('getFixture delegates to LytService.getFixture', () => {
        const mockLytService = {
            getFixture: (key) => ({
                key,
                transport: 'webhook',
                eventType: 'gate.pass'
            }),
            getFixtures: () => [],
            getBootstrap: () => ({}),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.getFixture('gate-pass-webhook');
        strict_1.default.equal(result.key, 'gate-pass-webhook');
        strict_1.default.equal(result.eventType, 'gate.pass');
    });
    (0, node_test_1.default)('compareFixture delegates to LytService.compareFixtureInput', () => {
        const mockLytService = {
            compareFixtureInput: (key, body) => ({
                fixtureKey: key,
                body
            }),
            getFixtures: () => [],
            getBootstrap: () => ({}),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.compareFixture('payment-success-webhook', {
            payload: { paymentId: 'payment-001' },
            headers: { signature: 'fixture:test' }
        });
        strict_1.default.equal(result.fixtureKey, 'payment-success-webhook');
        strict_1.default.deepEqual(result.body, {
            payload: { paymentId: 'payment-001' },
            headers: { signature: 'fixture:test' }
        });
    });
    (0, node_test_1.default)('importFixturePreview delegates to LytService.previewFixtureImport', () => {
        const mockLytService = {
            previewFixtureImport: (key, body) => ({
                fixtureKey: key,
                body
            }),
            getFixtures: () => [],
            getBootstrap: () => ({}),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.importFixturePreview('payment-success-webhook', {
            payload: { paymentId: 'payment-001' },
            headers: { signature: 'fixture:test' }
        });
        strict_1.default.equal(result.fixtureKey, 'payment-success-webhook');
        strict_1.default.deepEqual(result.body, {
            payload: { paymentId: 'payment-001' },
            headers: { signature: 'fixture:test' }
        });
    });
    (0, node_test_1.default)('importFixturePlan delegates to LytService.planFixtureImport', () => {
        const mockLytService = {
            planFixtureImport: (key, body) => ({
                fixtureKey: key,
                body
            }),
            getFixtures: () => [],
            getBootstrap: () => ({}),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.importFixturePlan('payment-success-webhook', {
            payload: { paymentId: 'payment-001' },
            query: { traceId: 'trace-001' }
        });
        strict_1.default.equal(result.fixtureKey, 'payment-success-webhook');
        strict_1.default.deepEqual(result.body, {
            payload: { paymentId: 'payment-001' },
            query: { traceId: 'trace-001' }
        });
    });
    // ── getBootstrap 边界：空依赖 ──
    (0, node_test_1.default)('getBootstrap handles empty dependency arrays', () => {
        const mockLytService = {
            getBootstrap: () => ({
                adapter: 'MockLytAdapter',
                foundationDependencies: [],
                foundationContracts: []
            }),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.getBootstrap();
        strict_1.default.equal(result.adapter, 'MockLytAdapter');
        strict_1.default.deepStrictEqual(result.foundationDependencies, []);
        strict_1.default.deepStrictEqual(result.foundationContracts, []);
    });
    // ── getBootstrap 边界：缺失字段 ──
    (0, node_test_1.default)('getBootstrap returns undefined for missing dependency metadata', () => {
        const mockLytService = {
            getBootstrap: () => ({
                adapter: 'MockLytAdapter'
                // foundationDependencies 和 foundationContracts 缺失
            }),
            getAdapter: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = controller.getBootstrap();
        strict_1.default.equal(result.adapter, 'MockLytAdapter');
        strict_1.default.equal(result.foundationDependencies, undefined);
        strict_1.default.equal(result.foundationContracts, undefined);
    });
    // ── getConnection 正例 ──
    (0, node_test_1.default)('getConnection delegates scoped lookup to LytService', async () => {
        const mockConnection = {
            tenantId: 'tenant-1',
            brandId: 'brand-1',
            storeId: 'store-1',
            endpoint: 'https://lyt-store-1.example.com',
            authMode: 'bearer-token',
            hasCredential: true,
            connectionStatus: 'configured',
            source: 'prisma'
        };
        const mockLytService = {
            getConnection: async (storeId, tenantContext) => ({
                ...mockConnection,
                storeId,
                tenantContext
            }),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getConnection('store-1', { tenantId: 'tenant-1', brandId: 'brand-1' });
        strict_1.default.equal(result.storeId, 'store-1');
        strict_1.default.deepStrictEqual(result.tenantContext, { tenantId: 'tenant-1', brandId: 'brand-1' });
        strict_1.default.equal(result.endpoint, 'https://lyt-store-1.example.com');
    });
    (0, node_test_1.default)('getAdapterSelection delegates scoped lookup to LytService', async () => {
        const mockLytService = {
            getAdapterSelection: async () => ({
                adapterName: 'SandboxLytAdapter',
                adapterMode: 'sandbox',
                reason: 'sandbox endpoint',
                vendor: 'lyt-enterprise',
                vendorTenantId: 'vendor-tenant-1',
                vendorBrandId: 'vendor-brand-1',
                vendorStoreId: 'vendor-store-1',
                endpoint: 'https://sandbox.lyt.example.com',
                authMode: 'sandbox-signature',
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured'
            }),
            getConnection: async () => ({}),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getAdapterSelection('store-1', { tenantId: 'tenant-1' });
        strict_1.default.equal(result.adapterName, 'SandboxLytAdapter');
        strict_1.default.equal(result.adapterMode, 'sandbox');
        strict_1.default.equal(result.vendorStoreId, 'vendor-store-1');
        strict_1.default.deepStrictEqual(result.capabilities, ['member', 'payment']);
    });
    (0, node_test_1.default)('getConnectionCapabilityReadiness delegates scoped lookup to LytService', async () => {
        const mockLytService = {
            getConnectionCapabilityReadiness: async () => ({
                storeId: 'store-1',
                storeCode: 'S001',
                enabledCapabilities: ['member', 'payment'],
                readinessByCapability: [{ capability: 'member', enabled: true, readiness: 'ready' }]
            }),
            getConnection: async () => ({}),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getConnectionCapabilityReadiness('store-1', { tenantId: 'tenant-1' });
        strict_1.default.equal(result.storeId, 'store-1');
        strict_1.default.equal(result.storeCode, 'S001');
        strict_1.default.deepStrictEqual(result.enabledCapabilities, ['member', 'payment']);
    });
    (0, node_test_1.default)('getStoreCapabilityAccessView delegates scoped lookup to LytService', async () => {
        const mockLytService = {
            getStoreCapabilityAccessView: async () => ({
                storeId: 'store-1',
                connectionStatus: 'configured',
                accessByCapability: [{ capability: 'member', readiness: 'ready', access: 'enabled', reason: 'ok' }]
            }),
            getConnection: async () => ({}),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getStoreCapabilityAccessView('store-1', { tenantId: 'tenant-1' });
        strict_1.default.equal(result.storeId, 'store-1');
        strict_1.default.equal(result.connectionStatus, 'configured');
        strict_1.default.equal(result.accessByCapability[0]?.access, 'enabled');
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary delegates to LytService', async () => {
        const mockLytService = {
            getConnectionGovernanceSummary: async () => ({
                totalStores: 2,
                configuredStores: 1,
                recommendedNextActions: ['action-1']
            }),
            getConnection: async () => ({}),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getConnectionGovernanceSummary({ tenantId: 'tenant-1', brandId: 'brand-1' });
        strict_1.default.equal(result.totalStores, 2);
        strict_1.default.equal(result.configuredStores, 1);
        strict_1.default.deepStrictEqual(result.recommendedNextActions, ['action-1']);
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts delegates to LytService', async () => {
        const mockLytService = {
            getConnectionGovernanceAlerts: async () => ({
                alerts: [{ code: 'pending-configuration-stores', severity: 'high', count: 1 }]
            }),
            getConnection: async () => ({}),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getConnectionGovernanceAlerts({ tenantId: 'tenant-1', brandId: 'brand-1' });
        strict_1.default.equal(result.alerts[0]?.code, 'pending-configuration-stores');
        strict_1.default.equal(result.alerts[0]?.severity, 'high');
    });
    // ── getConnection 边界：无 tenantContext ──
    (0, node_test_1.default)('getConnection handles undefined tenantContext', async () => {
        const mockConnection = {
            tenantId: 'tenant-1',
            storeId: 'store-2',
            endpoint: 'https://lyt-store-2.example.com',
            authMode: 'api-key',
            hasCredential: false,
            connectionStatus: 'pending-configuration',
            source: 'fallback'
        };
        const mockLytService = {
            getConnection: async (_storeId, _tc) => mockConnection,
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getConnection('store-2', undefined);
        strict_1.default.equal(result.storeId, 'store-2');
        strict_1.default.equal(result.connectionStatus, 'pending-configuration');
        strict_1.default.equal(result.source, 'fallback');
        strict_1.default.equal(result.hasCredential, false);
    });
    // ── getConnection 边界：空字符串 storeId ──
    (0, node_test_1.default)('getConnection forwards empty storeId to service', async () => {
        let capturedStoreId = '';
        const mockLytService = {
            getConnection: async (storeId) => {
                capturedStoreId = storeId;
                return { tenantId: 't', storeId, endpoint: '', authMode: 'none', hasCredential: false, connectionStatus: 'pending-configuration', source: 'fallback' };
            },
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.getConnection('', undefined);
        strict_1.default.equal(capturedStoreId, '');
        strict_1.default.equal(result.storeId, '');
    });
    // ── getDeviceStatus 正例 ──
    (0, node_test_1.default)('getDeviceStatus delegates to adapter.getDeviceStatus', async () => {
        const mockAdapter = {
            getDeviceStatus: (deviceId) => Promise.resolve({ deviceId, status: 'ONLINE' })
        };
        const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) };
        const controller = new LytController(mockLytService);
        const result = await controller.getDeviceStatus('dev-42');
        strict_1.default.deepStrictEqual(result, { deviceId: 'dev-42', status: 'ONLINE' });
    });
    // ── getDeviceStatus 反例：设备离线 ──
    (0, node_test_1.default)('getDeviceStatus returns OFFLINE status', async () => {
        const mockAdapter = {
            getDeviceStatus: (deviceId) => Promise.resolve({ deviceId, status: 'OFFLINE' })
        };
        const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) };
        const controller = new LytController(mockLytService);
        const result = await controller.getDeviceStatus('dev-offline-1');
        strict_1.default.equal(result.deviceId, 'dev-offline-1');
        strict_1.default.equal(result.status, 'OFFLINE');
    });
    // ── getDeviceStatus 反例：设备维护中 ──
    (0, node_test_1.default)('getDeviceStatus returns MAINTENANCE status', async () => {
        const mockAdapter = {
            getDeviceStatus: (deviceId) => Promise.resolve({ deviceId, status: 'MAINTENANCE' })
        };
        const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) };
        const controller = new LytController(mockLytService);
        const result = await controller.getDeviceStatus('dev-maint-1');
        strict_1.default.equal(result.deviceId, 'dev-maint-1');
        strict_1.default.equal(result.status, 'MAINTENANCE');
    });
    // ── getDeviceStatus 边界：空 deviceId ──
    (0, node_test_1.default)('getDeviceStatus forwards empty deviceId', async () => {
        let capturedId = '';
        const mockAdapter = {
            getDeviceStatus: (deviceId) => {
                capturedId = deviceId;
                return Promise.resolve({ deviceId, status: 'OFFLINE' });
            }
        };
        const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) };
        const controller = new LytController(mockLytService);
        const result = await controller.getDeviceStatus('');
        strict_1.default.equal(capturedId, '');
        strict_1.default.equal(result.deviceId, '');
    });
    // ── getDeviceStatus 边界：特殊字符 deviceId ──
    (0, node_test_1.default)('getDeviceStatus handles special character deviceId', async () => {
        const deviceId = 'lyt://gate-reader/floor-1/entrance-A';
        const mockAdapter = {
            getDeviceStatus: (id) => Promise.resolve({ deviceId: id, status: 'ONLINE' })
        };
        const mockLytService = { getAdapter: () => mockAdapter, getBootstrap: () => ({}) };
        const controller = new LytController(mockLytService);
        const result = await controller.getDeviceStatus(deviceId);
        strict_1.default.equal(result.deviceId, deviceId);
        strict_1.default.equal(result.status, 'ONLINE');
    });
    // ── getDeviceHealthSummary 正例 ──
    (0, node_test_1.default)('getDeviceHealthSummary delegates devices to service', () => {
        const sampleDevices = [
            { deviceId: 'd1', tenantContext: {}, storeId: 's1', deviceType: 'GATE_READER', name: 'G1', status: 'ONLINE', registeredAt: '2025-01-01T00:00:00Z' },
            { deviceId: 'd2', tenantContext: {}, storeId: 's1', deviceType: 'CAMERA', name: 'C1', status: 'OFFLINE', registeredAt: '2025-01-01T00:00:00Z' }
        ];
        const mockHealthSummary = { total: 2, online: 1, offline: 1, maintenance: 0, anomalous: 1, healthRate: 50, deviceTypeBreakdown: {} };
        const mockLytService = {
            getDeviceHealthSummary: (devices, thresholdMinutes) => mockHealthSummary
        };
        const controller = new LytController(mockLytService);
        const result = controller.getDeviceHealthSummary({ devices: sampleDevices });
        strict_1.default.equal(result.total, 2);
        strict_1.default.equal(result.healthRate, 50);
    });
    // ── getDeviceHealthSummary 正例：传入 thresholdMinutes ──
    (0, node_test_1.default)('getDeviceHealthSummary forwards thresholdMinutes', () => {
        let capturedThreshold;
        const mockLytService = {
            getDeviceHealthSummary: (_devices, thresholdMinutes) => {
                capturedThreshold = thresholdMinutes;
                return { total: 0, online: 0, offline: 0, maintenance: 0, anomalous: 0, healthRate: 100, deviceTypeBreakdown: {} };
            }
        };
        const controller = new LytController(mockLytService);
        controller.getDeviceHealthSummary({ devices: [], thresholdMinutes: 10 });
        strict_1.default.equal(capturedThreshold, 10);
    });
    // ── getDeviceHealthSummary 反例：空设备列表 ──
    (0, node_test_1.default)('getDeviceHealthSummary returns 100% for empty device list', () => {
        const mockLytService = {
            getDeviceHealthSummary: () => ({ total: 0, online: 0, offline: 0, maintenance: 0, anomalous: 0, healthRate: 100, deviceTypeBreakdown: {} })
        };
        const controller = new LytController(mockLytService);
        const result = controller.getDeviceHealthSummary({ devices: [] });
        strict_1.default.equal(result.total, 0);
        strict_1.default.equal(result.healthRate, 100);
    });
    // ── getDeviceHealthSummary 边界：不传 thresholdMinutes ──
    (0, node_test_1.default)('getDeviceHealthSummary defaults thresholdMinutes', () => {
        let capturedThreshold;
        const mockLytService = {
            getDeviceHealthSummary: (_devices, thresholdMinutes) => {
                capturedThreshold = thresholdMinutes;
                return { total: 0, online: 0, offline: 0, maintenance: 0, anomalous: 0, healthRate: 100, deviceTypeBreakdown: {} };
            }
        };
        const controller = new LytController(mockLytService);
        controller.getDeviceHealthSummary({ devices: [] });
        strict_1.default.equal(capturedThreshold, undefined);
    });
    (0, node_test_1.default)('acceptWebhook delegates to LytService.acceptWebhook', async () => {
        const payload = {
            eventId: 'evt-1',
            eventType: 'payment.success',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: { orderId: 'order-1' }
        };
        const mockLytService = {
            acceptWebhook: async (body) => ({
                status: 'accepted',
                received: body
            }),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.acceptWebhook(payload);
        strict_1.default.equal(result.status, 'accepted');
        strict_1.default.deepStrictEqual(result.received, payload);
    });
    (0, node_test_1.default)('drillWebhook delegates to LytService.drillWebhook', async () => {
        const payload = {
            eventId: 'drill-001',
            eventType: 'payment.success',
            dryRun: true,
            payload: { orderId: 'order-1' }
        };
        const mockLytService = {
            drillWebhook: async (body) => ({
                mode: 'dry-run',
                received: body
            }),
            acceptWebhook: async () => ({}),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.drillWebhook(payload);
        strict_1.default.equal(result.mode, 'dry-run');
        strict_1.default.deepStrictEqual(result.received, payload);
    });
    (0, node_test_1.default)('replayWebhookFixture delegates to LytService.replayWebhookFixture', async () => {
        const payload = {
            fixtureKey: 'payment-success-webhook',
            eventId: 'fixture-run-001'
        };
        const mockLytService = {
            replayWebhookFixture: async (body) => ({
                status: 'accepted',
                received: body
            }),
            drillWebhook: async () => ({}),
            acceptWebhook: async () => ({}),
            getAdapter: () => ({}),
            getBootstrap: () => ({})
        };
        const controller = new LytController(mockLytService);
        const result = await controller.replayWebhookFixture(payload);
        strict_1.default.equal(result.status, 'accepted');
        strict_1.default.deepStrictEqual(result.received, payload);
    });
});
//# sourceMappingURL=lyt.controller.test.js.map