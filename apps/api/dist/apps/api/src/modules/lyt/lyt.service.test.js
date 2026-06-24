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
const common_1 = require("@nestjs/common");
(0, node_test_1.describe)('LytService', () => {
    const { LytService } = require('./lyt.service');
    const { toLytStandardizedWebhookEventContract } = require('./lyt.contract');
    (0, node_test_1.default)('getAdapter returns the injected adapter instance', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ name: 'mock-adapter', adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getAdapter();
        strict_1.default.equal(result.adapterName, 'MockLytAdapter');
    });
    (0, node_test_1.default)('getConnection delegates to scoped connection manager', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = {
            getConnectionForStore: async (storeId, tenantContext) => ({
                storeId,
                tenantContext,
                endpoint: 'https://lyt.example.com',
                authMode: 'bearer-token'
            })
        };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.getConnection('store-001', { tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.equal(result.storeId, 'store-001');
        strict_1.default.deepStrictEqual(result.tenantContext, { tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.equal(result.endpoint, 'https://lyt.example.com');
    });
    (0, node_test_1.default)('getAdapterSelection returns resolved adapter info for store connection', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({
                adapterName: 'SandboxLytAdapter',
                adapterMode: 'sandbox',
                reason: 'connection is marked as sandbox/staging for rehearsal'
            }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = {
            getConnectionForStore: async () => ({
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-001',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-001',
                endpoint: 'https://sandbox.lyt.example.com',
                authMode: 'sandbox-signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/brand-001',
                capabilities: ['member', 'payment', 'device'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'brand',
                healthStatus: 'healthy'
            })
        };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.getAdapterSelection('store-001', { tenantId: 'tenant-001' });
        strict_1.default.equal(result.adapterName, 'SandboxLytAdapter');
        strict_1.default.equal(result.adapterMode, 'sandbox');
        strict_1.default.equal(result.vendor, 'lyt-enterprise');
        strict_1.default.equal(result.vendorTenantId, 'vendor-tenant-001');
        strict_1.default.equal(result.vendorBrandId, 'vendor-brand-001');
        strict_1.default.equal(result.vendorStoreId, 'vendor-store-001');
        strict_1.default.equal(result.endpoint, 'https://sandbox.lyt.example.com');
        strict_1.default.deepStrictEqual(result.capabilities, ['member', 'payment', 'device']);
        strict_1.default.equal(result.credentialRef, 'vault://lyt/brand-001');
        strict_1.default.equal(result.resolutionLevel, 'brand');
    });
    (0, node_test_1.default)('getConnectionCapabilityReadiness returns scoped capability readiness for a store', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = {
            getConnectionForStore: async () => ({
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-001',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-001',
                endpoint: 'https://lyt-brand.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/brand-001',
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'brand',
                healthStatus: 'healthy'
            }),
            listScopedStores: async () => [
                { id: 'store-001', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '测试门店一' }
            ]
        };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.getConnectionCapabilityReadiness('store-001', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.equal(result.storeCode, 'S001');
        strict_1.default.equal(result.storeName, '测试门店一');
        strict_1.default.equal(result.vendorStoreId, 'vendor-store-001');
        strict_1.default.deepStrictEqual(result.enabledCapabilities, ['member', 'payment']);
        strict_1.default.equal(result.readinessByCapability.find((item) => item.capability === 'member')?.readiness, 'inherited-ready');
        strict_1.default.equal(result.readinessByCapability.find((item) => item.capability === 'device')?.readiness, 'not-enabled');
        strict_1.default.ok(result.missingRequirements.includes('store-level-capability-verification'));
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('继承上级连接')));
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary aggregates readiness across scoped stores', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const connectionMap = {
            'store-ready': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-ready',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-ready',
                endpoint: 'https://lyt-ready.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'payment', 'device'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            },
            'store-pending': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-pending',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-pending',
                endpoint: 'mock://lyt/tenant-001/store-pending',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment', 'order', 'device', 'gate'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            },
            'store-stale': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stale',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stale',
                endpoint: 'https://lyt-stale.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            }
        };
        const mockConnections = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
                { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
                { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
            ]
        };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.equal(result.totalStores, 3);
        strict_1.default.equal(result.configuredStores, 2);
        strict_1.default.equal(result.pendingConfigurationStores, 1);
        strict_1.default.equal(result.staleStores, 1);
        strict_1.default.equal(result.inheritedStores, 1);
        strict_1.default.equal(result.storeLevelConfiguredStores, 1);
        strict_1.default.equal(result.capabilityBreakdown.find((item) => item.capability === 'member')?.pendingStores, 1);
        strict_1.default.equal(result.capabilityBreakdown.find((item) => item.capability === 'device')?.readyStores, 1);
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('pending-configuration')));
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('stale')));
        // stores are sorted by governanceRiskLevel: high (pending-configuration) first,
        // then medium (stale), then low (healthy). See LytService.getConnectionGovernanceSummary
        // riskOrder = { high: 0, medium: 1, low: 2 }.
        strict_1.default.equal(result.stores[0]?.storeId, 'store-pending');
        strict_1.default.equal(result.stores[1]?.storeId, 'store-stale');
        strict_1.default.equal(result.stores[2]?.storeId, 'store-ready');
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts returns structured governance alerts', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const connectionMap = {
            'store-ready': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-ready',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-ready',
                endpoint: 'https://lyt-ready.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            },
            'store-pending': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-pending',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-pending',
                endpoint: 'mock://lyt/tenant-001/store-pending',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment', 'device'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            },
            'store-stale': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stale',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stale',
                endpoint: 'https://lyt-stale.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            }
        };
        const mockConnections = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
                { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
                { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
            ]
        };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.equal(result.alerts.length, 6);
        strict_1.default.equal(result.alerts[0]?.code, 'pending-configuration-stores');
        strict_1.default.equal(result.alerts[0]?.severity, 'high');
        strict_1.default.ok(result.alerts.some((item) => item.code === 'stale-connections'));
        strict_1.default.ok(result.alerts.some((item) => item.code === 'credential-missing-stores'));
        strict_1.default.ok(result.alerts.some((item) => item.code === 'inherited-store-verification'));
        strict_1.default.ok(result.alerts.some((item) => item.code === 'capability-pending-stores'));
    });
    (0, node_test_1.default)('getStoreCapabilityAccessView maps readiness to frontend access states', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = {
            getConnectionForStore: async () => ({
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-001',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-001',
                endpoint: 'https://lyt-store.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-001',
                capabilities: ['member', 'payment', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            }),
            listScopedStores: async () => [
                { id: 'store-001', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '测试门店一' }
            ]
        };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.getStoreCapabilityAccessView('store-001', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.equal(result.connectionStatus, 'configured');
        strict_1.default.equal(result.healthStatus, 'stale');
        strict_1.default.equal(result.accessByCapability.find((item) => item.capability === 'member')?.access, 'degraded');
        strict_1.default.equal(result.accessByCapability.find((item) => item.capability === 'payment')?.access, 'degraded');
        strict_1.default.equal(result.accessByCapability.find((item) => item.capability === 'device')?.access, 'hidden');
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('健康检查')));
    });
    (0, node_test_1.default)('getFixtures returns first-batch LYT fixture catalog', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getFixtures();
        strict_1.default.equal(result.length, 5);
        strict_1.default.equal(result[0].key, 'member-query');
        strict_1.default.equal(result[2].eventType, 'payment.success');
        strict_1.default.equal(result[2].validationStatus, 'ready-for-rehearsal');
        strict_1.default.deepEqual(result[2].missingSampleFields, []);
    });
    (0, node_test_1.default)('getFixtures supports transport filter and returns checklist metadata', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getFixtures({ transport: 'webhook' });
        strict_1.default.deepEqual(result.map((item) => item.key), ['payment-success-webhook', 'gate-pass-webhook']);
        strict_1.default.equal(result[0].mappingVersion, 'lyt-field-mapping-spec-v1');
        strict_1.default.equal(result[0].riskLevel, 'high');
        strict_1.default.deepEqual(result[0].requiredHeaders, ['signature', 'timestamp']);
        strict_1.default.deepEqual(result[0].recommendedHeaders, ['x-lyt-source']);
        strict_1.default.ok(result[0].archiveChecklist.includes('mappingVersion'));
        strict_1.default.ok(result[0].schemaChecklist.includes('signature-validation'));
        strict_1.default.deepEqual(result[0].sampleHeaders, {
            signature: 'fixture:payment-success-webhook',
            timestamp: '2026-06-14T10:06:30.000Z'
        });
    });
    (0, node_test_1.default)('getFixture returns a single fixture by key', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getFixture('gate-pass-webhook');
        strict_1.default.equal(result.key, 'gate-pass-webhook');
        strict_1.default.equal(result.transport, 'webhook');
        strict_1.default.equal(result.eventType, 'gate.pass');
        strict_1.default.equal(result.validationStatus, 'ready-for-rehearsal');
        strict_1.default.ok(result.requiredRawFields.includes('gateId'));
    });
    (0, node_test_1.default)('getFixtureSummary returns checklist rollout summary', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getFixtureSummary({ transport: 'webhook' });
        strict_1.default.equal(result.totalFixtures, 2);
        strict_1.default.equal(result.readyFixtures, 2);
        strict_1.default.equal(result.blockedFixtures, 0);
        strict_1.default.equal(result.highRiskBlockedFixtures, 0);
        strict_1.default.deepEqual(result.blockedFixtureKeys, []);
        strict_1.default.equal(result.transportBreakdown.webhook, 2);
        strict_1.default.equal(result.capabilityBreakdown.payment, 1);
        strict_1.default.equal(result.capabilityBreakdown.gate, 1);
        strict_1.default.deepEqual(result.missingChecklistBreakdown, {});
        strict_1.default.ok(result.recommendedChecklistBreakdown['headers:x-lyt-source'] >= 1);
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('headers/query checklist')));
    });
    (0, node_test_1.default)('getFixtureSummary reports blocked fixtures and exact missing checklist items', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getFixtureSummary({ transport: 'webhook', capability: 'payment' });
        strict_1.default.equal(result.totalFixtures, 1);
        strict_1.default.deepEqual(result.blockedFixtureKeys, []);
        strict_1.default.equal(result.fixtures[0]?.key, 'payment-success-webhook');
        strict_1.default.deepEqual(result.fixtures[0]?.missingChecklistItems, []);
    });
    (0, node_test_1.default)('compareFixtureInput returns required and recommended gap report', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.compareFixtureInput('payment-success-webhook', {
            payload: {
                paymentId: 'payment-001',
                orderId: 'order-001',
                transactionNo: 'txn-001',
                amount: 108,
                customField: 'custom'
            },
            headers: {
                signature: 'fixture:payment-success-webhook'
            },
            query: {
                unknownQuery: '1'
            }
        });
        strict_1.default.equal(result.fixtureKey, 'payment-success-webhook');
        strict_1.default.equal(result.readiness, 'missing-required');
        strict_1.default.ok(result.payload.missingRequired.includes('requestId'));
        strict_1.default.ok(result.payload.missingRecommended.includes('currency'));
        strict_1.default.deepEqual(result.payload.safeExtraObserved, []);
        strict_1.default.deepEqual(result.payload.riskyExtraObserved, ['customField']);
        strict_1.default.ok(result.headers.missingRequired.includes('timestamp'));
        strict_1.default.ok(result.headers.missingRecommended.includes('x-lyt-source'));
        strict_1.default.deepEqual(result.headers.safeExtraObserved, []);
        strict_1.default.deepEqual(result.headers.riskyExtraObserved, []);
        strict_1.default.deepEqual(result.query.missingRecommended, ['traceId']);
        strict_1.default.deepEqual(result.query.safeExtraObserved, []);
        strict_1.default.deepEqual(result.query.riskyExtraObserved, ['unknownQuery']);
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('required')));
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('unknown risky')));
    });
    (0, node_test_1.default)('previewFixtureImport returns merged sample suggestion and readiness after import', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.previewFixtureImport('payment-success-webhook', {
            payload: {
                requestId: 'req-pay-import-1',
                paymentId: 'payment-001',
                orderId: 'order-001',
                transactionNo: 'txn-001',
                amount: 108,
                currency: 'CNY',
                tenantId: 'tenant-demo',
                brandId: 'brand-demo',
                storeId: 'store-demo-001',
                occurredAt: '2026-06-14T10:06:00.000Z'
            },
            headers: {
                signature: 'fixture:payment-success-import',
                timestamp: '2026-06-14T10:06:30.000Z',
                'x-lyt-source': 'captured-sample'
            },
            query: {
                traceId: 'trace-001'
            }
        });
        strict_1.default.equal(result.fixtureKey, 'payment-success-webhook');
        strict_1.default.equal(result.readinessAfterImport, 'ready');
        strict_1.default.ok(result.changedSections.includes('payload'));
        strict_1.default.ok(result.changedSections.includes('headers'));
        strict_1.default.ok(result.changedSections.includes('query'));
        strict_1.default.ok(result.changedKeys.payload.includes('requestId'));
        strict_1.default.equal(result.nextSamplePayload.requestId, 'req-pay-import-1');
        strict_1.default.equal(result.nextSampleHeaders['x-lyt-source'], 'captured-sample');
        strict_1.default.equal(result.nextSampleQueryParams.traceId, 'trace-001');
        strict_1.default.equal(result.compareReport.readiness, 'ready');
    });
    (0, node_test_1.default)('planFixtureImport returns blocked decision when required fields remain missing after import', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.planFixtureImport('payment-success-webhook', {
            payload: {
                requestId: '',
                paymentId: 'payment-001'
            }
        });
        strict_1.default.equal(result.importDecision, 'blocked-by-required');
        strict_1.default.equal(result.readinessBeforeImport, 'missing-required');
        strict_1.default.equal(result.readinessAfterImport, 'missing-required');
        strict_1.default.ok(result.sections.payload.unresolvedRequiredAfterImport.includes('requestId'));
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('required')));
    });
    (0, node_test_1.default)('planFixtureImport returns needs-review when risky extras require manual review', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.planFixtureImport('payment-success-webhook', {
            payload: {
                requestId: 'req-pay-import-2',
                paymentId: 'payment-001',
                orderId: 'order-001',
                transactionNo: 'txn-001',
                amount: 108,
                currency: 'CNY',
                tenantId: 'tenant-demo',
                brandId: 'brand-demo',
                storeId: 'store-demo-001',
                occurredAt: '2026-06-14T10:06:00.000Z',
                customField: 'custom'
            },
            headers: {
                signature: 'fixture:payment-success-import',
                timestamp: '2026-06-14T10:06:30.000Z',
                'x-lyt-source': 'captured-sample'
            },
            query: {
                traceId: 'trace-001'
            }
        });
        strict_1.default.equal(result.importDecision, 'needs-review');
        strict_1.default.equal(result.readinessAfterImport, 'ready');
        strict_1.default.deepEqual(result.sections.payload.riskyExtraCandidates, ['customField']);
        strict_1.default.ok(result.recommendedPromotions.includes('payload:requestId'));
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('risky extra')));
        strict_1.default.equal(result.preview.compareReport.payload.riskyExtraObserved[0], 'customField');
    });
    (0, node_test_1.default)('planFixtureImport returns ready-to-promote when import is complete and stable', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.planFixtureImport('payment-success-webhook', {
            payload: {
                requestId: 'req-pay-import-3',
                paymentId: 'payment-001',
                orderId: 'order-001',
                transactionNo: 'txn-001',
                amount: 108,
                currency: 'CNY',
                tenantId: 'tenant-demo',
                brandId: 'brand-demo',
                storeId: 'store-demo-001',
                occurredAt: '2026-06-14T10:06:00.000Z',
                sourceRemark: 'captured-sample'
            },
            headers: {
                signature: 'fixture:payment-success-import',
                timestamp: '2026-06-14T10:06:30.000Z',
                'x-lyt-source': 'captured-sample',
                'x-request-id': 'req-pay-import-3'
            },
            query: {
                traceId: 'trace-001'
            }
        });
        strict_1.default.equal(result.importDecision, 'ready-to-promote');
        strict_1.default.equal(result.readinessAfterImport, 'ready');
        strict_1.default.deepEqual(result.sections.payload.riskyExtraCandidates, []);
        strict_1.default.deepEqual(result.sections.payload.safeExtraCandidates, ['sourceRemark']);
        strict_1.default.deepEqual(result.sections.headers.safeExtraCandidates, ['x-request-id']);
        strict_1.default.ok(result.recommendedPromotions.includes('headers:x-request-id'));
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('safe extra')));
    });
    (0, node_test_1.default)('drillWebhook returns dry-run standardized preview without publishing', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        let publishCalled = false;
        const mockIntegration = {
            acceptWebhook: async () => ({}),
            publishEvent: async () => {
                publishCalled = true;
                return {};
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.drillWebhook({
            eventId: 'drill-001',
            eventType: 'payment.success',
            dryRun: true,
            payload: { tenantId: 'tenant-1', storeId: 'store-1', orderId: 'order-1' }
        });
        strict_1.default.equal(result.mode, 'dry-run');
        strict_1.default.equal(result.standardizedEvent.standardizedEventName, 'cashier.payment-succeeded');
        strict_1.default.equal(result.archiveRecord.signatureStatus, 'not-applicable');
        strict_1.default.equal(result.archiveRecord.source, 'lyt-drill');
        strict_1.default.equal(result.standardizedEnvelope, null);
        strict_1.default.equal(result.standardizedPublicationStatus, null);
        strict_1.default.equal(publishCalled, false);
    });
    (0, node_test_1.default)('drillWebhook can build payload from fixtureKey and archive the rehearsal payload', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.drillWebhook({
            eventId: 'drill-fixture-001',
            fixtureKey: 'payment-success-webhook',
            dryRun: true
        });
        strict_1.default.equal(result.standardizedEvent.sourceEventName, 'payment.success');
        strict_1.default.equal(result.archiveRecord.fixtureKey, 'payment-success-webhook');
        strict_1.default.equal(result.archiveRecord.requestId, 'req-pay-001');
    });
    (0, node_test_1.default)('replayWebhookFixture reuses callback pipeline and tags archive fixtureKey', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        let capturedInput;
        const mockIntegration = {
            acceptWebhook: async (_source, body) => ({
                ...(capturedInput = body),
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: `lyt:${body.eventId}` },
                envelope: { aggregateId: body.eventId, eventName: body.eventType }
            }),
            publishEvent: async (eventName) => ({
                status: 'accepted',
                envelope: { aggregateId: 'fixture-run-001', eventName, source: 'lyt-standardized' }
            })
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.replayWebhookFixture({
            fixtureKey: 'payment-success-webhook',
            eventId: 'fixture-run-001',
            payload: { requestId: 'req-pay-override-1' },
            headers: { signature: 'fixture:payment-success-override' },
            query: { replaySource: 'service-test' }
        });
        strict_1.default.equal(result.status, 'accepted');
        strict_1.default.equal(result.archiveRecord.fixtureKey, 'payment-success-webhook');
        strict_1.default.equal(result.archiveRecord.requestId, 'req-pay-override-1');
        strict_1.default.deepEqual(result.archiveRecord.rawHeaders, {
            signature: 'fixture:payment-success-override',
            timestamp: '2026-06-14T10:06:30.000Z'
        });
        strict_1.default.deepEqual(result.archiveRecord.rawQuery, { replaySource: 'service-test' });
        strict_1.default.deepEqual(capturedInput?.rawHeaders, {
            signature: 'fixture:payment-success-override',
            timestamp: '2026-06-14T10:06:30.000Z'
        });
        strict_1.default.deepEqual(capturedInput?.rawQuery, { replaySource: 'service-test' });
        strict_1.default.equal(result.standardizedEvent.standardizedEventName, 'cashier.payment-succeeded');
    });
    (0, node_test_1.default)('replayWebhookFixture rejects missing required fields when strictValidation is enabled', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        await strict_1.default.rejects(() => service.replayWebhookFixture({
            fixtureKey: 'payment-success-webhook',
            strictValidation: true,
            payload: {
                paymentId: undefined,
                transactionNo: ''
            }
        }), (error) => error instanceof common_1.BadRequestException &&
            error.message.includes('payload:paymentId') &&
            error.message.includes('payload:transactionNo'));
    });
    (0, node_test_1.default)('drillWebhook publishes standardized event when dryRun is false', async () => {
        const mockAdapter = {};
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({}),
            publishEvent: async (eventName) => ({
                status: 'accepted',
                envelope: {
                    aggregateId: 'drill-002',
                    eventName,
                    source: 'lyt-drill'
                }
            })
        };
        const service = new LytService(mockAdapter, mockFoundation, mockConnections, mockIntegration);
        const result = await service.drillWebhook({
            eventId: 'drill-002',
            eventType: 'coupon.redeemed',
            payload: { tenantId: 'tenant-1', storeId: 'store-1', couponId: 'coupon-1' }
        });
        strict_1.default.equal(result.mode, 'published');
        strict_1.default.equal(result.standardizedEvent.standardizedEventName, 'promotion.coupon-redeemed');
        strict_1.default.equal(result.archiveRecord.source, 'lyt-drill');
        strict_1.default.equal(result.standardizedEnvelope?.eventName, 'promotion.coupon-redeemed');
        strict_1.default.equal(result.standardizedPublicationStatus, 'accepted');
    });
    (0, node_test_1.default)('getBootstrap returns adapter name and foundation dependencies', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => [
                { adapterName: 'MockLytAdapter', adapterMode: 'mock' },
                { adapterName: 'SandboxLytAdapter', adapterMode: 'sandbox' },
                { adapterName: 'RealLytAdapter', adapterMode: 'real' }
            ]
        };
        const mockFoundation = {
            getDependencySummary: () => ({
                dependsOn: ['identity-access', 'configuration-governance'],
                handoffContracts: ['lyt-adapter:v1', 'lyt-gateway:v1']
            })
        };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getBootstrap();
        strict_1.default.equal(result.adapter, 'MockLytAdapter');
        strict_1.default.deepStrictEqual(result.foundationDependencies, ['identity-access', 'configuration-governance']);
        strict_1.default.deepStrictEqual(result.foundationContracts, ['lyt-adapter:v1', 'lyt-gateway:v1']);
        strict_1.default.equal(result.availableAdapters?.length, 3);
        strict_1.default.equal(result.selectionStrategy, 'connection-driven: mock -> sandbox -> real');
    });
    (0, node_test_1.default)('getBootstrap handles null foundation dependency', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getBootstrap();
        strict_1.default.equal(result.adapter, 'MockLytAdapter');
        strict_1.default.deepStrictEqual(result.foundationDependencies, []);
        strict_1.default.deepStrictEqual(result.foundationContracts, []);
    });
    (0, node_test_1.default)('getBootstrap handles undefined dependsOn and handoffContracts', () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => ({}) };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = { acceptWebhook: async () => ({}), publishEvent: async () => ({}) };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = service.getBootstrap();
        strict_1.default.equal(result.adapter, 'MockLytAdapter');
        strict_1.default.deepStrictEqual(result.foundationDependencies, []);
        strict_1.default.deepStrictEqual(result.foundationContracts, []);
    });
    (0, node_test_1.default)('acceptWebhook standardizes accepted lyt webhook into internal event', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const accepted = {
            status: 'accepted',
            source: 'lyt',
            signatureVerified: true,
            idempotency: { key: 'lyt:evt-2001' },
            envelope: { aggregateId: 'evt-2001', eventName: 'payment.success' }
        };
        const published = {
            status: 'accepted',
            envelope: {
                aggregateId: 'evt-2001',
                eventName: 'cashier.payment-succeeded',
                source: 'lyt-standardized'
            }
        };
        const mockIntegration = {
            acceptWebhook: async () => accepted,
            publishEvent: async (...args) => {
                strict_1.default.equal(args[0], 'cashier.payment-succeeded');
                return published;
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.acceptWebhook({
            eventId: 'evt-2001',
            eventType: 'payment.success',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: { tenantId: 'tenant-1', storeId: 'store-1', orderId: 'order-1' }
        });
        const expectedStandardized = toLytStandardizedWebhookEventContract({
            eventId: 'evt-2001',
            eventType: 'payment.success',
            payload: { tenantId: 'tenant-1', storeId: 'store-1', orderId: 'order-1' }
        });
        strict_1.default.equal(result.status, 'accepted');
        strict_1.default.deepStrictEqual(result.standardizedEvent, expectedStandardized);
        strict_1.default.equal(result.archiveRecord.signatureStatus, 'verified');
        strict_1.default.deepStrictEqual(result.standardizedEnvelope, published.envelope);
        strict_1.default.equal(result.standardizedPublicationStatus, 'accepted');
    });
    (0, node_test_1.default)('acceptWebhook skips standardized publication for duplicate raw webhook', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        let publishCalled = false;
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'duplicate',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-dup' }
            }),
            publishEvent: async () => {
                publishCalled = true;
                return {};
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.acceptWebhook({
            eventType: 'member.sync',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: { tenantId: 'tenant-1', memberId: 'member-1' }
        });
        strict_1.default.equal(result.status, 'duplicate');
        strict_1.default.equal(result.standardizedEvent.standardizedEventName, 'member.profile-synced');
        strict_1.default.equal(result.archiveRecord.source, 'lyt-callback');
        strict_1.default.equal(result.standardizedEnvelope, null);
        strict_1.default.equal(publishCalled, false);
    });
    (0, node_test_1.default)('acceptWebhook attaches accepted webhook to runtime-governance receipt chain', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-runtime-001' },
                envelope: { aggregateId: 'evt-runtime-001', eventName: 'payment.success' }
            }),
            publishEvent: async () => ({
                status: 'accepted',
                envelope: { aggregateId: 'evt-runtime-001', eventName: 'cashier.payment-succeeded', source: 'lyt-standardized' }
            })
        };
        const runtimeSubmits = [];
        const runtimeCallbacks = [];
        const mockRuntimeGovernanceService = {
            submitAction: async (payload) => {
                runtimeSubmits.push(payload);
                return {
                    receiptCode: 'LYT-WEBHOOK-CALLBACK-PROCEED-001',
                    state: 'submitted'
                };
            },
            recordCallback: async (receiptCode, payload) => {
                runtimeCallbacks.push({ receiptCode, payload });
                return {
                    receiptCode,
                    state: 'callback-recorded',
                    callback: {
                        callbackStatus: payload.callbackStatus,
                        ackToken: payload.ackToken,
                        lastEvent: payload.lastEvent,
                        summary: payload.summary
                    }
                };
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration, undefined, undefined, undefined, mockRuntimeGovernanceService);
        const result = await service.acceptWebhook({
            eventType: 'payment.success',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: {
                tenantId: 'tenant-runtime-1',
                brandId: 'brand-runtime-1',
                storeId: 'store-runtime-1',
                orderId: 'order-runtime-1',
                paymentId: 'payment-runtime-1'
            }
        });
        strict_1.default.equal(runtimeSubmits.length, 1);
        strict_1.default.equal(runtimeSubmits[0]?.app, 'lyt');
        strict_1.default.equal(runtimeSubmits[0]?.action, 'webhook-callback');
        strict_1.default.equal(runtimeSubmits[0]?.tenantId, 'tenant-runtime-1');
        strict_1.default.equal(runtimeSubmits[0]?.riskLevel, 'high');
        strict_1.default.equal((runtimeSubmits[0]?.payload).sourceEventName, 'payment.success');
        strict_1.default.equal((runtimeSubmits[0]?.payload).standardizedEventName, 'cashier.payment-succeeded');
        strict_1.default.equal((runtimeSubmits[0]?.payload).acceptedStatus, 'accepted');
        strict_1.default.equal(runtimeCallbacks.length, 1);
        strict_1.default.equal(runtimeCallbacks[0]?.receiptCode, 'LYT-WEBHOOK-CALLBACK-PROCEED-001');
        strict_1.default.equal(runtimeCallbacks[0]?.payload.callbackStatus, 'callback-recorded');
        strict_1.default.equal(runtimeCallbacks[0]?.payload.idempotencyKey, 'lyt-webhook-callback:evt-runtime-001');
        strict_1.default.equal(runtimeCallbacks[0]?.payload.ackToken, 'lyt:evt-runtime-001');
        strict_1.default.equal(result.runtimeReceipt.state, 'callback-recorded');
    });
    (0, node_test_1.default)('acceptWebhook reuses runtime-governance receipt chain for duplicate webhook', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'duplicate',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-runtime-dup' }
            }),
            publishEvent: async () => {
                throw new Error('duplicate webhook should not republish standardized event');
            }
        };
        const runtimeSubmits = [];
        const runtimeCallbacks = [];
        const mockRuntimeGovernanceService = {
            submitAction: async (payload) => {
                runtimeSubmits.push(payload);
                return {
                    receiptCode: 'LYT-WEBHOOK-CALLBACK-PROCEED-DUP',
                    state: 'submitted'
                };
            },
            recordCallback: async (receiptCode, payload) => {
                runtimeCallbacks.push({ receiptCode, payload });
                return {
                    receiptCode,
                    state: 'callback-recorded',
                    callback: {
                        callbackStatus: payload.callbackStatus,
                        ackToken: payload.ackToken,
                        lastEvent: payload.lastEvent,
                        summary: payload.summary
                    }
                };
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration, undefined, undefined, undefined, mockRuntimeGovernanceService);
        const result = await service.acceptWebhook({
            eventId: 'evt-runtime-dup',
            eventType: 'member.sync',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: {
                tenantId: 'tenant-runtime-dup',
                memberId: 'member-runtime-dup'
            }
        });
        strict_1.default.equal(result.status, 'duplicate');
        strict_1.default.equal(runtimeSubmits.length, 1);
        strict_1.default.equal((runtimeSubmits[0]?.payload).acceptedStatus, 'duplicate');
        strict_1.default.equal(runtimeCallbacks.length, 1);
        strict_1.default.equal(runtimeCallbacks[0]?.payload.ackToken, 'lyt:evt-runtime-dup');
        strict_1.default.equal(typeof runtimeCallbacks[0]?.payload.summary, 'string');
        strict_1.default.match(runtimeCallbacks[0]?.payload.summary, /重复 webhook/);
        strict_1.default.equal(result.runtimeReceipt.state, 'callback-recorded');
    });
    (0, node_test_1.default)('acceptWebhook syncs member snapshot when member profile standardized event is accepted', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-member-001' },
                envelope: { aggregateId: 'evt-member-001', eventName: 'lyt.webhook.accepted' }
            }),
            publishEvent: async () => ({
                status: 'accepted',
                envelope: { aggregateId: 'evt-member-001', eventName: 'member.profile-synced' }
            })
        };
        const syncCalls = [];
        const operationsProfileCalls = [];
        const enqueueOperationsTaskCalls = [];
        const mockMemberService = {
            syncLytMemberSnapshot: async (payload) => {
                syncCalls.push(payload);
                return {
                    snapshot: {
                        snapshotId: 'snapshot-001',
                        externalMemberId: payload.externalMemberId
                    },
                    profile: {
                        memberId: 'member-profile-001'
                    }
                };
            },
            getOperationsProfile: async (memberId, tenantContext) => {
                operationsProfileCalls.push({ memberId, tenantContext });
                return {
                    memberId,
                    lifecycleStage: 'vip-active',
                    audienceSegments: ['vip-tier-member', 'loyal-member'],
                    recommendedActions: [{ code: 'assign-vip-concierge' }],
                    automationTriggers: [{ code: 'member-profile-sync-follow-up' }]
                };
            },
            enqueueOperationsTasks: async (payload) => {
                enqueueOperationsTaskCalls.push(payload);
                return {
                    queuedTasks: [{ taskId: 'ops-task-member-001' }],
                    existingTasks: [],
                    executedReceipts: [{ executionId: 'ops-exec-member-001', runtimeReceiptCode: 'runtime-member-001' }]
                };
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration, undefined, mockMemberService);
        const result = await service.acceptWebhook({
            eventType: 'member.sync',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: {
                tenantId: 'tenant-1',
                brandId: 'brand-1',
                storeId: 'store-1',
                externalMemberId: 'lyt-member-1001',
                memberCode: 'VIP-1001',
                mobile: '13500000000',
                nickname: 'Webhook Alice',
                levelCode: 'VIP',
                points: 1800,
                growthValue: 2200,
                updatedAt: '2026-06-14T12:30:00.000Z'
            }
        });
        strict_1.default.equal(syncCalls.length, 1);
        strict_1.default.equal(syncCalls[0]?.externalMemberId, 'lyt-member-1001');
        strict_1.default.equal((syncCalls[0]?.tenantContext).tenantId, 'tenant-1');
        strict_1.default.equal(operationsProfileCalls.length, 1);
        strict_1.default.equal(operationsProfileCalls[0]?.memberId, 'member-profile-001');
        strict_1.default.equal((operationsProfileCalls[0]?.tenantContext).tenantId, 'tenant-1');
        strict_1.default.equal(enqueueOperationsTaskCalls.length, 1);
        strict_1.default.equal(enqueueOperationsTaskCalls[0]?.memberId, 'member-profile-001');
        strict_1.default.equal(enqueueOperationsTaskCalls[0]?.source, 'manual-refresh');
        strict_1.default.equal(result.memberSnapshotSync.status, 'synced');
        strict_1.default.equal(result.memberSnapshotSync.snapshotId, 'snapshot-001');
        strict_1.default.equal(result.snapshotConsumerSync.status, 'consumed');
        strict_1.default.equal(result.snapshotConsumerSync.memberOperationsSync.status, 'ready');
        strict_1.default.deepEqual(result.snapshotConsumerSync.memberOperationsSync
            .recommendedActionCodes, ['assign-vip-concierge']);
        strict_1.default.deepEqual(result.snapshotConsumerSync.memberOperationsSync
            .queuedTaskIds, ['ops-task-member-001']);
        strict_1.default.deepEqual(result.snapshotConsumerSync.memberOperationsSync
            .executedRuntimeReceiptCodes, ['runtime-member-001']);
    });
    (0, node_test_1.default)('acceptWebhook syncs order and payment snapshots for standardized LYT transaction events', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-payment-001' },
                envelope: { aggregateId: 'evt-payment-001', eventName: 'lyt.webhook.accepted' }
            }),
            publishEvent: async () => ({
                status: 'accepted',
                envelope: { aggregateId: 'evt-payment-001', eventName: 'cashier.payment-succeeded' }
            })
        };
        const orderSyncCalls = [];
        const paymentSyncCalls = [];
        const loyaltyCalls = [];
        const memberOperationsCalls = [];
        const enqueueOperationsTaskCalls = [];
        const campaignEvaluations = [];
        const mockTransactionsService = {
            syncLytOrderSnapshot: async (payload) => {
                orderSyncCalls.push(payload);
                return {
                    snapshotId: 'order-snapshot-001',
                    externalOrderId: payload.externalOrderId
                };
            },
            syncLytPaymentSnapshot: async (payload) => {
                paymentSyncCalls.push(payload);
                return {
                    snapshotId: 'payment-snapshot-001',
                    externalPaymentId: payload.externalPaymentId
                };
            },
            getLytOrderSnapshot: async (externalOrderId) => ({
                snapshotId: 'order-snapshot-lookup',
                tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1', storeId: 'store-1' },
                externalOrderId,
                memberId: 'member-1001',
                couponCode: 'COUPON-1001',
                blindboxPlanId: 'blindbox-1001',
                blindboxQuantity: 1,
                amount: 188,
                discountAmount: 8,
                payableAmount: 180,
                currency: 'CNY',
                status: 'PAID',
                paidAt: '2026-06-14T14:31:00.000Z',
                updatedAtFromSource: '2026-06-14T14:32:00.000Z'
            }),
            getLytPaymentSnapshot: async (externalPaymentId) => ({
                snapshotId: 'payment-snapshot-lookup',
                tenantContext: { tenantId: 'tenant-1', brandId: 'brand-1', storeId: 'store-1' },
                externalPaymentId,
                externalOrderId: 'lyt-order-1001',
                paymentChannel: 'wechat-pay',
                paymentStatus: 'SUCCEEDED',
                amount: 188,
                currency: 'CNY',
                transactionNo: 'txn-1001',
                paidAt: '2026-06-14T14:30:00.000Z',
                updatedAtFromSource: '2026-06-14T14:30:00.000Z'
            })
        };
        const mockLoyaltyService = {
            settlePaidOrderFromSnapshots: async (orderSnapshot, paymentSnapshot) => {
                loyaltyCalls.push({ mode: 'paid', orderSnapshot, paymentSnapshot });
                return {
                    settlementId: 'settlement-001',
                    orderId: orderSnapshot.externalOrderId,
                    paymentId: paymentSnapshot.externalPaymentId
                };
            },
            settleFailedOrderFromSnapshots: async (orderSnapshot, paymentSnapshot) => {
                loyaltyCalls.push({ mode: 'failed', orderSnapshot, paymentSnapshot });
                return {
                    settlementId: 'settlement-002',
                    orderId: orderSnapshot.externalOrderId,
                    paymentId: paymentSnapshot.externalPaymentId
                };
            }
        };
        const mockMemberService = {
            getOperationsProfile: async (memberId) => {
                memberOperationsCalls.push({ memberId });
                return {
                    memberId,
                    lifecycleStage: 'repeat-paid',
                    audienceSegments: ['lifecycle-repeat-paid', 'high-value-buyer'],
                    recommendedActions: [{ code: 'recommend-repeat-purchase-bundle' }],
                    automationTriggers: [{ code: 'payment-success-journey' }]
                };
            },
            enqueueOperationsTasks: async (payload) => {
                enqueueOperationsTaskCalls.push(payload);
                if (typeof payload.sourcePaymentId === 'string') {
                    return {
                        queuedTasks: [{ taskId: 'ops-task-001' }],
                        existingTasks: [],
                        executedReceipts: [{ executionId: 'ops-exec-001', runtimeReceiptCode: 'runtime-receipt-001' }]
                    };
                }
                return {
                    queuedTasks: [],
                    existingTasks: [{ taskId: 'ops-task-001' }],
                    executedReceipts: []
                };
            }
        };
        const mockCampaignService = {
            evaluateTriggers: (event) => {
                campaignEvaluations.push(event);
                return {
                    matchedCampaigns: 1,
                    dispatchedActions: 1,
                    skippedActions: 0,
                    failedActions: 0,
                    dispatches: [{ dispatchId: 'dispatch-001' }]
                };
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration, mockLoyaltyService, mockMemberService, mockTransactionsService, undefined, undefined, undefined, mockCampaignService);
        const paymentResult = await service.acceptWebhook({
            eventType: 'payment.success',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: {
                tenantId: 'tenant-1',
                brandId: 'brand-1',
                storeId: 'store-1',
                paymentId: 'lyt-payment-1001',
                orderId: 'lyt-order-1001',
                transactionNo: 'txn-1001',
                amount: 188,
                currency: 'CNY',
                channel: 'wechat-pay',
                occurredAt: '2026-06-14T14:30:00.000Z'
            }
        });
        strict_1.default.equal(paymentSyncCalls.length, 1);
        strict_1.default.equal(paymentSyncCalls[0]?.externalPaymentId, 'lyt-payment-1001');
        strict_1.default.equal(paymentResult.paymentSnapshotSync.status, 'synced');
        strict_1.default.equal(paymentResult.paymentSnapshotSync.snapshotId, 'payment-snapshot-001');
        strict_1.default.equal(paymentResult.snapshotConsumerSync.status, 'consumed');
        strict_1.default.equal(loyaltyCalls.length, 1);
        strict_1.default.equal(memberOperationsCalls.length, 1);
        strict_1.default.equal(enqueueOperationsTaskCalls.length, 1);
        strict_1.default.equal(enqueueOperationsTaskCalls[0]?.source, 'payment-success');
        strict_1.default.equal(enqueueOperationsTaskCalls[0]?.sourceOrderId, 'lyt-order-1001');
        strict_1.default.equal(enqueueOperationsTaskCalls[0]?.sourcePaymentId, 'lyt-payment-1001');
        strict_1.default.equal(loyaltyCalls[0]?.mode, 'paid');
        strict_1.default.equal(paymentResult.snapshotConsumerSync.memberOperationsSync
            .status, 'ready');
        strict_1.default.deepEqual(paymentResult.snapshotConsumerSync.memberOperationsSync
            .queuedTaskIds, ['ops-task-001']);
        strict_1.default.deepEqual(paymentResult.snapshotConsumerSync.memberOperationsSync
            .executedReceiptIds, ['ops-exec-001']);
        strict_1.default.deepEqual(paymentResult.snapshotConsumerSync.memberOperationsSync
            .executedRuntimeReceiptCodes, ['runtime-receipt-001']);
        strict_1.default.equal(campaignEvaluations.length, 1);
        strict_1.default.equal(campaignEvaluations[0]?.eventName, 'payment.success');
        strict_1.default.equal(campaignEvaluations[0]?.memberId, 'member-1001');
        strict_1.default.equal(paymentResult.snapshotConsumerSync.campaignDispatchCount, 1);
        const orderResult = await service.acceptWebhook({
            eventType: 'order.updated',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: {
                tenantId: 'tenant-1',
                brandId: 'brand-1',
                storeId: 'store-1',
                externalOrderId: 'lyt-order-1001',
                orderNo: 'NO-1001',
                memberId: 'member-1001',
                amount: 188,
                discountAmount: 8,
                payableAmount: 180,
                currency: 'CNY',
                status: 'PAID',
                paidAt: '2026-06-14T14:31:00.000Z',
                updatedAt: '2026-06-14T14:32:00.000Z'
            }
        });
        strict_1.default.equal(orderSyncCalls.length, 1);
        strict_1.default.equal(orderSyncCalls[0]?.externalOrderId, 'lyt-order-1001');
        strict_1.default.equal(orderResult.orderSnapshotSync.status, 'synced');
        strict_1.default.equal(orderResult.orderSnapshotSync.snapshotId, 'order-snapshot-001');
        strict_1.default.equal(orderResult.snapshotConsumerSync.status, 'consumed');
        strict_1.default.equal(memberOperationsCalls.length, 2);
        strict_1.default.equal(enqueueOperationsTaskCalls.length, 2);
        strict_1.default.equal(enqueueOperationsTaskCalls[1]?.source, 'payment-success');
        strict_1.default.equal(enqueueOperationsTaskCalls[1]?.sourceOrderId, 'lyt-order-1001');
        strict_1.default.equal(enqueueOperationsTaskCalls[1]?.sourcePaymentId, undefined);
        strict_1.default.deepEqual(orderResult.snapshotConsumerSync.memberOperationsSync
            .queuedTaskIds, []);
        strict_1.default.deepEqual(orderResult.snapshotConsumerSync.memberOperationsSync
            .existingTaskIds, ['ops-task-001']);
    });
    (0, node_test_1.default)('acceptWebhook keeps fixtureKey in callback archive record when present', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-fixture' },
                envelope: { aggregateId: 'evt-fixture', eventName: 'gate.pass' }
            }),
            publishEvent: async () => ({ status: 'accepted', envelope: { aggregateId: 'evt-fixture', eventName: 'store.gate-pass-recorded' } })
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.acceptWebhook({
            fixtureKey: 'gate-pass-webhook',
            eventType: 'gate.pass',
            signature: 'fixture:gate-pass-webhook',
            timestamp: '1718234567890',
            payload: { tenantId: 'tenant-1', storeId: 'store-1', requestId: 'req-gate-1' }
        });
        strict_1.default.equal(result.archiveRecord.fixtureKey, 'gate-pass-webhook');
    });
    (0, node_test_1.default)('acceptWebhook emits lyt.webhook.accepted audit when TrustGovernanceService is provided', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-audit-1' },
                envelope: { aggregateId: 'evt-audit-1', eventName: 'payment.success' }
            }),
            publishEvent: async () => ({
                status: 'accepted',
                envelope: { aggregateId: 'evt-audit-1', eventName: 'payment.success.standardized' }
            })
        };
        const auditCalls = [];
        const mockTrust = {
            recordAudit: async (eventType, details, context) => {
                auditCalls.push({ eventType, details, context });
                return { auditId: 'audit_1' };
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration, undefined, undefined, undefined, undefined, undefined, mockTrust);
        await service.acceptWebhook({
            eventType: 'payment.success',
            signature: 'sha256=test',
            timestamp: '1718234567890',
            payload: { tenantId: 'tenant-001', brandId: 'brand-001', storeId: 'store-001', paymentId: 'pay-1' }
        });
        strict_1.default.equal(auditCalls.length, 1);
        strict_1.default.equal(auditCalls[0]?.eventType, 'lyt.webhook.accepted');
        strict_1.default.equal(auditCalls[0]?.details.aggregateId, 'evt-audit-1');
        strict_1.default.equal(auditCalls[0]?.details.acceptedStatus, 'accepted');
        strict_1.default.equal(auditCalls[0]?.details.signatureVerified, true);
        strict_1.default.equal(auditCalls[0]?.context?.source, 'lyt-adapter');
        strict_1.default.equal(auditCalls[0]?.context?.tenantId, 'tenant-001');
        strict_1.default.equal(auditCalls[0]?.context?.actorId, 'lyt-adapter');
        // payment capability → high risk per resolveWebhookRuntimeRiskLevel
        strict_1.default.equal(auditCalls[0]?.context?.riskLevel, 'high');
    });
    (0, node_test_1.default)('acceptWebhook emits low-risk audit on duplicate webhook path', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'duplicate',
                source: 'lyt',
                signatureVerified: false,
                idempotency: { key: 'lyt:evt-dup-1' },
                envelope: { aggregateId: 'evt-dup-1', eventName: 'payment.success' }
            }),
            publishEvent: async () => ({ status: 'duplicate', envelope: null })
        };
        const auditCalls = [];
        const mockTrust = {
            recordAudit: async (eventType, details, context) => {
                auditCalls.push({ eventType, details, context });
                return { auditId: 'audit_dup_1' };
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration, undefined, undefined, undefined, undefined, undefined, mockTrust);
        await service.acceptWebhook({
            eventType: 'payment.success',
            signature: 'sha256=dup',
            timestamp: '1718234567890',
            payload: { tenantId: 'tenant-001', storeId: 'store-001' }
        });
        strict_1.default.equal(auditCalls.length, 1);
        strict_1.default.equal(auditCalls[0]?.eventType, 'lyt.webhook.accepted');
        strict_1.default.equal(auditCalls[0]?.details.acceptedStatus, 'duplicate');
        // Duplicate webhook path is explicitly downgraded to low risk (already audited)
        strict_1.default.equal(auditCalls[0]?.context?.riskLevel, 'low');
    });
    (0, node_test_1.default)('acceptWebhook no-ops when TrustGovernanceService is not provided', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-noop' },
                envelope: { aggregateId: 'evt-noop', eventName: 'gate.pass' }
            }),
            publishEvent: async () => ({
                status: 'accepted',
                envelope: { aggregateId: 'evt-noop', eventName: 'gate.pass.standardized' }
            })
        };
        // No TrustGovernanceService injected — emitAudit should silently no-op
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration);
        const result = await service.acceptWebhook({
            eventType: 'gate.pass',
            signature: 'sha256=noop',
            timestamp: '1718234567890',
            payload: { tenantId: 'tenant-001', storeId: 'store-001' }
        });
        strict_1.default.equal(result.standardizedEvent.aggregateId, 'evt-noop');
    });
    (0, node_test_1.default)('replayWebhookFixture emits lyt.fixture.replayed audit after delegating to acceptWebhook', async () => {
        const mockAdapterRegistry = {
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        };
        const mockFoundation = { getDependencySummary: () => null };
        const mockConnections = { getConnectionForStore: async () => ({}) };
        const mockIntegration = {
            acceptWebhook: async () => ({
                status: 'accepted',
                source: 'lyt',
                signatureVerified: true,
                idempotency: { key: 'lyt:evt-fixture-replay' },
                envelope: { aggregateId: 'evt-fixture-replay', eventName: 'gate.pass' }
            }),
            publishEvent: async () => ({
                status: 'accepted',
                envelope: { aggregateId: 'evt-fixture-replay', eventName: 'gate.pass.standardized' }
            })
        };
        const auditCalls = [];
        const mockTrust = {
            recordAudit: async (eventType, details) => {
                auditCalls.push({ eventType, details });
                return { auditId: `audit_${auditCalls.length}` };
            }
        };
        const service = new LytService(mockAdapterRegistry, mockFoundation, mockConnections, mockIntegration, undefined, undefined, undefined, undefined, undefined, mockTrust);
        const result = await service.replayWebhookFixture({
            fixtureKey: 'gate-pass-webhook',
            strictValidation: true
        });
        // Expect 2 audits: lyt.webhook.accepted (from acceptWebhook) + lyt.fixture.replayed
        strict_1.default.equal(auditCalls.length, 2);
        strict_1.default.equal(auditCalls[0]?.eventType, 'lyt.webhook.accepted');
        strict_1.default.equal(auditCalls[1]?.eventType, 'lyt.fixture.replayed');
        strict_1.default.equal(auditCalls[1]?.details.aggregateId, 'evt-fixture-replay');
        strict_1.default.equal(auditCalls[1]?.details.fixtureKey, 'gate-pass-webhook');
        strict_1.default.equal(auditCalls[1]?.details.strictValidation, true);
        strict_1.default.equal(auditCalls[1]?.details.acceptedStatus, 'accepted');
        strict_1.default.ok(result.standardizedEvent.aggregateId);
    });
});
//# sourceMappingURL=lyt.service.test.js.map