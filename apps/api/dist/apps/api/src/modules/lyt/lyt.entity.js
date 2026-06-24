"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LytDeviceStatus = exports.LytDeviceType = void 0;
exports.isDeviceOnline = isDeviceOnline;
exports.isDeviceAnomalous = isDeviceAnomalous;
exports.computeDeviceHealthSummary = computeDeviceHealthSummary;
exports.makeLytBootstrap = makeLytBootstrap;
/**
 * LYT 设备类型枚举
 */
var LytDeviceType;
(function (LytDeviceType) {
    LytDeviceType["GateReader"] = "GATE_READER";
    LytDeviceType["PrizeMachine"] = "PRIZE_MACHINE";
    LytDeviceType["CastScreen"] = "CAST_SCREEN";
    LytDeviceType["Camera"] = "CAMERA";
    LytDeviceType["Sensor"] = "SENSOR";
})(LytDeviceType || (exports.LytDeviceType = LytDeviceType = {}));
/**
 * LYT 设备状态枚举
 */
var LytDeviceStatus;
(function (LytDeviceStatus) {
    LytDeviceStatus["Online"] = "ONLINE";
    LytDeviceStatus["Offline"] = "OFFLINE";
    LytDeviceStatus["Maintenance"] = "MAINTENANCE";
})(LytDeviceStatus || (exports.LytDeviceStatus = LytDeviceStatus = {}));
/**
 * 判断设备是否在线
 */
function isDeviceOnline(status) {
    return status === LytDeviceStatus.Online;
}
/**
 * 判断设备是否需要关注（离线或维护超过指定分钟数视为异常）
 */
function isDeviceAnomalous(device, thresholdMinutes = 5) {
    if (device.status === LytDeviceStatus.Online)
        return false;
    if (!device.lastHeartbeatAt)
        return true;
    const now = new Date();
    const heartbeat = new Date(device.lastHeartbeatAt);
    const diffMinutes = (now.getTime() - heartbeat.getTime()) / 60_000;
    return diffMinutes > thresholdMinutes;
}
/**
 * 计算设备健康汇总
 */
function computeDeviceHealthSummary(devices, thresholdMinutes = 5) {
    const total = devices.length;
    let online = 0;
    let offline = 0;
    let maintenance = 0;
    let anomalous = 0;
    const typeBreakdown = {
        [LytDeviceType.GateReader]: { total: 0, online: 0, offline: 0, maintenance: 0 },
        [LytDeviceType.PrizeMachine]: { total: 0, online: 0, offline: 0, maintenance: 0 },
        [LytDeviceType.CastScreen]: { total: 0, online: 0, offline: 0, maintenance: 0 },
        [LytDeviceType.Camera]: { total: 0, online: 0, offline: 0, maintenance: 0 },
        [LytDeviceType.Sensor]: { total: 0, online: 0, offline: 0, maintenance: 0 }
    };
    for (const device of devices) {
        const breakdown = typeBreakdown[device.deviceType];
        if (breakdown) {
            breakdown.total++;
            if (device.status === LytDeviceStatus.Online)
                breakdown.online++;
            else if (device.status === LytDeviceStatus.Offline)
                breakdown.offline++;
            else if (device.status === LytDeviceStatus.Maintenance)
                breakdown.maintenance++;
        }
        if (device.status === LytDeviceStatus.Online)
            online++;
        else if (device.status === LytDeviceStatus.Offline)
            offline++;
        else if (device.status === LytDeviceStatus.Maintenance)
            maintenance++;
        if (isDeviceAnomalous(device, thresholdMinutes)) {
            anomalous++;
        }
    }
    const healthRate = total > 0 ? roundTo((online / total) * 100, 2) : 100;
    return { total, online, offline, maintenance, anomalous, healthRate, deviceTypeBreakdown: typeBreakdown };
}
function roundTo(value, precision) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}
/**
 * 构造默认 LYT bootstrap
 */
function makeLytBootstrap(tenantContext, overrides = {}) {
    return {
        tenantContext,
        capabilities: ['device-management', 'connection-pool', 'gate-control', 'cast-screen'],
        phase: 'scaffold',
        ...overrides
    };
}
//# sourceMappingURL=lyt.entity.js.map