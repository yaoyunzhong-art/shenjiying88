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
const constants_1 = require("@nestjs/common/constants");
const { TenantContext } = require('./tenant.decorator');
(0, node_test_1.describe)('TenantContext param decorator', () => {
    (0, node_test_1.default)('is a function (returned by createParamDecorator)', () => {
        strict_1.default.equal(typeof TenantContext, 'function');
    });
    (0, node_test_1.default)('called with no arguments returns a ParameterDecorator function', () => {
        const decorator = TenantContext();
        strict_1.default.equal(typeof decorator, 'function');
    });
    (0, node_test_1.default)('called with data returns a ParameterDecorator function', () => {
        const decorator = TenantContext('custom-key');
        strict_1.default.equal(typeof decorator, 'function');
    });
    (0, node_test_1.default)('returns different decorator instances per call', () => {
        const d1 = TenantContext();
        const d2 = TenantContext();
        strict_1.default.notEqual(d1, d2);
    });
    (0, node_test_1.default)('sets ROUTE_ARGS_METADATA on controller method parameter index 0', () => {
        const decorator = TenantContext();
        class TestController {
            handle(_ctx) { }
        }
        decorator(TestController.prototype, 'handle', 0);
        const metadata = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, TestController, 'handle');
        strict_1.default.ok(metadata, 'ROUTE_ARGS_METADATA should be set');
        const keys = Object.keys(metadata);
        strict_1.default.ok(keys.length >= 1, `Expected at least 1 key, got ${keys.length}`);
        // NestJS key format: $uid__customRouteArgs__$index:0
        const paramEntry = Object.values(metadata).find((v) => v && typeof v === 'object' && v.index === 0);
        strict_1.default.ok(paramEntry, 'param at index 0 should have metadata entry');
    });
    (0, node_test_1.default)('sets metadata on different parameter index', () => {
        const decorator = TenantContext();
        class TestController {
            handle(_a, _b) { }
        }
        decorator(TestController.prototype, 'handle', 1);
        const metadata = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, TestController, 'handle');
        const paramEntry = Object.values(metadata).find((v) => v && typeof v === 'object' && v.index === 1);
        strict_1.default.ok(paramEntry, 'param at index 1 should have metadata entry');
    });
    (0, node_test_1.default)('sets metadata for multiple parameters on same method', () => {
        const d0 = TenantContext();
        const d1 = TenantContext();
        class TestController {
            handle(_ctx, _brand) { }
        }
        d0(TestController.prototype, 'handle', 0);
        d1(TestController.prototype, 'handle', 1);
        const metadata = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, TestController, 'handle');
        const keys = Object.keys(metadata);
        strict_1.default.ok(keys.length >= 2, `Expected at least 2 param entries, got ${keys.length}`);
    });
    (0, node_test_1.default)('does not throw when applied to different methods', () => {
        const decorator = TenantContext();
        class TestController {
            handleA() { }
            handleB() { }
        }
        strict_1.default.doesNotThrow(() => decorator(TestController.prototype, 'handleA', 0));
        strict_1.default.doesNotThrow(() => decorator(TestController.prototype, 'handleB', 0));
    });
    (0, node_test_1.default)('metadata entry includes index and empty pipes array', () => {
        const decorator = TenantContext();
        class TestController {
            handle(_ctx) { }
        }
        decorator(TestController.prototype, 'handle', 0);
        const metadata = Reflect.getMetadata(constants_1.ROUTE_ARGS_METADATA, TestController, 'handle');
        const entry = Object.values(metadata).find((v) => v && typeof v === 'object' && v.index === 0);
        strict_1.default.ok(entry, 'should have entry');
        strict_1.default.equal(entry.index, 0);
        strict_1.default.ok(Array.isArray(entry.pipes));
        strict_1.default.equal(entry.pipes.length, 0);
        // factory and data are also stored by NestJS
        strict_1.default.ok(typeof entry.factory === 'function' || entry.data !== undefined, 'entry should have factory function or data');
    });
});
//# sourceMappingURL=tenant.decorator.test.js.map