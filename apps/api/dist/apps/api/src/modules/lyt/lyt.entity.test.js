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
(0, node_test_1.describe)('lyt.entity', () => {
    const { LytDeviceType, LytDeviceStatus, isDeviceOnline, isDeviceAnomalous, makeLytBootstrap, computeDeviceHealthSummary } = require('./lyt.entity');
    (0, node_test_1.describe)('LytDeviceType', () => {
        (0, node_test_1.default)('has all expected enum values', () => {
            const values = Object.values(LytDeviceType);
            strict_1.default.ok(values.includes('GATE_READER'));
            strict_1.default.ok(values.includes('PRIZE_MACHINE'));
            strict_1.default.ok(values.includes('CAST_SCREEN'));
            strict_1.default.ok(values.includes('CAMERA'));
            strict_1.default.ok(values.includes('SENSOR'));
        });
    });
    (0, node_test_1.describe)('LytDeviceStatus', () => {
        (0, node_test_1.default)('has online, offline, maintenance values', () => {
            const values = Object.values(LytDeviceStatus);
            strict_1.default.ok(values.includes('ONLINE'));
            strict_1.default.ok(values.includes('OFFLINE'));
            strict_1.default.ok(values.includes('MAINTENANCE'));
        });
    });
    (0, node_test_1.describe)('isDeviceOnline', () => {
        (0, node_test_1.default)('returns true for ONLINE status', () => {
            strict_1.default.equal(isDeviceOnline(LytDeviceStatus.Online), true);
        });
        (0, node_test_1.default)('returns false for OFFLINE status', () => {
            strict_1.default.equal(isDeviceOnline(LytDeviceStatus.Offline), false);
        });
        (0, node_test_1.default)('returns false for MAINTENANCE status', () => {
            strict_1.default.equal(isDeviceOnline(LytDeviceStatus.Maintenance), false);
        });
    });
    (0, node_test_1.describe)('isDeviceAnomalous', () => {
        const tenantContext = { storeId: 'store-1', tenantId: 't1', userId: 'u1', role: 'operator' };
        (0, node_test_1.default)('returns false for online device', () => {
            const device = {
                deviceId: 'd1',
                tenantContext,
                storeId: 'store-1',
                deviceType: LytDeviceType.GateReader,
                name: 'Gate 1',
                status: LytDeviceStatus.Online,
                registeredAt: '2025-01-01T00:00:00Z'
            };
            strict_1.default.equal(isDeviceAnomalous(device), false);
        });
        (0, node_test_1.default)('returns true for offline device without heartbeat', () => {
            const device = {
                deviceId: 'd2',
                tenantContext,
                storeId: 'store-1',
                deviceType: LytDeviceType.Camera,
                name: 'Cam 1',
                status: LytDeviceStatus.Offline,
                registeredAt: '2025-01-01T00:00:00Z'
            };
            strict_1.default.equal(isDeviceAnomalous(device), true);
        });
        (0, node_test_1.default)('returns false for recently offline device within threshold', () => {
            const now = new Date();
            const device = {
                deviceId: 'd3',
                tenantContext,
                storeId: 'store-1',
                deviceType: LytDeviceType.Sensor,
                name: 'Sensor 1',
                status: LytDeviceStatus.Offline,
                lastHeartbeatAt: now.toISOString(),
                registeredAt: '2025-01-01T00:00:00Z'
            };
            strict_1.default.equal(isDeviceAnomalous(device, 5), false);
        });
        (0, node_test_1.default)('returns true for long-offline device exceeding threshold', () => {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60000);
            const device = {
                deviceId: 'd4',
                tenantContext,
                storeId: 'store-1',
                deviceType: LytDeviceType.PrizeMachine,
                name: 'Prize 1',
                status: LytDeviceStatus.Offline,
                lastHeartbeatAt: tenMinutesAgo.toISOString(),
                registeredAt: '2025-01-01T00:00:00Z'
            };
            strict_1.default.equal(isDeviceAnomalous(device, 5), true);
        });
        (0, node_test_1.default)('maintenance device is anomalous when heartbeat expired', () => {
            const twentyMinutesAgo = new Date(Date.now() - 20 * 60000);
            const device = {
                deviceId: 'd5',
                tenantContext,
                storeId: 'store-1',
                deviceType: LytDeviceType.CastScreen,
                name: 'Screen 1',
                status: LytDeviceStatus.Maintenance,
                lastHeartbeatAt: twentyMinutesAgo.toISOString(),
                registeredAt: '2025-01-01T00:00:00Z'
            };
            strict_1.default.equal(isDeviceAnomalous(device, 10), true);
        });
    });
    (0, node_test_1.describe)('makeLytBootstrap', () => {
        (0, node_test_1.default)('returns default bootstrap with tenantContext', () => {
            const ctx = { storeId: 's1', tenantId: 't1', userId: 'u1', role: 'operator' };
            const result = makeLytBootstrap(ctx);
            strict_1.default.equal(result.tenantContext, ctx);
            strict_1.default.ok(result.capabilities.includes('device-management'));
            strict_1.default.ok(result.capabilities.includes('connection-pool'));
            strict_1.default.ok(result.capabilities.includes('gate-control'));
            strict_1.default.ok(result.capabilities.includes('cast-screen'));
            strict_1.default.equal(result.phase, 'scaffold');
        });
        (0, node_test_1.default)('allows capability overrides', () => {
            const ctx = { storeId: 's2', tenantId: 't2', userId: 'u2', role: 'admin' };
            const result = makeLytBootstrap(ctx, { capabilities: ['custom-feature'] });
            strict_1.default.deepStrictEqual(result.capabilities, ['custom-feature']);
        });
        (0, node_test_1.default)('allows phase override', () => {
            const ctx = { storeId: 's3', tenantId: 't3', userId: 'u3', role: 'admin' };
            const result = makeLytBootstrap(ctx, { phase: 'production' });
            strict_1.default.equal(result.phase, 'production');
        });
    });
    (0, node_test_1.describe)('computeDeviceHealthSummary', () => {
        const ctx = { storeId: 'store-1', tenantId: 't1', userId: 'u1', role: 'operator' };
        const makeDevice = (overrides = {}) => ({
            deviceId: overrides.deviceId ?? 'd1',
            tenantContext: ctx,
            storeId: 'store-1',
            deviceType: overrides.deviceType ?? LytDeviceType.GateReader,
            name: 'Test Device',
            status: overrides.status ?? LytDeviceStatus.Online,
            registeredAt: '2025-01-01T00:00:00Z',
            ...(overrides.lastHeartbeatAt !== undefined ? { lastHeartbeatAt: overrides.lastHeartbeatAt } : {})
        });
        (0, node_test_1.default)('empty device list returns 100% health', () => {
            const result = computeDeviceHealthSummary([]);
            strict_1.default.equal(result.total, 0);
            strict_1.default.equal(result.online, 0);
            strict_1.default.equal(result.offline, 0);
            strict_1.default.equal(result.maintenance, 0);
            strict_1.default.equal(result.anomalous, 0);
            strict_1.default.equal(result.healthRate, 100);
        });
        (0, node_test_1.default)('all online devices give 100% health rate', () => {
            const devices = [
                makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
                makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Online }),
                makeDevice({ deviceId: 'd3', deviceType: LytDeviceType.Sensor, status: LytDeviceStatus.Online })
            ];
            const result = computeDeviceHealthSummary(devices);
            strict_1.default.equal(result.total, 3);
            strict_1.default.equal(result.online, 3);
            strict_1.default.equal(result.healthRate, 100);
            strict_1.default.equal(result.anomalous, 0);
        });
        (0, node_test_1.default)('mixed status devices compute correct health rate', () => {
            const devices = [
                makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
                makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Offline, lastHeartbeatAt: new Date(Date.now() - 10 * 60000).toISOString() }),
                makeDevice({ deviceId: 'd3', deviceType: LytDeviceType.CastScreen, status: LytDeviceStatus.Maintenance }),
                makeDevice({ deviceId: 'd4', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Online })
            ];
            const result = computeDeviceHealthSummary(devices);
            strict_1.default.equal(result.total, 4);
            strict_1.default.equal(result.online, 2);
            strict_1.default.equal(result.offline, 1);
            strict_1.default.equal(result.maintenance, 1);
            strict_1.default.equal(result.healthRate, 50);
            strict_1.default.ok(result.anomalous >= 1);
        });
        (0, node_test_1.default)('deviceTypeBreakdown has correct per-type counts', () => {
            const devices = [
                makeDevice({ deviceId: 'g1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
                makeDevice({ deviceId: 'g2', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Offline, lastHeartbeatAt: new Date(Date.now() - 20 * 60000).toISOString() }),
                makeDevice({ deviceId: 'p1', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Online }),
                makeDevice({ deviceId: 's1', deviceType: LytDeviceType.Sensor, status: LytDeviceStatus.Maintenance })
            ];
            const result = computeDeviceHealthSummary(devices);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.GateReader].total, 2);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.GateReader].online, 1);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.GateReader].offline, 1);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.PrizeMachine].total, 1);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.PrizeMachine].online, 1);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.Sensor].total, 1);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.Sensor].maintenance, 1);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.Camera].total, 0);
            strict_1.default.equal(result.deviceTypeBreakdown[LytDeviceType.CastScreen].total, 0);
        });
        (0, node_test_1.default)('anomalous devices detected beyond threshold', () => {
            const ancientHeartbeat = new Date(Date.now() - 60 * 60000).toISOString();
            const devices = [
                makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
                makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.Sensor, status: LytDeviceStatus.Offline, lastHeartbeatAt: ancientHeartbeat }),
                makeDevice({ deviceId: 'd3', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Maintenance, lastHeartbeatAt: ancientHeartbeat })
            ];
            const result = computeDeviceHealthSummary(devices, 30);
            strict_1.default.equal(result.anomalous, 2);
        });
    });
});
//# sourceMappingURL=lyt.entity.test.js.map