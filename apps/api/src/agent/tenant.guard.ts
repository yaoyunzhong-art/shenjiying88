/**
 * Compatibility shim for legacy tenant guard imports.
 *
 * Older modules import from `src/agent/tenant.guard` and expect both
 * `TenantGuard` and `TenantScopeGuard`. The real implementation now lives
 * under `src/modules/agent/tenant.guard`.
 */
export { TenantGuard, TenantGuard as TenantScopeGuard } from '../modules/agent/tenant.guard'
