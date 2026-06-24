"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const rxjs_1 = require("rxjs");
const request_audit_interceptor_1 = require("./request-audit.interceptor");
(0, node_test_1.describe)('RequestAuditInterceptor', () => {
    // Helper to create a mock RequestGovernanceService
    function createMockService() {
        return {
            ensureRequestContext: node_test_1.mock.fn((_req) => ({
                requestId: 'mock-request-id',
                startedAt: Date.now(),
            })),
            recordRequestSuccess: node_test_1.mock.fn(),
            recordRequestFailure: node_test_1.mock.fn(),
        };
    }
    // Helper to create a mock ExecutionContext for HTTP
    function createHttpContext(reqOverrides = {}) {
        const req = {
            method: 'GET',
            url: '/api/test',
            originalUrl: '/api/test',
            header: () => undefined,
            ...reqOverrides,
        };
        const res = {
            statusCode: 200,
            setHeader: node_test_1.mock.fn(),
        };
        return {
            getType: () => 'http',
            switchToHttp: () => ({
                getRequest: () => req,
                getResponse: () => res,
            }),
        };
    }
    // Helper to create a mock CallHandler
    function createCallHandler(data = { ok: true }) {
        return { handle: () => (0, rxjs_1.of)(data) };
    }
    (0, node_test_1.test)('should call ensureRequestContext on HTTP request', async () => {
        const mockService = createMockService();
        const interceptor = new request_audit_interceptor_1.RequestAuditInterceptor(mockService);
        const ctx = createHttpContext();
        const handler = createCallHandler();
        await new Promise((resolve) => {
            interceptor.intercept(ctx, handler).subscribe({
                next: () => resolve(),
                error: () => resolve(),
            });
        });
        strict_1.default.strictEqual(mockService.ensureRequestContext.mock.callCount(), 1);
    });
    (0, node_test_1.test)('should call recordRequestSuccess after successful response', async () => {
        const mockService = createMockService();
        const interceptor = new request_audit_interceptor_1.RequestAuditInterceptor(mockService);
        const ctx = createHttpContext();
        const handler = createCallHandler({ result: 'ok' });
        await new Promise((resolve) => {
            interceptor.intercept(ctx, handler).subscribe({
                next: () => resolve(),
                error: () => resolve(),
            });
        });
        strict_1.default.strictEqual(mockService.recordRequestSuccess.mock.callCount(), 1);
    });
    (0, node_test_1.test)('should not call recordRequestSuccess on non-HTTP context', async () => {
        const mockService = createMockService();
        const interceptor = new request_audit_interceptor_1.RequestAuditInterceptor(mockService);
        const ctx = {
            getType: () => 'rpc',
            switchToHttp: () => {
                throw new Error('should not be called');
            },
        };
        const handler = createCallHandler();
        await new Promise((resolve) => {
            interceptor.intercept(ctx, handler).subscribe({
                next: () => resolve(),
                error: () => resolve(),
            });
        });
        // For non-HTTP, neither ensureRequestContext nor recordRequestSuccess should be called
        strict_1.default.strictEqual(mockService.ensureRequestContext.mock.callCount(), 0);
        strict_1.default.strictEqual(mockService.recordRequestSuccess.mock.callCount(), 0);
    });
    (0, node_test_1.test)('should pass HTTP response data through unchanged', async () => {
        const mockService = createMockService();
        const interceptor = new request_audit_interceptor_1.RequestAuditInterceptor(mockService);
        const ctx = createHttpContext();
        const responseData = { id: 1, name: 'test-result' };
        const handler = createCallHandler(responseData);
        const result = await new Promise((resolve) => {
            interceptor.intercept(ctx, handler).subscribe({
                next: (val) => resolve(val),
                error: () => resolve(undefined),
            });
        });
        strict_1.default.deepStrictEqual(result, responseData);
    });
    (0, node_test_1.test)('should pass null through unchanged', async () => {
        const mockService = createMockService();
        const interceptor = new request_audit_interceptor_1.RequestAuditInterceptor(mockService);
        const ctx = createHttpContext();
        const handler = createCallHandler(null);
        const result = await new Promise((resolve) => {
            interceptor.intercept(ctx, handler).subscribe({
                next: (val) => resolve(val),
                error: () => resolve(undefined),
            });
        });
        strict_1.default.strictEqual(result, null);
    });
    (0, node_test_1.test)('should call ensureRequestContext before recordRequestSuccess', async () => {
        const callOrder = [];
        const mockService = {
            ensureRequestContext: node_test_1.mock.fn(() => {
                callOrder.push('ensureRequestContext');
                return { requestId: 'ordered-test', startedAt: Date.now() };
            }),
            recordRequestSuccess: node_test_1.mock.fn(() => {
                callOrder.push('recordRequestSuccess');
            }),
        };
        const interceptor = new request_audit_interceptor_1.RequestAuditInterceptor(mockService);
        const ctx = createHttpContext();
        const handler = createCallHandler();
        await new Promise((resolve) => {
            interceptor.intercept(ctx, handler).subscribe({
                next: () => resolve(),
                error: () => resolve(),
            });
        });
        strict_1.default.deepStrictEqual(callOrder, ['ensureRequestContext', 'recordRequestSuccess']);
    });
});
//# sourceMappingURL=request-audit.interceptor.test.js.map