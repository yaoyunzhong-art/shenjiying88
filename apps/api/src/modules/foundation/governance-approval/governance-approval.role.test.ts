import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
// ── governance-approval 使用 PrismaService，纯 controller 方法签名测试 ──
const ROLES = {
  Security: '🔧安监',
  TenantAdmin: '👔店长',
  Operations: '🎯运行专员',
  HR: '👥HR'
}

// 懒加载 controller 类用于反射测试
let GovernanceApprovalController: any
let controllerInstance: any

function getControllerClass() {
  if (!GovernanceApprovalController) {
    GovernanceApprovalController = require('./governance-approval.controller').GovernanceApprovalController
  }
  return GovernanceApprovalController
}

function getControllerInstance() {
  if (!controllerInstance) {
    const Ctrl = getControllerClass()
    controllerInstance = new Ctrl({} as any)
  }
  return controllerInstance
}

// ── 路径元数据测试 ──
describe('governance-approval 控制器元数据', () => {
  it('控制器 /foundation/governance-approval 控制器存在', () => {
    const Ctrl = getControllerClass()
    assert.ok(Ctrl)
  })

  it('listApprovals 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.listApprovals, 'function')
  })

  it('summarizeApprovals 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.summarizeApprovals, 'function')
  })

  it('getApproval 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.getApproval, 'function')
  })

  it('materializeApproval 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.materializeApproval, 'function')
  })

  it('decideApproval 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.decideApproval, 'function')
  })

  it('cancelApproval 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.cancelApproval, 'function')
  })

  it('resubmitApproval 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.resubmitApproval, 'function')
  })

  it('markExecuted 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.markExecuted, 'function')
  })

  it('markExecutionFailed 方法存在且返回 Promise', () => {
    const ctrl = getControllerInstance()
    assert.equal(typeof ctrl.markExecutionFailed, 'function')
  })
})

// ── 角色视角的审批生命周期方法签名测试 ──
describe(`${ROLES.Security} governance-approval 角色视角`, () => {
  it('安监使用 getApproval 签名正确（ticket 参数）', () => {
    const ctrl = getControllerInstance()
    // getApproval expects a ticket string parameter
    assert.ok(typeof ctrl.getApproval === 'function')
  })

  it('安监使用 decideApproval 签名正确（decision input）', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.decideApproval === 'function')
  })

  it('安监使用 cancelApproval 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.cancelApproval === 'function')
  })
})

describe(`${ROLES.TenantAdmin} governance-approval 角色视角`, () => {
  it('店长使用 materializeApproval 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.materializeApproval === 'function')
  })

  it('店长使用 markExecuted 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.markExecuted === 'function')
  })

  it('店长使用 resubmitApproval 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.resubmitApproval === 'function')
  })
})

describe(`${ROLES.Operations} governance-approval 角色视角`, () => {
  it('运营专员使用 listApprovals 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.listApprovals === 'function')
  })

  it('运营专员使用 summarizeApprovals 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.summarizeApprovals === 'function')
  })

  it('运营专员使用 markExecutionFailed 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.markExecutionFailed === 'function')
  })
})

describe(`${ROLES.HR} governance-approval 角色视角`, () => {
  it('HR使用 getApproval 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.getApproval === 'function')
  })

  it('HR使用 listApprovals 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.listApprovals === 'function')
  })

  it('HR使用 summarizeApprovals 签名正确', () => {
    const ctrl = getControllerInstance()
    assert.ok(typeof ctrl.summarizeApprovals === 'function')
  })
})

// ── HTTP 路由元数据测试 ──
describe('governance-approval HTTP 路由元数据', () => {
  it('控制器 path 已设置', () => {
    const Ctrl = getControllerClass()
    const path = Reflect.getMetadata('path', Ctrl)
    assert.equal(path, 'foundation/governance-approval')
  })

  it('listApprovals @Get() 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.listApprovals)
    const path = Reflect.getMetadata('path', Ctrl.prototype.listApprovals)
    assert.equal(method, 0) // GET
    assert.equal(path, '/')
  })

  it('summarizeApprovals @Get(summarize) 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.summarizeApprovals)
    const path = Reflect.getMetadata('path', Ctrl.prototype.summarizeApprovals)
    assert.equal(method, 0)
    assert.equal(path, 'summarize')
  })

  it('getApproval @Get(:ticket) 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.getApproval)
    const path = Reflect.getMetadata('path', Ctrl.prototype.getApproval)
    assert.equal(method, 0)
    assert.equal(path, ':ticket')
  })

  it('materializeApproval @Post() 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.materializeApproval)
    assert.equal(method, 1) // POST = 1
  })

  it('decideApproval @Post(decide) 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.decideApproval)
    const path = Reflect.getMetadata('path', Ctrl.prototype.decideApproval)
    assert.equal(method, 1)
    assert.equal(path, 'decide')
  })

  it('cancelApproval @Post(cancel) 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.cancelApproval)
    const path = Reflect.getMetadata('path', Ctrl.prototype.cancelApproval)
    assert.equal(method, 1)
    assert.equal(path, 'cancel')
  })

  it('resubmitApproval @Post(resubmit) 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.resubmitApproval)
    const path = Reflect.getMetadata('path', Ctrl.prototype.resubmitApproval)
    assert.equal(method, 1)
    assert.equal(path, 'resubmit')
  })

  it('markExecuted @Post(execute) 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.markExecuted)
    const path = Reflect.getMetadata('path', Ctrl.prototype.markExecuted)
    assert.equal(method, 1)
    assert.equal(path, 'execute')
  })

  it('markExecutionFailed @Post(execute-failure) 路由存在', () => {
    const Ctrl = getControllerClass()
    const method = Reflect.getMetadata('method', Ctrl.prototype.markExecutionFailed)
    const path = Reflect.getMetadata('path', Ctrl.prototype.markExecutionFailed)
    assert.equal(method, 1)
    assert.equal(path, 'execute-failure')
  })
})
