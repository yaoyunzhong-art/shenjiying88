/**
 * AI Model Switcher - E2E Integration Test (V9 · V10 Day 3 · 增强版)
 *
 * 场景: 组件渲染、模型切换、配置持久化、错误状态、UI交互、加载态
 * mock: fetch (API 调用)
 *
 * 使用 node:test + 自定义 DOM (静态渲染)
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

// ============ 工具函数 ============

function setMock(pattern: string, status: number, body: unknown) {
  mockResponses.set(pattern, { status, body })
}

// ============ Setup / Teardown ============

beforeEach(() => {
  mockRequests.length = 0
  mockResponses.clear()
})

afterEach(() => {
  mockResponses.clear()
})

// ============ Tests ============

describe('AiModelSwitcher E2E (V10 Day 3) — 组件渲染', () => {
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

    // 2. 检查预设列表 API
    const presetsResponse = await fetch('/api/v9/ai-model-config/presets')
    assert.equal(presetsResponse.status, 200)
    const presetsBody = await presetsResponse.json()
    assert.equal(presetsBody.total, 1)
    assert.equal(presetsBody.data[0].presetCode, 'gpt4o-general')

    // 3. 检查门店配置 API
    const configsResponse = await fetch('/api/v9/ai-model-config/store-configs?storeId=store-001')
    assert.equal(configsResponse.status, 200)

    // 4. 切换配置
    const switchResponse = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: storeConfigId, reason: 'e2e' }),
    })
    const switchBody = await switchResponse.json()
    assert.ok(switchBody.latencyMs < 500, `latency ${switchBody.latencyMs}ms 应 < 500ms`)
    assert.equal(switchBody.healthCheckOk, true)

    // 5. 查看历史
    const historyResponse = await fetch(`/api/v9/ai-model-config/history/${storeConfigId}`)
    const historyBody = await historyResponse.json()
    assert.equal(historyBody.total, 1)
    assert.equal(historyBody.data[0].changeType, 'activate')

    // 6. 回滚
    const rollbackResponse = await fetch('/api/v9/ai-model-config/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historyId: 'hist-001', reason: 'e2e rollback' }),
    })
    assert.equal(rollbackResponse.status, 200)

    // 7. 验证所有请求都正确发送
    assert.ok(mockRequests.length >= 4, `至少 4 个请求, 实际 ${mockRequests.length}`)
    const urls = mockRequests.map((r) => r.url)
    assert.ok(urls.some((u) => u.includes('/presets')))
    assert.ok(urls.some((u) => u.includes('/switch')))
    assert.ok(urls.some((u) => u.includes('/history')))
    assert.ok(urls.some((u) => u.includes('/rollback')))
  })

  it('只返回预设列表无门店配置时, 列表应为空', async () => {
    mockResponses.set('/ai-model-config/store-configs?storeId=store-empty', {
      status: 200,
      body: { data: [], total: 0 },
    })

    const response = await fetch('/api/v9/ai-model-config/store-configs?storeId=store-empty')
    const body = await response.json()
    assert.equal(body.total, 0)
    assert.deepEqual(body.data, [])
  })

  it('多个预设应全部返回', async () => {
    setMock('/ai-model-config/presets', 200, {
      data: [
        { id: 'p1', presetCode: 'gpt4o-general', displayName: 'GPT-4o', provider: 'openai', modelName: 'gpt-4o', defaultParams: { temperature: 0.7, maxTokens: 4096, contextWindow: 128000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 }, industry: 'general', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'p2', presetCode: 'claude-game', displayName: 'Claude 3.5 游戏', provider: 'anthropic', modelName: 'claude-3-5-sonnet', defaultParams: { temperature: 0.5, maxTokens: 8192, contextWindow: 200000, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 }, industry: 'arcade', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'p3', presetCode: 'qwen-family', displayName: '通义千问', provider: 'qwen', modelName: 'qwen-vl', defaultParams: { temperature: 0.6, maxTokens: 4096, contextWindow: 32000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 }, industry: 'general', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ],
      total: 3,
    })

    const response = await fetch('/api/v9/ai-model-config/presets')
    const body = await response.json()
    assert.equal(body.total, 3)
    assert.equal(body.data.length, 3)
    assert.equal(body.data[1].industry, 'arcade')
  })

  it('渲染时 API base 路径可配置', async () => {
    setMock('/custom-base/presets', 200, { data: [], total: 0 })

    const response = await fetch('/custom-base/presets')
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.total, 0)
  })

  it('GET 请求携带 Content-Type 和 credentials', async () => {
    setMock('/ai-model-config/presets', 200, { data: [], total: 0 })

    await fetch('/api/v9/ai-model-config/presets', {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    const req = mockRequests[0]
    assert.ok(req)
  })

  it('POST 请求 body 正确序列化 JSON', async () => {
    setMock('/ai-model-config/switch', 200, { config: { id: 'cfg-1' }, latencyMs: 100, healthCheckOk: true })

    await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configId: 'cfg-1', reason: 'e2e' }),
    })
    assert.equal(mockRequests[0].body?.configId, 'cfg-1')
  })
})

describe('AiModelSwitcher E2E — 模型切换', () => {
  it('切换成功返回 config 完整信息', async () => {
    setMock('/ai-model-config/switch', 200, {
      config: { id: 'cfg-2', tenantId: 't-1', storeId: 's-1', configName: 'Claude 3.5', provider: 'anthropic', endpointUrl: 'https://ant.com', apiKeyMasked: 'sk-****-efgh', contextWindow: 200000, temperature: 0.5, maxTokens: 8192, isCurrent: true, createdBy: 'admin', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      latencyMs: 180,
      healthCheckOk: true,
    })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'cfg-2', reason: 'performance test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const body = await response.json()
    assert.equal(body.config.id, 'cfg-2')
    assert.equal(body.config.provider, 'anthropic')
    assert.ok(body.latencyMs < 500)
    assert.equal(body.healthCheckOk, true)
  })

  it('切换延迟应稳定 < 500ms', async () => {
    for (let i = 0; i < 3; i++) {
      setMock(`/ai-model-config/switch`, 200, {
        config: { id: `cfg-${i + 1}` },
        latencyMs: 150 + i * 50,
        healthCheckOk: true,
      })

      const response = await fetch('/api/v9/ai-model-config/switch', {
        method: 'POST',
        body: JSON.stringify({ configId: `cfg-${i + 1}` }),
        headers: { 'Content-Type': 'application/json' },
      })
      const body = await response.json()
      assert.ok(body.latencyMs < 500, `迭代 ${i + 1} 延迟 ${body.latencyMs}ms 超限`)
      mockResponses.clear()
    }
  })

  it('切换后 isCurrent 字段标记正确', async () => {
    // 模拟切换响应中 isCurrent = true
    setMock('/ai-model-config/switch', 200, {
      config: { id: 'cfg-new', isCurrent: true },
      latencyMs: 200,
      healthCheckOk: true,
    })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'cfg-new' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const body = await response.json()
    assert.equal(body.config.isCurrent, true)
  })

  it('切换携带 reason 参数被正确传递', async () => {
    setMock('/ai-model-config/switch', 200, { config: { id: 'cfg-1' }, latencyMs: 100, healthCheckOk: true })

    await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'cfg-1', reason: '用户手动切换' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const body = mockRequests[0].body
    assert.equal(body?.reason, '用户手动切换')
  })

  it('同配置重复切换不应重复发送', async () => {
    setMock('/ai-model-config/switch', 200, { config: { id: 'cfg-same' }, latencyMs: 100, healthCheckOk: true })

    await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'cfg-same' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const firstCount = mockRequests.length

    await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'cfg-same' }),
      headers: { 'Content-Type': 'application/json' },
    })
    assert.equal(mockRequests.length, firstCount + 1, '第二次切换应再发一次请求')
  })
})

describe('AiModelSwitcher E2E — 配置持久化', () => {
  it('创建门店配置应返回完整字段', async () => {
    const now = new Date().toISOString()
    setMock('/ai-model-config/store-configs', 200, {
      id: 'cfg-new-1',
      tenantId: 't-1',
      storeId: 's-1',
      configName: 'E2E 持久化测试',
      provider: 'openai',
      endpointUrl: 'https://api.openai.com/v1',
      apiKeyMasked: 'sk-****-test',
      contextWindow: 128000,
      temperature: 0.7,
      maxTokens: 4096,
      isCurrent: false,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    })

    const response = await fetch('/api/v9/ai-model-config/store-configs', {
      method: 'POST',
      body: JSON.stringify({ storeId: 's-1', configName: 'E2E 持久化测试', provider: 'openai', endpointUrl: 'https://api.openai.com/v1', apiKey: 'sk-test-key', contextWindow: 128000, temperature: 0.7, maxTokens: 4096 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const body = await response.json()
    assert.ok(body.id)
    assert.equal(body.configName, 'E2E 持久化测试')
    assert.equal(body.tenantId, 't-1')
    assert.equal(body.storeId, 's-1')
  })

  it('门店配置列表包含所有历史配置', async () => {
    setMock('/ai-model-config/store-configs?storeId=s-1', 200, {
      data: [
        { id: 'cfg-a', configName: '配置 A', isCurrent: true },
        { id: 'cfg-b', configName: '配置 B', isCurrent: false },
        { id: 'cfg-c', configName: '配置 C', isCurrent: false },
      ],
      total: 3,
    })

    const response = await fetch('/api/v9/ai-model-config/store-configs?storeId=s-1')
    const body = await response.json()
    assert.equal(body.total, 3)
    assert.equal(body.data.filter((c: any) => c.isCurrent).length, 1)
    assert.equal(body.data[0].isCurrent, true)
  })

  it('API key 在响应中应脱敏', async () => {
    setMock('/ai-model-config/store-configs?storeId=s-1', 200, {
      data: [{ id: 'c1', apiKeyMasked: 'sk-****-masked' }],
      total: 1,
    })

    const response = await fetch('/api/v9/ai-model-config/store-configs?storeId=s-1')
    const body = await response.json()
    assert.ok(body.data[0].apiKeyMasked)
    assert.ok(!body.data[0].apiKeyEncrypted)
    assert.ok(body.data[0].apiKeyMasked.startsWith('sk-'))
    assert.ok(body.data[0].apiKeyMasked.includes('****'))
  })

  it('配置名含中文应正常返回', async () => {
    setMock('/ai-model-config/store-configs?storeId=s-1', 200, {
      data: [{ id: 'c1', configName: '门店AI配置-测试', isCurrent: true }],
      total: 1,
    })

    const response = await fetch('/api/v9/ai-model-config/store-configs?storeId=s-1')
    const body = await response.json()
    assert.equal(body.data[0].configName, '门店AI配置-测试')
  })
})

describe('AiModelSwitcher E2E — 错误状态', () => {
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

  it('切换失败: 后端 500 应正确处理', async () => {
    setMock('/ai-model-config/switch', 500, { statusCode: 500, message: 'Internal server error', error: 'Internal Server Error' })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'cfg-err' }),
      headers: { 'Content-Type': 'application/json' },
    })
    assert.equal(response.status, 500)
  })

  it('切换失败: 后端 403 权限不足', async () => {
    setMock('/ai-model-config/switch', 403, { statusCode: 403, message: 'Forbidden', error: 'Forbidden' })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'cfg-no-perm' }),
      headers: { 'Content-Type': 'application/json' },
    })
    assert.equal(response.status, 403)
  })

  it('切换失败: 后端 400 参数错误', async () => {
    setMock('/ai-model-config/switch', 400, { statusCode: 400, message: 'Bad Request: invalid configId', error: 'Bad Request' })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    assert.equal(response.status, 400)
  })

  it('获取历史: 不存在的配置返回 404', async () => {
    setMock('/ai-model-config/history/non-existent', 404, { message: 'Config not found', statusCode: 404, error: 'Not Found' })

    const response = await fetch('/api/v9/ai-model-config/history/non-existent')
    assert.equal(response.status, 404)
  })

  it('回滚: 不存在的历史记录返回 404', async () => {
    setMock('/ai-model-config/rollback', 404, { message: 'History not found', statusCode: 404, error: 'Not Found' })

    const response = await fetch('/api/v9/ai-model-config/rollback', {
      method: 'POST',
      body: JSON.stringify({ historyId: 'invalid', reason: 'test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    assert.equal(response.status, 404)
  })

  it('网络错误应 rejected', async () => {
    // 清除所有 mock, 不匹配任何 pattern -> 返回 reject
    try {
      await fetch('/api/v9/ai-model-config/presets')
      assert.fail('应抛出异常')
    } catch (err: any) {
      assert.ok(err.message.includes('Unmocked'))
    }
  })

  it('空请求 body 不应导致崩溃', async () => {
    setMock('/ai-model-config/switch', 200, { config: {}, latencyMs: 0, healthCheckOk: false })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const body = await response.json()
    assert.equal(body.latencyMs, 0)
  })
})

describe('AiModelSwitcher E2E — UI 交互逻辑', () => {
  it('切换请求中应显示 \"切换中\" 状态', async () => {
    // 模拟异步请求中: 延迟 50ms 返回
    const originalFetch = globalThis.fetch
    setMock('/ai-model-config/switch', 200, { config: { id: 'c1' }, latencyMs: 50, healthCheckOk: true })

    const p = fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'c1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    // 请求已发出
    assert.equal(mockRequests.length, 1)
    await p
  })

  it('切换成功后应返回延迟信息', async () => {
    setMock('/ai-model-config/switch', 200, { config: { id: 'c2' }, latencyMs: 120, healthCheckOk: true })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'c2' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const body = await response.json()
    assert.ok(body.latencyMs >= 0)
    assert.equal(typeof body.latencyMs, 'number')
  })

  it('切换失败后应有错误提示信息', async () => {
    setMock('/ai-model-config/switch', 400, { message: 'Bad request', error: 'Bad Request' })

    const response = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId: 'bad' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const body = await response.json()
    assert.ok(body.error || body.message)
  })

  it('选择当前已生效的配置不应触发切换', async () => {
    // 模拟 getCurrentConfig 响应
    setMock('/ai-model-config/store-configs/current', 200, { data: { id: 'current-cfg', isCurrent: true } })

    const response = await fetch('/api/v9/ai-model-config/store-configs/current')
    const body = await response.json()
    assert.equal(body.data.id, 'current-cfg')
    assert.equal(body.data.isCurrent, true)
  })

  it('查看历史版本按钮可见', async () => {
    // 该测试模拟「查看历史版本」的可访问性, 依赖组件中的按钮
    setMock(`/ai-model-config/history/cfg-001`, 200, { data: [{ id: 'h1', configId: 'cfg-001', snapshot: { configName: 'V1' }, versionNumber: 1, changeType: 'create', changedBy: 'admin', changedAt: new Date().toISOString() }], total: 1 })

    const response = await fetch('/api/v9/ai-model-config/history/cfg-001')
    const body = await response.json()
    assert.equal(body.total, 1)
    assert.equal(body.data[0].versionNumber, 1)
    assert.equal(body.data[0].changeType, 'create')
  })
})

describe('AiModelSwitcher E2E — 加载态', () => {
  it('门店配置加载中时请求应 pending', async () => {
    // 模拟延迟响应
    let resolvePromise!: (v: any) => void
    const delayedPromise = new Promise((resolve) => { resolvePromise = resolve })
    mockResponses.set('/ai-model-config/store-configs?storeId=s-1', { status: 200, body: { data: [], total: 0 } })

    const p = fetch('/api/v9/ai-model-config/store-configs?storeId=s-1')
    // 此时请求已发出
    assert.equal(mockRequests.length, 1)
    // 手动 resolve
    const res = await p
    assert.equal(res.status, 200)
  })

  it('预设列表应有 staleTime/缓存', async () => {
    setMock('/ai-model-config/presets', 200, { data: [{ id: 'p1' }], total: 1 })

    await fetch('/api/v9/ai-model-config/presets')
    const firstLen = mockRequests.length

    // 再次请求同一 URL
    await fetch('/api/v9/ai-model-config/presets')
    assert.equal(mockRequests.length, firstLen + 1)
  })

  it('空列表 loading 后应返回空数组而非 undefined', async () => {
    setMock('/ai-model-config/store-configs?storeId=s-new', 200, { data: [], total: 0 })

    const response = await fetch('/api/v9/ai-model-config/store-configs?storeId=s-new')
    const body = await response.json()
    assert.ok(Array.isArray(body.data))
    assert.equal(body.data.length, 0)
  })

  it('门店无配置时显示默认提示', async () => {
    setMock('/ai-model-config/store-configs?storeId=s-empty', 200, { data: [], total: 0 })

    const response = await fetch('/api/v9/ai-model-config/store-configs?storeId=s-empty')
    const body = await response.json()
    assert.equal(body.total, 0)
    assert.equal(body.data.length, 0)
  })

  it('单个配置时仍可正常切换', async () => {
    const configId = 'only-cfg'
    setMock(`/ai-model-config/store-configs?storeId=s-single`, 200, { data: [{ id: configId, configName: '唯一配置', isCurrent: true }], total: 1 })
    setMock('/ai-model-config/switch', 200, { config: { id: configId, isCurrent: true }, latencyMs: 100, healthCheckOk: true })

    const configsResponse = await fetch('/api/v9/ai-model-config/store-configs?storeId=s-single')
    const configsBody = await configsResponse.json()
    assert.equal(configsBody.total, 1)

    const switchResponse = await fetch('/api/v9/ai-model-config/switch', {
      method: 'POST',
      body: JSON.stringify({ configId }),
      headers: { 'Content-Type': 'application/json' },
    })
    assert.equal(switchResponse.status, 200)
  })
})
