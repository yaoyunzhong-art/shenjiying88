/**
 * license-renewal.entity.ts — root-level re-export bridge
 *
 * Re-exports from entities/ subdirectory for conventional module resolution.
 * The actual entity definitions live in ./entities/ subdirectory.
 */
export { LicenseRenewalRecord } from './entities/license-renewal-record.entity'
export { RenewalNotification } from './entities/renewal-notification.entity'
export type { RenewalStatus } from './entities/license-renewal-record.entity'
export type { NotificationType } from './entities/renewal-notification.entity'
