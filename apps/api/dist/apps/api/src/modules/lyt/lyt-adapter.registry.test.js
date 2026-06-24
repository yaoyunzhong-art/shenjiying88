"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const config_1 = require("@nestjs/config");
const mock_lyt_adapter_1 = require("./adapters/mock-lyt.adapter");
const real_lyt_adapter_1 = require("./adapters/real-lyt.adapter");
const sandbox_lyt_adapter_1 = require("./adapters/sandbox-lyt.adapter");
const lyt_adapter_registry_1 = require("./lyt-adapter.registry");
(0, node_test_1.default)('LytAdapterRegistry resolves mock adapter for fallback connection', () => {
    const configService = new config_1.ConfigService();
    const registry = new lyt_adapter_registry_1.LytAdapterRegistry(new mock_lyt_adapter_1.MockLytAdapter(), new sandbox_lyt_adapter_1.SandboxLytAdapter(configService), new real_lyt_adapter_1.RealLytAdapter(configService));
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
    strict_1.default.equal(selection.adapterName, 'MockLytAdapter');
    strict_1.default.equal(selection.adapterMode, 'mock');
});
(0, node_test_1.default)('LytAdapterRegistry resolves sandbox adapter for sandbox endpoint', () => {
    const configService = new config_1.ConfigService();
    const registry = new lyt_adapter_registry_1.LytAdapterRegistry(new mock_lyt_adapter_1.MockLytAdapter(), new sandbox_lyt_adapter_1.SandboxLytAdapter(configService), new real_lyt_adapter_1.RealLytAdapter(configService));
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
    strict_1.default.equal(selection.adapterName, 'SandboxLytAdapter');
    strict_1.default.equal(selection.adapterMode, 'sandbox');
});
(0, node_test_1.default)('LytAdapterRegistry resolves real adapter for production endpoint', () => {
    const configService = new config_1.ConfigService();
    const registry = new lyt_adapter_registry_1.LytAdapterRegistry(new mock_lyt_adapter_1.MockLytAdapter(), new sandbox_lyt_adapter_1.SandboxLytAdapter(configService), new real_lyt_adapter_1.RealLytAdapter(configService));
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
    strict_1.default.equal(selection.adapterName, 'RealLytAdapter');
    strict_1.default.equal(selection.adapterMode, 'real');
});
//# sourceMappingURL=lyt-adapter.registry.test.js.map