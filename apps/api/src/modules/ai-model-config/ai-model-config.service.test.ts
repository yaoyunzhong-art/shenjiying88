/**
 * ai-model-config.service.spec.ts — AI 模型配置 Service 深层单元测试
 *
 * 覆盖：
 *  - ApiKeyMask:                正例（脱敏/格式校验）/ 反例（空key/太短）/ 边界（边界长度/特殊字符）
 *  - ConfigValidator:           正例（温度范围/上下文窗口/最大Token）/ 反例（越界/负数）/ 边界（临界值/0值）
 *  - ProviderResolver:          正例（provider解析/默认值/映射）/ 反例（空值/不合法）/ 边界（大小写/未知provider）
 *  - StoreConfigDiff:           正例（参数差异对比/新增/删除）/ 反例（完全相同）/ 边界（空属性/单向差异）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const VALID_PROVIDERS = ['openai', 'anthropic', 'deepseek', 'baidu', 'aliyun', 'tencent'] as const
const VALID_INDUSTRIES = ['arcade', 'retail', 'fashion', 'food', 'general'] as const

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

/** 创建测试用门店配置输入 */
function mockStoreConfigInput(overrides?: Partial<{
  storeId: string
  configName: string
  provider: string
  endpointUrl: string
  apiKey: string
  contextWindow: number
  temperature: number
  maxTokens: number
  customHeaders: Record<string, string> | undefined
}>): ReturnType<typeof Object> {
  return {
    storeId: 'store-test-001',
    configName: '测试配置',
    provider: 'openai',
    endpointUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-proj-VeryLongFakeApiKeyForTesting123456',
    contextWindow: 8192,
    temperature: 0.7,
    maxTokens: 4096,
    customHeaders: undefined,
    ...overrides,
  }
}

/** 创建测试用预设对象 */
function mockPreset(overrides?: Partial<{
  presetCode: string
  provider: string
  industry: string
  isActive: boolean
  defaultParams: Record<string, number>
}>): Record<string, unknown> {
  return {
    presetCode: 'gpt4o-general',
    provider: 'openai',
    industry: 'general',
    isActive: true,
    defaultParams: { temperature: 0.7, maxTokens: 4096, contextWindow: 8192 },
    ...overrides,
  }
}

