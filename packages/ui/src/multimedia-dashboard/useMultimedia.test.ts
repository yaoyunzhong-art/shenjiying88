import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { before, beforeEach, describe, test } from 'node:test'

type QueryConfig = {
  queryKey: unknown[]
  queryFn: () => Promise<unknown>
  staleTime?: number
}

type MutationConfig = {
  mutationFn: (input: any) => Promise<unknown>
  onSuccess?: (data: unknown, variables: unknown, context: unknown) => unknown
}

const queryClientCalls: Array<{ queryKey: unknown[] }> = []
let lastQueryConfig: QueryConfig | null = null
let lastMutationConfig: MutationConfig | null = null
let fetchCalls: Array<{ url: string; init?: RequestInit }> = []
let nextFetchResponse: Response | null = null

const localRequire = createRequire(import.meta.url)
const Module = localRequire('module')
const origLoad = Module._load
Module._load = function (request: string, parent: unknown, isMain: boolean) {
  if (request === '@tanstack/react-query') {
    return {
      useQuery(config: QueryConfig) {
        lastQueryConfig = config
        return {
          data: undefined,
          isLoading: false,
          queryKey: config.queryKey,
          execute: config.queryFn,
        }
      },
      useMutation(config: MutationConfig) {
        lastMutationConfig = config
        return {
          isPending: false,
          async mutateAsync(input: unknown) {
            const result = await config.mutationFn(input)
            await config.onSuccess?.(result, input, undefined)
            return result
          },
        }
      },
      useQueryClient() {
        return {
          invalidateQueries(input: { queryKey: unknown[] }) {
            queryClientCalls.push(input)
            return Promise.resolve()
          },
        }
      },
    }
  }
  return origLoad.call(this, request, parent, isMain)
}

const hooks = localRequire('./useMultimedia')
Module._load = origLoad

before(() => {
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init })
    if (!nextFetchResponse) {
      throw new Error('Missing mocked fetch response')
    }
    const response = nextFetchResponse
    nextFetchResponse = null
    return response
  }) as typeof fetch
})

beforeEach(() => {
  queryClientCalls.length = 0
  fetchCalls = []
  nextFetchResponse = null
  lastQueryConfig = null
  lastMutationConfig = null
})

