'use client';

import React, { useMemo } from 'react';
import { createRuntimeGovernancePanelBindings, createRuntimeGovernancePanelClient } from '@m5/sdk';
import {
  joinRuntimeScopeSummary,
  RuntimeGovernancePanelTemplate
} from '@m5/ui';
import type { RuntimeGovernanceReceipt, TenantContextContract } from '@m5/types';
import {
  adminRuntimeActionPresets,
  buildAdminRuntimeReplayRequest,
  buildAdminRuntimeSubmitRequest,
  canReplayAdminRuntimeReceipt,
  summarizeAdminRuntimeReceipt,
  type AdminRuntimeActionPreset
} from '../runtime-governance';

interface RuntimeGovernancePanelProps {
  tenantContext: TenantContextContract;
}

export function RuntimeGovernancePanel({ tenantContext }: RuntimeGovernancePanelProps) {
  const runtimeBindings = useMemo(
    () =>
      createRuntimeGovernancePanelBindings({
        client: createRuntimeGovernancePanelClient({
          tenantId: tenantContext.tenantId,
          brandId: tenantContext.brandId,
          storeId: tenantContext.storeId,
          marketCode: tenantContext.marketCode
        }),
        buildSubmitRequest: (preset: AdminRuntimeActionPreset, nonce: string) =>
          buildAdminRuntimeSubmitRequest(preset, tenantContext, nonce),
        buildReplayRequest: (receipt: RuntimeGovernanceReceipt, nonce: string) =>
          buildAdminRuntimeReplayRequest(receipt, nonce)
      }),
    [tenantContext]
  );

  return (
    <RuntimeGovernancePanelTemplate<RuntimeGovernanceReceipt, AdminRuntimeActionPreset>
      presets={adminRuntimeActionPresets}
      defaultAction="runtime-replay"
      initialMessage="等待发起真实 runtime submit"
      scopeSummary={joinRuntimeScopeSummary(
        [tenantContext.tenantId, tenantContext.brandId ?? '-', tenantContext.storeId ?? '-'],
        { prefix: '当前租户：' }
      )}
      summarizeReceipt={summarizeAdminRuntimeReceipt}
      canReplayReceipt={canReplayAdminRuntimeReceipt}
      {...runtimeBindings}
      getReceiptScopeLabel={(receipt: RuntimeGovernanceReceipt | null) =>
        joinRuntimeScopeSummary([receipt?.rateLimit?.scopeKey ?? ''], { prefix: 'rateLimit：' })
      }
      submitErrorMessage="runtime submit 失败，请检查 API 可达性与 foundation.runtime-governance.write 权限。"
      queryErrorMessage="runtime query 失败，当前 receipt 可能尚未持久化或 API 不可达。"
      replayErrorMessage="runtime replay 失败，请确认 receipt 当前可 replay 且 write 权限已放行。"
    />
  );
}
