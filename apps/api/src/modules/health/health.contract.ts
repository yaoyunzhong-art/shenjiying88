import type {
  HealthCheckResult,
  ComponentHealth,
  HealthStatus,
} from './health.entity'

/**
 * Contract types for health module cross-boundary communication.
 * These are the stable surface that other modules consume.
 */

/** External contract for health check result (cross-module safe subset) */
export interface HealthCheckContract {
  status: HealthStatus
  checkedAt: string
  uptimeSeconds: number
  version: string
  componentCount: number
  componentNames: string[]
  degradedComponents: string[]
  unavailableComponents: string[]
  lytMode?: string
}

/** External contract for component health (cross-module safe subset) */
export interface ComponentHealthContract {
  name: string
  status: HealthStatus
  latencyMs: number
  hasDetail: boolean
}

/** External contract for health ping result */
export interface HealthPingContract {
  alive: boolean
  timestamp: string
}

/**
 * Convert internal HealthCheckResult to cross-module contract.
 * Flattens component details into aggregated lists for safe external exposure.
 */
export function toHealthCheckContract(result: HealthCheckResult): HealthCheckContract {
  const degradedComponents: string[] = []
  const unavailableComponents: string[] = []

  for (const c of result.components) {
    if (c.status === 'DEGRADED') degradedComponents.push(c.name)
    if (c.status === 'UNAVAILABLE') unavailableComponents.push(c.name)
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
  }
}

/**
 * Convert internal ComponentHealth to cross-module contract.
 * Strips potentially sensitive detail payload.
 */
export function toComponentHealthContract(component: ComponentHealth): ComponentHealthContract {
  return {
    name: component.name,
    status: component.status,
    latencyMs: component.latencyMs,
    hasDetail: component.detail !== undefined,
  }
}

/**
 * Convert health ping result to cross-module contract.
 */
export function toHealthPingContract(result: {
  alive: boolean
  timestamp: string
}): HealthPingContract {
  return {
    alive: result.alive,
    timestamp: result.timestamp,
  }
}
