/**
 * Phase 96 Domain 前台 Mock (V10 Sprint 2 Day 25 - SSR mock)
 */

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

export function useDomainList() { return { data: MOCK_DOMAINS, isLoading: false } }
export function useDomainAdd() { return { mutate: () => undefined, isPending: false } }
export function useDomainVerify() { return { mutate: () => undefined, isPending: false } }
export function useDomainRequestSsl() { return { mutate: () => undefined, isPending: false } }
export function useDomainRemove() { return { mutate: () => undefined, isPending: false } }