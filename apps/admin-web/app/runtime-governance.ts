import type {
  AdminRuntimeActionKey,
  AdminRuntimeActionPresetContract,
  RuntimeGovernanceBatchReplayRequest,
  RuntimeGovernanceReceipt,
  RuntimeGovernanceReplayRequest,
  RuntimeGovernanceSubmitRequest,
  TenantContextContract
} from '@m5/types';
import {
  adminRuntimeActionPresetContracts,
  adminRuntimeActionPresetContractMap,
} from '@m5/types';
import { buildRuntimeGovernanceReplayRequest, buildRuntimeGovernanceSubmitRequest } from '@m5/sdk';
import { canReplayRuntimePanelReceipt, getRuntimePanelTenantId, summarizeRuntimePanelReceipt } from '@m5/ui';

export type AdminRuntimeActionPreset = AdminRuntimeActionPresetContract;

export const adminRuntimeActionPresets = adminRuntimeActionPresetContracts;

export function getAdminRuntimeActionPreset(
  action: AdminRuntimeActionKey
): AdminRuntimeActionPreset | undefined {
  return adminRuntimeActionPresetContractMap[action];
}

export function buildAdminRuntimeSubmitRequest(
  preset: AdminRuntimeActionPreset,
  tenantContext: TenantContextContract,
  nonce: string
): RuntimeGovernanceSubmitRequest {
  return buildRuntimeGovernanceSubmitRequest({
    app: 'admin-web',
    actorId: 'ops.admin-web',
    nonce,
    preset,
    tenantId: tenantContext.tenantId,
    brandId: tenantContext.brandId,
    storeId: tenantContext.storeId,
    marketCode: tenantContext.marketCode
  });
}

export function buildAdminRuntimeReplayRequest(
  receipt: RuntimeGovernanceReceipt,
  nonce: string
): RuntimeGovernanceReplayRequest {
  const preset = getAdminRuntimeActionPreset(receipt.action as AdminRuntimeActionKey);
  return buildRuntimeGovernanceReplayRequest({
    app: 'admin-web',
    actorId: 'ops.admin-web',
    nonce,
    requestedFrom: preset?.replaySource ?? 'ADMIN_WEB_RUNTIME',
    receipt,
    tenantId: parseRuntimeScopeTenantId(receipt)
  });
}

export function buildAdminRuntimeBatchReplayRequest(
  receipts: RuntimeGovernanceReceipt[],
  nonceSeed: string
): RuntimeGovernanceBatchReplayRequest {
  return {
    items: receipts.map((receipt, index) => ({
      receiptCode: receipt.receiptCode,
      ...buildAdminRuntimeReplayRequest(receipt, `${nonceSeed}-${index + 1}`)
    }))
  };
}

export function summarizeAdminRuntimeReceipt(receipt: RuntimeGovernanceReceipt): string {
  return summarizeRuntimePanelReceipt(receipt);
}

export function canReplayAdminRuntimeReceipt(receipt: RuntimeGovernanceReceipt) {
  return canReplayRuntimePanelReceipt(receipt);
}

function parseRuntimeScopeTenantId(receipt: RuntimeGovernanceReceipt) {
  return getRuntimePanelTenantId(receipt);
}
