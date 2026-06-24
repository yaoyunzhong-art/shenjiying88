import type { HealthCheckResult, ComponentHealth, HealthStatus } from './health.entity';
/**
 * Contract types for health module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */
/** External contract for health check result (cross-module safe subset) */
export interface HealthCheckContract {
    status: HealthStatus;
    checkedAt: string;
    uptimeSeconds: number;
    version: string;
    componentCount: number;
    componentNames: string[];
    degradedComponents: string[];
    unavailableComponents: string[];
    lytMode?: string;
}
/** External contract for component health (cross-module safe subset) */
export interface ComponentHealthContract {
    name: string;
    status: HealthStatus;
    latencyMs: number;
    hasDetail: boolean;
}
/** External contract for health ping result */
export interface HealthPingContract {
    alive: boolean;
    timestamp: string;
}
/**
 * Convert internal HealthCheckResult to cross-module contract.
 * Flattens component details into aggregated lists for safe external exposure.
 */
export declare function toHealthCheckContract(result: HealthCheckResult): HealthCheckContract;
/**
 * Convert internal ComponentHealth to cross-module contract.
 * Strips potentially sensitive detail payload.
 */
export declare function toComponentHealthContract(component: ComponentHealth): ComponentHealthContract;
/**
 * Convert health ping result to cross-module contract.
 */
export declare function toHealthPingContract(result: {
    alive: boolean;
    timestamp: string;
}): HealthPingContract;
//# sourceMappingURL=health.contract.d.ts.map