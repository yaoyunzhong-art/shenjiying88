"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const lyt_fixture_catalog_1 = require("./lyt-fixture.catalog");
(0, node_test_1.default)('getLytFixtureCatalog exposes the first-batch high-priority fixtures', () => {
    const catalog = (0, lyt_fixture_catalog_1.getLytFixtureCatalog)();
    strict_1.default.equal(catalog.length, 5);
    strict_1.default.deepEqual(catalog.map((item) => item.key), ['member-query', 'order-query', 'payment-success-webhook', 'gate-pass-webhook', 'device-status-query']);
});
(0, node_test_1.default)('getLytFixtureByKey returns webhook fixture with eventType', () => {
    const fixture = (0, lyt_fixture_catalog_1.getLytFixtureByKey)('payment-success-webhook');
    strict_1.default.equal(fixture?.transport, 'webhook');
    strict_1.default.equal(fixture?.eventType, 'payment.success');
    strict_1.default.equal(fixture?.samplePayload.requestId, 'req-pay-001');
    strict_1.default.equal(fixture?.mappingVersion, 'lyt-field-mapping-spec-v1');
    strict_1.default.equal(fixture?.riskLevel, 'high');
    strict_1.default.deepEqual(fixture?.requiredHeaders, ['signature', 'timestamp']);
    strict_1.default.deepEqual(fixture?.sampleHeaders, {
        signature: 'fixture:payment-success-webhook',
        timestamp: '2026-06-14T10:06:30.000Z'
    });
});
(0, node_test_1.default)('getLytFixtureByKey returns null for unknown key', () => {
    strict_1.default.equal((0, lyt_fixture_catalog_1.getLytFixtureByKey)('unknown-fixture'), null);
});
(0, node_test_1.default)('getLytFixtureCatalog can filter by transport and capability', () => {
    const webhooks = (0, lyt_fixture_catalog_1.getLytFixtureCatalog)({ transport: 'webhook' });
    const deviceOnly = (0, lyt_fixture_catalog_1.getLytFixtureCatalog)({ capability: 'device' });
    strict_1.default.deepEqual(webhooks.map((item) => item.key), ['payment-success-webhook', 'gate-pass-webhook']);
    strict_1.default.deepEqual(deviceOnly.map((item) => item.key), ['device-status-query']);
});
(0, node_test_1.default)('evaluateLytFixtureValidation marks complete fixtures as ready', () => {
    const fixture = (0, lyt_fixture_catalog_1.getLytFixtureByKey)('gate-pass-webhook');
    strict_1.default.ok(fixture);
    const result = (0, lyt_fixture_catalog_1.evaluateLytFixtureValidation)(fixture);
    strict_1.default.equal(result.validationStatus, 'ready-for-rehearsal');
    strict_1.default.deepEqual(result.missingSampleFields, []);
    strict_1.default.deepEqual(result.missingChecklistItems, []);
});
//# sourceMappingURL=lyt-fixture.catalog.test.js.map