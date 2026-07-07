/**
 * Phase 96 SSO 前台 Mock Hooks (V10 Sprint 2 Day 24 - SSR mock)
 */

import type { SsoConnection, SsoLoginInit, SsoLoginResult } from './types'

const MOCK_CONNECTIONS: SsoConnection[] = [
  {
    id: 'sso-okta-corp',
    tenantId: 'tenant-A',
    protocol: 'saml',
    name: 'Okta 企业 SSO',
    status: 'active',
    isDefault: true,
    defaultRole: 'operator',
    autoProvisionTenant: false,
    allowedEmailDomains: ['shenjiying88.com'],
    hasSaml: true,
    hasOidc: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-28',
    createdBy: 'admin',
  },
  {
    id: 'sso-azure-oidc',
    tenantId: 'tenant-A',
    protocol: 'oidc',
    name: 'Azure AD',
    status: 'disabled',
    isDefault: false,
    defaultRole: 'viewer',
    autoProvisionTenant: false,
    allowedEmailDomains: [],
    hasSaml: false,
    hasOidc: true,
    createdAt: '2026-06-10',
    updatedAt: '2026-06-20',
    createdBy: 'admin',
  },
]

export function useSsoConnections() { return { data: MOCK_CONNECTIONS, isLoading: false } }
export function useSsoConnection(_id: string) { return { data: MOCK_CONNECTIONS[0], isLoading: false } }
export function useCreateSsoConnection() { return { mutate: () => undefined, isPending: false } }
export function useUpdateSsoConnection() { return { mutate: () => undefined, isPending: false } }
export function useDeleteSsoConnection() { return { mutate: () => undefined, isPending: false } }
export function useSsoLogin(): { mutate: (input: any) => void; isPending: boolean } {
  return {
    mutate: () => undefined,
    isPending: false,
  }
}
export function useSsoComplete(): { mutate: (input: any) => void; isPending: boolean; data: SsoLoginResult | undefined } {
  return {
    mutate: () => undefined,
    isPending: false,
    data: undefined,
  }
}