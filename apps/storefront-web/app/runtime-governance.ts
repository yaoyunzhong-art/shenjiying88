import type {
  RuntimeGovernanceActionKey,
  RuntimeGovernanceReceipt,
  RuntimeGovernanceReplayRequest,
  RuntimeGovernanceRecommendedAction,
  RuntimeGovernanceSubmitRequest,
  RuntimeGovernanceNextStep
} from '@m5/types';
import { buildRuntimeGovernanceReplayRequest, buildRuntimeGovernanceSubmitRequest } from '@m5/sdk';
import { canReplayRuntimePanelReceipt, getRuntimePanelTenantId, summarizeRuntimePanelReceipt } from '@m5/ui';

export interface StorefrontRuntimeContext {
  marketCode: string;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
}

export interface StorefrontRuntimeActionPreset {
  action: Extract<RuntimeGovernanceActionKey, 'booking-submit' | 'payment-submit'>;
  label: string;
  scenario: string;
  riskLevel: 'low' | 'medium' | 'high';
  nextStep: RuntimeGovernanceNextStep;
  recommendedAction: RuntimeGovernanceRecommendedAction;
  requestEndpoint: string;
  handlerName: string;
  payload: Record<string, unknown>;
}

export const storefrontRuntimeActionPresets: readonly StorefrontRuntimeActionPreset[] = [
  {
    action: 'booking-submit',
    label: 'Booking Submit',
    scenario: '门店官网预约入口优先走真实 runtime submit，直接读取 receipt 与 callback 状态。',
    riskLevel: 'high',
    nextStep: 'PROCEED',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/storefront/bookings',
    handlerName: 'storefront-booking-submit-handler',
    payload: {
      bookingCode: 'STORE-BOOKING-001',
      source: 'storefront-web'
    }
  },
  {
    action: 'payment-submit',
    label: 'Payment Submit',
    scenario: '门店支付入口在弱网与 fallback 场景下保留真实 blocked receipt，而不是前端伪造成功态。',
    riskLevel: 'high',
    nextStep: 'REFRESH',
    recommendedAction: 'REFRESH_BOOTSTRAP',
    requestEndpoint: '/api/v1/storefront/payments/submit',
    handlerName: 'storefront-payment-submit-handler',
    payload: {
      orderNo: 'STORE-PAY-001',
      amount: 19900
    }
  }
];

export function buildStorefrontRuntimeSubmitRequest(
  preset: StorefrontRuntimeActionPreset,
  context: StorefrontRuntimeContext,
  nonce: string
): RuntimeGovernanceSubmitRequest {
  return buildRuntimeGovernanceSubmitRequest({
    app: 'storefront-web',
    actorId: 'ops.storefront-web',
    nonce,
    preset,
    tenantId: context.tenantCode,
    brandId: context.brandCode,
    storeId: context.storeCode,
    marketCode: context.marketCode
  });
}

export function buildStorefrontRuntimeReplayRequest(
  receipt: RuntimeGovernanceReceipt,
  nonce: string
): RuntimeGovernanceReplayRequest {
  return buildRuntimeGovernanceReplayRequest({
    app: 'storefront-web',
    actorId: 'ops.storefront-web',
    nonce,
    requestedFrom: 'STOREFRONT_WEB_RUNTIME',
    receipt,
    tenantId: parseRuntimeScopeTenantId(receipt)
  });
}

export function summarizeStorefrontRuntimeReceipt(receipt: RuntimeGovernanceReceipt): string {
  return summarizeRuntimePanelReceipt(receipt);
}

export function canReplayStorefrontRuntimeReceipt(receipt: RuntimeGovernanceReceipt) {
  return canReplayRuntimePanelReceipt(receipt);
}

function parseRuntimeScopeTenantId(receipt: RuntimeGovernanceReceipt) {
  return getRuntimePanelTenantId(receipt);
}
