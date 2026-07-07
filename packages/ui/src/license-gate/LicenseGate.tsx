'use client';

/**
 * 付费授权 - 入口拦截组件 (V9 需求 2 双拦截前置)
 *
 * 5 端共享,前端 UI 拦截 (后端 LicenseGuard 是第二道拦截)
 *
 * 用法:
 *   <LicenseGate scope="ai.capability" storeId="store-001">
 *     <ExpensiveFeature />
 *   </LicenseGate>
 */

import React from 'react';
import { useLicenseCheck } from './useLicenseCheck';
import type { LicenseGateProps } from './types';

export function LicenseGate({
  scope,
  storeId,
  children,
  fallback,
  apiBase,
  device = 'pc',
}: LicenseGateProps) {
  const { data, isLoading, error } = useLicenseCheck({ scope, storeId, apiBase });

  if (isLoading) {
    return <LicenseLoadingFallback device={device} />;
  }

  if (error || !data) {
    return <LicenseErrorFallback device={device} error={error?.message} />;
  }

  if (!data.allowed) {
    return (
      fallback ?? (
        <UpgradePrompt
          scope={scope}
          reason={data.reason}
          trialDaysRemaining={data.trialDaysRemaining}
          quotaRemaining={data.quotaRemaining}
          device={device}
        />
      )
    );
  }

  return <>{children}</>;
}

export default LicenseGate;

// ============ Fallback 组件 ============

function LicenseLoadingFallback({ device }: { device: LicenseGateProps['device'] }) {
  return (
    <div
      style={{
        padding: device === 'h5' ? 16 : 24,
        textAlign: 'center',
        color: '#999',
        fontSize: device === 'h5' ? 12 : 13,
      }}
      data-license-gate="loading"
    >
      授权校验中...
    </div>
  );
}

function LicenseErrorFallback({ device, error }: { device: LicenseGateProps['device']; error?: string }) {
  return (
    <div
      style={{
        padding: device === 'h5' ? 12 : 16,
        background: '#fff2f0',
        border: '1px solid #ffccc7',
        borderRadius: 6,
        color: '#ff4d4f',
        fontSize: device === 'h5' ? 11 : 12,
      }}
      data-license-gate="error"
    >
      ⚠️ 授权校验失败: {error ?? 'unknown'}
    </div>
  );
}

interface UpgradePromptProps {
  scope: string;
  reason?: string;
  trialDaysRemaining?: number;
  quotaRemaining?: number;
  device: LicenseGateProps['device'];
}

function UpgradePrompt({ scope, reason, trialDaysRemaining, quotaRemaining, device }: UpgradePromptProps) {
  const title = SCOPE_PROMPT_TITLE[scope as keyof typeof SCOPE_PROMPT_TITLE] ?? '功能受限';
  const description = reason ?? '当前未授权该功能';

  const isTrialExpired = trialDaysRemaining !== undefined && trialDaysRemaining <= 0;
  const isQuotaExhausted = quotaRemaining !== undefined && quotaRemaining <= 0;

  return (
    <div
      style={{
        padding: device === 'h5' ? 16 : 24,
        background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
        border: '1px solid #ffd591',
        borderRadius: 8,
        textAlign: 'center',
        maxWidth: device === 'h5' ? '100%' : 480,
        margin: '0 auto',
      }}
      data-license-gate="denied"
      data-scope={scope}
    >
      <div style={{ fontSize: device === 'h5' ? 32 : 48, marginBottom: 8 }}>🔒</div>
      <div
        style={{
          fontSize: device === 'h5' ? 14 : 16,
          fontWeight: 600,
          color: '#d48806',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: device === 'h5' ? 12 : 13,
          color: '#874d00',
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        {description}
        {trialDaysRemaining !== undefined && !isTrialExpired && (
          <div style={{ marginTop: 4 }}>试用剩余 {trialDaysRemaining} 天</div>
        )}
        {isTrialExpired && <div style={{ marginTop: 4, color: '#ff4d4f' }}>试用期已结束</div>}
        {isQuotaExhausted && <div style={{ marginTop: 4, color: '#ff4d4f' }}>配额已用完</div>}
      </div>
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/billing/upgrade?scope=' + scope;
          }
        }}
        style={{
          padding: device === 'h5' ? '8px 20px' : '10px 24px',
          background: '#fa8c16',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontSize: device === 'h5' ? 13 : 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        立即升级
      </button>
    </div>
  );
}

const SCOPE_PROMPT_TITLE = {
  'ai.capability': 'AI 能力未授权',
  'ai.knowledge': '知识库容量不足',
  'ai.industry': '行业增值功能未授权',
  'integration.open': '多系统对接未授权',
} as const;