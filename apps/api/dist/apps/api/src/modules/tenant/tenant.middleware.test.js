"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const { TenantMiddleware } = require('./tenant.middleware');
function makeReq(headers = {}) {
    const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    return {
        header(name) {
            return headerMap.get(name.toLowerCase()) ?? undefined;
        },
        params: {},
        originalUrl: '/api/test',
        url: '/api/test',
        method: 'GET',
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' }
    };
}
(0, node_test_1.default)('TenantMiddleware use() sets default tenantContext', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq();
    let nextCalled = false;
    const res = {};
    middleware.use(req, res, () => {
        nextCalled = true;
    });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.ok(req.tenantContext);
    strict_1.default.equal(req.tenantContext.tenantId, 'tenant-demo');
    strict_1.default.equal(req.tenantContext.marketCode, 'us-default');
    strict_1.default.equal(req.tenantContext.brandId, undefined);
    strict_1.default.equal(req.tenantContext.storeId, undefined);
});
(0, node_test_1.default)('TenantMiddleware use() reads tenantContext from headers', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-tenant-id': 'tenant-custom',
        'x-brand-id': 'brand-custom',
        'x-store-id': 'store-custom',
        'x-market-code': 'zh-cn'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.equal(req.tenantContext.tenantId, 'tenant-custom');
    strict_1.default.equal(req.tenantContext.brandId, 'brand-custom');
    strict_1.default.equal(req.tenantContext.storeId, 'store-custom');
    strict_1.default.equal(req.tenantContext.marketCode, 'zh-cn');
});
(0, node_test_1.default)('TenantMiddleware use() trims whitespace from header values', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-tenant-id': '  tenant-trimmed  ',
        'x-market-code': '  jp  '
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.equal(req.tenantContext.tenantId, 'tenant-trimmed');
    strict_1.default.equal(req.tenantContext.marketCode, 'jp');
});
(0, node_test_1.default)('TenantMiddleware use() sets governanceContext with requestId', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-request-id': 'custom-request-id-123'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.governanceContext);
    strict_1.default.equal(req.governanceContext.requestId, 'custom-request-id-123');
    strict_1.default.equal(typeof req.governanceContext.startedAt, 'number');
    strict_1.default.ok(req.governanceContext.startedAt > 0);
});
(0, node_test_1.default)('TenantMiddleware use() generates randomUUID for governanceContext when x-request-id missing', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({});
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.governanceContext);
    strict_1.default.ok(req.governanceContext.requestId);
    strict_1.default.ok(req.governanceContext.requestId.length > 30);
});
(0, node_test_1.default)('TenantMiddleware use() builds actorContext from x-actor header (JSON)', () => {
    const middleware = new TenantMiddleware();
    const actor = {
        actorId: 'json-actor-1',
        actorType: 'brand-user',
        actorName: 'JSON User',
        tenantId: 'json-tenant',
        brandId: 'json-brand',
        storeId: 'json-store'
    };
    const req = makeReq({ 'x-actor': JSON.stringify(actor) });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.actorContext);
    strict_1.default.equal(req.actorContext?.actorId, 'json-actor-1');
    strict_1.default.equal(req.actorContext?.actorType, 'brand-user');
    strict_1.default.equal(req.actorContext?.actorName, 'JSON User');
    strict_1.default.equal(req.actorContext?.tenantId, 'json-tenant');
    strict_1.default.equal(req.actorContext?.brandId, 'json-brand');
    strict_1.default.equal(req.actorContext?.storeId, 'json-store');
    strict_1.default.equal(req.actorContext?.authenticated, true);
    strict_1.default.equal(req.actorContext?.source, 'headers');
});
(0, node_test_1.default)('TenantMiddleware use() builds actorContext from x-actor header (plain id)', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({ 'x-actor': 'plain-actor-id' });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.actorContext);
    strict_1.default.equal(req.actorContext?.actorId, 'plain-actor-id');
    strict_1.default.equal(req.actorContext?.actorType, 'tenant-user');
    strict_1.default.equal(req.actorContext?.authenticated, true);
});
(0, node_test_1.default)('TenantMiddleware use() builds actorContext from x-actor-id and individual headers', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-actor-id': 'actor-direct',
        'x-actor-type': 'employee-user',
        'x-actor-name': 'Direct User',
        'x-actor-tenant-id': 'direct-tenant',
        'x-roles': 'admin,editor',
        'x-permissions': 'tenant:read,tenant:write'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.actorContext);
    strict_1.default.equal(req.actorContext?.actorId, 'actor-direct');
    strict_1.default.equal(req.actorContext?.actorType, 'employee-user');
    strict_1.default.equal(req.actorContext?.actorName, 'Direct User');
    strict_1.default.equal(req.actorContext?.tenantId, 'direct-tenant');
    strict_1.default.deepStrictEqual(req.actorContext?.roles, ['admin', 'editor']);
    strict_1.default.deepStrictEqual(req.actorContext?.permissions, ['tenant:read', 'tenant:write']);
    strict_1.default.equal(req.actorContext?.authenticated, true);
});
(0, node_test_1.default)('TenantMiddleware use() deduplicates roles and permissions', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-actor-id': 'actor-dedup',
        'x-roles': 'admin,admin,super-admin',
        'x-permissions': 'read,read,write'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.deepStrictEqual(req.actorContext?.roles, ['admin', 'super-admin']);
    strict_1.default.deepStrictEqual(req.actorContext?.permissions, ['read', 'write']);
});
(0, node_test_1.default)('TenantMiddleware use() returns undefined actorContext when no identity headers', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-tenant-id': 'tenant-no-actor'
        // no actor headers
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.equal(req.actorContext, undefined);
});
(0, node_test_1.default)('TenantMiddleware use() uses x-actor as fallback id when x-actor-id is missing', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-actor': 'fallback-actor',
        'x-roles': 'viewer'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.actorContext);
    strict_1.default.equal(req.actorContext?.actorId, 'fallback-actor');
    strict_1.default.deepStrictEqual(req.actorContext?.roles, ['viewer']);
});
(0, node_test_1.default)('TenantMiddleware use() prefers x-actor-id over JSON x-actor actorId', () => {
    const middleware = new TenantMiddleware();
    const actor = { actorId: 'json-id', actorType: 'service-account' };
    const req = makeReq({
        'x-actor': JSON.stringify(actor),
        'x-actor-id': 'header-id-priority',
        'x-roles': 'bot'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.actorContext);
    // x-actor-id from dedicated header takes priority over JSON actorId
    strict_1.default.equal(req.actorContext?.actorId, 'header-id-priority');
    // actorType falls back to JSON payload
    strict_1.default.equal(req.actorContext?.actorType, 'service-account');
});
(0, node_test_1.default)('TenantMiddleware use() handles whitespace-only header values as undefined', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-tenant-id': '   ',
        'x-brand-id': '  ',
        'x-market-code': '  '
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.equal(req.tenantContext.tenantId, 'tenant-demo');
    strict_1.default.equal(req.tenantContext.brandId, undefined);
    strict_1.default.equal(req.tenantContext.marketCode, 'us-default');
});
(0, node_test_1.default)('TenantMiddleware use() uses x-actor id field as fallback', () => {
    const middleware = new TenantMiddleware();
    const actor = { id: 'id-field', type: 'platform-user', name: 'Platform Actor' };
    const req = makeReq({
        'x-actor': JSON.stringify(actor),
        'x-actor-tenant-id': 'plat-tenant'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.ok(req.actorContext);
    strict_1.default.equal(req.actorContext?.actorId, 'id-field');
    strict_1.default.equal(req.actorContext?.actorType, 'platform-user');
    strict_1.default.equal(req.actorContext?.actorName, 'Platform Actor');
    strict_1.default.equal(req.actorContext?.tenantId, 'plat-tenant');
});
(0, node_test_1.default)('TenantMiddleware use() handles empty string x-actor', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-actor': ''
    });
    const res = {};
    middleware.use(req, res, () => { });
    // empty x-actor returns {} from parseActorHeader, so no actorId
    strict_1.default.equal(req.actorContext, undefined);
});
(0, node_test_1.default)('TenantMiddleware use() supports x-role and x-permission as singular aliases', () => {
    const middleware = new TenantMiddleware();
    const req = makeReq({
        'x-actor-id': 'sing-alias',
        'x-role': 'admin',
        'x-permission': 'tenant:*'
    });
    const res = {};
    middleware.use(req, res, () => { });
    strict_1.default.deepStrictEqual(req.actorContext?.roles, ['admin']);
    strict_1.default.deepStrictEqual(req.actorContext?.permissions, ['tenant:*']);
});
//# sourceMappingURL=tenant.middleware.test.js.map