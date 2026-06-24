"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const request_governance_service_1 = require("./request-governance.service");
function mockRequest(overrides = {}) {
    return {
        method: 'GET',
        url: '/api/test',
        originalUrl: '/api/test',
        baseUrl: '',
        header: (name) => {
            if (name === 'x-request-id')
                return 'req-123';
            if (name === 'x-forwarded-for')
                return '10.0.0.1';
            if (name === 'user-agent')
                return 'test-agent';
            return undefined;
        },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
        route: { path: '/api/test' },
        tenantContext: { tenantId: 'tenant-1' },
        actorContext: { actorId: 'actor-1', actorType: 'user' },
        governanceContext: undefined,
        ...overrides,
    };
}
function mockResponse() {
    const headers = {};
    return {
        statusCode: 200,
        setHeader: (name, value) => {
            headers[name] = String(value);
        },
        getHeader: (name) => headers[name],
        getHeaders: () => headers,
    };
}
function mockTrustGovernanceService(rateLimitResult = {
    scopeKey: 'http|route:/api/test|tenant:tenant-1|actor:actor-1|ip:10.0.0.1',
    allowed: true,
    limit: 100,
    remaining: 99,
    retryAfterSeconds: 0,
    state: {},
}) {
    return {
        evaluateRateLimit: node_test_1.mock.fn(async () => rateLimitResult),
        recordAudit: node_test_1.mock.fn(async () => { }),
    };
}
(0, node_test_1.describe)('RequestGovernanceService', () => {
    let service;
    let trustGov;
    (0, node_test_1.beforeEach)(() => {
        trustGov = mockTrustGovernanceService();
        service = new request_governance_service_1.RequestGovernanceService(trustGov);
    });
    (0, node_test_1.test)('ensureRequestContext creates context with requestId from header', () => {
        const req = mockRequest({ governanceContext: undefined });
        const ctx = service.ensureRequestContext(req);
        strict_1.default.ok(ctx.requestId);
        strict_1.default.strictEqual(ctx.requestId, 'req-123');
        strict_1.default.ok(typeof ctx.startedAt === 'number');
        strict_1.default.ok(ctx.startedAt > 0);
    });
    (0, node_test_1.test)('ensureRequestContext generates UUID when no x-request-id header', () => {
        const req = mockRequest({
            governanceContext: undefined,
            header: () => undefined,
        });
        const ctx = service.ensureRequestContext(req);
        strict_1.default.ok(ctx.requestId);
        // UUID v4 format
        strict_1.default.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(ctx.requestId));
    });
    (0, node_test_1.test)('ensureRequestContext returns existing context if already set', () => {
        const existing = { requestId: 'existing-id', startedAt: 1000 };
        const req = mockRequest({ governanceContext: existing });
        const ctx = service.ensureRequestContext(req);
        strict_1.default.strictEqual(ctx.requestId, 'existing-id');
        strict_1.default.strictEqual(ctx.startedAt, 1000);
    });
    (0, node_test_1.test)('evaluateRateLimit delegates to trustGovernanceService', async () => {
        const req = mockRequest();
        const metadata = {
            limit: 100,
            windowSeconds: 60,
            prefix: 'test',
            scopeBy: ['tenant', 'ip'],
        };
        const decision = await service.evaluateRateLimit(req, metadata);
        strict_1.default.strictEqual(decision.applied, true);
        strict_1.default.strictEqual(decision.allowed, true);
        strict_1.default.strictEqual(decision.limit, 100);
        strict_1.default.strictEqual(decision.remaining, 99);
        strict_1.default.strictEqual(decision.retryAfterSeconds, 0);
        const callArgs = trustGov.evaluateRateLimit.mock.calls[0]?.arguments[0];
        strict_1.default.ok(callArgs.scopeKey.includes('tenant:tenant-1'));
        strict_1.default.ok(callArgs.scopeKey.includes('ip:10.0.0.1'));
        strict_1.default.strictEqual(callArgs.limit, 100);
        strict_1.default.strictEqual(callArgs.windowSeconds, 60);
    });
    (0, node_test_1.test)('evaluateRateLimit stores decision on request context', async () => {
        const req = mockRequest();
        const metadata = { limit: 50, windowSeconds: 30 };
        const decision = await service.evaluateRateLimit(req, metadata);
        strict_1.default.strictEqual(req.governanceContext?.rateLimit, decision);
        strict_1.default.strictEqual(decision.limit, 100); // from mock default
    });
    (0, node_test_1.test)('applyRateLimitHeaders sets rate limit headers on response', () => {
        const res = mockResponse();
        const decision = {
            applied: true,
            scopeKey: 'test|route:/api/test',
            allowed: true,
            limit: 100,
            remaining: 95,
            retryAfterSeconds: 0,
            state: {},
        };
        service.applyRateLimitHeaders(res, decision);
        strict_1.default.strictEqual(res.getHeader('X-RateLimit-Limit'), '100');
        strict_1.default.strictEqual(res.getHeader('X-RateLimit-Remaining'), '95');
        strict_1.default.strictEqual(res.getHeader('X-RateLimit-Scope'), 'test|route:/api/test');
        strict_1.default.strictEqual(res.getHeader('Retry-After'), undefined);
    });
    (0, node_test_1.test)('applyRateLimitHeaders sets Retry-After when blocked', () => {
        const res = mockResponse();
        const decision = {
            applied: true,
            scopeKey: 'test|route:/api/test',
            allowed: false,
            limit: 100,
            remaining: 0,
            retryAfterSeconds: 30,
            state: {},
        };
        service.applyRateLimitHeaders(res, decision);
        strict_1.default.strictEqual(res.getHeader('Retry-After'), '30');
    });
    (0, node_test_1.test)('applyRateLimitHeaders floors negative remaining to 0', () => {
        const res = mockResponse();
        const decision = {
            applied: true,
            scopeKey: 'test',
            allowed: false,
            limit: 10,
            remaining: -5,
            retryAfterSeconds: 0,
            state: {},
        };
        service.applyRateLimitHeaders(res, decision);
        strict_1.default.strictEqual(res.getHeader('X-RateLimit-Remaining'), '0');
    });
    (0, node_test_1.test)('recordRequestSuccess records audit with 200 status', async () => {
        const req = mockRequest();
        service.ensureRequestContext(req);
        const res = mockResponse();
        res.statusCode = 200;
        service.recordRequestSuccess(req, res);
        const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments;
        strict_1.default.strictEqual(callArgs[0], 'http.request.completed');
        strict_1.default.deepStrictEqual(callArgs[2], {
            tenantId: 'tenant-1',
            actorId: 'actor-1',
            source: 'http',
            riskLevel: 'low',
        });
    });
    (0, node_test_1.test)('recordRequestFailure records rate-limited audit for 429', async () => {
        const req = mockRequest();
        service.ensureRequestContext(req);
        service.recordRequestFailure(req, 429, 'Rate limit exceeded');
        const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments;
        strict_1.default.strictEqual(callArgs[0], 'http.request.rate-limited');
        strict_1.default.strictEqual(callArgs[1].errorName, 'UnhandledException');
        strict_1.default.strictEqual(callArgs[1].errorMessage, 'Rate limit exceeded');
        strict_1.default.strictEqual(callArgs[2].riskLevel, 'medium');
    });
    (0, node_test_1.test)('recordRequestFailure records denied audit for 401', async () => {
        const req = mockRequest();
        service.ensureRequestContext(req);
        service.recordRequestFailure(req, 401, 'Unauthorized', 'UnauthorizedException');
        const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments;
        strict_1.default.strictEqual(callArgs[0], 'http.request.denied');
        strict_1.default.strictEqual(callArgs[1].errorName, 'UnauthorizedException');
        strict_1.default.strictEqual(callArgs[2].riskLevel, 'medium');
    });
    (0, node_test_1.test)('recordRequestFailure records failed audit for 500', async () => {
        const req = mockRequest();
        service.ensureRequestContext(req);
        service.recordRequestFailure(req, 500, 'Internal error');
        const callArgs = trustGov.recordAudit.mock.calls[0]?.arguments;
        strict_1.default.strictEqual(callArgs[0], 'http.request.failed');
        strict_1.default.strictEqual(callArgs[2].riskLevel, 'high');
    });
    (0, node_test_1.test)('evaluateRateLimit uses default scopeBy when not provided', async () => {
        const req = mockRequest();
        const metadata = { limit: 10, windowSeconds: 10 };
        await service.evaluateRateLimit(req, metadata);
        const callArgs = trustGov.evaluateRateLimit.mock.calls[0]?.arguments[0];
        strict_1.default.ok(callArgs.scopeKey.includes('route:'));
        strict_1.default.ok(callArgs.scopeKey.includes('tenant:'));
        strict_1.default.ok(callArgs.scopeKey.includes('actor:'));
        strict_1.default.ok(callArgs.scopeKey.includes('ip:'));
    });
});
//# sourceMappingURL=request-governance.service.test.js.map