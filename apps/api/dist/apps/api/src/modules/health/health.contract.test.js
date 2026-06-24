"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const health_entity_1 = require("./health.entity");
const health_contract_1 = require("./health.contract");
/* ------------------------------------------------------------------ */
/*  toHealthCheckContract                                              */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toHealthCheckContract maps healthy result with all components ok', () => {
    const result = {
        status: health_entity_1.HealthStatus.Ok,
        checkedAt: '2026-06-23T08:00:00.000Z',
        uptimeSeconds: 3600,
        version: '1.2.3',
        components: [
            { name: 'database', status: health_entity_1.HealthStatus.Ok, latencyMs: 5 },
            { name: 'redis', status: health_entity_1.HealthStatus.Ok, latencyMs: 2 },
            { name: 'lyt-adapter', status: health_entity_1.HealthStatus.Ok, latencyMs: 10 },
        ],
        lytMode: 'mock',
    };
    const contract = (0, health_contract_1.toHealthCheckContract)(result);
    strict_1.default.equal(contract.status, health_entity_1.HealthStatus.Ok);
    strict_1.default.equal(contract.checkedAt, '2026-06-23T08:00:00.000Z');
    strict_1.default.equal(contract.uptimeSeconds, 3600);
    strict_1.default.equal(contract.version, '1.2.3');
    strict_1.default.equal(contract.componentCount, 3);
    strict_1.default.deepStrictEqual(contract.componentNames, ['database', 'redis', 'lyt-adapter']);
    strict_1.default.deepStrictEqual(contract.degradedComponents, []);
    strict_1.default.deepStrictEqual(contract.unavailableComponents, []);
    strict_1.default.equal(contract.lytMode, 'mock');
});
(0, node_test_1.default)('toHealthCheckContract maps degraded result with mixed statuses', () => {
    const result = {
        status: health_entity_1.HealthStatus.Degraded,
        checkedAt: '2026-06-23T08:05:00.000Z',
        uptimeSeconds: 3900,
        version: '1.2.3',
        components: [
            { name: 'database', status: health_entity_1.HealthStatus.Ok, latencyMs: 5 },
            { name: 'redis', status: health_entity_1.HealthStatus.Degraded, latencyMs: 800 },
            { name: 'lyt-adapter', status: health_entity_1.HealthStatus.Unavailable, latencyMs: 0, detail: { error: 'timeout' } },
            { name: 'memory', status: health_entity_1.HealthStatus.Ok, latencyMs: 1 },
            { name: 'disk', status: health_entity_1.HealthStatus.Ok, latencyMs: 3 },
        ],
        lytMode: 'platform-mock',
    };
    const contract = (0, health_contract_1.toHealthCheckContract)(result);
    strict_1.default.equal(contract.status, health_entity_1.HealthStatus.Degraded);
    strict_1.default.equal(contract.componentCount, 5);
    strict_1.default.deepStrictEqual(contract.degradedComponents, ['redis']);
    strict_1.default.deepStrictEqual(contract.unavailableComponents, ['lyt-adapter']);
    strict_1.default.equal(contract.lytMode, 'platform-mock');
});
(0, node_test_1.default)('toHealthCheckContract maps unavailable result with all components down', () => {
    const result = {
        status: health_entity_1.HealthStatus.Unavailable,
        checkedAt: '2026-06-23T08:10:00.000Z',
        uptimeSeconds: 4200,
        version: '1.2.3',
        components: [
            { name: 'database', status: health_entity_1.HealthStatus.Unavailable, latencyMs: 0, detail: { error: 'connection refused' } },
            { name: 'lyt-adapter', status: health_entity_1.HealthStatus.Unavailable, latencyMs: 0, detail: { error: 'timeout' } },
        ],
    };
    const contract = (0, health_contract_1.toHealthCheckContract)(result);
    strict_1.default.equal(contract.status, health_entity_1.HealthStatus.Unavailable);
    strict_1.default.equal(contract.componentCount, 2);
    strict_1.default.deepStrictEqual(contract.degradedComponents, []);
    strict_1.default.deepStrictEqual(contract.unavailableComponents, ['database', 'lyt-adapter']);
    strict_1.default.equal(contract.lytMode, undefined);
});
(0, node_test_1.default)('toHealthCheckContract handles empty component list', () => {
    const result = {
        status: health_entity_1.HealthStatus.Ok,
        checkedAt: '2026-06-23T08:00:00.000Z',
        uptimeSeconds: 0,
        version: '0.0.1',
        components: [],
    };
    const contract = (0, health_contract_1.toHealthCheckContract)(result);
    strict_1.default.equal(contract.status, health_entity_1.HealthStatus.Ok);
    strict_1.default.equal(contract.componentCount, 0);
    strict_1.default.deepStrictEqual(contract.componentNames, []);
    strict_1.default.deepStrictEqual(contract.degradedComponents, []);
    strict_1.default.deepStrictEqual(contract.unavailableComponents, []);
});
(0, node_test_1.default)('toHealthCheckContract preserves lytMode when set', () => {
    const result = {
        status: health_entity_1.HealthStatus.Ok,
        checkedAt: '2026-06-23T09:00:00.000Z',
        uptimeSeconds: 100,
        version: '0.0.0',
        components: [{ name: 'database', status: health_entity_1.HealthStatus.Ok, latencyMs: 3 }],
        lytMode: 'custom-adapter',
    };
    const contract = (0, health_contract_1.toHealthCheckContract)(result);
    strict_1.default.equal(contract.lytMode, 'custom-adapter');
});
/* ------------------------------------------------------------------ */
/*  toComponentHealthContract                                          */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toComponentHealthContract maps component without detail', () => {
    const component = {
        name: 'database',
        status: health_entity_1.HealthStatus.Ok,
        latencyMs: 5,
    };
    const contract = (0, health_contract_1.toComponentHealthContract)(component);
    strict_1.default.equal(contract.name, 'database');
    strict_1.default.equal(contract.status, health_entity_1.HealthStatus.Ok);
    strict_1.default.equal(contract.latencyMs, 5);
    strict_1.default.equal(contract.hasDetail, false);
});
(0, node_test_1.default)('toComponentHealthContract maps component with detail', () => {
    const component = {
        name: 'redis',
        status: health_entity_1.HealthStatus.Degraded,
        latencyMs: 800,
        detail: { host: 'localhost', port: 6379 },
    };
    const contract = (0, health_contract_1.toComponentHealthContract)(component);
    strict_1.default.equal(contract.name, 'redis');
    strict_1.default.equal(contract.status, health_entity_1.HealthStatus.Degraded);
    strict_1.default.equal(contract.latencyMs, 800);
    strict_1.default.equal(contract.hasDetail, true);
});
(0, node_test_1.default)('toComponentHealthContract maps unavailable component with error detail', () => {
    const component = {
        name: 'lyt-adapter',
        status: health_entity_1.HealthStatus.Unavailable,
        latencyMs: 0,
        detail: { error: 'timeout after 5000ms' },
    };
    const contract = (0, health_contract_1.toComponentHealthContract)(component);
    strict_1.default.equal(contract.name, 'lyt-adapter');
    strict_1.default.equal(contract.status, health_entity_1.HealthStatus.Unavailable);
    strict_1.default.equal(contract.latencyMs, 0);
    strict_1.default.equal(contract.hasDetail, true);
});
/* ------------------------------------------------------------------ */
/*  toHealthPingContract                                               */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('toHealthPingContract maps alive ping', () => {
    const result = { alive: true, timestamp: '2026-06-23T08:00:00.000Z' };
    const contract = (0, health_contract_1.toHealthPingContract)(result);
    strict_1.default.equal(contract.alive, true);
    strict_1.default.equal(contract.timestamp, '2026-06-23T08:00:00.000Z');
});
(0, node_test_1.default)('toHealthPingContract maps dead ping (edge case — should not happen in practice)', () => {
    const result = { alive: false, timestamp: '2026-06-23T08:00:00.000Z' };
    const contract = (0, health_contract_1.toHealthPingContract)(result);
    strict_1.default.equal(contract.alive, false);
    strict_1.default.equal(contract.timestamp, '2026-06-23T08:00:00.000Z');
});
(0, node_test_1.default)('toHealthPingContract round-trips identity', () => {
    const input = { alive: true, timestamp: new Date().toISOString() };
    const contract = (0, health_contract_1.toHealthPingContract)(input);
    strict_1.default.equal(contract.alive, input.alive);
    strict_1.default.equal(contract.timestamp, input.timestamp);
});
/* ------------------------------------------------------------------ */
/*  Contract type structural conformance                               */
/* ------------------------------------------------------------------ */
(0, node_test_1.default)('HealthCheckContract fields match expected shape', () => {
    const result = {
        status: health_entity_1.HealthStatus.Ok,
        checkedAt: '2026-06-23T08:00:00.000Z',
        uptimeSeconds: 100,
        version: '1.0.0',
        components: [
            { name: 'db', status: health_entity_1.HealthStatus.Ok, latencyMs: 1 },
            { name: 'redis', status: health_entity_1.HealthStatus.Ok, latencyMs: 2 },
        ],
    };
    const contract = (0, health_contract_1.toHealthCheckContract)(result);
    // Structural check: all expected keys are present
    const keys = Object.keys(contract).sort();
    strict_1.default.deepStrictEqual(keys, [
        'checkedAt',
        'componentCount',
        'componentNames',
        'degradedComponents',
        'lytMode',
        'status',
        'unavailableComponents',
        'uptimeSeconds',
        'version',
    ]);
});
(0, node_test_1.default)('ComponentHealthContract fields match expected shape', () => {
    const component = { name: 'disk', status: health_entity_1.HealthStatus.Ok, latencyMs: 3 };
    const contract = (0, health_contract_1.toComponentHealthContract)(component);
    const keys = Object.keys(contract).sort();
    strict_1.default.deepStrictEqual(keys, ['hasDetail', 'latencyMs', 'name', 'status']);
});
(0, node_test_1.default)('toHealthCheckContract degrades do not duplicate names', () => {
    const result = {
        status: health_entity_1.HealthStatus.Degraded,
        checkedAt: '2026-06-23T08:00:00.000Z',
        uptimeSeconds: 0,
        version: '0',
        components: [
            { name: 'redis', status: health_entity_1.HealthStatus.Degraded, latencyMs: 500 },
            { name: 'redis', status: health_entity_1.HealthStatus.Degraded, latencyMs: 600 }, // duplicate name (edge)
        ],
    };
    const contract = (0, health_contract_1.toHealthCheckContract)(result);
    // Both entries are preserved — no dedup logic
    strict_1.default.deepStrictEqual(contract.degradedComponents, ['redis', 'redis']);
});
//# sourceMappingURL=health.contract.test.js.map