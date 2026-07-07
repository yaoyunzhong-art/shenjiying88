'use client';

/**
 * 付费授权 - React Hook (V9 需求 2 · V10 Day 4)
 *
 * 5 端共享,用于前端入口拦截 (V9 双拦截前置)
 */

import { useQuery } from '@tanstack/react-query';
import type { CheckLicenseResponse, UseLicenseCheckOptions, LicenseScope } from './types';

const DEFAULT_API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_BASE) || '/api/v9';

async function httpGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * 检查当前 tenant/store 是否拥有指定 scope 的有效授权
 *
 * 用法:
 *   const { data, isLoading } = useLicenseCheck({ scope: 'ai.capability' })
 *   if (!data?.allowed) return <UpgradePrompt />
 */
export function useLicenseCheck({
  scope,
  storeId,
  apiBase = DEFAULT_API_BASE,
}: UseLicenseCheckOptions & { scope: LicenseScope }) {
  const url = `${apiBase}/license/check?scope=${encodeURIComponent(scope)}${
    storeId ? `&storeId=${encodeURIComponent(storeId)}` : ''
  }`;

  return useQuery<CheckLicenseResponse, Error>({
    queryKey: ['license-check', scope, storeId],
    queryFn: () => httpGet<CheckLicenseResponse>(url),
    staleTime: 60 * 1000,        // 1 分钟 (授权变更不频繁)
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}