import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { beforeEach, describe, test } from 'node:test'
import type { ReactElement, ReactNode } from 'react'

type HookState = {
  showUpload: boolean
  showBackends: boolean
}

const localRequire = createRequire(import.meta.url)

const baseAsset = {
  id: 'asset-001',
  tenantId: 'tenant-A',
  originalFilename: 'hero-banner.jpg',
  assetType: 'image',
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  contentHash: 'hash-001',
  storageBackend: 's3',
  storageKey: 'tenant-A/multimedia/hero-banner.jpg',
  status: 'ready',
  visibility: 'tenant_internal',
  tags: ['hero', 'homepage', 'landing'],
  uploadedBy: 'admin-A',
  processingProgress: 1,
  variantCount: 2,
  createdAt: '2026-06-30T00:00:00.000Z',
  updatedAt: '2026-06-30T00:00:00.000Z',
} as const

const baseStats = {
  totalAssets: 1,
  totalSizeBytes: 1024,
  byType: { image: { count: 1, sizeBytes: 1024 } },
  recentUploads: 1,
  avgProcessingTimeMs: 0,
  duplicateHits: 0,
} as const

const baseBackends = [
  {
    id: 'storage-001',
    name: 'oss-sh',
    type: 'oss',
    bucket: 'media-bucket',
    region: 'cn-shanghai',
    cdnDomain: 'media.shenjiying88.com',
    isDefault: true,
    enabled: true,
    createdAt: '2026-06-30T00:00:00.000Z',
  },
] as const

let currentState: HookState
let stateSetters: Array<(value: unknown) => void> = []
let uploadCalls: Array<unknown> = []
let deleteCalls: Array<unknown> = []
let signedUrlCalls: Array<unknown> = []
let selectedAssets: Array<string> = []
let confirmResult = true
let currentAssets: Array<Record<string, unknown>> = []
let currentStats: Record<string, unknown> | undefined
let currentBackends: Array<Record<string, unknown>> = []
let currentIsLoading = false
let capturedAssetQuery: unknown = null

function resetHarness() {
  currentState = {
    showUpload: false,
    showBackends: false,
  }
  stateSetters = []
  uploadCalls = []
  deleteCalls = []
  signedUrlCalls = []
  selectedAssets = []
  confirmResult = true
  currentAssets = [{ ...baseAsset }]
  currentStats = { ...baseStats, byType: { image: { count: 1, sizeBytes: 1024 } } }
  currentBackends = baseBackends.map((item) => ({ ...item }))
  currentIsLoading = false
  capturedAssetQuery = null
}

function isElement(node: unknown): node is ReactElement {
  return Boolean(node) && typeof node === 'object' && 'props' in (node as Record<string, unknown>)
}

function visit(node: ReactNode, visitor: (element: ReactElement) => void) {
  if (Array.isArray(node)) {
    for (const child of node) {
      visit(child, visitor)
    }
    return
  }
  if (!isElement(node)) {
    return
  }
  visitor(node)
  visit(node.props.children, visitor)
}

function findElement(node: ReactNode, predicate: (element: ReactElement) => boolean): ReactElement | null {
  let found: ReactElement | null = null
  visit(node, (element) => {
    if (!found && predicate(element)) {
      found = element
    }
  })
  return found
}

