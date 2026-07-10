import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [sandbox] [A] contract 测试
 *
 * 验证 sandbox 模块的合约映射器、实体 Shape、DTO 合约
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SandboxService as SandboxEnvService } from './sandbox.service'
import { SandboxIsvService } from './sandbox-isv.service'
import {
  toSandboxInstanceContract,
  toCodeExecutionResultContract,
  toISVAppContract,
  toAppInstallContract,
  toSDKPackageContract,
  toSandboxEnvironmentContract,
  toSandboxInstanceContracts,
  toISVAppContracts,
  toAppInstallContracts,
  toSandboxEnvironmentContracts,
} from './sandbox.contract'
import type {
  SandboxInstance,
  CodeExecutionResult,
  ISVApp,
  AppInstall,
  SDKPackage,
} from './sandbox-isv.service'
import type { SandboxEnvironment } from './sandbox.service'

// ── 辅助工厂 ──────────────────────────────────

function makeEnvService(): SandboxEnvService {
  return new SandboxEnvService()
}

// ── 合约: 实体 Shape ─────────────────────────

describe('[sandbox] 合约: SandboxInstance shape', () => {
  let isv: SandboxIsvService

  beforeEach(() => {
    isv = new SandboxIsvService()
  })

  it('initializeIsvSandbox 返回合法的 sandboxId', () => {
    const result = isv.initializeIsvSandbox('isv-001', { appId: 'app-001' })
    assert.ok(result.sandboxId.startsWith('isv-sandbox-'))
    assert.equal(typeof result.sandboxId, 'string')
  })

  it('resetSandbox 对存在的 ISV 返回 true', () => {
    isv.initializeIsvSandbox('isv-002', { appId: 'app-002' })
    const reset = isv.resetSandbox('isv-002')
    assert.equal(reset, true)
  })

  it('resetSandbox 对不存在的 ISV 返回 false', () => {
    const result = isv.resetSandbox('nonexistent')
    assert.equal(result, false)
  })
})

// ── 合约: CodeExecutionResult ─────────────────

describe('[sandbox] 合约: CodeExecutionResult shape', () => {
  it('toCodeExecutionResultContract 保持字段一致性', () => {
    const result: CodeExecutionResult = {
      success: true,
      output: 'test output',
      executionTimeMs: 100,
      memoryUsedMB: 32,
    }
    const contract = toCodeExecutionResultContract(result)

    assert.equal(contract.success, true)
    assert.equal(contract.output, 'test output')
    assert.equal(contract.executionTimeMs, 100)
    assert.equal(contract.memoryUsedMB, 32)
    assert.equal(contract.error, undefined)
  })

  it('toCodeExecutionResultContract 保留 error 字段', () => {
    const result: CodeExecutionResult = {
      success: false,
      output: '',
      error: 'Runtime error',
      executionTimeMs: 0,
      memoryUsedMB: 0,
    }
    const contract = toCodeExecutionResultContract(result)
    assert.equal(contract.success, false)
    assert.equal(contract.error, 'Runtime error')
  })
})

// ── 合约: SandboxInstance ─────────────────────

describe('[sandbox] 合约: SandboxInstance 映射', () => {
  it('toSandboxInstanceContract 保持字段一致性', () => {
    const now = new Date().toISOString()
    const instance: SandboxInstance = {
      id: 'sandbox-001',
      appId: 'app-001',
      developerId: 'dev-001',
      status: 'RUNNING',
      language: 'javascript',
      createdAt: now,
      lastActiveAt: now,
      resources: { cpu: 1, memory: 512, disk: 1024 },
    }
    const contract = toSandboxInstanceContract(instance)

    assert.equal(contract.id, 'sandbox-001')
    assert.equal(contract.appId, 'app-001')
    assert.equal(contract.status, 'RUNNING')
    assert.equal(contract.resources.cpu, 1)
    assert.equal(contract.resources.memory, 512)
  })

  it('toSandboxInstanceContract 保留 snapshot', () => {
    const instance: SandboxInstance = {
      id: 'sandbox-002',
      appId: 'app-002',
      developerId: 'dev-002',
      status: 'PENDING',
      language: 'python',
      createdAt: '2026-01-01',
      lastActiveAt: '2026-01-01',
      resources: { cpu: 2, memory: 1024, disk: 2048 },
      snapshot: '{"state":"test"}',
    }
    const contract = toSandboxInstanceContract(instance)
    assert.equal(contract.snapshot, '{"state":"test"}')
  })
})

// ── 合约: ISVApp ──────────────────────────────

