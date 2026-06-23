'use client';

import React, { useMemo } from 'react';
import { createRuntimeGovernancePanelBindings, createRuntimeGovernancePanelClient } from '@m5/sdk';
import {
  joinRuntimeScopeSummary,
  RuntimeGovernancePanelTemplate
} from '@m5/ui';
import type { RuntimeGovernanceReceipt } from '@m5/types';
import {
  buildStorefrontRuntimeReplayRequest,
  buildStorefrontRuntimeSubmitRequest,
  canReplayStorefrontRuntimeReceipt,
  storefrontRuntimeActionPresets,
  summarizeStorefrontRuntimeReceipt,
  type StorefrontRuntimeActionPreset
} from '../runtime-governance';

interface StorefrontRuntimeGovernancePanelProps {
  marketCode: string;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
}

export function RuntimeGovernancePanel({
  marketCode,
  tenantCode,
  brandCode,
  storeCode
}: StorefrontRuntimeGovernancePanelProps) {
  const runtimeBindings = useMemo(
    () =>
      createRuntimeGovernancePanelBindings({
        client: createRuntimeGovernancePanelClient({
          tenantId: tenantCode,
          brandId: brandCode,
          storeId: storeCode,
          marketCode
        }),
        buildSubmitRequest: (preset: StorefrontRuntimeActionPreset, nonce: string) =>
          buildStorefrontRuntimeSubmitRequest(preset, { marketCode, tenantCode, brandCode, storeCode }, nonce),
        buildReplayRequest: (receipt: RuntimeGovernanceReceipt, nonce: string) =>
          buildStorefrontRuntimeReplayRequest(receipt, nonce)
      }),
    [brandCode, marketCode, storeCode, tenantCode]
  );

  return (
    <RuntimeGovernancePanelTemplate<RuntimeGovernanceReceipt, StorefrontRuntimeActionPreset>
      presets={storefrontRuntimeActionPresets}
      defaultAction="booking-submit"
      initialMessage="等待发起 Storefront runtime submit"
      scopeSummary={joinRuntimeScopeSummary([marketCode, tenantCode, brandCode, storeCode])}
      summarizeReceipt={summarizeStorefrontRuntimeReceipt}
      canReplayReceipt={canReplayStorefrontRuntimeReceipt}
      {...runtimeBindings}
      getReceiptScopeLabel={() => joinRuntimeScopeSummary([marketCode, tenantCode, brandCode, storeCode])}
      submitErrorMessage="Storefront runtime submit 失败，请检查 API 可达性与 write 权限。"
      queryErrorMessage="Storefront runtime query 失败，当前 receipt 可能尚未持久化。"
      replayErrorMessage="Storefront runtime replay 失败，请确认 receipt 当前允许重放。"
    />
  );
}