function getText(node: ReactNode): string {
  if (Array.isArray(node)) {
    return node.map((child) => getText(child)).join('')
  }
  if (node == null || typeof node === 'boolean') {
    return ''
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (isElement(node)) {
    return getText(node.props.children)
  }
  return ''
}

function loadDashboard() {
  const actualReact = localRequire('react')
  const Module = localRequire('module')
  const originalLoad = Module._load
  let useStateIndex = 0

  const patchedReact = {
    ...actualReact,
    useState(initialValue: unknown) {
      const index = useStateIndex++
      const value = index === 0
        ? currentState.showUpload
        : index === 1
          ? currentState.showBackends
          : initialValue
      const setter = (next: unknown) => {
        stateSetters[index]?.(next)
      }
      return [value ?? initialValue, setter]
    },
  }

  Module._load = function (request: string, parent: unknown, isMain: boolean) {
    if (request === 'react') {
      return patchedReact
    }
    if (request === './useMultimedia' && String((parent as { filename?: string } | undefined)?.filename).includes('MultimediaDashboard')) {
      return {
        useMultimediaAssets(input: unknown) {
          capturedAssetQuery = input
          return {
            data: currentAssets,
            isLoading: currentIsLoading,
          }
        },
        useStorageStats() {
          return {
            data: currentStats,
          }
        },
        useStorageBackends() {
          return {
            data: currentBackends,
          }
        },
        useUploadAsset() {
          return {
            mutate(input: unknown) {
              uploadCalls.push(input)
            },
          }
        },
        useDeleteAsset() {
          return {
            mutate(input: unknown) {
              deleteCalls.push(input)
            },
          }
        },
        useGenerateSignedUrl() {
          return {
            mutate(input: unknown) {
              signedUrlCalls.push(input)
            },
          }
        },
      }
    }
    return originalLoad.call(this, request, parent, isMain)
  }

  delete localRequire.cache[localRequire.resolve('./MultimediaDashboard')]
  const dashboardModule = localRequire('./MultimediaDashboard')
  Module._load = originalLoad
  return dashboardModule
}

beforeEach(() => {
  resetHarness()
  globalThis.confirm = (() => confirmResult) as typeof confirm
  stateSetters[0] = () => undefined
  stateSetters[1] = () => undefined
})

describe('MultimediaDashboard interaction wiring', () => {
  test('loading 状态应优先渲染加载占位', () => {
    currentIsLoading = true

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})

    assert.equal(tree.props['data-testid'], 'mm-loading')
    assert.equal(tree.props.children, '加载中...')
  })

  test('filterType 应透传到 assets hook 且显示过滤标签', () => {
    const { MultimediaDashboard } = loadDashboard()
    MultimediaDashboard({ filterType: 'video' })

    assert.deepEqual(capturedAssetQuery, { assetType: 'video', limit: 100 })
  })

  test('空资产列表时应渲染 empty 态', () => {
    currentAssets = []

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const emptyState = findElement(tree, (element) => element.props['data-testid'] === 'mm-empty')
    const assetCardElement = findElement(
      tree,
      (element) => typeof element.type === 'function' && 'asset' in element.props,
    )

    assert.ok(emptyState)
    assert.equal(assetCardElement, null)
    assert.ok(getText(tree).includes('资产列表 (0)'))
    assert.ok(getText(tree).includes('暂无资产'))
  })

  test('无 stats 数据时不应渲染统计面板', () => {
    currentStats = undefined

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const statsPanel = findElement(
      tree,
      (element) => typeof element.type === 'function' && 'stats' in element.props,
    )

    assert.equal(statsPanel, null)
  })

  test('toggle 按钮应反映 storage backends 数量', () => {
    currentBackends = [
      ...baseBackends.map((item) => ({ ...item })),
      {
        id: 'storage-002',
        name: 's3-backup',
        type: 's3',
        bucket: 'backup-bucket',
        region: 'ap-east-1',
        isDefault: false,
        enabled: true,
        createdAt: '2026-06-30T00:00:00.000Z',
      },
    ]

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const backendsBtn = findElement(tree, (element) => element.props['data-testid'] === 'mm-toggle-backends')

    assert.ok(backendsBtn)
    assert.equal(getText(backendsBtn.props.children), '存储后端 (2)')
  })

  test('compact variant 应透传 data-variant 且缩略图走紧凑高度', () => {
    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({ variant: 'app' })
    const assetCardElement = findElement(
      tree,
      (element) => typeof element.type === 'function' && element.props.asset?.id === 'asset-001',
    )

    assert.equal(tree.props['data-variant'], 'app')
    assert.ok(assetCardElement)

    const assetTree = (assetCardElement.type as (props: Record<string, unknown>) => ReactElement)(assetCardElement.props)
    const thumb = findElement(assetTree, (element) => element.props['data-testid'] === 'mm-asset-thumb-asset-001')

    assert.ok(thumb)
    assert.equal(thumb.props.style.height, 80)
  })

  test('顶部按钮应切换 upload/backends 面板状态', () => {
    const uploadSetterCalls: Array<unknown> = []
    const backendSetterCalls: Array<unknown> = []
    stateSetters[0] = (value) => { uploadSetterCalls.push(value) }
    stateSetters[1] = (value) => { backendSetterCalls.push(value) }

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const uploadBtn = findElement(tree, (element) => element.props['data-testid'] === 'mm-upload-btn')
    const backendsBtn = findElement(tree, (element) => element.props['data-testid'] === 'mm-toggle-backends')

    assert.ok(uploadBtn)
    assert.ok(backendsBtn)
    uploadBtn.props.onClick()
    backendsBtn.props.onClick()

    assert.equal(typeof uploadSetterCalls[0], 'function')
    assert.equal(typeof backendSetterCalls[0], 'function')
    assert.equal((uploadSetterCalls[0] as (v: boolean) => boolean)(false), true)
    assert.equal((backendSetterCalls[0] as (v: boolean) => boolean)(false), true)
  })

  test('上传面板提交应触发 upload mutation 并关闭面板', () => {
    currentState.showUpload = true
    const uploadSetterCalls: Array<unknown> = []
    stateSetters[0] = (value) => { uploadSetterCalls.push(value) }

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const uploadPanel = findElement(tree, (element) => typeof element.type === 'function' && element.props.onClose)
    assert.ok(uploadPanel)

    const uploadTree = (uploadPanel.type as (props: Record<string, unknown>) => ReactElement)(uploadPanel.props)
    const submitBtn = findElement(uploadTree, (element) => element.props['data-testid'] === 'mm-upload-submit')

    assert.ok(submitBtn)
    submitBtn.props.onClick()

    assert.deepEqual(uploadCalls, [
      {
        file: { name: 'new-asset.jpg', size: 1024 * 1024, type: 'image/jpeg' },
        tags: ['upload', 'test'],
      },
    ])
    assert.deepEqual(uploadSetterCalls, [false])
  })

  test('上传面板输入变化和取消按钮应触发对应 setter/onClose', () => {
    currentState.showUpload = true
    const uploadSetterCalls: Array<unknown> = []
    const nameSetterCalls: Array<unknown> = []
    const tagsSetterCalls: Array<unknown> = []
    stateSetters[0] = (value) => { uploadSetterCalls.push(value) }
    stateSetters[2] = (value) => { nameSetterCalls.push(value) }
    stateSetters[3] = (value) => { tagsSetterCalls.push(value) }

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const uploadPanel = findElement(tree, (element) => typeof element.type === 'function' && element.props.onClose)
    assert.ok(uploadPanel)

    const uploadTree = (uploadPanel.type as (props: Record<string, unknown>) => ReactElement)(uploadPanel.props)
    const nameInput = findElement(uploadTree, (element) => element.props['data-testid'] === 'mm-upload-name')
    const tagsInput = findElement(uploadTree, (element) => element.props['data-testid'] === 'mm-upload-tags')
    const cancelBtn = findElement(uploadTree, (element) => element.props['data-testid'] === 'mm-upload-cancel')

    assert.ok(nameInput)
    assert.ok(tagsInput)
    assert.ok(cancelBtn)

    nameInput.props.onChange({ target: { value: 'poster-final.png' } })
    tagsInput.props.onChange({ target: { value: 'poster, launch, hero' } })
    cancelBtn.props.onClick()

    assert.deepEqual(nameSetterCalls, ['poster-final.png'])
    assert.deepEqual(tagsSetterCalls, ['poster, launch, hero'])
    assert.deepEqual(uploadSetterCalls, [false])
  })

  test('展开 storage backends 时应渲染默认标记和 CDN 信息', () => {
    currentState.showBackends = true

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const backendsPanel = findElement(
      tree,
      (element) => typeof element.type === 'function' && Array.isArray(element.props.backends),
    )

    assert.ok(backendsPanel)
    const backendsTree = (backendsPanel.type as (props: Record<string, unknown>) => ReactElement)(backendsPanel.props)
    const defaultTag = findElement(backendsTree, (element) => element.props['data-testid'] === 'mm-backend-default-storage-001')
    const backendCard = findElement(backendsTree, (element) => element.props['data-testid'] === 'mm-backend-storage-001')
    const contentText = JSON.stringify(backendsTree)

    assert.ok(defaultTag)
    assert.ok(backendCard)
    assert.equal(backendCard.props['data-default'], true)
    assert.ok(contentText.includes('media.shenjiying88.com'))
  })

  test('资产卡片点击签名和删除按钮应触发对应 mutation', () => {
    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({
      onAssetSelect: (asset: { id: string }) => selectedAssets.push(asset.id),
    })
    const assetCardElement = findElement(
      tree,
      (element) => typeof element.type === 'function' && element.props.asset?.id === 'asset-001',
    )

    assert.ok(assetCardElement)
    const assetTree = (assetCardElement.type as (props: Record<string, unknown>) => ReactElement)(assetCardElement.props)
    const assetRoot = findElement(assetTree, (element) => element.props['data-testid'] === 'mm-asset-asset-001')
    const signedBtn = findElement(assetTree, (element) => element.props['data-testid'] === 'mm-asset-signed-asset-001')
    const deleteBtn = findElement(assetTree, (element) => element.props['data-testid'] === 'mm-asset-delete-asset-001')
    const event = { stopPropagationCalled: false, stopPropagation() { this.stopPropagationCalled = true } }

    assert.ok(assetRoot)
    assert.ok(signedBtn)
    assert.ok(deleteBtn)

    assetRoot.props.onClick()
    signedBtn.props.onClick(event)
    deleteBtn.props.onClick(event)

    assert.deepEqual(selectedAssets, ['asset-001'])
    assert.deepEqual(signedUrlCalls, [{ assetId: 'asset-001' }])
    assert.deepEqual(deleteCalls, ['asset-001'])
    assert.equal(event.stopPropagationCalled, true)
  })

  test('删除确认取消时不应触发 delete mutation', () => {
    confirmResult = false

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const assetCardElement = findElement(
      tree,
      (element) => typeof element.type === 'function' && element.props.asset?.id === 'asset-001',
    )

    assert.ok(assetCardElement)
    const assetTree = (assetCardElement.type as (props: Record<string, unknown>) => ReactElement)(assetCardElement.props)
    const deleteBtn = findElement(assetTree, (element) => element.props['data-testid'] === 'mm-asset-delete-asset-001')

    assert.ok(deleteBtn)
    deleteBtn.props.onClick({ stopPropagation() {} })

    assert.deepEqual(deleteCalls, [])
  })

  test('processing 资产应渲染进度分支并保留状态属性', () => {
    currentAssets = [
      {
        ...baseAsset,
        id: 'asset-processing',
        status: 'processing',
        processingProgress: 0.65,
      },
    ]

    const { MultimediaDashboard } = loadDashboard()
    const tree = MultimediaDashboard({})
    const assetCardElement = findElement(
      tree,
      (element) => typeof element.type === 'function' && element.props.asset?.id === 'asset-processing',
    )

    assert.ok(assetCardElement)
    const assetTree = (assetCardElement.type as (props: Record<string, unknown>) => ReactElement)(assetCardElement.props)
    const assetRoot = findElement(assetTree, (element) => element.props['data-testid'] === 'mm-asset-asset-processing')
    const progressBlock = findElement(assetTree, (element) => element.props['data-testid'] === 'mm-asset-progress-asset-processing')

    assert.ok(assetRoot)
    assert.ok(progressBlock)
    assert.equal(assetRoot.props['data-status'], 'processing')
  })
})
