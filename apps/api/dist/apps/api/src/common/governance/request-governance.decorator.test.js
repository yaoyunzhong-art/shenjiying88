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
const { RequireRateLimit, RATE_LIMIT_METADATA_KEY, RateLimitMetadata } = require('./request-governance.decorator');
const sampleMetadata = {
    limit: 100,
    windowSeconds: 60,
    blockSeconds: 300,
    prefix: 'test-prefix',
    scopeBy: ['tenant', 'actor']
};
(0, node_test_1.describe)('RequireRateLimit decorator', () => {
    (0, node_test_1.default)('is a function', () => {
        strict_1.default.equal(typeof RequireRateLimit, 'function');
    });
    (0, node_test_1.default)('returns a decorator function when called with metadata', () => {
        const decorator = RequireRateLimit(sampleMetadata);
        strict_1.default.equal(typeof decorator, 'function');
    });
    (0, node_test_1.default)('sets metadata on method via descriptor.value', () => {
        class TestController {
            handle() { }
        }
        const decorator = RequireRateLimit(sampleMetadata);
        const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'handle');
        const returnedDescriptor = decorator(TestController.prototype, 'handle', descriptor);
        // NestJS SetMetadata stores on descriptor.value when a descriptor is present
        const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descriptor.value);
        strict_1.default.ok(stored, 'rate limit metadata should be set on descriptor.value');
        strict_1.default.equal(stored.limit, 100);
        strict_1.default.equal(stored.windowSeconds, 60);
        strict_1.default.equal(stored.blockSeconds, 300);
        strict_1.default.equal(stored.prefix, 'test-prefix');
        strict_1.default.deepStrictEqual(stored.scopeBy, ['tenant', 'actor']);
        // decorator should return the descriptor
        strict_1.default.equal(returnedDescriptor, descriptor);
    });
    (0, node_test_1.default)('sets metadata on class-level target (no descriptor)', () => {
        const decorator = RequireRateLimit({ limit: 10, windowSeconds: 30 });
        class TestController {
        }
        const result = decorator(TestController);
        const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, TestController);
        strict_1.default.ok(stored, 'rate limit metadata should be set on class');
        strict_1.default.equal(stored.limit, 10);
        strict_1.default.equal(stored.windowSeconds, 30);
        // decorator returns the target when no descriptor
        strict_1.default.equal(result, TestController);
    });
    (0, node_test_1.default)('metadata between different methods does not interfere', () => {
        class TestController {
            handleA() { }
            handleB() { }
        }
        const decA = RequireRateLimit({ limit: 5, windowSeconds: 10 });
        const decB = RequireRateLimit({ limit: 50, windowSeconds: 120 });
        const descA = Object.getOwnPropertyDescriptor(TestController.prototype, 'handleA');
        const descB = Object.getOwnPropertyDescriptor(TestController.prototype, 'handleB');
        decA(TestController.prototype, 'handleA', descA);
        decB(TestController.prototype, 'handleB', descB);
        const storedA = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descA.value);
        const storedB = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descB.value);
        strict_1.default.equal(storedA.limit, 5);
        strict_1.default.equal(storedB.limit, 50);
        strict_1.default.notEqual(storedA.windowSeconds, storedB.windowSeconds);
    });
    (0, node_test_1.default)('RATE_LIMIT_METADATA_KEY is the expected constant', () => {
        strict_1.default.equal(RATE_LIMIT_METADATA_KEY, 'trust-governance:rate-limit');
        strict_1.default.equal(typeof RATE_LIMIT_METADATA_KEY, 'string');
    });
    (0, node_test_1.default)('accepts minimal metadata (only limit + windowSeconds)', () => {
        class TestController {
            handle() { }
        }
        const decorator = RequireRateLimit({ limit: 1, windowSeconds: 5 });
        const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'handle');
        decorator(TestController.prototype, 'handle', descriptor);
        const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descriptor.value);
        strict_1.default.equal(stored.limit, 1);
        strict_1.default.equal(stored.windowSeconds, 5);
        strict_1.default.equal(stored.blockSeconds, undefined);
        strict_1.default.equal(stored.prefix, undefined);
        strict_1.default.equal(stored.scopeBy, undefined);
    });
    (0, node_test_1.default)('accepts metadata with scopeBy ip and route', () => {
        class TestController {
            handle() { }
        }
        const decorator = RequireRateLimit({
            limit: 200,
            windowSeconds: 3600,
            scopeBy: ['ip', 'route']
        });
        const descriptor = Object.getOwnPropertyDescriptor(TestController.prototype, 'handle');
        decorator(TestController.prototype, 'handle', descriptor);
        const stored = Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descriptor.value);
        strict_1.default.equal(stored.limit, 200);
        strict_1.default.deepStrictEqual(stored.scopeBy, ['ip', 'route']);
    });
    (0, node_test_1.default)('different controllers do not share metadata', () => {
        class CtrlA {
            handleA() { }
        }
        class CtrlB {
            handleB() { }
        }
        const decA = RequireRateLimit({ limit: 10, windowSeconds: 60 });
        const decB = RequireRateLimit({ limit: 999, windowSeconds: 9999 });
        const descA = Object.getOwnPropertyDescriptor(CtrlA.prototype, 'handleA');
        const descB = Object.getOwnPropertyDescriptor(CtrlB.prototype, 'handleB');
        decA(CtrlA.prototype, 'handleA', descA);
        decB(CtrlB.prototype, 'handleB', descB);
        strict_1.default.equal(Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descA.value).limit, 10);
        strict_1.default.equal(Reflect.getMetadata(RATE_LIMIT_METADATA_KEY, descB.value).limit, 999);
    });
});
//# sourceMappingURL=request-governance.decorator.test.js.map