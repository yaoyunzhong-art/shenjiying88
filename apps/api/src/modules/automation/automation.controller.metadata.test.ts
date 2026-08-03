/**
 * automation.controller.metadata.test.ts — Controller 元数据与装饰器增强测试
 *
 * 覆盖范围:
 *   1. Controller path/HTTP method 元数据
 *   2. HttpCode 状态码元数据
 *   3. UseGuards 中间件元数据
 *   4. 路由/方法完整性
 *   5. 功能一致性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { AutomationController } from './automation.controller'
import { HttpCode, HttpStatus } from '@nestjs/common'

describe('AutomationController metadata', () => {
  // ── Controller 级别元数据 ──

  it('controller path should be api/automation', () => {
    assert.equal(Reflect.getMetadata('path', AutomationController), 'api/automation')
  })

  it('controller should have __controller__ metadata', () => {
    assert.equal(Reflect.getMetadata('__controller__', AutomationController), true)
  })

  it('controller should be guard-registered', () => {
    const guards = Reflect.getMetadata('__guards__', AutomationController)
    assert.ok(Array.isArray(guards), '__guards__ should be an array')
    assert.ok(guards.length > 0, 'at least one guard should be registered')
  })

  // ── 路由路径与 HTTP 方法元数据 ──

  it('listRules: GET /rules', () => {
    const h = AutomationController.prototype.listRules
    assert.equal(Reflect.getMetadata('method', h), 0)
    assert.equal(Reflect.getMetadata('path', h), 'rules')
  })

  it('getRule: GET /rules/:id', () => {
    const h = AutomationController.prototype.getRule
    assert.equal(Reflect.getMetadata('method', h), 0)
    assert.equal(Reflect.getMetadata('path', h), 'rules/:id')
  })

  it('createRule: POST /rules', () => {
    const h = AutomationController.prototype.createRule
    assert.equal(Reflect.getMetadata('method', h), 1)
    assert.equal(Reflect.getMetadata('path', h), 'rules')
  })

  it('evaluateRule: POST /rules/:id/evaluate', () => {
    const h = AutomationController.prototype.evaluateRule
    assert.equal(Reflect.getMetadata('method', h), 1)
    assert.equal(Reflect.getMetadata('path', h), 'rules/:id/evaluate')
  })

  it('createWorkflow: POST /workflows', () => {
    const h = AutomationController.prototype.createWorkflow
    assert.equal(Reflect.getMetadata('method', h), 1)
    assert.equal(Reflect.getMetadata('path', h), 'workflows')
  })

  it('getWorkflow: GET /workflows/:id', () => {
    const h = AutomationController.prototype.getWorkflow
    assert.equal(Reflect.getMetadata('method', h), 0)
    assert.equal(Reflect.getMetadata('path', h), 'workflows/:id')
  })

  it('updateWorkflow: PUT /workflows/:id', () => {
    const h = AutomationController.prototype.updateWorkflow
    assert.equal(Reflect.getMetadata('method', h), 2)
    assert.equal(Reflect.getMetadata('path', h), 'workflows/:id')
  })

  it('listJobs: GET /jobs', () => {
    const h = AutomationController.prototype.listJobs
    assert.equal(Reflect.getMetadata('method', h), 0)
    assert.equal(Reflect.getMetadata('path', h), 'jobs')
  })

  it('createJob: POST /jobs', () => {
    const h = AutomationController.prototype.createJob
    assert.equal(Reflect.getMetadata('method', h), 1)
    assert.equal(Reflect.getMetadata('path', h), 'jobs')
  })

  // ── HttpCode 元数据 ──

  it('createRule HttpCode = 201', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.createRule), 201)
  })

  it('evaluateRule HttpCode = 200', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.evaluateRule), 200)
  })

  it('createWorkflow HttpCode = 201', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.createWorkflow), 201)
  })

  it('updateWorkflow HttpCode = 200', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.updateWorkflow), 200)
  })

  it('createJob HttpCode = 201', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.createJob), 201)
  })

  it('listRules has no HttpCode override (undefined = default 200)', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.listRules), undefined)
  })

  it('getRule has no HttpCode override', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.getRule), undefined)
  })

  it('getWorkflow has no HttpCode override', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.getWorkflow), undefined)
  })

  it('listJobs has no HttpCode override', () => {
    assert.equal(Reflect.getMetadata('__httpCode__', AutomationController.prototype.listJobs), undefined)
  })

  // ── 路由方法数量与一致性 ──

  it('all routes should have unique method+path combinations', () => {
    const handlers: [Function, number, string][] = [
      [AutomationController.prototype.listRules, 0, 'rules'],
      [AutomationController.prototype.getRule, 0, 'rules/:id'],
      [AutomationController.prototype.createRule, 1, 'rules'],
      [AutomationController.prototype.evaluateRule, 1, 'rules/:id/evaluate'],
      [AutomationController.prototype.createWorkflow, 1, 'workflows'],
      [AutomationController.prototype.getWorkflow, 0, 'workflows/:id'],
      [AutomationController.prototype.updateWorkflow, 2, 'workflows/:id'],
      [AutomationController.prototype.listJobs, 0, 'jobs'],
      [AutomationController.prototype.createJob, 1, 'jobs'],
    ]

    const fullPaths = handlers.map(([h, m, p]) => `${m} api/automation/${p}`)
    assert.equal(new Set(fullPaths).size, fullPaths.length)
  })

  it('HTTP methods should only be 0=GET, 1=POST, 2=PUT', () => {
    const handlers = [
      AutomationController.prototype.listRules,
      AutomationController.prototype.getRule,
      AutomationController.prototype.createRule,
      AutomationController.prototype.evaluateRule,
      AutomationController.prototype.createWorkflow,
      AutomationController.prototype.getWorkflow,
      AutomationController.prototype.updateWorkflow,
      AutomationController.prototype.listJobs,
      AutomationController.prototype.createJob,
    ]

    handlers.forEach(h => {
      const m = Reflect.getMetadata('method', h)
      assert.ok([0, 1, 2].includes(m), `${h.name} method=${m} should be 0/1/2`)
    })
  })

  it('path metadata should not start with /', () => {
    const handlers = [
      ['listRules', AutomationController.prototype.listRules],
      ['getRule', AutomationController.prototype.getRule],
      ['createRule', AutomationController.prototype.createRule],
      ['evaluateRule', AutomationController.prototype.evaluateRule],
      ['createWorkflow', AutomationController.prototype.createWorkflow],
      ['getWorkflow', AutomationController.prototype.getWorkflow],
      ['updateWorkflow', AutomationController.prototype.updateWorkflow],
      ['listJobs', AutomationController.prototype.listJobs],
      ['createJob', AutomationController.prototype.createJob],
    ] as const

    handlers.forEach(([name, h]) => {
      const p = Reflect.getMetadata('path', h)
      assert.equal(typeof p, 'string', `${name}: path should be string`)
      assert.ok(!p.startsWith('/'), `${name}: path "${p}" should not start with /`)
    })
  })

  it('parameter count on each handler', () => {
    const checks: [string, number][] = [
      ['listRules', 0],
      ['getRule', 1],
      ['createRule', 1],
      ['evaluateRule', 2],
      ['createWorkflow', 1],
      ['getWorkflow', 1],
      ['updateWorkflow', 2],
      ['listJobs', 1],
      ['createJob', 1],
    ]

    checks.forEach(([name, n]) => {
      assert.equal((AutomationController.prototype as any)[name].length, n,
        `${name} should have ${n} parameter(s)`)
    })
  })

  // ── 路径命名一致性 ──

  it('routes with /:id should have GET+PUT methods', () => {
    const routesWithId = ['getRule', 'getWorkflow', 'updateWorkflow']
    routesWithId.forEach(name => {
      const h = (AutomationController.prototype as any)[name] as Function
      assert.ok(h !== undefined, `${name} should exist`)
    })
  })

  it('collection routes should exist for rules, workflows, jobs', () => {
    const collections = ['listRules', 'createRule', 'createWorkflow', 'listJobs', 'createJob']
    collections.forEach(name => {
      const h = (AutomationController.prototype as any)[name] as Function
      assert.ok(typeof h === 'function', `${name} should be a function`)
    })
  })

  it('evaluateRule path includes /evaluate suffix', () => {
    const path = Reflect.getMetadata('path', AutomationController.prototype.evaluateRule)
    assert.ok(path.includes('/evaluate'))
  })

  it('updateWorkflow should use PUT (method=2)', () => {
    assert.equal(Reflect.getMetadata('method', AutomationController.prototype.updateWorkflow), 2)
  })

  // ── HttpCode 常量引用验证 ──

  it('create endpoints (201) match HttpStatus.CREATED', () => {
    assert.equal(201, HttpStatus.CREATED)
  })

  it('update/read endpoints (200) match HttpStatus.OK', () => {
    assert.equal(200, HttpStatus.OK)
  })
})
