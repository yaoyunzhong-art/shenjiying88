import { describe, it, expect } from 'vitest'
/**
 * sandbox.entity.test.ts
 *
 * Sandbox 实体类型定义测试。
 * sandbox.entity.ts re-exports types from sandbox-isv.service.ts.
 * 测试直接创建符合接口定义的对象并验证结构。
 */

import type {
  SandboxInstance,
  CodeExecutionResult,
  ISVApp,
  AppInstall,
  AppFilter,
  SDKPackage,
  SandboxStatus,
  CodeLanguage,
  AppStatus,
  AppCategory,
  SDKLanguage,
} from './sandbox-isv.service'

// ============================================================
// SandboxInstance
// ============================================================
describe('SandboxInstance', () => {
  const createInstance = (overrides: Partial<SandboxInstance> = {}): SandboxInstance => ({
    id: 'sb-001',
    appId: 'app-001',
    developerId: 'dev-001',
    status: 'RUNNING',
    language: 'javascript',
    createdAt: '2026-07-01T00:00:00.000Z',
    lastActiveAt: '2026-07-01T01:00:00.000Z',
    resources: { cpu: 1, memory: 512, disk: 1024 },
    ...overrides,
  })

  it('正例: 创建完整 SandboxInstance', () => {
    const s = createInstance()
    expect(s.id).toBe('sb-001')
    expect(s.appId).toBe('app-001')
    expect(s.developerId).toBe('dev-001')
    expect(s.status).toBe('RUNNING')
    expect(s.language).toBe('javascript')
    expect(s.resources.cpu).toBe(1)
    expect(s.resources.memory).toBe(512)
    expect(s.resources.disk).toBe(1024)
    expect(s.snapshot).toBeUndefined()
  })

  it('正例: 包含 snapshot 字段', () => {
    const s = createInstance({ snapshot: 'snap-v1' })
    expect(s.snapshot).toBe('snap-v1')
  })

  it('正例: 所有状态类型有效', () => {
    const statuses: SandboxStatus[] = ['PENDING', 'RUNNING', 'STOPPED', 'ERROR', 'DESTROYED']
    for (const status of statuses) {
      const s = createInstance({ status })
      expect(s.status).toBe(status)
    }
  })

  it('正例: 所有语言类型有效', () => {
    const langs: CodeLanguage[] = ['javascript', 'typescript', 'python', 'java', 'go', 'rust']
    for (const lang of langs) {
      const s = createInstance({ language: lang })
      expect(s.language).toBe(lang)
    }
  })

  it('正例: resources 字段类型正确', () => {
    const s = createInstance()
    expect(typeof s.resources.cpu).toBe('number')
    expect(typeof s.resources.memory).toBe('number')
    expect(typeof s.resources.disk).toBe('number')
  })

  it('边界: id/appId/developerId 为空字符串', () => {
    const s = createInstance({ id: '', appId: '', developerId: '' })
    expect(s.id).toBe('')
    expect(s.appId).toBe('')
    expect(s.developerId).toBe('')
  })
})

// ============================================================
// CodeExecutionResult
// ============================================================
describe('CodeExecutionResult', () => {
  it('正例: 创建成功结果', () => {
    const r: CodeExecutionResult = {
      success: true,
      output: 'hello world',
      executionTimeMs: 5,
      memoryUsedMB: 10,
    }
    expect(r.success).toBe(true)
    expect(r.output).toBe('hello world')
    expect(r.executionTimeMs).toBe(5)
    expect(r.memoryUsedMB).toBe(10)
    expect(r.error).toBeUndefined()
  })

  it('正例: 创建失败结果', () => {
    const r: CodeExecutionResult = {
      success: false,
      output: '',
      error: 'SyntaxError: unexpected token',
      executionTimeMs: 0,
      memoryUsedMB: 0,
    }
    expect(r.success).toBe(false)
    expect(r.error).toContain('SyntaxError')
  })

  it('边界: 超大执行时间', () => {
    const r: CodeExecutionResult = {
      success: true,
      output: '',
      executionTimeMs: 30000,
      memoryUsedMB: 1024,
    }
    expect(r.executionTimeMs).toBe(30000)
    expect(r.memoryUsedMB).toBe(1024)
  })
})

