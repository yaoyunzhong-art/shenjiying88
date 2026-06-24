"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthStatus = void 0;
exports.toHealthCheckResult = toHealthCheckResult;
exports.isHealthy = isHealthy;
exports.isDegraded = isDegraded;
/**
 * 健康检查状态枚举
 */
var HealthStatus;
(function (HealthStatus) {
    HealthStatus["Ok"] = "OK";
    HealthStatus["Degraded"] = "DEGRADED";
    HealthStatus["Unavailable"] = "UNAVAILABLE";
})(HealthStatus || (exports.HealthStatus = HealthStatus = {}));
/**
 * 从组件列表构造健康检查结果
 */
function toHealthCheckResult(components, overrides) {
    const worstStatus = components.reduce((worst, c) => {
        if (c.status === HealthStatus.Unavailable)
            return HealthStatus.Unavailable;
        if (c.status === HealthStatus.Degraded && worst !== HealthStatus.Unavailable)
            return HealthStatus.Degraded;
        return worst;
    }, HealthStatus.Ok);
    return {
        status: worstStatus,
        checkedAt: new Date().toISOString(),
        uptimeSeconds: overrides.uptimeSeconds,
        version: overrides.version,
        components,
        lytMode: overrides.lytMode,
        sampleMember: overrides.sampleMember
    };
}
/**
 * 判断系统是否健康
 */
function isHealthy(result) {
    return result.status === HealthStatus.Ok;
}
/**
 * 判断系统是否降级
 */
function isDegraded(result) {
    return result.status === HealthStatus.Degraded;
}
//# sourceMappingURL=health.entity.js.map