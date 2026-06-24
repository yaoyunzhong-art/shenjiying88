"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHealthCheckContract = toHealthCheckContract;
exports.toComponentHealthContract = toComponentHealthContract;
exports.toHealthPingContract = toHealthPingContract;
/**
 * Convert internal HealthCheckResult to cross-module contract.
 * Flattens component details into aggregated lists for safe external exposure.
 */
function toHealthCheckContract(result) {
    const degradedComponents = [];
    const unavailableComponents = [];
    for (const c of result.components) {
        if (c.status === 'DEGRADED')
            degradedComponents.push(c.name);
        if (c.status === 'UNAVAILABLE')
            unavailableComponents.push(c.name);
    }
    return {
        status: result.status,
        checkedAt: result.checkedAt,
        uptimeSeconds: result.uptimeSeconds,
        version: result.version,
        componentCount: result.components.length,
        componentNames: result.components.map((c) => c.name),
        degradedComponents,
        unavailableComponents,
        lytMode: result.lytMode,
    };
}
/**
 * Convert internal ComponentHealth to cross-module contract.
 * Strips potentially sensitive detail payload.
 */
function toComponentHealthContract(component) {
    return {
        name: component.name,
        status: component.status,
        latencyMs: component.latencyMs,
        hasDetail: component.detail !== undefined,
    };
}
/**
 * Convert health ping result to cross-module contract.
 */
function toHealthPingContract(result) {
    return {
        alive: result.alive,
        timestamp: result.timestamp,
    };
}
//# sourceMappingURL=health.contract.js.map