// ============================================================
// ISVApp
// ============================================================
describe('ISVApp', () => {
  const createApp = (overrides: Partial<ISVApp> = {}): ISVApp => ({
    id: 'app-001',
    name: 'CRM 插件',
    description: '客户管理',
    developerId: 'dev-001',
    category: 'CRM',
    status: 'PUBLISHED',
    version: '1.0.0',
    rating: 4.5,
    ratingCount: 10,
    installCount: 100,
    tags: ['crm', 'sales'],
    screenshots: ['https://cdn.example.com/ss1.png'],
    price: 0,
    isFree: true,
    publishedAt: '2026-06-01T00:00:00.000Z',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  })

  it('正例: 创建完整 ISVApp', () => {
    const app = createApp()
    expect(app.id).toBe('app-001')
    expect(app.name).toBe('CRM 插件')
    expect(app.category).toBe('CRM')
    expect(app.status).toBe('PUBLISHED')
    expect(app.tags).toContain('crm')
    expect(app.isFree).toBe(true)
  })

  it('正例: 所有分类类型有效', () => {
    const cats: AppCategory[] = ['CRM', 'MARKETING', 'ANALYTICS', 'PAYMENT', 'INVENTORY', 'HR', 'OTHER']
    for (const cat of cats) {
      const app = createApp({ category: cat })
      expect(app.category).toBe(cat)
    }
  })

  it('正例: 所有状态类型有效', () => {
    const statuses: AppStatus[] = ['DRAFT', 'PUBLISHED', 'SUSPENDED', 'DEPRECATED']
    for (const st of statuses) {
      const app = createApp({ status: st })
      expect(app.status).toBe(st)
    }
  })

  it('边界: publishedAt 可选', () => {
    const app = createApp({ publishedAt: undefined })
    expect(app.publishedAt).toBeUndefined()
  })

  it('边界: tags/screenshots 为空数组', () => {
    const app = createApp({ tags: [], screenshots: [] })
    expect(app.tags).toEqual([])
    expect(app.screenshots).toEqual([])
  })

  it('边界: 价格为负数', () => {
    const app = createApp({ price: -100 })
    expect(app.price).toBe(-100)
  })
})

// ============================================================
// AppInstall
// ============================================================
describe('AppInstall', () => {
  it('正例: 创建 AppInstall', () => {
    const inst: AppInstall = {
      id: 'install-001',
      appId: 'app-001',
      tenantId: 'tenant-001',
      installedAt: '2026-07-01T00:00:00.000Z',
      status: 'ACTIVE',
    }
    expect(inst.id).toBe('install-001')
    expect(inst.status).toBe('ACTIVE')
    expect(inst.tenantId).toBe('tenant-001')
  })

  it('正例: 所有安装状态有效', () => {
    const statuses: AppInstall['status'][] = ['ACTIVE', 'DISABLED', 'UNINSTALLED']
    for (const st of statuses) {
      const inst: AppInstall = {
        id: 'i-001', appId: 'a-001', tenantId: 't-001',
        installedAt: '2026-07-01T00:00:00.000Z', status: st,
      }
      expect(inst.status).toBe(st)
    }
  })
})

// ============================================================
// AppFilter
// ============================================================
describe('AppFilter', () => {
  it('正例: 空的 AppFilter', () => {
    const f: AppFilter = {}
    expect(Object.keys(f)).toHaveLength(0)
  })

  it('正例: 完整过滤条件', () => {
    const f: AppFilter = {
      category: 'CRM',
      status: 'PUBLISHED',
      developerId: 'dev-001',
      keyword: 'crm',
    }
    expect(f.category).toBe('CRM')
    expect(f.keyword).toBe('crm')
  })
})

// ============================================================
// SDKPackage
// ============================================================
describe('SDKPackage', () => {
  it('正例: 创建 SDKPackage', () => {
    const pkg: SDKPackage = {
      language: 'nodejs',
      version: '1.0.0',
      downloadURL: 'https://cdn.isv.com/sdk/app-001/nodejs/1.0.0.tar.gz',
      size: 102400,
      checksum: 'sha256-abc123',
      generatedAt: '2026-07-01T00:00:00.000Z',
    }
    expect(pkg.language).toBe('nodejs')
    expect(pkg.size).toBe(102400)
    expect(pkg.downloadURL).toContain('cdn.isv.com')
  })

  it('正例: 所有 SDK 语言有效', () => {
    const langs: SDKLanguage[] = ['nodejs', 'python', 'java', 'go']
    for (const lang of langs) {
      const pkg: SDKPackage = {
        language: lang,
        version: '1.0.0',
        downloadURL: `https://cdn.isv.com/sdk/app-001/${lang}/1.0.0.tar.gz`,
        size: 102400,
        checksum: `sha256-${lang}`,
        generatedAt: '2026-07-01T00:00:00.000Z',
      }
      expect(pkg.language).toBe(lang)
    }
  })

  it('边界: size 为 0', () => {
    const pkg: SDKPackage = {
      language: 'java',
      version: '0.0.0',
      downloadURL: '',
      size: 0,
      checksum: '',
      generatedAt: '2026-07-01T00:00:00.000Z',
    }
    expect(pkg.size).toBe(0)
    expect(pkg.downloadURL).toBe('')
  })
})