describe('[sandbox] 合约: ISVApp shape 映射', () => {
  it('toISVAppContract 保持字段一致性', () => {
    const app: ISVApp = {
      id: 'app-001',
      name: '数据分析插件',
      description: '实时数据分析工具',
      developerId: 'dev-analytics',
      category: 'ANALYTICS',
      status: 'PUBLISHED',
      version: '1.0.0',
      rating: 4.5,
      ratingCount: 10,
      installCount: 100,
      publishedAt: '2026-01-01',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      tags: ['analytics', 'dashboard'],
      screenshots: ['https://example.com/shot1.png'],
      price: 99,
      isFree: false,
    }
    const contract = toISVAppContract(app)

    assert.equal(contract.name, '数据分析插件')
    assert.equal(contract.category, 'ANALYTICS')
    assert.equal(contract.version, '1.0.0')
    assert.equal(contract.price, 99)
    assert.equal(contract.isFree, false)
    assert.deepEqual(contract.tags, ['analytics', 'dashboard'])
    assert.deepEqual(contract.screenshots, ['https://example.com/shot1.png'])
    assert.equal(contract.status, 'PUBLISHED')
  })

  it('ISVApp 免费应用映射正确', () => {
    const app: ISVApp = {
      id: 'app-free',
      name: '免费工具',
      description: '免费工具',
      developerId: 'dev-free',
      category: 'OTHER',
      status: 'PUBLISHED',
      version: '1.0.0',
      rating: 0,
      ratingCount: 0,
      installCount: 0,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      tags: [],
      screenshots: [],
      price: 0,
      isFree: true,
    }
    const contract = toISVAppContract(app)
    assert.equal(contract.isFree, true)
    assert.equal(contract.price, 0)
  })
})

// ── 合约: AppInstall ────────────────────────

describe('[sandbox] 合约: AppInstall shape 映射', () => {
  it('toAppInstallContract 保持字段一致性', () => {
    const install: AppInstall = {
      id: 'install-001',
      appId: 'app-001',
      tenantId: 'tenant-install-001',
      installedAt: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE',
    }
    const contract = toAppInstallContract(install)

    assert.equal(contract.appId, 'app-001')
    assert.equal(contract.tenantId, 'tenant-install-001')
    assert.equal(contract.status, 'ACTIVE')
    assert.equal(contract.installedAt, '2026-01-01T00:00:00.000Z')
  })

  it('AppInstall DISABLED 状态映射正确', () => {
    const install: AppInstall = {
      id: 'install-002',
      appId: 'app-002',
      tenantId: 'tenant-002',
      installedAt: '2026-06-01T00:00:00.000Z',
      status: 'DISABLED',
    }
    const contract = toAppInstallContract(install)
    assert.equal(contract.status, 'DISABLED')
  })

  it('AppInstall UNINSTALLED 状态映射正确', () => {
    const install: AppInstall = {
      id: 'install-003',
      appId: 'app-003',
      tenantId: 'tenant-003',
      installedAt: '2026-06-01T00:00:00.000Z',
      status: 'UNINSTALLED',
    }
    const contract = toAppInstallContract(install)
    assert.equal(contract.status, 'UNINSTALLED')
  })
})

// ── 合约: SDKPackage ────────────────────────

describe('[sandbox] 合约: SDKPackage shape 映射', () => {
  it('toSDKPackageContract 保持字段一致性', () => {
    const pkg: SDKPackage = {
      language: 'python',
      version: '1.0.0',
      downloadURL: 'https://cdn.isv.com/pypi/app-001/sdk-1.0.0.zip',
      size: 2048,
      checksum: 'abc123def456',
      generatedAt: '2026-01-01T00:00:00.000Z',
    }
    const contract = toSDKPackageContract(pkg)

    assert.equal(contract.language, 'python')
    assert.equal(contract.version, '1.0.0')
    assert.ok(contract.downloadURL.includes('pypi'))
    assert.equal(contract.size, 2048)
    assert.equal(contract.checksum, 'abc123def456')
    assert.equal(typeof contract.generatedAt, 'string')
  })

  it('不同语言 SDK 包区分映射', () => {
    const nodePkg: SDKPackage = {
      language: 'nodejs',
      version: '1.0.0',
      downloadURL: 'https://cdn.isv.com/npm/app-001/sdk-1.0.0.zip',
      size: 3000,
      checksum: 'aaa111',
      generatedAt: '2026-01-01',
    }
    const javaPkg: SDKPackage = {
      language: 'java',
      version: '2.0.0',
      downloadURL: 'https://cdn.isv.com/maven/app-001/sdk-2.0.0.zip',
      size: 5000,
      checksum: 'bbb222',
      generatedAt: '2026-01-02',
    }

    assert.notEqual(nodePkg.language, javaPkg.language)
    assert.ok(nodePkg.downloadURL.includes('npm'))
    assert.ok(javaPkg.downloadURL.includes('maven'))
  })
})

