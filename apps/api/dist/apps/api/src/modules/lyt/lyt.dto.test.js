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
(0, node_test_1.describe)('lyt.dto', () => {
    const { LytDeviceQueryDto, LytDeviceCreateDto, LytDeviceUpdateDto, LytGateVerifyDto, LytBootstrapResponseDto, LytFixtureCompareDto, LytFixtureImportPlanDto, LytFixtureImportPreviewDto, LytWebhookDrillDto, LytWebhookFixtureReplayDto, LytWebhookIngestDto } = require('./lyt.dto');
    const { LytDeviceType, LytDeviceStatus } = require('./lyt.entity');
    (0, node_test_1.describe)('LytDeviceQueryDto', () => {
        (0, node_test_1.default)('can be instantiated with no params', () => {
            const dto = new LytDeviceQueryDto();
            strict_1.default.equal(dto.deviceType, undefined);
            strict_1.default.equal(dto.status, undefined);
            strict_1.default.equal(dto.storeId, undefined);
            strict_1.default.equal(dto.keyword, undefined);
        });
        (0, node_test_1.default)('accepts all optional query fields', () => {
            const dto = new LytDeviceQueryDto();
            dto.deviceType = LytDeviceType.GateReader;
            dto.status = LytDeviceStatus.Online;
            dto.storeId = 'store-1';
            dto.keyword = 'gate';
            dto.page = 1;
            dto.pageSize = 20;
            strict_1.default.equal(dto.deviceType, 'GATE_READER');
            strict_1.default.equal(dto.status, 'ONLINE');
            strict_1.default.equal(dto.storeId, 'store-1');
            strict_1.default.equal(dto.keyword, 'gate');
            strict_1.default.equal(dto.page, 1);
            strict_1.default.equal(dto.pageSize, 20);
        });
    });
    (0, node_test_1.describe)('LytDeviceCreateDto', () => {
        (0, node_test_1.default)('has required fields', () => {
            const dto = new LytDeviceCreateDto();
            dto.deviceType = LytDeviceType.Camera;
            dto.name = 'Camera 1';
            dto.storeId = 'store-1';
            strict_1.default.equal(dto.deviceType, 'CAMERA');
            strict_1.default.equal(dto.name, 'Camera 1');
            strict_1.default.equal(dto.storeId, 'store-1');
        });
        (0, node_test_1.default)('firmwareVersion is optional', () => {
            const dto = new LytDeviceCreateDto();
            dto.deviceType = LytDeviceType.Camera;
            dto.name = 'Camera 2';
            dto.storeId = 'store-2';
            strict_1.default.equal(dto.firmwareVersion, undefined);
            dto.firmwareVersion = '1.2.3';
            strict_1.default.equal(dto.firmwareVersion, '1.2.3');
        });
    });
    (0, node_test_1.describe)('LytDeviceUpdateDto', () => {
        (0, node_test_1.default)('all fields are optional', () => {
            const dto = new LytDeviceUpdateDto();
            strict_1.default.equal(dto.name, undefined);
            strict_1.default.equal(dto.status, undefined);
            strict_1.default.equal(dto.firmwareVersion, undefined);
        });
        (0, node_test_1.default)('partial update sets only provided fields', () => {
            const dto = new LytDeviceUpdateDto();
            dto.name = 'Renamed Device';
            dto.status = LytDeviceStatus.Maintenance;
            strict_1.default.equal(dto.name, 'Renamed Device');
            strict_1.default.equal(dto.status, 'MAINTENANCE');
            strict_1.default.equal(dto.firmwareVersion, undefined);
        });
    });
    (0, node_test_1.describe)('LytGateVerifyDto', () => {
        (0, node_test_1.default)('has required passCode and storeId', () => {
            const dto = new LytGateVerifyDto();
            dto.passCode = 'PASS-1234';
            dto.storeId = 'store-1';
            strict_1.default.equal(dto.passCode, 'PASS-1234');
            strict_1.default.equal(dto.storeId, 'store-1');
        });
    });
    (0, node_test_1.describe)('LytBootstrapResponseDto', () => {
        (0, node_test_1.default)('has expected shape', () => {
            const dto = new LytBootstrapResponseDto();
            dto.tenantContext = { tenantId: 't1' };
            dto.capabilities = ['device-management'];
            dto.phase = 'scaffold';
            strict_1.default.deepStrictEqual(dto.tenantContext, { tenantId: 't1' });
            strict_1.default.deepStrictEqual(dto.capabilities, ['device-management']);
            strict_1.default.equal(dto.phase, 'scaffold');
        });
    });
    (0, node_test_1.describe)('LytWebhookIngestDto', () => {
        (0, node_test_1.default)('has required webhook signature, timestamp, and payload', () => {
            const dto = new LytWebhookIngestDto();
            dto.signature = 'sha256=test';
            dto.timestamp = '1718234567890';
            dto.payload = { orderId: 'order-1' };
            strict_1.default.equal(dto.signature, 'sha256=test');
            strict_1.default.equal(dto.timestamp, '1718234567890');
            strict_1.default.deepStrictEqual(dto.payload, { orderId: 'order-1' });
        });
        (0, node_test_1.default)('optional event metadata can be assigned', () => {
            const dto = new LytWebhookIngestDto();
            dto.eventId = 'evt-1';
            dto.eventType = 'payment.success';
            dto.rawBody = '{"orderId":"order-1"}';
            dto.fixtureKey = 'payment-success-webhook';
            dto.signature = 'sha256=test';
            dto.timestamp = '1718234567890';
            dto.payload = { orderId: 'order-1' };
            strict_1.default.equal(dto.eventId, 'evt-1');
            strict_1.default.equal(dto.eventType, 'payment.success');
            strict_1.default.equal(dto.rawBody, '{"orderId":"order-1"}');
            strict_1.default.equal(dto.fixtureKey, 'payment-success-webhook');
        });
    });
    (0, node_test_1.describe)('LytWebhookDrillDto', () => {
        (0, node_test_1.default)('supports drill preview payload with optional dryRun flag', () => {
            const dto = new LytWebhookDrillDto();
            dto.eventId = 'drill-1';
            dto.eventType = 'payment.success';
            dto.dryRun = true;
            dto.payload = { orderId: 'order-1' };
            strict_1.default.equal(dto.eventId, 'drill-1');
            strict_1.default.equal(dto.eventType, 'payment.success');
            strict_1.default.equal(dto.dryRun, true);
            strict_1.default.deepStrictEqual(dto.payload, { orderId: 'order-1' });
        });
        (0, node_test_1.default)('supports optional fixtureKey without requiring payload', () => {
            const dto = new LytWebhookDrillDto();
            dto.fixtureKey = 'payment-success-webhook';
            dto.dryRun = true;
            strict_1.default.equal(dto.fixtureKey, 'payment-success-webhook');
            strict_1.default.equal(dto.payload, undefined);
        });
    });
    (0, node_test_1.describe)('LytWebhookFixtureReplayDto', () => {
        (0, node_test_1.default)('supports fixture replay input with optional overrides', () => {
            const dto = new LytWebhookFixtureReplayDto();
            dto.fixtureKey = 'gate-pass-webhook';
            dto.eventId = 'fixture-run-001';
            dto.payload = { requestId: 'req-override-1' };
            dto.strictValidation = true;
            dto.headers = { signature: 'fixture:override' };
            dto.query = { channel: 'fixture-test' };
            strict_1.default.equal(dto.fixtureKey, 'gate-pass-webhook');
            strict_1.default.equal(dto.eventId, 'fixture-run-001');
            strict_1.default.deepStrictEqual(dto.payload, { requestId: 'req-override-1' });
            strict_1.default.equal(dto.strictValidation, true);
            strict_1.default.deepStrictEqual(dto.headers, { signature: 'fixture:override' });
            strict_1.default.deepStrictEqual(dto.query, { channel: 'fixture-test' });
        });
    });
    (0, node_test_1.describe)('LytFixtureCompareDto', () => {
        (0, node_test_1.default)('supports payload headers and query compare input', () => {
            const dto = new LytFixtureCompareDto();
            dto.payload = { paymentId: 'payment-001' };
            dto.headers = { signature: 'fixture:test' };
            dto.query = { traceId: 'trace-001' };
            strict_1.default.deepStrictEqual(dto.payload, { paymentId: 'payment-001' });
            strict_1.default.deepStrictEqual(dto.headers, { signature: 'fixture:test' });
            strict_1.default.deepStrictEqual(dto.query, { traceId: 'trace-001' });
        });
    });
    (0, node_test_1.describe)('LytFixtureImportPreviewDto', () => {
        (0, node_test_1.default)('supports captured sample import preview input', () => {
            const dto = new LytFixtureImportPreviewDto();
            dto.payload = { paymentId: 'payment-001' };
            dto.headers = { signature: 'fixture:test' };
            dto.query = { traceId: 'trace-001' };
            strict_1.default.deepStrictEqual(dto.payload, { paymentId: 'payment-001' });
            strict_1.default.deepStrictEqual(dto.headers, { signature: 'fixture:test' });
            strict_1.default.deepStrictEqual(dto.query, { traceId: 'trace-001' });
        });
    });
    (0, node_test_1.describe)('LytFixtureImportPlanDto', () => {
        (0, node_test_1.default)('supports fixture import plan input', () => {
            const dto = new LytFixtureImportPlanDto();
            dto.payload = { paymentId: 'payment-001' };
            dto.headers = { 'x-lyt-source': 'captured-sample' };
            dto.query = { traceId: 'trace-001' };
            strict_1.default.deepStrictEqual(dto.payload, { paymentId: 'payment-001' });
            strict_1.default.deepStrictEqual(dto.headers, { 'x-lyt-source': 'captured-sample' });
            strict_1.default.deepStrictEqual(dto.query, { traceId: 'trace-001' });
        });
    });
});
//# sourceMappingURL=lyt.dto.test.js.map