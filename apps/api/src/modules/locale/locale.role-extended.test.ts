import { describe, it, expect, beforeEach } from 'vitest'
import { LocaleService } from './locale.service'

/**
 * 🐜 [locale] 角色扩展测试
 * 覆盖国际化多语言翻译的边界场景
 */

function setup() {
  const svc = new LocaleService()
  return { svc }
}

describe('👔店长 locale 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('获取已配置的语言列表', () => {
    const langs = svc.svc.getSupportedLocales()
    expect(langs.length).toBeGreaterThanOrEqual(1)
    expect(langs).toContain('zh-CN')
  })

  it('翻译存在的 key 返回正确值', () => {
    const t = svc.svc.translate('common.save', 'en-US')
    expect(t).toBeTruthy()
  })
})

describe('🛒前台 locale 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('翻译不存在的 key 返回 key 本身', () => {
    const t = svc.svc.translate('nonexistent.key', 'zh-CN')
    expect(t).toBe('nonexistent.key')
  })

  it('按命名空间获取翻译', () => {
    const ns = svc.svc.getNamespace('common')
    expect(ns).toBeDefined()
    expect(typeof ns).toBe('object')
  })
})

describe('📢营销 locale 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('动态添加翻译并获取', () => {
    svc.svc.addTranslation('zh-CN', { 'custom.key': '自定义翻译' })
    const t = svc.svc.translate('custom.key', 'zh-CN')
    expect(t).toBe('自定义翻译')
  })

  it('不同语言相同 key 返回不同值', () => {
    const zh = svc.svc.translate('common.save', 'zh-CN')
    const en = svc.svc.translate('common.save', 'en-US')
    expect(zh).not.toBe(en)
  })
})
