import { describe, it, expect, beforeEach } from 'vitest'
import { LLMConfigService } from './llm-config.service'
import { I18nGeoService } from './i18n-geo.service'

/**
 * 🐜 [tenant-llm] 角色扩展测试
 */

function setup() {
  return {
    llm: new LLMConfigService(),
    geo: new I18nGeoService(),
  }
}

describe('👔店长 tenant-llm 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建租户 LLM 配置', () => {
    const config = svc.llm.createConfig({
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'sk-xxx',
      tenantId: 'tenant-1',
    })
    expect(config).toBeDefined()
    expect(config.provider).toBe('openai')
  })

  it('获取租户 LLM 配置', () => {
    const created = svc.llm.createConfig({
      provider: 'claude',
      model: 'claude-3',
      apiKey: 'sk-yyy',
      tenantId: 'tenant-2',
    })
    const config = svc.llm.getConfig(created.id)
    expect(config).not.toBeNull()
    expect(config!.provider).toBe('claude')
  })
})

describe('🛒前台 tenant-llm 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('测试 LLM 连接', async () => {
    const created = svc.llm.createConfig({
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'sk-test',
      tenantId: 't1',
    })
    const result = await svc.llm.testConnection(created.id)
    expect(result).toBeDefined()
  })
})

describe('📢营销 tenant-llm 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('地区语言服务检测', () => {
    const ctx = svc.geo.getGeoContext('8.8.8.8')
    expect(ctx.language).toBeDefined()
    expect(ctx.currency).toBeDefined()
  })

  it('国家码检测', () => {
    const country = svc.geo.detectCountryFromIP('8.8.8.8')
    expect(country).toBeDefined()
    expect(country).toBe('US')
  })
})
