/**
 * modules.service.spec.ts — 模块管理 Service 单元测试 (V23)
 *
 * 覆盖: register / getAll / getById / getTopologicalSort / detectCycles /
 *       checkDependencies / toggleStatus
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ModulesService } from './modules.service'

describe('ModulesService', () => {
  let svc: ModulesService

  beforeEach(() => {
    svc = new ModulesService()
  })

  // ════════════════════════════════════════════
  // register
  // ════════════════════════════════════════════

  describe('register', () => {
    it('正例: 注册独立模块', () => {
      const mod = svc.register('core', 'Core模块', '1.0.0')
      expect(mod.id).toBe('core')
      expect(mod.status).toBe('enabled')
    })

    it('正例: 注册带依赖的模块', () => {
      svc.register('core', 'Core', '1.0.0')
      const mod = svc.register('users', '用户模块', '1.0.0', ['core'])
      expect(mod.dependencies).toEqual(['core'])
    })
  })

  // ════════════════════════════════════════════
  // getAll
  // ════════════════════════════════════════════

  describe('getAll', () => {
    it('正例: 返回所有模块', () => {
      svc.register('a', 'A', '1.0.0')
      svc.register('b', 'B', '2.0.0')
      const all = svc.getAll()
      expect(all.length).toBe(2)
    })

    it('边界: 无模块返回空', () => {
      expect(svc.getAll().length).toBe(0)
    })
  })

  // ════════════════════════════════════════════
  // getById
  // ════════════════════════════════════════════

  describe('getById', () => {
    it('正例: 按ID查询', () => {
      svc.register('core', 'Core', '1.0.0')
      const mod = svc.getById('core')
      expect(mod).not.toBeNull()
    })

    it('反例: 不存在的ID返回null', () => {
      expect(svc.getById('nonexist')).toBeNull()
    })
  })

  // ════════════════════════════════════════════
  // getTopologicalSort
  // ════════════════════════════════════════════

  describe('getTopologicalSort', () => {
    it('正例: 按依赖顺序排序', () => {
      svc.register('core', 'Core', '1.0.0')
      svc.register('users', '用户', '1.0.0', ['core'])
      svc.register('admin', '管理', '1.0.0', ['users'])
      const sorted = svc.getTopologicalSort()
      const coreIdx = sorted.findIndex(m => m.id === 'core')
      const usersIdx = sorted.findIndex(m => m.id === 'users')
      const adminIdx = sorted.findIndex(m => m.id === 'admin')
      expect(coreIdx).toBeLessThan(usersIdx)
      expect(usersIdx).toBeLessThan(adminIdx)
    })
  })

  // ════════════════════════════════════════════
  // detectCycles
  // ════════════════════════════════════════════

  describe('detectCycles', () => {
    it('正例: 无环依赖', () => {
      svc.register('a', 'A', '1.0.0', ['b'])
      svc.register('b', 'B', '1.0.0')
      const cycles = svc.detectCycles()
      expect(cycles.length).toBe(0)
    })

    it('正例: 检测到循环依赖', () => {
      svc.register('a', 'A', '1.0.0', ['b'])
      svc.register('b', 'B', '1.0.0', ['a'])
      const cycles = svc.detectCycles()
      expect(cycles.length).toBeGreaterThan(0)
    })
  })

  // ════════════════════════════════════════════
  // checkDependencies
  // ════════════════════════════════════════════

  describe('checkDependencies', () => {
    it('正例: 所有依赖已注册', () => {
      svc.register('core', 'Core', '1.0.0')
      svc.register('users', '用户', '1.0.0', ['core'])
      const result = svc.checkDependencies('users')
      expect(result.resolved).toEqual(['core'])
      expect(result.missing.length).toBe(0)
    })

    it('正例: 发现缺失依赖', () => {
      svc.register('users', '用户', '1.0.0', ['core'])
      const result = svc.checkDependencies('users')
      expect(result.missing).toEqual(['core'])
    })
  })

  // ════════════════════════════════════════════
  // toggleStatus
  // ════════════════════════════════════════════

  describe('toggleStatus', () => {
    it('正例: 切换模块状态', () => {
      svc.register('core', 'Core', '1.0.0')
      const mod = svc.toggleStatus('core')
      expect(mod!.status).toBe('disabled')
      const mod2 = svc.toggleStatus('core')
      expect(mod2!.status).toBe('enabled')
    })

    it('反例: 不存在的模块返回null', () => {
      expect(svc.toggleStatus('nonexist')).toBeNull()
    })
  })

  // ════════════════════════════════════════════
  // checkDependencies (nonexistent module)
  // ════════════════════════════════════════════

  describe('checkDependencies (non-existent)', () => {
    it('边界: 不存在的模块返回空数组', () => {
      const result = svc.checkDependencies('ghost')
      expect(result.resolved).toEqual([])
      expect(result.missing).toEqual([])
    })
  })

  // ════════════════════════════════════════════
  // register (empty dependencies)
  // ════════════════════════════════════════════

  describe('register (empty dependencies)', () => {
    it('正例: 空依赖数组的模块注册', () => {
      const mod = svc.register('standalone', '独立模块', '2.0.0', [])
      expect(mod.dependencies).toEqual([])
    })
  })
})