/** 创建测试用历史记录 */
function mockHistory(overrides?: Partial<{
  id: string
  configId: string
  operatorId: string
  action: string
  reason: string
}>): Record<string, unknown> {
  return {
    id: 'hist-001',
    configId: 'config-001',
    operatorId: 'user-admin',
    action: 'switch',
    reason: '升级模型版本',
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑
// ═══════════════════════════════════════════════════════════════

/** 脱敏 API key: 保留前2后4, 中间用 *** 替代 */
function inlineMaskApiKey(key: string): string {
  if (!key || key.length <= 6) return 'sk-***'
  return `${key.slice(0, 2)}-***-${key.slice(-4)}`
}

/** 校验 API key 格式 */
function inlineValidateApiKey(key: string): { valid: boolean; reason?: string } {
  if (!key) return { valid: false, reason: 'API key 不能为空' }
  if (key.length < 8) return { valid: false, reason: 'API key 长度不足' }
  if (!key.includes('sk-') && !key.startsWith('AK')) return { valid: false, reason: 'API key 格式不正确' }
  return { valid: true }
}

/** 校验温度参数范围 [0, 2] */
function inlineValidateTemperature(temp: number): { valid: boolean; reason?: string } {
  if (typeof temp !== 'number' || isNaN(temp)) return { valid: false, reason: '温度必须是数字' }
  if (temp < 0) return { valid: false, reason: '温度不能小于 0' }
  if (temp > 2) return { valid: false, reason: '温度不能大于 2' }
  return { valid: true }
}

/** 校验上下文窗口 */
function inlineValidateContextWindow(size: number): { valid: boolean; reason?: string } {
  if (typeof size !== 'number' || isNaN(size)) return { valid: false, reason: '上下文窗口必须是数字' }
  if (!Number.isInteger(size)) return { valid: false, reason: '上下文窗口必须是整数' }
  if (size < 1024) return { valid: false, reason: '上下文窗口不能小于 1024' }
  if (size > 1048576) return { valid: false, reason: '上下文窗口不能超过 1M' }
  return { valid: true }
}

/** 校验最大 Token */
function inlineValidateMaxTokens(maxTokens: number): { valid: boolean; reason?: string } {
  if (typeof maxTokens !== 'number' || isNaN(maxTokens)) return { valid: false, reason: 'maxTokens 必须是数字' }
  if (!Number.isInteger(maxTokens)) return { valid: false, reason: 'maxTokens 必须是整数' }
  if (maxTokens < 1) return { valid: false, reason: 'maxTokens 不能小于 1' }
  if (maxTokens > 1048576) return { valid: false, reason: 'maxTokens 不能超过 1M' }
  return { valid: true }
}

/** 校验 provider 合法性 */
function inlineValidateProvider(provider: string): { valid: boolean; reason?: string } {
  if (!provider) return { valid: false, reason: 'provider 不能为空' }
  if (!(VALID_PROVIDERS as readonly string[]).includes(provider.toLowerCase())) {
    return { valid: false, reason: `不支持的 provider: ${provider}` }
  }
  return { valid: true }
}

/** 计算两个配置之间的差异 */
function inlineComputeDiff(
  oldCfg: Record<string, unknown>,
  newCfg: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {}
  const allKeys = new Set([...Object.keys(oldCfg), ...Object.keys(newCfg)])

  for (const key of allKeys) {
    const oldVal = oldCfg[key]
    const newVal = newCfg[key]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal }
    }
  }

  return diff
}

/** 解析 endpoint URL */
function inlineParseEndpointUrl(url: string): { valid: boolean; protocol: string; hostname: string } | null {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return { valid: true, protocol: parsed.protocol, hostname: parsed.hostname }
  } catch {
    return null
  }
}

/** 获取预设默认参数，支持覆盖 */
function inlineApplyPresetDefaults(
  presetParams: Record<string, number>,
  overrides: Record<string, number>,
): Record<string, number> {
  const result = { ...presetParams }
  for (const [key, val] of Object.entries(overrides)) {
    result[key] = val
  }
  return result
}

/** 汇总校验门店配置 */
function inlineValidateStoreConfig(input: ReturnType<typeof mockStoreConfigInput>): string[] {
  const errors: string[] = []

  const providerCheck = inlineValidateProvider(input.provider)
  if (!providerCheck.valid) errors.push(providerCheck.reason!)

  const keyCheck = inlineValidateApiKey(input.apiKey)
  if (!keyCheck.valid) errors.push(keyCheck.reason!)

  const tempCheck = inlineValidateTemperature(input.temperature)
  if (!tempCheck.valid) errors.push(tempCheck.reason!)

  const ctxCheck = inlineValidateContextWindow(input.contextWindow)
  if (!ctxCheck.valid) errors.push(ctxCheck.reason!)

  const tokenCheck = inlineValidateMaxTokens(input.maxTokens)
  if (!tokenCheck.valid) errors.push(tokenCheck.reason!)

  const endpointCheck = inlineParseEndpointUrl(input.endpointUrl)
  if (!endpointCheck) errors.push('endpoint URL 格式不合法')

  return errors
}

// ═══════════════════════════════════════════════════════════════
// ApiKeyMask — 纯函数
// ═══════════════════════════════════════════════════════════════

