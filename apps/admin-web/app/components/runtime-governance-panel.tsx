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
  deliveryMode: 'api' | 'fallback';
}

export function RuntimeGovernancePanel({ tenantContext, deliveryMode }: RuntimeGovernancePanelProps) {
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
  const sourceEvidence = useMemo(
    () => ({
      deliveryMode,
      tenantContextSource:
        deliveryMode === 'api'
          ? 'getAdminWorkbenchConsumerSnapshot.tenantContext'
          : 'fallbackTenantContext',
      runtimeClientSource: 'createRuntimeGovernancePanelClient',
      note:
        deliveryMode === 'api'
          ? 'Runtime 治理面板当前复用实时 bootstrap tenant context，submit/query/replay 继续直连真实 runtime API。'
          : 'Runtime 治理面板当前复用 fallback tenant context，submit/query/replay 仍直连真实 runtime API，需结合来源态判断证据可信度。'
    }),
    [deliveryMode]
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          borderRadius: 16,
          padding: '14px 16px',
          background: 'rgba(15, 23, 42, 0.28)',
          border: '1px solid rgba(148, 163, 184, 0.16)'
        }}
      >
        <div style={{ color: '#e2e8f0', fontSize: 13 }}>
          Delivery {sourceEvidence.deliveryMode} · tenantContext 来源: {sourceEvidence.tenantContextSource}
        </div>
        <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 13 }}>
          Runtime client: {sourceEvidence.runtimeClientSource} · tenantId: {tenantContext.tenantId || 'missing'}
        </div>
        <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
          {sourceEvidence.note}
        </div>
      </div>
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
    </div>
  );
}
