import { describe, it, expect, beforeEach } from 'vitest'
import { LlmConfigService } from './llm-config.service'
import { I18nGeoService } from './i18n-geo.service'

/**
 * 🐜 [tenant-llm] 角色扩展测试
 */

function setup() {
  return {
    llm: new LlmConfigService(),
    geo: new I18nGeoService(),
  }
}

describe('👔店长 tenant-llm 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('配置租户 LLM 模型', () => {
    const config = svc.llm.setConfig('tenant-1', { provider: 'openai', model: 'gpt-4', apiKey: 'sk-xxx' })
    expect(config.provider).toBe('openai')
    expect(config.model).toBe('gpt-4')
  })

  it('获取租户 LLM 配置', () => {
    svc.llm.setConfig('tenant-2', { provider: 'claude', model: 'claude-3', apiKey: 'sk-yyy' })
    const config = svc.llm.getConfig('tenant-2')
    expect(config).not.toBeNull()
    expect(config!.provider).toBe('claude')
  })

  it('获取不存在的租户配置返回 null', () => {
    expect(svc.llm.getConfig('no-tenant')).toBeNull()
  })
})

describe('🛒前台 tenant-llm 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('通过 LLM 发送请求', async () => {
    svc.llm.setConfig('t1', { provider: 'openai', model: 'gpt-4', apiKey: 'sk-test' })
    const resp = await svc.llm.sendRequest('t1', [{ role: 'user', content: 'Hello' }])
    expect(resp).toBeDefined()
  })
})

describe('📢营销 tenant-llm 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('地区语言服务检测', () => {
    const locale = svc.geo.detectLocale('CN')
    expect(locale).toBeDefined()
  })

  it('翻译文本', () => {
    const translated = svc.geo.translate('欢迎', 'en')
    expect(translated).toBeDefined()
  })
})
