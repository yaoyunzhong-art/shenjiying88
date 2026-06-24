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
const tenant_dto_1 = require("./tenant.dto");
(0, node_test_1.describe)('tenant.dto: TenantResolveQueryDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new tenant_dto_1.TenantResolveQueryDto();
        strict_1.default.equal(dto.verbose, undefined);
        strict_1.default.equal(dto.scope, undefined);
    });
    (0, node_test_1.default)('can set verbose=true', () => {
        const dto = new tenant_dto_1.TenantResolveQueryDto();
        dto.verbose = true;
        strict_1.default.equal(dto.verbose, true);
    });
    (0, node_test_1.default)('can set verbose=false', () => {
        const dto = new tenant_dto_1.TenantResolveQueryDto();
        dto.verbose = false;
        strict_1.default.equal(dto.verbose, false);
    });
    (0, node_test_1.default)('can set scope string', () => {
        const dto = new tenant_dto_1.TenantResolveQueryDto();
        dto.scope = 'tenant-platform';
        strict_1.default.equal(dto.scope, 'tenant-platform');
    });
    (0, node_test_1.default)('can set both verbose and scope', () => {
        const dto = new tenant_dto_1.TenantResolveQueryDto();
        dto.verbose = true;
        dto.scope = 'tenant-scope';
        strict_1.default.equal(dto.verbose, true);
        strict_1.default.equal(dto.scope, 'tenant-scope');
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new tenant_dto_1.TenantResolveQueryDto();
        strict_1.default.ok(dto instanceof tenant_dto_1.TenantResolveQueryDto);
    });
});
(0, node_test_1.describe)('tenant.dto: TenantActorDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new tenant_dto_1.TenantActorDto();
        strict_1.default.equal(dto.actorId, undefined);
        strict_1.default.equal(dto.actorType, undefined);
        strict_1.default.equal(dto.actorName, undefined);
        strict_1.default.equal(dto.roles, undefined);
        strict_1.default.equal(dto.permissions, undefined);
        strict_1.default.equal(dto.authenticated, undefined);
    });
    (0, node_test_1.default)('can construct complete actor', () => {
        const dto = new tenant_dto_1.TenantActorDto();
        dto.actorId = 'a-001';
        dto.actorType = 'tenant-user';
        dto.actorName = '张三';
        dto.roles = ['manager', 'staff'];
        dto.permissions = ['read:tenant', 'write:tenant'];
        dto.authenticated = true;
        strict_1.default.equal(dto.actorId, 'a-001');
        strict_1.default.equal(dto.actorType, 'tenant-user');
        strict_1.default.equal(dto.actorName, '张三');
        strict_1.default.deepEqual(dto.roles, ['manager', 'staff']);
        strict_1.default.deepEqual(dto.permissions, ['read:tenant', 'write:tenant']);
        strict_1.default.equal(dto.authenticated, true);
    });
    (0, node_test_1.default)('can construct unauthenticated actor', () => {
        const dto = new tenant_dto_1.TenantActorDto();
        dto.actorId = 'a-002';
        dto.actorType = 'service-account';
        dto.roles = [];
        dto.permissions = [];
        dto.authenticated = false;
        strict_1.default.equal(dto.authenticated, false);
        strict_1.default.deepEqual(dto.roles, []);
        strict_1.default.deepEqual(dto.permissions, []);
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new tenant_dto_1.TenantActorDto();
        strict_1.default.ok(dto instanceof tenant_dto_1.TenantActorDto);
    });
});
(0, node_test_1.describe)('tenant.dto: TenantResolveResponseDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new tenant_dto_1.TenantResolveResponseDto();
        strict_1.default.equal(dto.effectiveTenantId, undefined);
        strict_1.default.equal(dto.source, undefined);
        strict_1.default.equal(dto.effectiveBrandId, undefined);
        strict_1.default.equal(dto.effectiveStoreId, undefined);
        strict_1.default.equal(dto.effectiveMarketCode, undefined);
        strict_1.default.equal(dto.actor, undefined);
        strict_1.default.equal(dto.requestId, undefined);
    });
    (0, node_test_1.default)('can construct complete response', () => {
        const actor = new tenant_dto_1.TenantActorDto();
        actor.actorId = 'a-001';
        actor.actorType = 'tenant-user';
        actor.roles = ['staff'];
        actor.permissions = [];
        actor.authenticated = true;
        const dto = new tenant_dto_1.TenantResolveResponseDto();
        dto.requestId = 'req-001';
        dto.effectiveTenantId = 'tenant-demo';
        dto.effectiveBrandId = 'brand-01';
        dto.effectiveStoreId = 'store-01';
        dto.effectiveMarketCode = 'default';
        dto.actor = actor;
        dto.source = 'tenant-module';
        strict_1.default.equal(dto.requestId, 'req-001');
        strict_1.default.equal(dto.effectiveTenantId, 'tenant-demo');
        strict_1.default.equal(dto.effectiveBrandId, 'brand-01');
        strict_1.default.equal(dto.effectiveStoreId, 'store-01');
        strict_1.default.equal(dto.effectiveMarketCode, 'default');
        strict_1.default.ok(dto.actor);
        strict_1.default.equal(dto.actor.actorId, 'a-001');
        strict_1.default.equal(dto.source, 'tenant-module');
    });
    (0, node_test_1.default)('supports actor as null', () => {
        const dto = new tenant_dto_1.TenantResolveResponseDto();
        dto.effectiveTenantId = 'tenant-demo';
        dto.source = 'tenant-module';
        dto.actor = null;
        strict_1.default.equal(dto.actor, null);
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new tenant_dto_1.TenantResolveResponseDto();
        strict_1.default.ok(dto instanceof tenant_dto_1.TenantResolveResponseDto);
    });
});
(0, node_test_1.describe)('tenant.dto: TenantContextSetDto', () => {
    (0, node_test_1.default)('default properties are undefined', () => {
        const dto = new tenant_dto_1.TenantContextSetDto();
        strict_1.default.equal(dto.tenantId, undefined);
        strict_1.default.equal(dto.brandId, undefined);
        strict_1.default.equal(dto.storeId, undefined);
        strict_1.default.equal(dto.marketCode, undefined);
    });
    (0, node_test_1.default)('can set partial context', () => {
        const dto = new tenant_dto_1.TenantContextSetDto();
        dto.tenantId = 'tenant-custom';
        dto.marketCode = 'cn-sh';
        strict_1.default.equal(dto.tenantId, 'tenant-custom');
        strict_1.default.equal(dto.marketCode, 'cn-sh');
        strict_1.default.equal(dto.brandId, undefined);
        strict_1.default.equal(dto.storeId, undefined);
    });
    (0, node_test_1.default)('can set full context', () => {
        const dto = new tenant_dto_1.TenantContextSetDto();
        dto.tenantId = 'tenant-001';
        dto.brandId = 'brand-001';
        dto.storeId = 'store-001';
        dto.marketCode = 'cn-bj';
        strict_1.default.equal(dto.tenantId, 'tenant-001');
        strict_1.default.equal(dto.brandId, 'brand-001');
        strict_1.default.equal(dto.storeId, 'store-001');
        strict_1.default.equal(dto.marketCode, 'cn-bj');
    });
    (0, node_test_1.default)('instanceof check', () => {
        const dto = new tenant_dto_1.TenantContextSetDto();
        strict_1.default.ok(dto instanceof tenant_dto_1.TenantContextSetDto);
    });
});
//# sourceMappingURL=tenant.dto.test.js.map