// ── 合约: SandboxEnvironment ────────────────

describe('[sandbox] 合约: SandboxEnvironment shape 映射', () => {
  let envSvc: SandboxEnvService

  beforeEach(() => {
    envSvc = makeEnvService()
  })

  it('createEnvironment 返回符合合约的环境', () => {
    const env = envSvc.createEnvironment('tenant-001', { name: 'dev-sandbox', tags: ['dev'] })
    const contract = toSandboxEnvironmentContract(env)

    assert.equal(typeof contract.envId, 'string')
    assert.ok(contract.envId.startsWith('env-'))
    assert.equal(contract.tenantId, 'tenant-001')
    assert.equal(contract.name, 'dev-sandbox')
    assert.equal(contract.status, 'RUNNING')
    assert.equal(typeof contract.createdAt, 'string')
    assert.ok(contract.config.tags)
  })

  it('stopEnvironment 后状态变为 STOPPED', () => {
    const env = envSvc.createEnvironment('tenant-002', { name: 'test-env' })
    assert.equal(env.status, 'RUNNING')

    const stopped = envSvc.stopEnvironment(env.envId)
    assert.equal(stopped, true)

    const contract = toSandboxEnvironmentContract(env)
    assert.equal(contract.status, 'STOPPED')
  })

  it('停止不存在的环境返回 false', () => {
    const result = envSvc.stopEnvironment('nonexistent')
    assert.equal(result, false)
  })

  it('startEnvironment 后状态变为 RUNNING', () => {
    const env = envSvc.createEnvironment('tenant-003', { name: 'start-env' })
    envSvc.stopEnvironment(env.envId)
    assert.equal(env.status, 'STOPPED')

    const started = envSvc.startEnvironment(env.envId)
    assert.equal(started, true)
    assert.equal(env.status, 'RUNNING')
  })
})

// ── 合约: 批量映射 ───────────────────────────

describe('[sandbox] 合约: 批量映射', () => {
  it('toSandboxInstanceContracts 批量映射', () => {
    const now = new Date().toISOString()
    const i1: SandboxInstance = { id: 's1', appId: 'app-a', developerId: 'dev-x', status: 'RUNNING', language: 'javascript', createdAt: now, lastActiveAt: now, resources: { cpu: 1, memory: 512, disk: 1024 } }
    const i2: SandboxInstance = { id: 's2', appId: 'app-b', developerId: 'dev-x', status: 'RUNNING', language: 'python', createdAt: now, lastActiveAt: now, resources: { cpu: 2, memory: 1024, disk: 2048 } }

    const contracts = toSandboxInstanceContracts([i1, i2])
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].appId, 'app-a')
    assert.equal(contracts[1].appId, 'app-b')
  })

  it('toISVAppContracts 批量映射', () => {
    const a1: ISVApp = { id: 'app-1', name: 'App1', description: 'd1', developerId: 'd1', category: 'CRM', status: 'PUBLISHED', version: '1.0', rating: 0, ratingCount: 0, installCount: 0, createdAt: 'now', updatedAt: 'now', tags: [], screenshots: [], price: 0, isFree: true }
    const a2: ISVApp = { id: 'app-2', name: 'App2', description: 'd2', developerId: 'd2', category: 'ANALYTICS', status: 'PUBLISHED', version: '2.0', rating: 0, ratingCount: 0, installCount: 0, createdAt: 'now', updatedAt: 'now', tags: [], screenshots: [], price: 10, isFree: false }

    const contracts = toISVAppContracts([a1, a2])
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].name, 'App1')
    assert.equal(contracts[1].name, 'App2')
  })

  it('toAppInstallContracts 批量映射', () => {
    const in1: AppInstall = { id: 'i1', appId: 'app-1', tenantId: 't1', installedAt: 'now', status: 'ACTIVE' }
    const in2: AppInstall = { id: 'i2', appId: 'app-1', tenantId: 't2', installedAt: 'now', status: 'ACTIVE' }

    const contracts = toAppInstallContracts([in1, in2])
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].tenantId, 't1')
    assert.equal(contracts[1].tenantId, 't2')
  })

  it('toSandboxEnvironmentContracts 批量映射', () => {
    const svc = makeEnvService()
    const e1 = svc.createEnvironment('t1', { name: 'env1' })
    const e2 = svc.createEnvironment('t2', { name: 'env2' })

    const contracts = toSandboxEnvironmentContracts([e1, e2])
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].name, 'env1')
    assert.equal(contracts[1].name, 'env2')
  })
})
