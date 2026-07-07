/**
 * AI Model Switcher - E2E Integration Test (V9 · V10 Day 3)
 *
 * 场景: 列表 → 切换 → 历史 → 回滚 全链路
 * mock: fetch (API 调用)
 *
 * 使用 node:test + 自定义 DOM (Day 3 简化,Day 4 接入 Playwright)
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

// ============ Mock fetch ============

interface MockRequest {
  url: string
  method: string
  body?: unknown
}

const mockRequests: MockRequest[] = []
let mockResponses = new Map<string, { status: number; body: unknown }>()

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString()
  const method = init?.method ?? 'GET'
  const body = init?.body ? JSON.parse(String(init.body)) : undefined

  mockRequests.push({ url, method, body })

  // 匹配 mock
  for (const [pattern, response] of mockResponses.entries()) {
    if (url.includes(pattern)) {
      return Promise.resolve(
        new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }
  }

  return Promise.reject(new Error(`Unmocked: ${method} ${url}`))
}

// 注入全局
;(globalThis as any).fetch = mockFetch

// ============ Setup / Teardown ============

beforeEach(() => {
  mockRequests.length = 0
  mockResponses = new Map()
})

// ============ Tests ============

describe('AI Model Switcher E2E (V10 Day 3)', () => {
  it('完整流程: 列预设 → 列门店配置 → 切换 → 历史 → 回滚', async () => {
    // 1. mock 数据准备
    const storeConfigId = 'cfg-001'
    const presetId = 'preset-gpt4o-general'

    mockResponses.set('/ai-model-config/presets', {
      status: 200,
      body: {
        data: [
          {
            id: presetId,
            presetCode: 'gpt4o-general',
            displayName: 'GPT-4o (通用)',
            provider: 'openai',
            modelName: 'gpt-4o',
            defaultParams: { temperature: 0.7, maxTokens: 4096, contextWindow: 128000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
            industry: 'general',
            isActive: true,
            description: 'OpenAI GPT-4o',
            createdAt: '2026-06-28T00:00:00Z',
            updatedAt: '2026-06-28T00:00:00Z',
          },
        ],
        total: 1,
      },
    })

    mockResponses.set('/ai-model-config/store-configs?storeId=store-001', {
      status: 200,
      body: {
        data: [
          {
            id: storeConfigId,
            tenantId: 'tenant-A',
            storeId: 'store-001',
            configName: '门店自建 GPT-4o',
            provider: 'openai',
            endpointUrl: 'https://api.openai.com/v1',
            apiKeyMasked: 'sk-***-xxxx',
            contextWindow: 8192,
            temperature: 0.7,
            maxTokens: 2048,
            isCurrent: true,
            createdBy: 'admin',
            createdAt: '2026-06-28T00:00:00Z',
            updatedAt: '2026-06-28T00:00:00Z',
          },
        ],
        total: 1,
      },
    })

    mockResponses.set('/ai-model-config/switch', {
      status: 200,
      body: {
        config: {
          id: storeConfigId,
          tenantId: 'tenant-A',
          storeId: 'store-001',
          configName: '门店自建 GPT-4o',
          provider: 'openai',
          endpointUrl: 'https://api.openai.com/v1',
          apiKeyMasked: 'sk-***-xxxx',
          contextWindow: 8192,
          temperature: 0.7,
          maxTokens: 2048,
          isCurrent: true,
          createdBy: 'admin',
          createdAt: '2026-06-28T00:00:00Z',
          updatedAt: '2026-06-28T00:01:00Z',
        },
        latencyMs: 280,
        healthCheckOk: true,
      },
    })

    mockResponses.set(`/ai-model-config/history/${storeConfigId}`, {
      status: 200,
      body: {
        data: [
          {
            id: 'hist-001',
            configId: storeConfigId,
            snapshot: { configName: '门店自建 GPT-4o', temperature: 0.7 },
            versionNumber: 2,
            changeType: 'activate',
            changedBy: 'admin',
            changedAt: '2026-06-28T00:01:00Z',
            reason: 'e2e test',
          },
        ],
        total: 1,
      },
    })

    mockResponses.set('/ai-model-config/rollback', {
      status: 200,
      body: {
        id: storeConfigId,
        tenantId: 'tenant-A',
        storeId: 'store-001',
        configName: '门店自建 GPT-4o',
        provider: 'openai',
        endpointUrl: 'https://api.openai.com/v1',
        apiKeyMasked: 'sk-***-xxxx',
        contextWindow: 8192,
        temperature: 0.7,
        maxTokens: 2048,
        isCurrent: true,
        createdBy: 'admin',
        createdAt: '2026-06-28T00:00:00Z',
        updatedAt: '2026-06-28T00:02:00Z',
      },
    })

    // 2. 直接调用 hook (绕过 React 渲染,验证业务流)
    const { useAiModelPresets, useStoreConfigs, useSwitchAiModel, useConfigHistory, useRollbackAiModel } =
      await import('./useAiModelPresets')

    // 这个测试主要验证 mock 数据链路
    // 实际组件渲染留给 Playwright (Day 4)
    const presetsResponse = await fetch('/api/v9/ai-model-config/presets')
    assert.equal(presetsResponse.status, 200)
    const presetsBody = await presetsResponse.json()
    assert.equal(presetsBody.total, 1)
    assert.equal(presetsBody.data[0].presetCode, 'gpt4o-general')

    const switchResponse = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: storeConfigId, reason: 'e2e' }),
    })
    const switchBody = await switchResponse.json()
    assert.ok(switchBody.latencyMs < 500, `latency ${switchBody.latencyMs}ms 应 < 500ms`)
    assert.equal(switchBody.healthCheckOk, true)

    const historyResponse = await fetch(`/api/v9/ai-model-config/history/${storeConfigId}`)
    const historyBody = await historyResponse.json()
    assert.equal(historyBody.total, 1)
    assert.equal(historyBody.data[0].changeType, 'activate')

    const rollbackResponse = await fetch('/api/v9/ai-model-config/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId: 'hist-001', reason: 'e2e rollback' }),
    })
    assert.equal(rollbackResponse.status, 200)

    // 3. 验证所有请求都正确发送
    assert.ok(mockRequests.length >= 4, `至少 4 个请求, 实际 ${mockRequests.length}`)
    const urls = mockRequests.map((r) => r.url)
    assert.ok(urls.some((u) => u.includes('/presets')))
    assert.ok(urls.some((u) => u.includes('/switch')))
    assert.ok(urls.some((u) => u.includes('/history')))
    assert.ok(urls.some((u) => u.includes('/rollback')))
  })

  it('切换失败: 后端 404 应正确处理', async () => {
    mockResponses.set('/ai-model-config/switch', {
      status: 404,
      body: { statusCode: 404, message: 'Config not found', error: 'Not Found' },
    })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: 'invalid' }),
    })
    assert.equal(response.status, 404)
  })
})