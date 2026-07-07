/**
 * lowcode.contract.test.ts
 * 低代码合约映射器测试
 */

import { describe, it, expect } from 'vitest'
import {
  toPageContract,
  toComponentContract,
  toTemplateContract,
} from './lowcode.contract'

describe('lowcode.contract — mappers', () => {
  describe('toPageContract', () => {
    it('应映射页面实体到合约', () => {
      const entity = {
        id: 'page-1',
        name: 'MyPage',
        templateId: 'tpl-1',
        status: 'published',
        components: [{ id: 'c1', type: 'navbar', props: { title: 'Test' } }],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      } as any

      const contract = toPageContract(entity)
      expect(contract.id).toBe('page-1')
      expect(contract.name).toBe('MyPage')
      expect(contract.status).toBe('published')
      expect(contract.components).toHaveLength(1)
    })

    it('空组件应映射为空数组', () => {
      const entity = {
        id: 'page-2',
        name: 'Empty',
        templateId: 'tpl-2',
        status: 'draft',
        components: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any

      const contract = toPageContract(entity)
      expect(contract.components).toEqual([])
    })

    it('应包含所有合约属性', () => {
      const entity = {
        id: 'page-3',
        name: 'Full',
        templateId: 'tpl-3',
        status: 'published',
        components: [],
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-02'),
      } as any

      const contract = toPageContract(entity)
      const keys = Object.keys(contract)
      expect(keys).toContain('id')
      expect(keys).toContain('name')
      expect(keys).toContain('templateId')
      expect(keys).toContain('status')
      expect(keys).toContain('components')
      expect(keys).toContain('createdAt')
      expect(keys).toContain('updatedAt')
    })
  })

  describe('toComponentContract', () => {
    it('应映射组件实体到合约', () => {
      const entity = {
        id: 'comp-1',
        type: 'chart',
        props: { type: 'line' },
      } as any

      const contract = toComponentContract(entity)
      expect(contract.id).toBe('comp-1')
      expect(contract.type).toBe('chart')
      expect(contract.props).toEqual({ type: 'line' })
    })

    it('空 props 映射为空对象', () => {
      const entity = { id: 'comp-2', type: 'navbar' } as any
      const contract = toComponentContract(entity)
      expect(contract.props).toEqual({})
    })
  })

  describe('toTemplateContract', () => {
    it('应映射模板实体到合约', () => {
      const entity = {
        id: 'tpl-1',
        name: 'Dashboard Tpl',
        description: 'A dashboard template',
        components: [{ type: 'navbar', defaultProps: { title: 'Dash' } }],
        status: 'active',
      } as any

      const contract = toTemplateContract(entity)
      expect(contract.id).toBe('tpl-1')
      expect(contract.name).toBe('Dashboard Tpl')
      expect(contract.description).toBe('A dashboard template')
      expect(contract.components).toHaveLength(1)
      expect(contract.status).toBe('active')
    })

    it('description 可选', () => {
      const entity = {
        id: 'tpl-2',
        name: 'No Desc',
        components: [],
        status: 'active',
      } as any

      const contract = toTemplateContract(entity)
      expect(contract.description).toBeUndefined()
    })
  })
})
