/**
 * Phase 96 Domain 前台 Hooks (V10 Sprint 2 Day 25)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DomainMapping } from './types'

const MOCK_DOMAINS: DomainMapping[] = [
  {
    id: 'dom-acme-001',
    tenantId: 'tenant-A',
    domain: 'acme.shenjiying88.com',
    verificationToken: 'mock-token-abc123',
    verificationHost: '_shenjiying-verify.acme.shenjiying88.com',
    status: 'active_ssl',
    ssl: {
      provider: 'letsencrypt',
      expiresAt: '2026-09-26T00:00:00Z',
      fingerprint: 'abc123def456',
      lastRenewedAt: '2026-06-26T00:00:00Z',
    },
    lastVerifiedAt: '2026-06-26T00:00:00Z',
    verificationFailCount: 0,
    createdAt: '2026-06-20',
    updatedAt: '2026-06-28',
    createdBy: 'admin',
  },
  {
    id: 'dom-shop-002',
    tenantId: 'tenant-A',
    domain: 'shop.shenjiying88.cn',
    verificationToken: 'mock-token-def456',
    verificationHost: '_shenjiying-verify.shop.shenjiying88.cn',
    status: 'pending_verification',
    verificationFailCount: 0,
    createdAt: '2026-06-27',
    updatedAt: '2026-06-28',
    createdBy: 'admin',
  },
]

async function fetchDomainsApi(): Promise<DomainMapping[]> {
  await new Promise((r) => setTimeout(r, 80))
  return MOCK_DOMAINS
}

export function useDomainList() {
  return useQuery({ queryKey: ['domain', 'list'], queryFn: fetchDomainsApi, staleTime: 30 * 1000 })
}

export function useDomainAdd() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (domain: string) => {
      await new Promise((r) => setTimeout(r, 200))
      return { id: `dom-${Date.now().toString(36)}`, domain } as any
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domain', 'list'] }),
  })
}

export function useDomainVerify() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 300))
      return { id, ok: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domain', 'list'] }),
  })
}

export function useDomainRequestSsl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 500))
      return { id, ok: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domain', 'list'] }),
  })
}

export function useDomainRemove() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 150))
      return { id, deleted: true }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['domain', 'list'] }),
  })
}