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
class PortalController {
    portalService;
    constructor(portalService) {
        this.portalService = portalService;
    }
    getBootstrap() {
        return this.portalService.getBootstrap();
    }
}
Get('bootstrap')(PortalController.prototype, 'getBootstrap');
Controller('portals')(PortalController);
(0, node_test_1.describe)('PortalController', () => {
    let callCount = 0;
    let bootstrapPayload;
    let controller;
    node_test_1.default.beforeEach(() => {
        callCount = 0;
        bootstrapPayload = {
            tenantPortal: { audience: 'to-b', scopeType: 'tenant' },
            brandPortal: { audience: 'to-b', scopeType: 'brand' },
            storePortal: { audience: 'to-c', scopeType: 'store' },
        };
        controller = new PortalController({
            getBootstrap: () => {
                callCount += 1;
                return bootstrapPayload;
            },
        });
    });
    (0, node_test_1.describe)('getBootstrap()', () => {
        (0, node_test_1.default)('delegates to portalService.getBootstrap', () => {
            const result = controller.getBootstrap();
            strict_1.default.equal(callCount, 1);
            strict_1.default.equal(result, bootstrapPayload);
        });
        (0, node_test_1.default)('returns a well-shaped bootstrap response', () => {
            const result = controller.getBootstrap();
            strict_1.default.ok('tenantPortal' in result);
            strict_1.default.ok('brandPortal' in result);
            strict_1.default.ok('storePortal' in result);
            strict_1.default.equal(result.tenantPortal.audience, 'to-b');
            strict_1.default.equal(result.storePortal.audience, 'to-c');
        });
    });
    (0, node_test_1.describe)('decorator metadata', () => {
        (0, node_test_1.default)('registers controller prefix', () => {
            strict_1.default.equal(PortalController.__prefix, 'portals');
        });
        (0, node_test_1.default)('registers @Get("bootstrap") on getBootstrap', () => {
            strict_1.default.ok(getRegistrations.includes('getBootstrap:bootstrap'));
        });
    });
});
//# sourceMappingURL=portal.controller.spec.js.map