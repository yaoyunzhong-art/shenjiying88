"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const rxjs_1 = require("rxjs");
const response_interceptor_1 = require("./response.interceptor");
(0, node_test_1.describe)('ResponseInterceptor', () => {
    const interceptor = new response_interceptor_1.ResponseInterceptor();
    (0, node_test_1.test)('should wrap response data in ApiResult envelope', async () => {
        const handler = { handle: () => (0, rxjs_1.of)({ items: [1, 2, 3] }) };
        const result = await new Promise((resolve, reject) => {
            interceptor.intercept({}, handler).subscribe({
                next: resolve,
                error: reject,
            });
        });
        strict_1.default.deepStrictEqual(result, {
            success: true,
            message: 'OK',
            data: { items: [1, 2, 3] },
            timestamp: result.timestamp,
        });
        strict_1.default.ok(typeof result.timestamp === 'string');
    });
    (0, node_test_1.test)('should handle null data', async () => {
        const handler = { handle: () => (0, rxjs_1.of)(null) };
        const result = await new Promise((resolve, reject) => {
            interceptor.intercept({}, handler).subscribe({
                next: resolve,
                error: reject,
            });
        });
        strict_1.default.deepStrictEqual(result, {
            success: true,
            message: 'OK',
            data: null,
            timestamp: result.timestamp,
        });
    });
    (0, node_test_1.test)('should handle string data', async () => {
        const handler = { handle: () => (0, rxjs_1.of)('hello') };
        const result = await new Promise((resolve, reject) => {
            interceptor.intercept({}, handler).subscribe({
                next: resolve,
                error: reject,
            });
        });
        strict_1.default.deepStrictEqual(result, {
            success: true,
            message: 'OK',
            data: 'hello',
            timestamp: result.timestamp,
        });
    });
    (0, node_test_1.test)('should propagate errors from handler', async () => {
        const handler = { handle: () => (0, rxjs_1.of)(null).pipe(() => { throw new Error('upstream error'); }) };
        try {
            interceptor.intercept({}, handler).subscribe({});
            // If we reach here without error, the test fails
            strict_1.default.fail('expected error to be thrown');
        }
        catch (err) {
            strict_1.default.ok(err instanceof Error);
            strict_1.default.equal(err.message, 'upstream error');
        }
    });
    (0, node_test_1.test)('should preserve object structure without mutation', async () => {
        const data = { id: 1, name: 'test' };
        const handler = { handle: () => (0, rxjs_1.of)(data) };
        const result = await new Promise((resolve, reject) => {
            interceptor.intercept({}, handler).subscribe({
                next: resolve,
                error: reject,
            });
        });
        strict_1.default.strictEqual(result.data, data);
        strict_1.default.deepStrictEqual(result.data, { id: 1, name: 'test' });
    });
});
//# sourceMappingURL=response.interceptor.test.js.map