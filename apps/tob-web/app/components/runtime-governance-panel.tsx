'use client';

import React, { useMemo } from 'react';
import { createRuntimeGovernancePanelBindings, createRuntimeGovernancePanelClient } from '@m5/sdk';
import {
  joinRuntimeScopeSummary,
  RuntimeGovernancePanelTemplate
} from '@m5/ui';
import type { RuntimeGovernanceReceipt } from '@m5/types';
import {
  buildTobRuntimeReplayRequest,
  buildTobRuntimeSubmitRequest,
  canReplayTobRuntimeReceipt,
  summarizeTobRuntimeReceipt,
  tobRuntimeActionPresets,
  type TobRuntimeActionPreset
} from '../runtime-governance';

interface TobRuntimeGovernancePanelProps {
  marketCode: string;
  tenantCode: string;
}

export function RuntimeGovernancePanel({ marketCode, tenantCode }: TobRuntimeGovernancePanelProps) {
  const runtimeBindings = useMemo(
    () =>
      createRuntimeGovernancePanelBindings({
        client: createRuntimeGovernancePanelClient({
          tenantId: tenantCode,
          marketCode
        }),
        buildSubmitRequest: (preset: TobRuntimeActionPreset, nonce: string) =>
          buildTobRuntimeSubmitRequest(preset, { marketCode, tenantCode }, nonce),
        buildReplayRequest: (receipt: RuntimeGovernanceReceipt, nonce: string) =>
          buildTobRuntimeReplayRequest(receipt, nonce)
      }),
    [marketCode, tenantCode]
  );

  return (
    <RuntimeGovernancePanelTemplate<RuntimeGovernanceReceipt, TobRuntimeActionPreset>
      presets={tobRuntimeActionPresets}
      defaultAction="booking-submit"
      initialMessage="等待发起 ToB portal runtime submit"
      scopeSummary={joinRuntimeScopeSummary([`market ${marketCode}`, `tenant ${tenantCode}`])}
      summarizeReceipt={summarizeTobRuntimeReceipt}
      canReplayReceipt={canReplayTobRuntimeReceipt}
      {...runtimeBindings}
      getReceiptScopeLabel={() => joinRuntimeScopeSummary([`market ${marketCode}`, `tenant ${tenantCode}`])}
      submitErrorMessage="ToB runtime submit 失败，请检查 foundation.runtime-governance.write 权限与 API 可达性。"
      queryErrorMessage="ToB runtime query 失败，当前 receipt 可能尚未持久化。"
      replayErrorMessage="ToB runtime replay 失败，请确认 receipt 当前允许重放。"
    />
  );
}
