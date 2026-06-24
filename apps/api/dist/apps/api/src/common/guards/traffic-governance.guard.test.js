"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const common_1 = require("@nestjs/common");
const traffic_governance_guard_1 = require("./traffic-governance.guard");
const request_governance_decorator_1 = require("../governance/request-governance.decorator");
function makeReflector(metadata) {
    return {
        getAllAndOverride: node_test_1.mock.fn((_key, _targets) => metadata),
    };
}
function makeReq(overrides = {}) {
    return {
        method: 'GET',
        url: '/api/test',
        originalUrl: '/api/test',
        baseUrl: '',
        header: node_test_1.mock.fn(() => undefined),
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
        route: { path: '/api/test' },
        tenantContext: { tenantId: 'tenant-1' },
        actorContext: { actorId: 'actor-1', actorType: 'user' },
        governanceContext: undefined,
        ...overrides,
    };
}
function makeRes() {
    const headers = {};
    return {
        setHeader: node_test_1.mock.fn((name, value) => {
            headers[name.toLowerCase()] = String(value);
        }),
        getHeader: (name) => headers[name.toLowerCase()],
        getHeaders: () => headers,
    };
}
function makeRequestGovernanceService(result = { allowed: true, limit: 100, remaining: 99, retryAfterSeconds: 0, scopeKey: 'test|route:/api/test' }) {
    return {
        evaluateRateLimit: node_test_1.mock.fn(async () => ({
            applied: true,
            ...result,
            state: {},
        })),
        applyRateLimitHeaders: node_test_1.mock.fn(),
        ensureRequestContext: node_test_1.mock.fn(),
    };
}
function makeHttpContext(req, res) {
    return {
        getType: () => 'http',
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
            getRequest: () => req,
            getResponse: () => res,
        }),
    };
}
(0, node_test_1.describe)('TrafficGovernanceGuard', () => {
    (0, node_test_1.describe)('canActivate', () => {
        (0, node_test_1.test)('returns true when context is not http', async () => {
            const reflector = makeReflector(undefined);
            const svc = makeRequestGovernanceService();
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const result = await guard.canActivate({ getType: () => 'ws' });
            strict_1.default.equal(result, true);
        });
        (0, node_test_1.test)('returns true when no rate-limit metadata is set', async () => {
            const reflector = makeReflector(undefined);
            const svc = makeRequestGovernanceService();
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const req = makeReq();
            const res = makeRes();
            const context = makeHttpContext(req, res);
            const result = await guard.canActivate(context);
            strict_1.default.equal(result, true);
        });
        (0, node_test_1.test)('returns true when rate limit allows the request', async () => {
            const metadata = { limit: 100, windowSeconds: 60 };
            const reflector = makeReflector(metadata);
            const svc = makeRequestGovernanceService({
                allowed: true,
                limit: 100,
                remaining: 99,
                retryAfterSeconds: 0,
                scopeKey: 'test|route:/api/test',
            });
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const req = makeReq();
            const res = makeRes();
            const context = makeHttpContext(req, res);
            const result = await guard.canActivate(context);
            strict_1.default.equal(result, true);
        });
        (0, node_test_1.test)('throws HttpException 429 when rate limit blocks the request', async () => {
            const metadata = { limit: 10, windowSeconds: 10 };
            const reflector = makeReflector(metadata);
            const svc = makeRequestGovernanceService({
                allowed: false,
                limit: 10,
                remaining: 0,
                retryAfterSeconds: 30,
                scopeKey: 'test|route:/api/test|tenant:tenant-1',
            });
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const req = makeReq();
            const res = makeRes();
            const context = makeHttpContext(req, res);
            await strict_1.default.rejects(() => guard.canActivate(context), (err) => {
                strict_1.default.ok(err instanceof common_1.HttpException);
                strict_1.default.equal(err.getStatus(), common_1.HttpStatus.TOO_MANY_REQUESTS);
                strict_1.default.ok(err.message.includes('Rate limit exceeded'));
                strict_1.default.ok(err.message.includes('test|route:/api/test|tenant:tenant-1'));
                return true;
            });
        });
        (0, node_test_1.test)('applies rate limit headers on the response for allowed requests', async () => {
            const metadata = { limit: 50, windowSeconds: 30 };
            const reflector = makeReflector(metadata);
            const svc = makeRequestGovernanceService({
                allowed: true,
                limit: 50,
                remaining: 45,
                retryAfterSeconds: 0,
                scopeKey: 'test|route:/api/test',
            });
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const req = makeReq();
            const res = makeRes();
            const context = makeHttpContext(req, res);
            await guard.canActivate(context);
            strict_1.default.equal(svc.applyRateLimitHeaders.mock.calls.length, 1);
            const calledWith = svc.applyRateLimitHeaders.mock.calls[0].arguments;
            strict_1.default.equal(calledWith[0], res);
            strict_1.default.equal(calledWith[1].allowed, true);
            strict_1.default.equal(calledWith[1].limit, 50);
            strict_1.default.equal(calledWith[1].remaining, 45);
        });
        (0, node_test_1.test)('applies rate limit headers on the response even when blocked', async () => {
            const metadata = { limit: 5, windowSeconds: 60, blockSeconds: 120 };
            const reflector = makeReflector(metadata);
            const svc = makeRequestGovernanceService({
                allowed: false,
                limit: 5,
                remaining: 0,
                retryAfterSeconds: 60,
                scopeKey: 'test|route:/api/test',
            });
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const req = makeReq();
            const res = makeRes();
            const context = makeHttpContext(req, res);
            await strict_1.default.rejects(() => guard.canActivate(context));
            strict_1.default.equal(svc.applyRateLimitHeaders.mock.calls.length, 1);
            const calledWith = svc.applyRateLimitHeaders.mock.calls[0].arguments;
            strict_1.default.equal(calledWith[0], res);
            strict_1.default.equal(calledWith[1].allowed, false);
            strict_1.default.equal(calledWith[1].retryAfterSeconds, 60);
        });
        (0, node_test_1.test)('delegates metadata to evaluateRateLimit with correct request', async () => {
            const metadata = {
                limit: 200,
                windowSeconds: 120,
                prefix: 'api',
                scopeBy: ['tenant', 'ip'],
                blockSeconds: 300,
            };
            const reflector = makeReflector(metadata);
            const svc = makeRequestGovernanceService();
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const req = makeReq();
            const res = makeRes();
            const context = makeHttpContext(req, res);
            await guard.canActivate(context);
            strict_1.default.equal(svc.evaluateRateLimit.mock.calls.length, 1);
            const callArgs = svc.evaluateRateLimit.mock.calls[0].arguments;
            strict_1.default.equal(callArgs[0], req);
            strict_1.default.deepStrictEqual(callArgs[1], metadata);
        });
        (0, node_test_1.test)('reads metadata from both handler and class using getAllAndOverride', async () => {
            const metadata = { limit: 30, windowSeconds: 15 };
            const reflector = makeReflector(metadata);
            const svc = makeRequestGovernanceService();
            const guard = new traffic_governance_guard_1.TrafficGovernanceGuard(reflector, svc);
            const req = makeReq();
            const res = makeRes();
            const handler = { name: 'testHandler' };
            const klass = { name: 'TestController' };
            const context = {
                getType: () => 'http',
                getHandler: () => handler,
                getClass: () => klass,
                switchToHttp: () => ({
                    getRequest: () => req,
                    getResponse: () => res,
                }),
            };
            await guard.canActivate(context);
            strict_1.default.equal(reflector.getAllAndOverride.mock.calls.length, 1);
            const reflectorArgs = reflector.getAllAndOverride.mock.calls[0].arguments;
            strict_1.default.equal(reflectorArgs[0], request_governance_decorator_1.RATE_LIMIT_METADATA_KEY);
            strict_1.default.deepStrictEqual(reflectorArgs[1], [handler, klass]);
        });
    });
});
//# sourceMappingURL=traffic-governance.guard.test.js.map