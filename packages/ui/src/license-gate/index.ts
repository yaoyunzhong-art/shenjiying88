/**
 * 付费授权 - 公开 API (V9 需求 2 · V10 Day 4 Phase 88)
 */

export { LicenseGate } from './LicenseGate';
export { default } from './LicenseGate';
export { useLicenseCheck } from './useLicenseCheck';

export type {
  LicenseGateProps,
  UseLicenseCheckOptions,
  License,
  LicenseScope,
  LicenseLevel,
  LicenseStatus,
  ActivationSource,
  CheckLicenseResponse,
} from './types';