import { describe, it, expect, beforeEach } from 'vitest'
import { SandboxService } from './sandbox.service'
import { SandboxIsvService } from './sandbox-isv.service'

/**
 * 🐜 [sandbox] 角色扩展测试
 */

function setup() {
  return {
    sandbox: new SandboxService(),
    isv: new SandboxIsvService(),
  }
}

describe('👔店长 sandbox 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('创建沙箱环境', () => {
    const env = svc.sandbox.createEnvironment('tenant-1', { name: '测试环境' })
    expect(env.envId).toBeTruthy()
    expect(env.tenantId).toBe('tenant-1')
  })

  it('列出沙箱环境', () => {
    svc.sandbox.createEnvironment('t1', { name: 'Env A' })
    svc.sandbox.createEnvironment('t1', { name: 'Env B' })
    const list = svc.sandbox.listEnvironments('t1')
    expect(list.length).toBeGreaterThanOrEqual(2)
  })
})

describe('🎯运行专员 sandbox 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('ISV 沙箱初始化', () => {
    const isv = svc.isv.initializeIsvSandbox('isv-1', { appId: 'app-1' })
    expect(isv.sandboxId).toBeTruthy()
  })

  it('重置沙箱数据', () => {
    svc.isv.initializeIsvSandbox('isv-2', { appId: 'app-2' })
    const reset = svc.isv.resetSandbox('isv-2')
    expect(reset).toBe(true)
  })

  it('重置不存在的沙箱', () => {
    const reset = svc.isv.resetSandbox('no-such')
    expect(reset).toBe(false)
  })
})