describe('useMultimedia real hook api wiring', () => {
  test('useMultimediaAssets 应请求真实 assets query string', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: true,
      data: {
        items: [
          {
            id: 'asset-001',
            tenantId: 'tenant-A',
            originalFilename: 'hero.jpg',
            assetType: 'image',
            mimeType: 'image/jpeg',
            sizeBytes: 1024,
            contentHash: 'hash-001',
            storageBackend: 's3',
            storageKey: 'tenant-A/multimedia/hero.jpg',
            status: 'ready',
            visibility: 'tenant_internal',
            tags: ['hero'],
            uploadedBy: 'admin',
            processingProgress: 1,
            variantCount: 0,
            createdAt: '2026-06-30T00:00:00.000Z',
            updatedAt: '2026-06-30T00:00:00.000Z',
          },
        ],
        total: 1,
      },
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const query = hooks.useMultimediaAssets({ assetType: 'image', tags: ['hero', 'homepage'], limit: 3 })
    const data = await query.execute()

    assert.deepEqual(query.queryKey, ['multimedia', 'assets', { assetType: 'image', tags: ['hero', 'homepage'], limit: 3 }])
    assert.equal(fetchCalls[0]?.url, '/api/multimedia/assets?assetType=image&limit=3&tags=hero&tags=homepage')
    assert.equal(Array.isArray(data), true)
    assert.equal((data as Array<{ id: string }>)[0]?.id, 'asset-001')
  })

  test('useStorageStats 应请求真实 stats 接口', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: true,
      data: {
        totalAssets: 12,
        totalSizeBytes: 4096,
        byType: {
          image: { count: 10, sizeBytes: 2048 },
        },
        recentUploads: 3,
        avgProcessingTimeMs: 1500,
        duplicateHits: 1,
      },
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const query = hooks.useStorageStats()
    const data = await query.execute()

    assert.deepEqual(query.queryKey, ['multimedia', 'stats'])
    assert.equal(fetchCalls[0]?.url, '/api/multimedia/stats')
    assert.equal((data as { recentUploads: number }).recentUploads, 3)
  })

  test('useStorageBackends 应请求真实 backends 接口', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: true,
      data: {
        items: [
          {
            id: 'storage-001',
            name: 'oss-sh',
            type: 'oss',
            bucket: 'media-bucket',
            region: 'cn-shanghai',
            endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
            cdnDomain: 'media.shenjiying88.com',
            isDefault: true,
            enabled: true,
            createdAt: '2026-06-30T00:00:00.000Z',
          },
        ],
      },
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const query = hooks.useStorageBackends()
    const data = await query.execute()

    assert.deepEqual(query.queryKey, ['multimedia', 'backends'])
    assert.equal(fetchCalls[0]?.url, '/api/multimedia/storage-backends')
    assert.equal((data as Array<{ cdnDomain?: string }>)[0]?.cdnDomain, 'media.shenjiying88.com')
  })

  test('useUploadAsset 应计算 contentHash 并刷新 assets/stats', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: true,
      data: {
        id: 'asset-new',
        tenantId: 'tenant-A',
        originalFilename: 'new-asset.jpg',
        assetType: 'image',
        mimeType: 'image/jpeg',
        sizeBytes: 2048,
        contentHash: 'server-hash',
        storageBackend: 's3',
        storageKey: 'tenant-A/multimedia/new-asset.jpg',
        status: 'uploading',
        visibility: 'tenant_internal',
        tags: ['upload', 'test'],
        uploadedBy: 'admin',
        processingProgress: 0,
        variantCount: 0,
        createdAt: '2026-06-30T00:00:00.000Z',
        updatedAt: '2026-06-30T00:00:00.000Z',
      },
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const mutation = hooks.useUploadAsset()
    const input = {
      file: { name: 'new-asset.jpg', size: 2048, type: 'image/jpeg' },
      tags: ['upload', 'test'],
    }
    const result = await mutation.mutateAsync(input)
    const requestBody = JSON.parse(String(fetchCalls[0]?.init?.body))
    const expectedHash = createHash('sha256').update(JSON.stringify({
      name: 'new-asset.jpg',
      size: 2048,
      type: 'image/jpeg',
      tags: ['upload', 'test'],
    })).digest('hex')

    assert.equal(fetchCalls[0]?.url, '/api/multimedia/assets')
    assert.equal(fetchCalls[0]?.init?.method, 'POST')
    assert.equal(requestBody.originalFilename, 'new-asset.jpg')
    assert.equal(requestBody.contentHash, expectedHash)
    assert.deepEqual(requestBody.tags, ['upload', 'test'])
    assert.equal((result as { id: string }).id, 'asset-new')
    assert.deepEqual(queryClientCalls, [
      { queryKey: ['multimedia', 'assets'] },
      { queryKey: ['multimedia', 'stats'] },
    ])
  })

  test('useUploadAsset 在后端返回错误时应透出 message 且不刷新缓存', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: false,
      message: 'MIME not allowed',
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })

    const mutation = hooks.useUploadAsset()

    await assert.rejects(
      mutation.mutateAsync({
        file: { name: 'bad.exe', size: 100, type: 'application/octet-stream' },
        tags: ['blocked'],
      }),
      /MIME not allowed/,
    )
    assert.deepEqual(queryClientCalls, [])
  })

  test('useDeleteAsset 应支持 204 空响应并刷新 assets/stats', async () => {
    nextFetchResponse = new Response(null, { status: 204 })

    const mutation = hooks.useDeleteAsset()
    const result = await mutation.mutateAsync('asset-001')

    assert.equal(fetchCalls[0]?.url, '/api/multimedia/assets/asset-001')
    assert.equal(fetchCalls[0]?.init?.method, 'DELETE')
    assert.deepEqual(result, { id: 'asset-001' })
    assert.deepEqual(queryClientCalls, [
      { queryKey: ['multimedia', 'assets'] },
      { queryKey: ['multimedia', 'stats'] },
    ])
  })

  test('useGenerateSignedUrl 应透传 variantId 到真实接口', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: true,
      data: {
        url: 'https://cdn.shenjiying88.com/asset-thumb.webp?signature=test',
        expiresAt: 1750000000,
      },
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const mutation = hooks.useGenerateSignedUrl()
    const result = await mutation.mutateAsync({
      assetId: 'asset-001',
      expiresInSec: 300,
      variantId: 'variant-001',
    })
    const requestBody = JSON.parse(String(fetchCalls[0]?.init?.body))

    assert.equal(fetchCalls[0]?.url, '/api/multimedia/assets/asset-001/signed-url')
    assert.equal(fetchCalls[0]?.init?.method, 'POST')
    assert.deepEqual(requestBody, {
      expiresInSec: 300,
      variantId: 'variant-001',
    })
    assert.equal((result as { expiresAt: number }).expiresAt, 1750000000)
  })

  test('useAddStorageBackend 应请求真实 backend payload 并刷新 backends', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: true,
      data: {
        id: 'storage-001',
        name: 'oss-sh',
        type: 'oss',
        bucket: 'media-bucket',
        region: 'cn-shanghai',
        endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
        cdnDomain: 'media.shenjiying88.com',
        isDefault: true,
        enabled: true,
        createdAt: '2026-06-30T00:00:00.000Z',
      },
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const mutation = hooks.useAddStorageBackend()
    const result = await mutation.mutateAsync({
      name: 'oss-sh',
      type: 'oss',
      bucket: 'media-bucket',
      region: 'cn-shanghai',
      credentials: 'plain-secret',
      endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
      cdnDomain: 'media.shenjiying88.com',
      isDefault: true,
    })
    const requestBody = JSON.parse(String(fetchCalls[0]?.init?.body))

    assert.equal(fetchCalls[0]?.url, '/api/multimedia/storage-backends')
    assert.equal(fetchCalls[0]?.init?.method, 'POST')
    assert.deepEqual(requestBody, {
      name: 'oss-sh',
      type: 'oss',
      bucket: 'media-bucket',
      region: 'cn-shanghai',
      credentials: 'plain-secret',
      endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
      cdnDomain: 'media.shenjiying88.com',
      isDefault: true,
    })
    assert.equal((result as { id: string }).id, 'storage-001')
    assert.deepEqual(queryClientCalls, [
      { queryKey: ['multimedia', 'backends'] },
    ])
  })

  test('useGenerateSignedUrl 在 envelope success=false 时应抛出 message', async () => {
    nextFetchResponse = new Response(JSON.stringify({
      success: false,
      message: 'variant not found',
      timestamp: '2026-06-30T00:00:00.000Z',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    const mutation = hooks.useGenerateSignedUrl()

    await assert.rejects(
      mutation.mutateAsync({
        assetId: 'asset-001',
        variantId: 'variant-missing',
      }),
      /variant not found/,
    )
  })
})
