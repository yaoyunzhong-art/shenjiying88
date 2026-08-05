/**
 * system-config.service.spec.ts — 系统配置模块 Service 单元测试
 *
 * 覆盖: get/set/getAll/delete / 覆盖更新 / 边界操作
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SystemConfigService } from './system-config.service'

describe('SystemConfigService', () => {
  let svc: SystemConfigService

  beforeEach(() => {
    svc = new SystemConfigService()
  })

  it('set 创建新配置', () => {
    const setting = svc.set('site.name', '神机营', '站点名称', 'admin')
    expect(setting.key).toBe('site.name')
    expect(setting.value).toBe('神机营')
    expect(setting.description).toBe('站点名称')
    expect(setting.updatedBy).toBe('admin')
    expect(setting.updatedAt).toBeDefined()
  })

  it('set 覆盖已有配置', () => {
    svc.set('site.name', '旧名称', '旧描述', 'admin')
    const updated = svc.set('site.name', '新名称', '新描述', 'admin2')
    expect(updated.value).toBe('新名称')
    expect(updated.description).toBe('新描述')
    expect(updated.updatedBy).toBe('admin2')
  })

  it('set 支持各种值类型', () => {
    const strSetting = svc.set('str.key', '字符串值', '字符串', 'admin')
    expect(strSetting.value).toBe('字符串值')

    const numSetting = svc.set('num.key', 42, '数字', 'admin')
    expect(numSetting.value).toBe(42)

    const boolSetting = svc.set('bool.key', true, '布尔', 'admin')
    expect(boolSetting.value).toBe(true)

    const objSetting = svc.set('obj.key', { nested: true }, '对象', 'admin')
    expect(objSetting.value).toEqual({ nested: true })
  })

  it('get 返回指定配置', () => {
    svc.set('site.title', '标题', '标题描述', 'admin')
    const setting = svc.get('site.title')
    expect(setting).toBeDefined()
    expect(setting!.value).toBe('标题')
  })

  it('get 不存在的 key 返回 undefined', () => {
    expect(svc.get('nonexistent')).toBeUndefined()
  })

  it('getAll 返回所有配置', () => {
    svc.set('key1', 'val1', 'desc1', 'admin')
    svc.set('key2', 'val2', 'desc2', 'admin')
    svc.set('key3', 'val3', 'desc3', 'admin')
    const all = svc.getAll()
    expect(all).toHaveLength(3)
  })

  it('getAll 空配置返回空数组', () => {
    expect(svc.getAll()).toEqual([])
  })

  it('delete 删除已有配置返回 true', () => {
    svc.set('tmp.key', 'temp', '临时', 'admin')
    const result = svc.delete('tmp.key')
    expect(result).toBe(true)
    expect(svc.get('tmp.key')).toBeUndefined()
  })

  it('delete 不存在的配置返回 false', () => {
    const result = svc.delete('nonexistent.key')
    expect(result).toBe(false)
  })

  it('多次 set 同一 key 只有最新值保留', () => {
    svc.set('duplicate.key', 'a', 'desc', 'admin')
    svc.set('duplicate.key', 'b', 'desc', 'admin')
    svc.set('duplicate.key', 'c', 'desc', 'admin')
    const all = svc.getAll()
    const matches = all.filter((s) => s.key === 'duplicate.key')
    expect(matches).toHaveLength(1)
    expect(matches[0].value).toBe('c')
  })
})
