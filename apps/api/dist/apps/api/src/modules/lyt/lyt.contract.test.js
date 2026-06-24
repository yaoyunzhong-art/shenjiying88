"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const lyt_contract_1 = require("./lyt.contract");
(0, node_test_1.default)('toLytMemberProfileContract maps domain profile to public contract', () => {
    const profile = { memberId: 'member-1', nickname: '测试会员', levelName: 'GOLD' };
    const result = (0, lyt_contract_1.toLytMemberProfileContract)(profile);
    strict_1.default.deepEqual(result, { id: 'member-1', name: '测试会员', level: 'GOLD' });
});
(0, node_test_1.default)('toLytMemberProfileContract defaults missing optional fields', () => {
    const profile = { memberId: 'member-1' };
    const result = (0, lyt_contract_1.toLytMemberProfileContract)(profile);
    strict_1.default.deepEqual(result, { id: 'member-1', name: 'member-1', level: 'N/A' });
});
(0, node_test_1.default)('toLytDeviceStatusContract maps online device status', () => {
    const result = (0, lyt_contract_1.toLytDeviceStatusContract)({ deviceId: 'dev-42', status: 'ONLINE' });
    strict_1.default.deepEqual(result, { deviceId: 'dev-42', status: 'ONLINE' });
});
(0, node_test_1.default)('toLytDeviceStatusContract maps offline device status', () => {
    const result = (0, lyt_contract_1.toLytDeviceStatusContract)({ deviceId: 'dev-99', status: 'OFFLINE' });
    strict_1.default.deepEqual(result, { deviceId: 'dev-99', status: 'OFFLINE' });
});
(0, node_test_1.default)('toLytBootstrapContract normalizes bootstrap data', () => {
    const bootstrap = {
        adapter: 'MockLytAdapter',
        foundationDependencies: ['identity-access', 'configuration-governance'],
        foundationContracts: ['lyt-adapter:v1'],
        availableAdapters: [
            { adapterName: 'MockLytAdapter', adapterMode: 'mock' },
            { adapterName: 'SandboxLytAdapter', adapterMode: 'sandbox' }
        ],
        selectionStrategy: 'connection-driven: mock -> sandbox -> real'
    };
    const result = (0, lyt_contract_1.toLytBootstrapContract)(bootstrap);
    strict_1.default.equal(result.adapter, 'MockLytAdapter');
    strict_1.default.deepEqual(result.foundationDependencies, ['identity-access', 'configuration-governance']);
    strict_1.default.deepEqual(result.foundationContracts, ['lyt-adapter:v1']);
    strict_1.default.equal(result.availableAdapters?.length, 2);
    strict_1.default.equal(result.selectionStrategy, 'connection-driven: mock -> sandbox -> real');
});
(0, node_test_1.default)('toLytBootstrapContract returns safe copy (not the same array reference)', () => {
    const deps = ['identity-access'];
    const result = (0, lyt_contract_1.toLytBootstrapContract)({
        adapter: 'test',
        foundationDependencies: deps,
        foundationContracts: ['v1']
    });
    // Mutate the original array — contract copy must be unaffected
    deps.push('extra-module');
    strict_1.default.deepEqual(result.foundationDependencies, ['identity-access']);
    strict_1.default.equal(deps.length, 2);
});
(0, node_test_1.default)('toLytStandardizedWebhookEventContract maps payment success event', () => {
    const result = (0, lyt_contract_1.toLytStandardizedWebhookEventContract)({
        eventId: 'evt-1001',
        eventType: 'payment.success',
        payload: {
            tenantId: 'tenant-1',
            brandId: 'brand-1',
            storeId: 'store-1',
            orderId: 'order-1'
        }
    });
    strict_1.default.equal(result.aggregateId, 'evt-1001');
    strict_1.default.equal(result.sourceEventName, 'payment.success');
    strict_1.default.equal(result.standardizedEventName, 'cashier.payment-succeeded');
    strict_1.default.equal(result.capability, 'payment');
    strict_1.default.equal(result.idempotencyKey, 'lyt-standardized:evt-1001');
    strict_1.default.equal(result.tenantId, 'tenant-1');
    strict_1.default.equal(result.brandId, 'brand-1');
    strict_1.default.equal(result.storeId, 'store-1');
    strict_1.default.equal(result.payload.aggregateId, 'evt-1001');
});
(0, node_test_1.default)('toLytStandardizedWebhookEventContract falls back for unknown source event', () => {
    const result = (0, lyt_contract_1.toLytStandardizedWebhookEventContract)({
        eventId: 'evt-unknown',
        eventType: 'mystery.changed',
        payload: { traceId: 'trace-1' }
    });
    strict_1.default.equal(result.standardizedEventName, 'lyt.unmapped-webhook-received');
    strict_1.default.equal(result.capability, 'unknown');
    strict_1.default.equal(result.tenantId, undefined);
});
(0, node_test_1.default)('toLytWebhookArchiveRecordContract captures raw payload archive metadata', () => {
    const standardizedEvent = (0, lyt_contract_1.toLytStandardizedWebhookEventContract)({
        eventId: 'evt-archive',
        eventType: 'gate.pass',
        payload: {
            tenantId: 'tenant-1',
            storeId: 'store-1',
            requestId: 'req-1',
            occurredAt: '2026-06-14T10:08:00.000Z'
        }
    });
    const result = (0, lyt_contract_1.toLytWebhookArchiveRecordContract)({
        source: 'lyt-callback',
        standardizedEvent,
        rawPayload: standardizedEvent.payload,
        rawBody: '{"requestId":"req-1"}',
        rawHeaders: { signature: 'fixture:test' },
        rawQuery: { channel: 'fixture-test' },
        receivedAt: '2026-06-14T10:10:00.000Z',
        signatureVerified: true
    });
    strict_1.default.equal(result.source, 'lyt-callback');
    strict_1.default.equal(result.signatureStatus, 'verified');
    strict_1.default.equal(result.requestId, 'req-1');
    strict_1.default.equal(result.occurredAt, '2026-06-14T10:08:00.000Z');
    strict_1.default.equal(result.mappingVersion, 'lyt-field-mapping-spec-v1');
    strict_1.default.equal(result.rawBody, '{"requestId":"req-1"}');
    strict_1.default.deepEqual(result.rawHeaders, { signature: 'fixture:test' });
    strict_1.default.deepEqual(result.rawQuery, { channel: 'fixture-test' });
});
(0, node_test_1.default)('toLytFixtureCatalogItemContract returns defensive payload copy', () => {
    const samplePayload = { requestId: 'req-1' };
    const result = (0, lyt_contract_1.toLytFixtureCatalogItemContract)({
        key: 'payment-success-webhook',
        title: '支付成功回调样例',
        transport: 'webhook',
        capability: 'payment',
        riskLevel: 'high',
        method: 'POST',
        path: '/webhooks/payment-success',
        recommendedUsage: '用于回调演练',
        eventType: 'payment.success',
        mappingVersion: 'lyt-field-mapping-spec-v1',
        requiredRawFields: ['requestId'],
        recommendedRawFields: ['currency'],
        requiredHeaders: ['signature'],
        recommendedHeaders: ['x-lyt-source'],
        requiredQueryParams: [],
        recommendedQueryParams: ['traceId'],
        standardFieldChecklist: ['externalPaymentId'],
        schemaChecklist: ['headers', 'payload-body'],
        archiveChecklist: ['rawPayload'],
        validationStatus: 'ready-for-rehearsal',
        missingSampleFields: [],
        missingChecklistItems: [],
        samplePayload,
        sampleHeaders: { signature: 'fixture:test' },
        sampleQueryParams: {}
    });
    samplePayload.requestId = 'changed';
    strict_1.default.equal(result.samplePayload.requestId, 'req-1');
    strict_1.default.deepEqual(result.requiredRawFields, ['requestId']);
    strict_1.default.deepEqual(result.recommendedRawFields, ['currency']);
    strict_1.default.deepEqual(result.requiredHeaders, ['signature']);
    strict_1.default.deepEqual(result.recommendedHeaders, ['x-lyt-source']);
    strict_1.default.deepEqual(result.sampleHeaders, { signature: 'fixture:test' });
});
//# sourceMappingURL=lyt.contract.test.js.map