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
class LytService {
    getAdapter() {
        return {
            getMember: async (id) => ({
                id,
                name: 'seed-member-001',
                level: 'GOLD',
            }),
        };
    }
}
class HealthController {
    lytService;
    constructor(lytService) {
        this.lytService = lytService;
    }
    async getHealth() {
        const adapter = this.lytService.getAdapter();
        const sampleMember = await adapter.getMember('seed-member-001');
        return {
            status: 'ok',
            lytMode: 'mock',
            sampleMember,
        };
    }
}
Get()(HealthController.prototype, 'getHealth');
Controller('health')(HealthController);
(0, node_test_1.describe)('HealthController', () => {
    let controller;
    node_test_1.default.beforeEach(() => {
        controller = new HealthController(new LytService());
    });
    (0, node_test_1.describe)('getHealth()', () => {
        (0, node_test_1.default)('returns status "ok"', async () => {
            const result = await controller.getHealth();
            strict_1.default.equal(result.status, 'ok');
        });
        (0, node_test_1.default)('returns lytMode "mock"', async () => {
            const result = await controller.getHealth();
            strict_1.default.equal(result.lytMode, 'mock');
        });
        (0, node_test_1.default)('returns seed sample member', async () => {
            const result = await controller.getHealth();
            strict_1.default.equal(result.sampleMember.id, 'seed-member-001');
        });
        (0, node_test_1.default)('calls adapter.getMember with seed id', async () => {
            let calledWith = null;
            const mockLytService = {
                getAdapter: () => ({
                    getMember: async (id) => {
                        calledWith = id;
                        return { id: 'x', name: 'test' };
                    },
                }),
            };
            const ctrl = new HealthController(mockLytService);
            await ctrl.getHealth();
            strict_1.default.equal(calledWith, 'seed-member-001');
        });
    });
    (0, node_test_1.describe)('decorator metadata', () => {
        (0, node_test_1.default)('registers controller prefix', () => {
            strict_1.default.equal(HealthController.__prefix, 'health');
        });
        (0, node_test_1.default)('registers @Get on getHealth', () => {
            strict_1.default.ok(getRegistrations.includes('getHealth:'));
        });
    });
});
//# sourceMappingURL=health.controller.spec.js.map