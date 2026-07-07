/**
 * Phase 96 SSO 前台 Hooks (V10 Sprint 2 Day 24)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SsoConnection, SsoLoginInit, SsoLoginResult } from './types'

// Mock 数据 (开发态 fallback)
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

async function fetchConnectionsApi(): Promise<SsoConnection[]> {
  await new Promise((r) => setTimeout(r, 80))
  return MOCK_CONNECTIONS
}

export function useSsoConnections() {
  return useQuery({ queryKey: ['sso', 'connections'], queryFn: fetchConnectionsApi, staleTime: 30 * 1000 })
}

export function useSsoConnection(id: string) {
  return useQuery({
    queryKey: ['sso', 'connection', id],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 50))
      return MOCK_CONNECTIONS.find((c) => c.id === id) ?? null
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateSsoConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<SsoConnection>) => {
      await new Promise((r) => setTimeout(r, 200))
      return { id: `sso-${Date.now().toString(36)}`, ...input } as SsoConnection
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso', 'connections'] }),
  })
}

export function useUpdateSsoConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<SsoConnection> & { id: string }) => {
      await new Promise((r) => setTimeout(r, 150))
      return { id, ...patch } as SsoConnection
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso', 'connections'] }),
  })
}

export function useDeleteSsoConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 100))
      return { id, deleted: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sso', 'connections'] }),
  })
}

export function useSsoLogin() {
  return useMutation({
    mutationFn: async (input: { connectionId: string; forceAuthn?: boolean }): Promise<SsoLoginInit> => {
      await new Promise((r) => setTimeout(r, 100))
      return {
        redirectUrl: `https://idp.example.com/sso?conn=${input.connectionId}`,
        state: `state-${Math.random().toString(36).slice(2, 10)}`,
      }
    },
  })
}

export function useSsoComplete() {
  return useMutation({
    mutationFn: async (input: { protocol: 'saml' | 'oidc'; payload: string; state?: string }): Promise<SsoLoginResult> => {
      await new Promise((r) => setTimeout(r, 200))
      return {
        userId: `user-${Math.random().toString(36).slice(2, 8)}`,
        email: 'demo@shenjiying88.com',
        role: 'operator',
        isNewUser: false,
        tenantId: 'tenant-A',
        accessToken: `mock-jwt-${Math.random().toString(36).slice(2, 16)}`,
        expiresIn: 3600,
      }
    },
  })
}