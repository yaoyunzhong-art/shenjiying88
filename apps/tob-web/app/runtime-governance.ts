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

export interface TobRuntimeContext {
  marketCode: string;
  tenantCode: string;
}

export interface TobRuntimeActionPreset {
  action: Extract<RuntimeGovernanceActionKey, 'member-login' | 'booking-submit'>;
  label: string;
  scenario: string;
  riskLevel: 'low' | 'medium' | 'high';
  nextStep: RuntimeGovernanceNextStep;
  recommendedAction: RuntimeGovernanceRecommendedAction;
  requestEndpoint: string;
  handlerName: string;
  payload: Record<string, unknown>;
}

export const tobRuntimeActionPresets: readonly TobRuntimeActionPreset[] = [
  {
    action: 'member-login',
    label: 'Tenant Login',
    scenario: 'ToB 门户登录先走真实 runtime submit，观察 challenge gate 与登录回执。',
    riskLevel: 'medium',
    nextStep: 'CHALLENGE',
    recommendedAction: 'COMPLETE_CHALLENGE',
    requestEndpoint: '/api/v1/members/session/challenge',
    handlerName: 'tob-member-login-handler',
    payload: {
      loginChannel: 'tenant-portal',
      identityHint: 'merchant-admin'
    }
  },
  {
    action: 'booking-submit',
    label: 'Booking Submit',
    scenario: 'ToB 门户预约入口优先提交真实 runtime receipt，避免只靠说明态判断可用性。',
    riskLevel: 'high',
    nextStep: 'PROCEED',
    recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
    requestEndpoint: '/api/v1/storefront/bookings',
    handlerName: 'tob-booking-submit-handler',
    payload: {
      bookingCode: 'TOB-BOOKING-001',
      source: 'tenant-portal'
    }
  }
];

export function buildTobRuntimeSubmitRequest(
  preset: TobRuntimeActionPreset,
  context: TobRuntimeContext,
  nonce: string
): RuntimeGovernanceSubmitRequest {
  return buildRuntimeGovernanceSubmitRequest({
    app: 'tob-web',
    actorId: 'ops.tob-web',
    nonce,
    preset,
    tenantId: context.tenantCode,
    marketCode: context.marketCode
  });
}

export function buildTobRuntimeReplayRequest(
  receipt: RuntimeGovernanceReceipt,
  nonce: string
): RuntimeGovernanceReplayRequest {
  return buildRuntimeGovernanceReplayRequest({
    app: 'tob-web',
    actorId: 'ops.tob-web',
    nonce,
    requestedFrom: 'TOB_WEB_RUNTIME',
    receipt,
    tenantId: parseRuntimeScopeTenantId(receipt)
  });
}

export function summarizeTobRuntimeReceipt(receipt: RuntimeGovernanceReceipt): string {
  return summarizeRuntimePanelReceipt(receipt);
}

export function canReplayTobRuntimeReceipt(receipt: RuntimeGovernanceReceipt) {
  return canReplayRuntimePanelReceipt(receipt);
}

function parseRuntimeScopeTenantId(receipt: RuntimeGovernanceReceipt) {
  return getRuntimePanelTenantId(receipt);
}