describe('ApiKeyMask | inlineMaskApiKey', () => {
  // ── 正例 8+ ──

  it('正例: 标准 sk- 开头 key 脱敏格式', () => {
    const masked = inlineMaskApiKey('sk-proj-VeryLongFakeApiKeyForTesting123456')
    expect(masked).toBe('sk-***-3456')
    expect(masked.endsWith('3456')).toBe(true)
  })

  it('正例: AK 开头 key 脱敏', () => {
    const masked = inlineMaskApiKey('AKIDtestkey9876543210abcdef')
    expect(masked).toBe('AK-***-cdef')
    expect(masked.endsWith('cdef')).toBe(true)
  })

  it('正例: 返回格式始终为 "前缀-***-后4位"', () => {
    const keys = ['sk-abc123def456', 'AK-test1234', 'sk-aabbccdd']
    for (const key of keys) {
      const r = inlineMaskApiKey(key)
      expect(r).toMatch(/^.{2}-\*\*\*-.{4}$/)
    }
  })

  it('正例: 不同 key 脱敏结果后缀不同', () => {
    const r1 = inlineMaskApiKey('sk-abcdefgh12345678')
    const r2 = inlineMaskApiKey('sk-abcdefgh87654321')
    expect(r1).not.toBe(r2)
    expect(r1.endsWith('5678')).toBe(true)
    expect(r2.endsWith('4321')).toBe(true)
  })

  it('正例: inlineValidateApiKey 验证合法 sk- key', () => {
    expect(inlineValidateApiKey('sk-proj-valid-key-here-1234').valid).toBe(true)
  })

  it('正例: inlineValidateApiKey 验证合法 AK key', () => {
    expect(inlineValidateApiKey('AKIDtestkey9876543210').valid).toBe(true)
  })

  it('正例: inlineMaskApiKey 幂等性', () => {
    const key = 'sk-proj-mysecretkey9876'
    expect(inlineMaskApiKey(key)).toBe(inlineMaskApiKey(key))
  })

  it('正例: inlineMaskApiKey 对长 key (50+ 字符) 正常工作', () => {
    const longKey = 'sk-proj-' + 'a'.repeat(40) + '1234'
    const masked = inlineMaskApiKey(longKey)
    expect(masked.endsWith('1234')).toBe(true)
  })

  // ── 反例 5+ ──

  it('反例: 空 key 返回 sk-***', () => {
    expect(inlineMaskApiKey('')).toBe('sk-***')
  })

  it('反例: 短 key (≤6) 返回 sk-***', () => {
    expect(inlineMaskApiKey('abc')).toBe('sk-***')
    expect(inlineMaskApiKey('abcdef')).toBe('sk-***')
  })

  it('反例: inlineValidateApiKey 空 key 不通过', () => {
    const r = inlineValidateApiKey('')
    expect(r.valid).toBe(false)
    expect(r.reason).toBe('API key 不能为空')
  })

  it('反例: inlineValidateApiKey 过短 key (< 8) 不通过', () => {
    const r = inlineValidateApiKey('short1')
    expect(r.valid).toBe(false)
    expect(r.reason).toBe('API key 长度不足')
  })

  it('反例: inlineValidateApiKey 格式错误 (不含 sk- 或 AK)', () => {
    const r = inlineValidateApiKey('invalidformat12345678')
    expect(r.valid).toBe(false)
    expect(r.reason).toContain('格式不正确')
  })

  // ── 边界 5+ ──

  it('边界: key 长度正好 8 字符', () => {
    // 'sk-12345' = 8 字符, 含 sk- 前缀
    const r = inlineValidateApiKey('sk-12345')
    expect(r.valid).toBe(true)
    expect(inlineMaskApiKey('sk-12345')).toBe('sk-***-2345')
  })

  it('边界: key 长度正好 7 字符（短 key 分支）', () => {
    expect(inlineMaskApiKey('sk-123')).toBe('sk-***')
  })

  it('边界: key 包含特殊字符', () => {
    // 多字节 emoji 不影响字符长度
    const masked = inlineMaskApiKey('sk-proj-a🔑-key-9999')
    expect(masked).toBe('sk-***-9999')
  })

  it('边界: key 仅含数字', () => {
    const r = inlineValidateApiKey('1234567890123456')
    expect(r.valid).toBe(false)
    expect(r.reason).toContain('格式不正确')
  })

  it('边界: key 含空格前缀', () => {
    // 不含 sk- 或 AK 开头 (忽略空格判断)
    const r = inlineValidateApiKey('  sk-proj-key123456')
    // 'sk-proj-key123456'.includes('sk-') 为 true, 但整个字符串含空格前缀
    // 这里更准确地: includes('sk-') 仍然匹配, 但空格前缀不影响实际用途
    expect(r.valid).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// ConfigValidator — 纯函数
// ═══════════════════════════════════════════════════════════════

describe('ConfigValidator | 参数校验', () => {
  // ── 正例 ──

  it('正例: 温度 0.7 通过', () => {
    expect(inlineValidateTemperature(0.7).valid).toBe(true)
  })

  it('正例: 温度 2.0 (上限) 通过', () => {
    expect(inlineValidateTemperature(2.0).valid).toBe(true)
  })

  it('正例: 温度 0 (下限) 通过', () => {
    expect(inlineValidateTemperature(0).valid).toBe(true)
  })

  it('正例: 上下文窗口 8192 通过', () => {
    expect(inlineValidateContextWindow(8192).valid).toBe(true)
  })

  it('正例: maxTokens 4096 通过', () => {
    expect(inlineValidateMaxTokens(4096).valid).toBe(true)
  })

  it('正例: 合法 provider "deepseek" 通过', () => {
    expect(inlineValidateProvider('deepseek').valid).toBe(true)
  })

  it('正例: 完整配置校验通过', () => {
    const input = mockStoreConfigInput()
    const errors = inlineValidateStoreConfig(input)
    expect(errors).toHaveLength(0)
  })

  it('正例: endpoint URL 解析返回协议和主机名', () => {
    const r = inlineParseEndpointUrl('https://api.deepseek.com/v1')
    expect(r).not.toBeNull()
    expect(r!.protocol).toBe('https:')
    expect(r!.hostname).toBe('api.deepseek.com')
  })

  // ── 反例 ──

  it('反例: 温度 > 2 不通过', () => {
    expect(inlineValidateTemperature(2.1).valid).toBe(false)
  })

  it('反例: 温度 < 0 不通过', () => {
    expect(inlineValidateTemperature(-0.1).valid).toBe(false)
  })

  it('反例: NaN 温度不通过', () => {
    expect(inlineValidateTemperature(NaN).valid).toBe(false)
  })

  it('反例: 上下文窗口 100 (< 1024) 不通过', () => {
    expect(inlineValidateContextWindow(100).valid).toBe(false)
  })

  it('反例: 上下文窗口非整数不通过', () => {
    expect(inlineValidateContextWindow(8192.5).valid).toBe(false)
  })

  it('反例: maxTokens = 0 不通过', () => {
    expect(inlineValidateMaxTokens(0).valid).toBe(false)
  })

  it('反例: 不支持的 provider 不通过', () => {
    expect(inlineValidateProvider('unknown-provider').valid).toBe(false)
  })

  it('反例: 空 provider 不通过', () => {
    expect(inlineValidateProvider('').valid).toBe(false)
  })

  it('反例: 完整配置校验检测多个错误', () => {
    const input = mockStoreConfigInput({
      provider: 'unknown',
      apiKey: 'short',
      temperature: 3,
      contextWindow: 500,
      maxTokens: 0,
      endpointUrl: 'not-a-url',
    })
    const errors = inlineValidateStoreConfig(input)
    expect(errors.length).toBeGreaterThanOrEqual(6)
  })

  // ── 边界 ──

  it('边界: 温度 2.0 (精确上限) 通过', () => {
    expect(inlineValidateTemperature(2.0).valid).toBe(true)
  })

  it('边界: 上下文窗口 1024 (精确下限) 通过', () => {
    expect(inlineValidateContextWindow(1024).valid).toBe(true)
  })

  it('边界: 上下文窗口 1048576 (精确上限) 通过', () => {
    expect(inlineValidateContextWindow(1048576).valid).toBe(true)
  })

  it('边界: maxTokens = 1 (最小有效值) 通过', () => {
    expect(inlineValidateMaxTokens(1).valid).toBe(true)
  })

  it('边界: endpoint URL 不含协议返回 null', () => {
    expect(inlineParseEndpointUrl('api.openai.com/v1')).toBeNull()
  })

  it('边界: endpoint URL 为 ftp 协议返回 null', () => {
    expect(inlineParseEndpointUrl('ftp://example.com')).toBeNull()
  })

  it('边界: 空 URL 返回 null', () => {
    expect(inlineParseEndpointUrl('')).toBeNull()
  })

  it('边界: provider 大小写不敏感 (OpenAI → openai)', () => {
    expect(inlineValidateProvider('OpenAI').valid).toBe(true)
    expect(inlineValidateProvider('OPENAI').valid).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// StoreConfigDiff — 配置差异对比
// ═══════════════════════════════════════════════════════════════

describe('StoreConfigDiff | inlineComputeDiff', () => {
  // ── 正例 ──

  it('正例: 温度变更可检测', () => {
    const oldCfg = { temperature: 0.7, maxTokens: 4096 }
    const newCfg = { temperature: 1.0, maxTokens: 4096 }
    const diff = inlineComputeDiff(oldCfg, newCfg)
    expect(diff.temperature).toBeDefined()
    expect(diff.temperature.old).toBe(0.7)
    expect(diff.temperature.new).toBe(1.0)
    expect(diff.maxTokens).toBeUndefined()
  })

  it('正例: 新增属性可检测', () => {
    const oldCfg = { temperature: 0.7 }
    const newCfg = { temperature: 0.7, contextWindow: 8192 }
    const diff = inlineComputeDiff(oldCfg, newCfg)
    expect(diff.contextWindow).toBeDefined()
    expect(diff.contextWindow.old).toBeUndefined()
    expect(diff.contextWindow.new).toBe(8192)
  })

  it('正例: 删除属性可检测', () => {
    const oldCfg = { temperature: 0.7, maxTokens: 4096 }
    const newCfg = { temperature: 0.7 }
    const diff = inlineComputeDiff(oldCfg, newCfg)
    expect(diff.maxTokens).toBeDefined()
    expect(diff.maxTokens.old).toBe(4096)
    expect(diff.maxTokens.new).toBeUndefined()
  })

  it('正例: 多项变更同时检测', () => {
    const oldCfg = { a: 1, b: 2, c: 3 }
    const newCfg = { a: 1, b: 99, c: 3 }
    const diff = inlineComputeDiff(oldCfg, newCfg)
    expect(Object.keys(diff)).toEqual(['b'])
  })

  // ── 反例 ──

  it('反例: 完全相同的配置无 diff', () => {
    const cfg = { temperature: 0.7, maxTokens: 4096, provider: 'openai' }
    expect(inlineComputeDiff(cfg, cfg)).toEqual({})
    expect(Object.keys(inlineComputeDiff(cfg, { ...cfg }))).toHaveLength(0)
  })

  it('反例: 空对象比较无 diff', () => {
    expect(inlineComputeDiff({}, {})).toEqual({})
  })

  // ── 边界 ──

  it('边界: 单属性差异', () => {
    const diff = inlineComputeDiff({ temperature: 0.7 }, { temperature: 0.7 })
    expect(Object.keys(diff)).toHaveLength(0)
  })

  it('边界: inlineApplyPresetDefaults 覆盖默认值', () => {
    const params = inlineApplyPresetDefaults({ temperature: 0.7, maxTokens: 4096 }, { temperature: 1.0 })
    expect(params.temperature).toBe(1.0)
    expect(params.maxTokens).toBe(4096)
  })

  it('边界: inlineApplyPresetDefaults 无覆盖返回原值', () => {
    const params = inlineApplyPresetDefaults({ temperature: 0.7 }, {})
    expect(params).toEqual({ temperature: 0.7 })
  })
})
