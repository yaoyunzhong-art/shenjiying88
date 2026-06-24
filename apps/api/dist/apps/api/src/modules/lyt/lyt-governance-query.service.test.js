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
(0, node_test_1.describe)('LytGovernanceQueryService', () => {
    const { LytGovernanceQueryService } = require('./lyt-governance-query.service');
    const { LytService } = require('./lyt.service');
    (0, node_test_1.default)('getConnectionGovernanceSummary aggregates readiness and recommendations', async () => {
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
                capabilities: ['member', 'payment', 'order'],
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
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
                { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
                { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
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
        strict_1.default.equal(result.storeGroups.find((item) => item.code === 'high-risk-stores')?.count, 1);
        strict_1.default.deepEqual(result.storeGroups.find((item) => item.code === 'high-risk-stores')?.storeIds, ['store-pending']);
        strict_1.default.equal(result.storeGroups.find((item) => item.code === 'high-risk-stores')?.recommendedFocus, 'high-risk');
        strict_1.default.equal(result.storeGroups.find((item) => item.code === 'pending-configuration-stores')?.primaryActionLabel, '进入连接配置');
        strict_1.default.equal(result.storeGroups.find((item) => item.code === 'stale-stores')?.count, 1);
        strict_1.default.equal(result.storeGroups.find((item) => item.code === 'inherited-store-verification')?.count, 1);
        strict_1.default.deepEqual(result.stores.map((item) => item.storeId), ['store-pending', 'store-stale', 'store-ready']);
        strict_1.default.equal(result.stores[0]?.governanceRiskLevel, 'high');
        strict_1.default.ok(result.stores[0]?.alertCodes.includes('pending-configuration-stores'));
        strict_1.default.ok(result.stores[0]?.blockingIssueCount > result.stores[2].blockingIssueCount);
        strict_1.default.equal(result.stores[0]?.primaryIssueCode, 'pending-configuration-stores');
        strict_1.default.equal(result.stores[0]?.primaryFocus, 'connection-setup');
        strict_1.default.equal(result.stores[0]?.primaryActionLabel, '补齐连接配置');
        strict_1.default.deepEqual(result.stores[0]?.secondaryIssues.map((item) => item.code), ['credential-missing-stores', 'capability-pending-stores']);
        strict_1.default.deepEqual(result.stores[0]?.focusTrail, ['connection-setup', 'credential-binding', 'capability-rollout']);
        strict_1.default.ok(result.stores[1]?.alertCodes.includes('stale-connections'));
        strict_1.default.equal(result.stores[1]?.primaryIssueCode, 'stale-connections');
        strict_1.default.equal(result.stores[1]?.primaryFocus, 'health-check');
        strict_1.default.deepEqual(result.stores[1]?.secondaryIssues.map((item) => item.code), ['inherited-store-verification']);
        strict_1.default.deepEqual(result.stores[1]?.focusTrail, ['health-check', 'inheritance-verification']);
        strict_1.default.equal(result.stores[2]?.governanceRiskLevel, 'low');
        strict_1.default.equal(result.stores[2]?.primaryIssueCode, 'healthy');
        strict_1.default.equal(result.stores[2]?.primaryFocus, 'stable');
        strict_1.default.deepEqual(result.stores[2]?.secondaryIssues, []);
        strict_1.default.deepEqual(result.stores[2]?.focusTrail, ['stable']);
        strict_1.default.ok(result.stores[0]?.recommendedNextActions.some((item) => item.includes('endpoint')));
    });
    (0, node_test_1.default)('getStoreCapabilityAccessView maps readiness to access states and next actions', async () => {
        const connectionManager = {
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
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getStoreCapabilityAccessView('store-001', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.equal(result.connectionStatus, 'configured');
        strict_1.default.equal(result.healthStatus, 'stale');
        strict_1.default.equal(result.accessByCapability.find((item) => item.capability === 'member')?.access, 'degraded');
        strict_1.default.equal(result.accessByCapability.find((item) => item.capability === 'payment')?.access, 'degraded');
        strict_1.default.ok(result.accessByCapability
            .find((item) => item.capability === 'member')
            ?.reason.includes('优先巡检'));
        strict_1.default.equal(result.accessByCapability.find((item) => item.capability === 'device')?.access, 'hidden');
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('健康检查')));
    });
    (0, node_test_1.default)('getConnectionCapabilityReadiness flags missing vendor mappings as governance requirements', async () => {
        const connectionManager = {
            getConnectionForStore: async () => ({
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-002',
                vendorTenantId: '',
                vendorBrandId: undefined,
                vendorStoreId: '',
                endpoint: 'https://lyt-store.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-002',
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }),
            listScopedStores: async () => [
                { id: 'store-002', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S002', name: '映射缺失门店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionCapabilityReadiness('store-002', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.ok(result.missingRequirements.includes('vendor-tenant-mapping'));
        strict_1.default.ok(result.missingRequirements.includes('vendor-brand-mapping'));
        strict_1.default.ok(result.missingRequirements.includes('vendor-store-mapping'));
        strict_1.default.ok(result.recommendedNextActions.some((item) => item.includes('vendorTenantId / vendorBrandId / vendorStoreId')));
        const summary = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.equal(summary.storeGroups.find((item) => item.code === 'vendor-mapping-gaps')?.recommendedFocus, 'vendor-mapping');
        strict_1.default.equal(summary.stores[0]?.primaryIssueCode, 'vendor-mapping-gaps');
        strict_1.default.equal(summary.stores[0]?.primaryFocus, 'vendor-mapping');
        strict_1.default.equal(summary.stores[0]?.primaryActionLabel, '补齐外部编码映射');
        strict_1.default.deepEqual(summary.stores[0]?.secondaryIssues, []);
        strict_1.default.deepEqual(summary.stores[0]?.focusTrail, ['vendor-mapping']);
    });
    (0, node_test_1.default)('getConnectionCapabilityReadiness keeps recommendation priority for combined readiness issues', async () => {
        const connectionManager = {
            getConnectionForStore: async () => ({
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-003',
                vendorTenantId: '',
                vendorBrandId: undefined,
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-003',
                authMode: 'mock-token',
                hasCredential: false,
                credentialRef: undefined,
                capabilities: ['member'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            }),
            listScopedStores: async () => [
                { id: 'store-003', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S003', name: '组合问题门店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionCapabilityReadiness('store-003', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(result.recommendedNextActions, [
            '优先为该门店补齐独立 endpoint 与 credential，避免长期停留在 fallback/mock 状态',
            '尽快刷新该门店连接健康检查，确认 token、签名和 endpoint 是否仍然有效',
            '优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，避免我方主键与 LYT 外部编码混用',
            '当前门店仍在继承上级连接，建议逐店核对 vendorStoreId 与 capability 开通范围',
            '根据门店实际设备与经营形态确认未开通 capability 是否需要补配或显式禁用'
        ]);
        strict_1.default.ok(result.missingRequirements.includes('credential'));
        strict_1.default.ok(result.missingRequirements.includes('store-scoped-connection'));
        strict_1.default.ok(result.missingRequirements.includes('connection-health-refresh'));
        strict_1.default.ok(result.missingRequirements.includes('store-level-capability-verification'));
    });
    (0, node_test_1.default)('getConnectionCapabilityReadiness returns stable default recommendation for fully ready store', async () => {
        const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf'];
        const connectionManager = {
            getConnectionForStore: async () => ({
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-ready-stable',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-ready-stable',
                endpoint: 'https://lyt-ready-stable.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-ready-stable',
                capabilities: allCapabilities,
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }),
            listScopedStores: async () => [
                { id: 'store-ready-stable', tenantId: 'tenant-001', brandId: 'brand-001', code: 'RS001', name: '稳定就绪门店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionCapabilityReadiness('store-ready-stable', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(result.missingRequirements, []);
        strict_1.default.equal(result.readinessByCapability.every((item) => item.readiness === 'ready'), true);
        strict_1.default.deepEqual(result.recommendedNextActions, ['当前门店连接与 capability readiness 已具备接入治理条件，可继续接真实读面与运营台']);
    });
    (0, node_test_1.default)('getStoreCapabilityAccessView exposes reason copy for enabled degraded blocked and hidden states', async () => {
        const connectionMap = {
            'store-ready': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-ready',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-ready',
                endpoint: 'https://lyt-ready.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-ready',
                capabilities: ['member'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            },
            'store-inherited': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-inherited',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-inherited',
                endpoint: 'https://lyt-inherited.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-inherited',
                capabilities: ['payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'healthy'
            },
            'store-pending': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-pending',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-pending',
                endpoint: 'mock://lyt/tenant-001/store-pending',
                authMode: 'mock-token',
                hasCredential: false,
                credentialRef: undefined,
                capabilities: ['gate'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 门店' },
                { id: 'store-inherited', tenantId: 'tenant-001', brandId: 'brand-001', code: 'I001', name: 'Inherited 门店' },
                { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 门店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const readyView = await service.getStoreCapabilityAccessView('store-ready', { tenantId: 'tenant-001', brandId: 'brand-001' });
        const inheritedView = await service.getStoreCapabilityAccessView('store-inherited', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const pendingView = await service.getStoreCapabilityAccessView('store-pending', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.equal(readyView.accessByCapability.find((item) => item.capability === 'member')?.access, 'enabled');
        strict_1.default.ok(readyView.accessByCapability
            .find((item) => item.capability === 'member')
            ?.reason.includes('可正常开放'));
        strict_1.default.equal(readyView.accessByCapability.find((item) => item.capability === 'device')?.access, 'hidden');
        strict_1.default.ok(readyView.accessByCapability
            .find((item) => item.capability === 'device')
            ?.reason.includes('隐藏无效入口'));
        strict_1.default.equal(inheritedView.accessByCapability.find((item) => item.capability === 'payment')?.access, 'degraded');
        strict_1.default.ok(inheritedView.accessByCapability
            .find((item) => item.capability === 'payment')
            ?.reason.includes('继续逐店核验'));
        strict_1.default.equal(pendingView.accessByCapability.find((item) => item.capability === 'gate')?.access, 'blocked');
        strict_1.default.ok(pendingView.accessByCapability
            .find((item) => item.capability === 'gate')
            ?.reason.includes('阻塞相关操作入口'));
    });
    (0, node_test_1.default)('LytService fallback readiness matches query service readiness shape', async () => {
        const connectionMap = {
            'store-readiness': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-readiness',
                vendorTenantId: '',
                vendorBrandId: undefined,
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-readiness',
                authMode: 'mock-token',
                hasCredential: false,
                credentialRef: undefined,
                capabilities: ['member'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-readiness', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Readiness 门店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryReadiness = await queryService.getConnectionCapabilityReadiness('store-readiness', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const fallbackReadiness = await fallbackService.getConnectionCapabilityReadiness('store-readiness', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackReadiness, queryReadiness);
    });
    (0, node_test_1.default)('LytService fallback readiness matches query service stable default recommendation', async () => {
        const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf'];
        const connectionMap = {
            'store-ready-stable': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-ready-stable',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-ready-stable',
                endpoint: 'https://lyt-ready-stable.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-ready-stable',
                capabilities: allCapabilities,
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                {
                    id: 'store-ready-stable',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'RS001',
                    name: '稳定就绪门店'
                }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryReadiness = await queryService.getConnectionCapabilityReadiness('store-ready-stable', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const fallbackReadiness = await fallbackService.getConnectionCapabilityReadiness('store-ready-stable', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackReadiness, queryReadiness);
        strict_1.default.deepEqual(fallbackReadiness.missingRequirements, []);
        strict_1.default.deepEqual(fallbackReadiness.recommendedNextActions, [
            '当前门店连接与 capability readiness 已具备接入治理条件，可继续接真实读面与运营台'
        ]);
    });
    (0, node_test_1.default)('LytService fallback access view matches query service access reasons', async () => {
        const connectionMap = {
            'store-access': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-access',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-access',
                endpoint: 'mock://lyt/tenant-001/store-access',
                authMode: 'mock-token',
                hasCredential: false,
                credentialRef: undefined,
                capabilities: ['payment'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'tenant',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-access', tenantId: 'tenant-001', brandId: 'brand-001', code: 'A001', name: 'Access 门店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAccessView = await queryService.getStoreCapabilityAccessView('store-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackAccessView, queryAccessView);
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'payment')?.access, 'blocked');
        strict_1.default.ok(fallbackAccessView.accessByCapability
            .find((item) => item.capability === 'payment')
            ?.reason.includes('阻塞相关操作入口'));
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'member')?.access, 'hidden');
    });
    (0, node_test_1.default)('LytService fallback access view matches query service stale degraded reasons', async () => {
        const connectionMap = {
            'store-stale-access': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stale-access',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-stale-access',
                endpoint: 'https://lyt-stale-access.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-stale-access',
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                {
                    id: 'store-stale-access',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'SA001',
                    name: 'Stale Access 门店'
                }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAccessView = await queryService.getStoreCapabilityAccessView('store-stale-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-stale-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackAccessView, queryAccessView);
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'member')?.access, 'degraded');
        strict_1.default.ok(fallbackAccessView.accessByCapability
            .find((item) => item.capability === 'member')
            ?.reason.includes('优先巡检'));
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'device')?.access, 'hidden');
    });
    (0, node_test_1.default)('LytService fallback access view matches query service ready and hidden reasons', async () => {
        const connectionMap = {
            'store-ready-access': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-ready-access',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-ready-access',
                endpoint: 'https://lyt-ready-access.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-ready-access',
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                {
                    id: 'store-ready-access',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'RA001',
                    name: 'Ready Access 门店'
                }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAccessView = await queryService.getStoreCapabilityAccessView('store-ready-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-ready-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackAccessView, queryAccessView);
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'member')?.access, 'enabled');
        strict_1.default.ok(fallbackAccessView.accessByCapability
            .find((item) => item.capability === 'member')
            ?.reason.includes('可正常开放'));
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'device')?.access, 'hidden');
        strict_1.default.ok(fallbackAccessView.accessByCapability
            .find((item) => item.capability === 'device')
            ?.reason.includes('隐藏无效入口'));
    });
    (0, node_test_1.default)('LytService fallback access view matches query service inherited degraded reasons', async () => {
        const connectionMap = {
            'store-inherited-access': {
                vendor: 'lyt-enterprise',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-inherited-access',
                vendorTenantId: 'vendor-tenant-001',
                vendorBrandId: 'vendor-brand-001',
                vendorStoreId: 'vendor-store-inherited-access',
                endpoint: 'https://lyt-inherited-access.example.com',
                authMode: 'signature',
                hasCredential: true,
                credentialRef: 'vault://lyt/store-inherited-access',
                capabilities: ['payment', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                {
                    id: 'store-inherited-access',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'IA001',
                    name: 'Inherited Access 门店'
                }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAccessView = await queryService.getStoreCapabilityAccessView('store-inherited-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const fallbackAccessView = await fallbackService.getStoreCapabilityAccessView('store-inherited-access', {
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackAccessView, queryAccessView);
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'payment')?.access, 'degraded');
        strict_1.default.ok(fallbackAccessView.accessByCapability
            .find((item) => item.capability === 'payment')
            ?.reason.includes('继续逐店核验'));
        strict_1.default.equal(fallbackAccessView.accessByCapability.find((item) => item.capability === 'member')?.access, 'hidden');
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts emits vendor mapping gaps alert', async () => {
        const connectionMap = {
            'store-mapping-gap': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-mapping-gap',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'https://lyt-gap.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'payment', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-mapping-gap', tenantId: 'tenant-001', brandId: 'brand-001', code: 'M001', name: '映射异常店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const vendorGapAlert = result.alerts.find((item) => item.code === 'vendor-mapping-gaps');
        strict_1.default.ok(vendorGapAlert);
        strict_1.default.equal(vendorGapAlert?.severity, 'high');
        strict_1.default.deepEqual(vendorGapAlert?.affectedStoreIds, ['store-mapping-gap']);
        strict_1.default.deepEqual(vendorGapAlert?.affectedCapabilities, ['member', 'payment', 'gate']);
        strict_1.default.equal(vendorGapAlert?.recommendedNextActions[0], '先统一 LYT 外部编码映射，再推进真实门店接入、事件治理与前端读面');
    });
    (0, node_test_1.default)('LytService fallback governance alerts match query service vendor mapping guidance', async () => {
        const connectionMap = {
            'store-mapping-gap': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-mapping-gap',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'https://lyt-gap.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'payment', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-mapping-gap', tenantId: 'tenant-001', brandId: 'brand-001', code: 'M001', name: '映射异常店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const queryVendorGapAlert = queryAlerts.alerts.find((item) => item.code === 'vendor-mapping-gaps');
        const fallbackVendorGapAlert = fallbackAlerts.alerts.find((item) => item.code === 'vendor-mapping-gaps');
        strict_1.default.deepEqual(fallbackVendorGapAlert, queryVendorGapAlert);
        strict_1.default.equal(fallbackVendorGapAlert?.recommendedNextActions[0], '先统一 LYT 外部编码映射，再推进真实门店接入、事件治理与前端读面');
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts emits pending configuration guidance', async () => {
        const connectionMap = {
            'store-pending-alert': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-pending-alert',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-pending-alert',
                endpoint: 'mock://lyt/tenant-001/store-pending-alert',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-pending-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: '待配置告警店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const pendingAlert = result.alerts.find((item) => item.code === 'pending-configuration-stores');
        strict_1.default.ok(pendingAlert);
        strict_1.default.equal(pendingAlert?.severity, 'high');
        strict_1.default.deepEqual(pendingAlert?.affectedStoreIds, ['store-pending-alert']);
        strict_1.default.equal(pendingAlert?.recommendedNextActions[0], '优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态');
    });
    (0, node_test_1.default)('LytService fallback governance alerts match query service pending configuration guidance', async () => {
        const connectionMap = {
            'store-pending-alert': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-pending-alert',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-pending-alert',
                endpoint: 'mock://lyt/tenant-001/store-pending-alert',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-pending-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: '待配置告警店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const queryPendingAlert = queryAlerts.alerts.find((item) => item.code === 'pending-configuration-stores');
        const fallbackPendingAlert = fallbackAlerts.alerts.find((item) => item.code === 'pending-configuration-stores');
        strict_1.default.deepEqual(fallbackPendingAlert, queryPendingAlert);
        strict_1.default.equal(fallbackPendingAlert?.recommendedNextActions[0], '优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态');
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts emits stale connection guidance', async () => {
        const connectionMap = {
            'store-stale-alert': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stale-alert',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stale-alert',
                endpoint: 'https://lyt-stale-alert.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'stale'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-stale-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '过期连接告警店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const staleAlert = result.alerts.find((item) => item.code === 'stale-connections');
        strict_1.default.ok(staleAlert);
        strict_1.default.equal(staleAlert?.severity, 'high');
        strict_1.default.deepEqual(staleAlert?.affectedStoreIds, ['store-stale-alert']);
        strict_1.default.equal(staleAlert?.recommendedNextActions[0], '批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效');
    });
    (0, node_test_1.default)('LytService fallback governance alerts match query service stale guidance', async () => {
        const connectionMap = {
            'store-stale-alert': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stale-alert',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stale-alert',
                endpoint: 'https://lyt-stale-alert.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'stale'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-stale-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: '过期连接告警店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const queryStaleAlert = queryAlerts.alerts.find((item) => item.code === 'stale-connections');
        const fallbackStaleAlert = fallbackAlerts.alerts.find((item) => item.code === 'stale-connections');
        strict_1.default.deepEqual(fallbackStaleAlert, queryStaleAlert);
        strict_1.default.equal(fallbackStaleAlert?.recommendedNextActions[0], '批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效');
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts emits credential missing guidance', async () => {
        const connectionMap = {
            'store-credential-alert': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-credential-alert',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-credential-alert',
                endpoint: 'https://lyt-credential-alert.example.com',
                authMode: 'signature',
                hasCredential: false,
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-credential-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '凭证缺失告警店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const credentialAlert = result.alerts.find((item) => item.code === 'credential-missing-stores');
        strict_1.default.ok(credentialAlert);
        strict_1.default.equal(credentialAlert?.severity, 'high');
        strict_1.default.deepEqual(credentialAlert?.affectedStoreIds, ['store-credential-alert']);
        strict_1.default.equal(credentialAlert?.recommendedNextActions[0], '为缺失凭证的门店补齐 credentialRef 或安全密钥绑定');
    });
    (0, node_test_1.default)('LytService fallback governance alerts match query service credential guidance', async () => {
        const connectionMap = {
            'store-credential-alert': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-credential-alert',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-credential-alert',
                endpoint: 'https://lyt-credential-alert.example.com',
                authMode: 'signature',
                hasCredential: false,
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-credential-alert', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '凭证缺失告警店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const queryCredentialAlert = queryAlerts.alerts.find((item) => item.code === 'credential-missing-stores');
        const fallbackCredentialAlert = fallbackAlerts.alerts.find((item) => item.code === 'credential-missing-stores');
        strict_1.default.deepEqual(fallbackCredentialAlert, queryCredentialAlert);
        strict_1.default.equal(fallbackCredentialAlert?.recommendedNextActions[0], '为缺失凭证的门店补齐 credentialRef 或安全密钥绑定');
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary orders complex high risk stores by issue weight and preserves focus trail order', async () => {
        const connectionMap = {
            'store-complex': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-complex',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-complex',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment', 'order', 'gate'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            },
            'store-vendor': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-vendor',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'https://lyt-vendor.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            },
            'store-healthy': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-healthy',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-healthy',
                endpoint: 'https://lyt-healthy.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-complex', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '复杂高风险店' },
                { id: 'store-vendor', tenantId: 'tenant-001', brandId: 'brand-001', code: 'V001', name: '映射缺口店' },
                { id: 'store-healthy', tenantId: 'tenant-001', brandId: 'brand-001', code: 'H001', name: '稳定门店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.deepEqual(result.stores.map((item) => item.storeId), ['store-complex', 'store-vendor', 'store-healthy']);
        strict_1.default.equal(result.stores[0]?.blockingIssueCount, 4);
        strict_1.default.deepEqual(result.stores[0]?.secondaryIssues.map((item) => item.code), [
            'vendor-mapping-gaps',
            'credential-missing-stores',
            'stale-connections',
            'inherited-store-verification',
            'capability-pending-stores'
        ]);
        strict_1.default.deepEqual(result.stores[0]?.focusTrail, [
            'connection-setup',
            'vendor-mapping',
            'credential-binding',
            'health-check',
            'inheritance-verification',
            'capability-rollout'
        ]);
        strict_1.default.equal(result.stores[1]?.primaryIssueCode, 'vendor-mapping-gaps');
        strict_1.default.deepEqual(result.stores[1]?.focusTrail, ['vendor-mapping']);
        strict_1.default.deepEqual(result.stores[2]?.focusTrail, ['stable']);
    });
    (0, node_test_1.default)('LytService fallback governance summary matches query service focus trail shape', async () => {
        const connectionMap = {
            'store-complex': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-complex',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-complex',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment', 'order', 'gate'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            },
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
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-complex', tenantId: 'tenant-001', brandId: 'brand-001', code: 'C001', name: '复杂高风险店' },
                { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackSummary.stores.map((item) => ({
            storeId: item.storeId,
            primaryIssueCode: item.primaryIssueCode,
            focusTrail: item.focusTrail
        })), querySummary.stores.map((item) => ({
            storeId: item.storeId,
            primaryIssueCode: item.primaryIssueCode,
            focusTrail: item.focusTrail
        })));
        strict_1.default.deepEqual(fallbackSummary.stores.map((item) => item.secondaryIssues.map((entry) => entry.code)), querySummary.stores.map((item) => item.secondaryIssues.map((entry) => entry.code)));
        strict_1.default.deepEqual(fallbackSummary.storeGroups.map((item) => ({
            code: item.code,
            recommendedFocus: item.recommendedFocus
        })), querySummary.storeGroups.map((item) => ({
            code: item.code,
            recommendedFocus: item.recommendedFocus
        })));
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary aggregates capability breakdown across ready inherited stale pending and hidden states', async () => {
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
                capabilities: ['member', 'payment', 'order'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            },
            'store-inherited-stale': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-inherited-stale',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-inherited-stale',
                endpoint: 'https://lyt-inherited-stale.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'payment', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
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
                capabilities: ['payment', 'device'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
                {
                    id: 'store-inherited-stale',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'I001',
                    name: 'Inherited Stale 店'
                },
                { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.deepEqual(result.capabilityBreakdown.find((item) => item.capability === 'member'), {
            capability: 'member',
            readyStores: 1,
            inheritedReadyStores: 0,
            staleStores: 1,
            pendingStores: 0,
            notEnabledStores: 1
        });
        strict_1.default.deepEqual(result.capabilityBreakdown.find((item) => item.capability === 'payment'), {
            capability: 'payment',
            readyStores: 1,
            inheritedReadyStores: 0,
            staleStores: 1,
            pendingStores: 1,
            notEnabledStores: 0
        });
        strict_1.default.deepEqual(result.capabilityBreakdown.find((item) => item.capability === 'order'), {
            capability: 'order',
            readyStores: 1,
            inheritedReadyStores: 0,
            staleStores: 0,
            pendingStores: 0,
            notEnabledStores: 2
        });
        strict_1.default.deepEqual(result.capabilityBreakdown.find((item) => item.capability === 'gate'), {
            capability: 'gate',
            readyStores: 0,
            inheritedReadyStores: 0,
            staleStores: 1,
            pendingStores: 0,
            notEnabledStores: 2
        });
        strict_1.default.deepEqual(result.capabilityBreakdown.find((item) => item.capability === 'device'), {
            capability: 'device',
            readyStores: 0,
            inheritedReadyStores: 0,
            staleStores: 0,
            pendingStores: 1,
            notEnabledStores: 2
        });
    });
    (0, node_test_1.default)('LytService fallback governance summary matches query service capability breakdown', async () => {
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
                capabilities: ['member', 'payment', 'order'],
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
                capabilities: ['payment', 'device'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-ready', tenantId: 'tenant-001', brandId: 'brand-001', code: 'R001', name: 'Ready 店' },
                { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackSummary.capabilityBreakdown, querySummary.capabilityBreakdown);
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary keeps recommended next actions in governance priority order', async () => {
        const connectionMap = {
            'store-priority-a': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-priority-a',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-priority-a',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment', 'order'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'tenant',
                healthStatus: 'pending-configuration'
            },
            'store-priority-b': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-priority-b',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-priority-b',
                endpoint: 'https://lyt-priority-b.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['payment', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'stale'
            },
            'store-priority-c': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-priority-c',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-priority-c',
                endpoint: 'https://lyt-priority-c.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-priority-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Priority 店A' },
                { id: 'store-priority-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P002', name: 'Priority 店B' },
                { id: 'store-priority-c', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P003', name: 'Priority 店C' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.deepEqual(result.recommendedNextActions, [
            '优先清理 pending-configuration 门店，先补真实 endpoint、credential 和 vendorStoreId 映射',
            '针对 stale 门店批量执行连接巡检，确认签名、凭证和健康检查时效',
            '优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，先统一外部编码再继续推进工作台接入',
            '对继承品牌/租户默认连接的门店逐店核查 capability readiness，避免上级默认配置掩盖门店差异',
            '优先补齐 capability member 的门店开通信息，减少门店侧功能降级'
        ]);
    });
    (0, node_test_1.default)('LytService fallback governance summary matches query service recommended next actions', async () => {
        const connectionMap = {
            'store-query-a': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-query-a',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-query-a',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['payment', 'device'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            },
            'store-query-b': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-query-b',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-query-b',
                endpoint: 'https://lyt-query-b.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'payment'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-query-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'Q001', name: 'Query 店A' },
                { id: 'store-query-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'Q002', name: 'Query 店B' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackSummary.recommendedNextActions, querySummary.recommendedNextActions);
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary returns only stable default recommendation for healthy fully configured stores', async () => {
        const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf'];
        const connectionMap = {
            'store-stable-a': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stable-a',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stable-a',
                endpoint: 'https://lyt-stable-a.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: allCapabilities,
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            },
            'store-stable-b': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stable-b',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stable-b',
                endpoint: 'https://lyt-stable-b.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: allCapabilities,
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-stable-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stable 店A' },
                { id: 'store-stable-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S002', name: 'Stable 店B' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.deepEqual(result.recommendedNextActions, ['当前租户/品牌的 LYT 连接治理状态稳定，可继续推进真实门店读面和运营工作台接入']);
        strict_1.default.deepEqual(result.storeGroups, []);
        strict_1.default.ok(result.stores.every((item) => item.primaryIssueCode === 'healthy'));
        strict_1.default.ok(result.stores.every((item) => item.focusTrail.length === 1 && item.focusTrail[0] === 'stable'));
    });
    (0, node_test_1.default)('healthy tenant emits no governance alerts and fallback matches query defaults', async () => {
        const allCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf'];
        const connectionMap = {
            'store-stable-a': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stable-a',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stable-a',
                endpoint: 'https://lyt-stable-a.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: allCapabilities,
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            },
            'store-stable-b': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-stable-b',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-stable-b',
                endpoint: 'https://lyt-stable-b.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: allCapabilities,
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-stable-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stable 店A' },
                { id: 'store-stable-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S002', name: 'Stable 店B' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const querySummary = await queryService.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackSummary = await fallbackService.getConnectionGovernanceSummary({
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(queryAlerts.alerts, []);
        strict_1.default.deepEqual(fallbackAlerts.alerts, []);
        strict_1.default.deepEqual(fallbackSummary.recommendedNextActions, querySummary.recommendedNextActions);
        strict_1.default.deepEqual(fallbackSummary.storeGroups, querySummary.storeGroups);
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary prefers earliest governed capability when pending counts tie', async () => {
        const connectionMap = {
            'store-tie-a': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-tie-a',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-tie-a',
                endpoint: 'mock://lyt/tenant-001/store-tie-a',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            },
            'store-tie-b': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-tie-b',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-tie-b',
                endpoint: 'mock://lyt/tenant-001/store-tie-b',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['payment'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-tie-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T001', name: 'Tie 店A' },
                { id: 'store-tie-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T002', name: 'Tie 店B' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.equal(result.recommendedNextActions[result.recommendedNextActions.length - 1], '优先补齐 capability member 的门店开通信息，减少门店侧功能降级');
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts prefers earliest governed capability on tied pending and hidden counts', async () => {
        const connectionMap = {
            'store-tie-a': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-tie-a',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-tie-a',
                endpoint: 'mock://lyt/tenant-001/store-tie-a',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            },
            'store-tie-b': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-tie-b',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-tie-b',
                endpoint: 'mock://lyt/tenant-001/store-tie-b',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['payment'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-tie-a', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T001', name: 'Tie 店A' },
                { id: 'store-tie-b', tenantId: 'tenant-001', brandId: 'brand-001', code: 'T002', name: 'Tie 店B' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        const pendingCapabilityAlert = queryAlerts.alerts.find((item) => item.code === 'capability-pending-stores');
        const notEnabledCapabilityAlert = queryAlerts.alerts.find((item) => item.code === 'capability-not-enabled-gaps');
        strict_1.default.ok(pendingCapabilityAlert?.summary.includes('capability member'));
        strict_1.default.deepEqual(pendingCapabilityAlert?.affectedCapabilities, ['member']);
        strict_1.default.ok(notEnabledCapabilityAlert?.summary.includes('capability order'));
        strict_1.default.deepEqual(notEnabledCapabilityAlert?.affectedCapabilities, ['order']);
        strict_1.default.deepEqual(fallbackAlerts.alerts, queryAlerts.alerts);
    });
    (0, node_test_1.default)('getConnectionGovernanceSummary keeps storeGroups sorted and counts overlapping stores correctly', async () => {
        const connectionMap = {
            'store-alpha': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-alpha',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-alpha',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'fallback',
                healthStatus: 'pending-configuration'
            },
            'store-beta': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-beta',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'https://lyt-beta.example.com',
                authMode: 'signature',
                hasCredential: false,
                capabilities: ['member', 'gate'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'tenant',
                healthStatus: 'stale'
            },
            'store-gamma': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-gamma',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'https://lyt-gamma.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-alpha', tenantId: 'tenant-001', brandId: 'brand-001', code: 'A001', name: 'Alpha 店' },
                { id: 'store-beta', tenantId: 'tenant-001', brandId: 'brand-001', code: 'B001', name: 'Beta 店' },
                { id: 'store-gamma', tenantId: 'tenant-001', brandId: 'brand-001', code: 'G001', name: 'Gamma 店' }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001', brandId: 'brand-001' });
        strict_1.default.deepEqual(result.storeGroups.map((item) => item.code), [
            'vendor-mapping-gaps',
            'high-risk-stores',
            'credential-missing-stores',
            'stale-stores',
            'pending-configuration-stores',
            'inherited-store-verification'
        ]);
        strict_1.default.deepEqual(result.storeGroups.find((item) => item.code === 'vendor-mapping-gaps')?.storeIds, ['store-alpha', 'store-beta', 'store-gamma']);
        strict_1.default.deepEqual(result.storeGroups.find((item) => item.code === 'high-risk-stores')?.storeIds, ['store-alpha', 'store-beta', 'store-gamma']);
        strict_1.default.deepEqual(result.storeGroups.find((item) => item.code === 'credential-missing-stores')?.storeIds, ['store-alpha', 'store-beta']);
        strict_1.default.deepEqual(result.storeGroups.find((item) => item.code === 'pending-configuration-stores')?.storeIds, ['store-alpha']);
        strict_1.default.deepEqual(result.storeGroups.find((item) => item.code === 'stale-stores')?.storeIds, ['store-beta']);
        strict_1.default.deepEqual(result.storeGroups.find((item) => item.code === 'inherited-store-verification')?.storeIds, ['store-beta']);
    });
    (0, node_test_1.default)('getConnectionGovernanceAlerts picks top pending and not-enabled capabilities by affected store count', async () => {
        const connectionMap = {
            'store-payment-pending-a': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-payment-pending-a',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-payment-pending-a',
                endpoint: 'mock://lyt/tenant-001/store-payment-pending-a',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment', 'order', 'device', 'coin', 'inventory', 'shelf'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'store',
                healthStatus: 'pending-configuration'
            },
            'store-payment-pending-b': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-payment-pending-b',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-payment-pending-b',
                endpoint: 'mock://lyt/tenant-001/store-payment-pending-b',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['payment', 'order', 'device', 'coin', 'inventory', 'shelf'],
                connectionStatus: 'pending-configuration',
                source: 'fallback',
                resolutionLevel: 'store',
                healthStatus: 'pending-configuration'
            },
            'store-member-ready': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-member-ready',
                vendorTenantId: 'tenant-001',
                vendorBrandId: 'brand-001',
                vendorStoreId: 'vendor-store-member-ready',
                endpoint: 'https://lyt-member-ready.example.com',
                authMode: 'signature',
                hasCredential: true,
                capabilities: ['member', 'order', 'device', 'coin', 'inventory', 'shelf'],
                connectionStatus: 'configured',
                source: 'prisma',
                resolutionLevel: 'store',
                healthStatus: 'healthy'
            }
        };
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                {
                    id: 'store-payment-pending-a',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'P001',
                    name: '支付待配置店A'
                },
                {
                    id: 'store-payment-pending-b',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'P002',
                    name: '支付待配置店B'
                },
                {
                    id: 'store-member-ready',
                    tenantId: 'tenant-001',
                    brandId: 'brand-001',
                    code: 'M001',
                    name: '会员稳定店'
                }
            ]
        };
        const service = new LytGovernanceQueryService(connectionManager);
        const result = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const pendingCapabilityAlert = result.alerts.find((item) => item.code === 'capability-pending-stores');
        const notEnabledCapabilityAlert = result.alerts.find((item) => item.code === 'capability-not-enabled-gaps');
        strict_1.default.ok(pendingCapabilityAlert);
        strict_1.default.equal(pendingCapabilityAlert?.count, 2);
        strict_1.default.deepEqual(pendingCapabilityAlert?.affectedCapabilities, ['payment']);
        strict_1.default.deepEqual(pendingCapabilityAlert?.affectedStoreIds, ['store-payment-pending-a', 'store-payment-pending-b']);
        strict_1.default.ok(pendingCapabilityAlert?.recommendedNextActions[0]?.includes('payment'));
        strict_1.default.ok(notEnabledCapabilityAlert);
        strict_1.default.equal(notEnabledCapabilityAlert?.count, 3);
        strict_1.default.deepEqual(notEnabledCapabilityAlert?.affectedCapabilities, ['gate']);
        strict_1.default.deepEqual(notEnabledCapabilityAlert?.affectedStoreIds, ['store-payment-pending-a', 'store-payment-pending-b', 'store-member-ready']);
        strict_1.default.ok(notEnabledCapabilityAlert?.recommendedNextActions[0]?.includes('gate'));
    });
    (0, node_test_1.default)('LytService fallback governance alerts match query service alert shape', async () => {
        const connectionMap = {
            'store-pending': {
                vendor: 'lyt',
                tenantId: 'tenant-001',
                brandId: 'brand-001',
                storeId: 'store-pending',
                vendorTenantId: 'tenant-001',
                vendorBrandId: '',
                vendorStoreId: '',
                endpoint: 'mock://lyt/tenant-001/store-pending',
                authMode: 'mock-token',
                hasCredential: false,
                capabilities: ['member', 'payment'],
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
        const connectionManager = {
            getConnectionForStore: async (storeId) => connectionMap[storeId],
            listScopedStores: async () => [
                { id: 'store-pending', tenantId: 'tenant-001', brandId: 'brand-001', code: 'P001', name: 'Pending 店' },
                { id: 'store-stale', tenantId: 'tenant-001', brandId: 'brand-001', code: 'S001', name: 'Stale 店' }
            ]
        };
        const queryService = new LytGovernanceQueryService(connectionManager);
        const fallbackService = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, connectionManager, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) });
        const queryAlerts = await queryService.getConnectionGovernanceAlerts({ tenantId: 'tenant-001', brandId: 'brand-001' });
        const fallbackAlerts = await fallbackService.getConnectionGovernanceAlerts({
            tenantId: 'tenant-001',
            brandId: 'brand-001'
        });
        strict_1.default.deepEqual(fallbackAlerts.alerts.map((item) => ({
            code: item.code,
            severity: item.severity,
            count: item.count,
            affectedStoreIds: item.affectedStoreIds,
            affectedCapabilities: item.affectedCapabilities
        })), queryAlerts.alerts.map((item) => ({
            code: item.code,
            severity: item.severity,
            count: item.count,
            affectedStoreIds: item.affectedStoreIds,
            affectedCapabilities: item.affectedCapabilities
        })));
    });
    (0, node_test_1.default)('LytService delegates governance queries to LytGovernanceQueryService when injected', async () => {
        const governanceQueryService = {
            getConnectionCapabilityReadiness: async () => ({ kind: 'readiness-delegated' }),
            getConnectionGovernanceSummary: async () => ({ kind: 'summary-delegated' }),
            getConnectionGovernanceAlerts: async () => ({ kind: 'alerts-delegated' }),
            getStoreCapabilityAccessView: async () => ({ kind: 'access-delegated' })
        };
        const service = new LytService({
            getDefaultAdapter: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock' }),
            resolveAdapterSelection: () => ({ adapterName: 'MockLytAdapter', adapterMode: 'mock', reason: 'default' }),
            listAvailableAdapters: () => []
        }, { getDependencySummary: () => null }, {
            getConnectionForStore: async () => {
                throw new Error('should not reach connection manager when governance query service is injected');
            },
            listScopedStores: async () => []
        }, { acceptWebhook: async () => ({}), publishEvent: async () => ({}) }, undefined, undefined, undefined, undefined, governanceQueryService);
        const readiness = await service.getConnectionCapabilityReadiness('store-001', { tenantId: 'tenant-001' });
        const summary = await service.getConnectionGovernanceSummary({ tenantId: 'tenant-001' });
        const alerts = await service.getConnectionGovernanceAlerts({ tenantId: 'tenant-001' });
        const accessView = await service.getStoreCapabilityAccessView('store-001', { tenantId: 'tenant-001' });
        strict_1.default.deepEqual(readiness, { kind: 'readiness-delegated' });
        strict_1.default.deepEqual(summary, { kind: 'summary-delegated' });
        strict_1.default.deepEqual(alerts, { kind: 'alerts-delegated' });
        strict_1.default.deepEqual(accessView, { kind: 'access-delegated' });
    });
});
//# sourceMappingURL=lyt-governance-query.service.test.js.map