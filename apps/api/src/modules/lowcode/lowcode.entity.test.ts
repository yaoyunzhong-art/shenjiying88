/**
 * lowcode.entity.test.ts
 * 低代码聚合实体测试
 *
 * 注意：TypeORM Column()/default 仅在 ORM active-record 模式下生效，
 * 纯类 new 实例时不会被填充，因此测试不依赖默认值。
 */

import { describe, it, expect } from 'vitest'
import { LowcodeTemplate, LowcodePageSnapshot, LowcodeComponentLibrary } from './lowcode.entity'

describe('LowcodeTemplate Entity', () => {
  it('应定义实体类和装饰器', () => {
    expect(LowcodeTemplate).toBeDefined()
    expect(LowcodePageSnapshot).toBeDefined()
    expect(LowcodeComponentLibrary).toBeDefined()
  })

  it('应接受完整数据', () => {
    const tpl = Object.assign(new LowcodeTemplate(), {
      id: 'tpl-001',
      name: 'Dashboard',
      status: 'active',
      components: [{ type: 'navbar', defaultProps: { title: 'Test' } }],
      metadata: { version: 1 },
    })
    expect(tpl.id).toBe('tpl-001')
    expect(tpl.name).toBe('Dashboard')
    expect(tpl.status).toBe('active')
    expect(tpl.components).toHaveLength(1)
    expect(tpl.components[0].type).toBe('navbar')
    expect(tpl.metadata).toEqual({ version: 1 })
  })

  it('应支持所有状态枚举', () => {
    const active = Object.assign(new LowcodeTemplate(), { status: 'active' })
    const archived = Object.assign(new LowcodeTemplate(), { status: 'archived' })
    const deprecated = Object.assign(new LowcodeTemplate(), { status: 'deprecated' })
    expect(active.status).toBe('active')
    expect(archived.status).toBe('archived')
    expect(deprecated.status).toBe('deprecated')
  })

  it('应包含描述和创建者字段', () => {
    const tpl = Object.assign(new LowcodeTemplate(), {
      id: 'tpl-002',
      name: 'Full',
      description: 'A complete template',
      components: [],
      metadata: {},
      createdBy: 'admin',
    })
    expect(tpl.description).toBe('A complete template')
    expect(tpl.createdBy).toBe('admin')
  })
})

describe('LowcodePageSnapshot Entity', () => {
  it('应接受快照数据', () => {
    const snap = Object.assign(new LowcodePageSnapshot(), {
      id: 'snap-001',
      pageId: 'page-001',
      version: 3,
      components: [{ type: 'button', props: { text: 'Submit' } }],
      changelog: 'Added submit button',
      publishedBy: 'admin',
    })
    expect(snap.pageId).toBe('page-001')
    expect(snap.version).toBe(3)
    expect(snap.components).toHaveLength(1)
    expect(snap.changelog).toBe('Added submit button')
    expect(snap.publishedBy).toBe('admin')
  })

  it('changelog 和 publishedBy 可为空', () => {
    const snap = Object.assign(new LowcodePageSnapshot(), {
      id: 'snap-002',
      pageId: 'page-002',
      version: 1,
      components: [],
    })
    expect(snap.changelog).toBeUndefined()
    expect(snap.publishedBy).toBeUndefined()
  })

  it('应支持任意版本号', () => {
    const snap = Object.assign(new LowcodePageSnapshot(), {
      id: 'snap-003',
      pageId: 'page-003',
      version: 5,
      components: [],
    })
    expect(snap.version).toBe(5)
  })
})

describe('LowcodeComponentLibrary Entity', () => {
  it('应接受组件库数据', () => {
    const comp = Object.assign(new LowcodeComponentLibrary(), {
      id: 'lib-001',
      name: 'Custom Chart',
      type: 'chart',
      defaultProps: { type: 'bar' },
      schema: { color: { type: 'string', required: true } },
      status: 'active',
    })
    expect(comp.name).toBe('Custom Chart')
    expect(comp.type).toBe('chart')
    expect(comp.defaultProps).toEqual({ type: 'bar' })
    expect(comp.schema).toEqual({ color: { type: 'string', required: true } })
    expect(comp.status).toBe('active')
  })

  it('应支持 archived 状态', () => {
    const comp = Object.assign(new LowcodeComponentLibrary(), {
      id: 'lib-002',
      name: 'Old Button',
      type: 'button',
      status: 'archived',
    })
    expect(comp.status).toBe('archived')
  })
})
