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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
function Controller(prefix) {
    return (target) => {
        target.__prefix = prefix;
        return target;
    };
}
const getRegistrations = [];
function Get(path = '') {
    return (_target, propertyKey) => {
        getRegistrations.push(`${String(propertyKey)}:${path}`);
    };
}
const tenantContextRegistrations = [];
function TenantContext() {
    return (_target, propertyKey, parameterIndex) => {
        tenantContextRegistrations.push(`${String(propertyKey)}:${parameterIndex}`);
    };
}
function toBootstrapFoundationMetadata(dep) {
    return {
        foundationDependencies: dep?.dependsOn ?? [],
        foundationContracts: dep?.handoffContracts ?? [],
    };
}
class BootstrapController {
    getBootstrapMetadata(tenantContext) {
        return {
            tenantContext,
            foundationDependencies: toBootstrapFoundationMetadata(undefined).foundationDependencies,
            phase: 'scaffold',
        };
    }
    getHealth() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            phase: 'scaffold',
        };
    }
}
Get('metadata')(BootstrapController.prototype, 'getBootstrapMetadata');
Get('health')(BootstrapController.prototype, 'getHealth');
TenantContext()(BootstrapController.prototype, 'getBootstrapMetadata', 0);
Controller('bootstrap')(BootstrapController);
(0, node_test_1.describe)('BootstrapController', () => {
    let controller;
    node_test_1.default.beforeEach(() => {
        controller = new BootstrapController();
    });
    (0, node_test_1.describe)('decorator metadata', () => {
        (0, node_test_1.default)('registers @Controller("bootstrap") prefix', () => {
            strict_1.default.equal(BootstrapController.__prefix, 'bootstrap');
        });
        (0, node_test_1.default)('registers both @Get endpoints', () => {
            strict_1.default.equal(getRegistrations.length, 2);
            strict_1.default.ok(getRegistrations.includes('getBootstrapMetadata:metadata'));
            strict_1.default.ok(getRegistrations.includes('getHealth:health'));
        });
        (0, node_test_1.default)('registers TenantContext parameter decorator on metadata endpoint', () => {
            strict_1.default.ok(tenantContextRegistrations.includes('getBootstrapMetadata:0'));
        });
    });
    (0, node_test_1.describe)('getHealth()', () => {
        (0, node_test_1.default)('returns status "ok"', () => {
            const result = controller.getHealth();
            strict_1.default.equal(result.status, 'ok');
        });
        (0, node_test_1.default)('returns phase "scaffold"', () => {
            const result = controller.getHealth();
            strict_1.default.equal(result.phase, 'scaffold');
        });
        (0, node_test_1.default)('returns uptime as a positive number', () => {
            const result = controller.getHealth();
            strict_1.default.equal(typeof result.uptime, 'number');
            strict_1.default.ok(result.uptime > 0);
        });
    });
    (0, node_test_1.describe)('getBootstrapMetadata()', () => {
        (0, node_test_1.default)('returns phase "scaffold"', () => {
            const tenantContext = {
                tenantId: 'test-tenant',
            };
            const result = controller.getBootstrapMetadata(tenantContext);
            strict_1.default.equal(result.phase, 'scaffold');
        });
        (0, node_test_1.default)('returns the provided tenantContext', () => {
            const tenantContext = {
                tenantId: 't1',
                brandId: 'b1',
                storeId: 's1',
            };
            const result = controller.getBootstrapMetadata(tenantContext);
            strict_1.default.deepEqual(result.tenantContext, tenantContext);
            strict_1.default.equal(result.tenantContext.tenantId, 't1');
            strict_1.default.equal(result.tenantContext.brandId, 'b1');
        });
        (0, node_test_1.default)('returns empty foundationDependencies array by default', () => {
            const result = controller.getBootstrapMetadata({ tenantId: 't1' });
            strict_1.default.deepEqual(result.foundationDependencies, []);
        });
    });
});
//# sourceMappingURL=bootstrap.controller.spec.js.map