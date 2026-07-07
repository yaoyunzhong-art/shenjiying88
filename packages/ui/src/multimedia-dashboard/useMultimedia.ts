/**
 * Phase 99 多模态存储 前台 Real Hooks (V11 Sprint 3 Day 34)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  MultimediaAsset,
  StorageBackend,
  StorageStats,
  StorageBackendType,
} from './types'

const API_BASE = '/api/multimedia'
type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data: T
  timestamp: string
}

type AssetListResponse = {
  items: MultimediaAsset[]
  total: number
}

type StorageBackendListResponse = {
  items: StorageBackend[]
}

type SignedUrlResponse = {
  url: string
  expiresAt: number
}

type UploadAssetInput = {
  file: { name: string; size: number; type: string }
  tags?: string[]
}

type AddStorageBackendInput = {
  name: string
  type: StorageBackendType
  bucket: string
  region: string
  credentials: string
  endpoint?: string
  cdnDomain?: string
  isDefault?: boolean
}

// ============ API 调用 ============

async function requestApi<T>(
  path: string,
  init?: RequestInit,
  options?: { allowEmptyResponse?: boolean },
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  const allowEmptyResponse = options?.allowEmptyResponse ?? false
  if (response.status === 204) {
    return undefined as T
  }

  const body = await response.json().catch(() => null) as ApiEnvelope<T> | null
  if (!response.ok) {
    throw new Error(body?.message || `HTTP ${response.status}`)
  }
  if (!body) {
    if (allowEmptyResponse) {
      return undefined as T
    }
    throw new Error('Empty response body')
  }
  if (!body?.success) {
    throw new Error(body?.message || 'Request failed')
  }
  return body.data
}

async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const nodeCrypto = await import('node:crypto')
  return nodeCrypto.createHash('sha256').update(text).digest('hex')
}

async function createAssetApi(input: UploadAssetInput): Promise<MultimediaAsset> {
  const contentHash = await sha256Hex(JSON.stringify({
    name: input.file.name,
    size: input.file.size,
    type: input.file.type,
    tags: input.tags ?? [],
  }))

  return requestApi<MultimediaAsset>('/assets', {
    method: 'POST',
    body: JSON.stringify({
      originalFilename: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      contentHash,
      visibility: 'tenant_internal',
      tags: input.tags ?? [],
    }),
  })
}

async function deleteAssetApi(assetId: string): Promise<void> {
  await requestApi<void>(`/assets/${assetId}`, {
    method: 'DELETE',
  }, { allowEmptyResponse: true })
}

async function createStorageBackendApi(input: AddStorageBackendInput): Promise<StorageBackend> {
  return requestApi<StorageBackend>('/storage-backends', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      type: input.type,
      bucket: input.bucket,
      region: input.region,
      credentials: input.credentials,
      endpoint: input.endpoint,
      cdnDomain: input.cdnDomain,
      isDefault: input.isDefault,
    }),
  })
}

async function fetchAssetsApi(opts: { assetType?: string; tags?: string[]; limit?: number } = {}): Promise<MultimediaAsset[]> {
  const params = new URLSearchParams()
  if (opts.assetType) params.set('assetType', opts.assetType)
  if (opts.limit != null) params.set('limit', String(opts.limit))
  for (const tag of opts.tags ?? []) {
    params.append('tags', tag)
  }
  const query = params.toString()
  const data = await requestApi<AssetListResponse>(`/assets${query ? `?${query}` : ''}`)
  return data.items
}

async function fetchStatsApi(): Promise<StorageStats> {
  return requestApi<StorageStats>('/stats')
}

async function fetchBackendsApi(): Promise<StorageBackend[]> {
  const data = await requestApi<StorageBackendListResponse>('/storage-backends')
  return data.items
}

// ============ Hooks ============

export function useMultimediaAssets(opts: { assetType?: string; tags?: string[]; limit?: number } = {}) {
  return useQuery({
    queryKey: ['multimedia', 'assets', opts],
    queryFn: () => fetchAssetsApi(opts),
    staleTime: 30 * 1000,
  })
}

export function useStorageStats() {
  return useQuery({
    queryKey: ['multimedia', 'stats'],
    queryFn: fetchStatsApi,
    staleTime: 60 * 1000,
  })
}

export function useStorageBackends() {
  return useQuery({
    queryKey: ['multimedia', 'backends'],
    queryFn: fetchBackendsApi,
    staleTime: 60 * 1000,
  })
}

export function useUploadAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createAssetApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multimedia', 'assets'] })
      qc.invalidateQueries({ queryKey: ['multimedia', 'stats'] })
    },
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (assetId: string) => {
      await deleteAssetApi(assetId)
      return { id: assetId }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['multimedia', 'assets'] })
      qc.invalidateQueries({ queryKey: ['multimedia', 'stats'] })
    },
  })
}

export function useGenerateSignedUrl() {
  return useMutation({
    mutationFn: async (input: { assetId: string; expiresInSec?: number; variantId?: string }) => {
      return requestApi<SignedUrlResponse>(`/assets/${input.assetId}/signed-url`, {
        method: 'POST',
        body: JSON.stringify({
          expiresInSec: input.expiresInSec,
          variantId: input.variantId,
        }),
      })
    },
  })
}

export function useAddStorageBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createStorageBackendApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['multimedia', 'backends'] }),
  })
}
