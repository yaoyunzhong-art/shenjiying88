import { describe, it, expect } from 'vitest'
/**
 * sandbox.dto.test.ts
 *
 * Sandbox DTO 单元测试。
 * DTO 类使用 plain property assignments (无 class-validator 装饰器),
 * 测试侧重于实例化、类型和序列化。
 */

import {
  CreateSandboxDto,
  ExecuteCodeDto,
  SandboxResponseDto,
  CodeExecutionResponseDto,
  PublishAppDto,
  InstallAppDto,
  RateAppDto,
  AppFilterDto,
  AppResponseDto,
  AppInstallResponseDto,
  GenerateSDKDto,
  SDKResponseDto,
} from './sandbox.dto'

// ============================================================
// CreateSandboxDto
// ============================================================
describe('CreateSandboxDto', () => {
  it('正例: 创建完整 DTO', () => {
    const dto = new CreateSandboxDto()
    dto.appId = 'app-001'
    dto.developerId = 'dev-001'
    expect(dto.appId).toBe('app-001')
    expect(dto.developerId).toBe('dev-001')
  })

  it('边界: appId/developerId 为空字符串', () => {
    const dto = new CreateSandboxDto()
    dto.appId = ''
    dto.developerId = ''
    expect(dto.appId).toBe('')
    expect(dto.developerId).toBe('')
  })
})

// ============================================================
// ExecuteCodeDto
// ============================================================
describe('ExecuteCodeDto', () => {
  it('正例: 创建完整 DTO', () => {
    const dto = new ExecuteCodeDto()
    dto.code = 'console.log("hi")'
    dto.language = 'javascript'
    expect(dto.code).toBe('console.log("hi")')
    expect(dto.language).toBe('javascript')
  })

  it('边界: 空代码', () => {
    const dto = new ExecuteCodeDto()
    dto.code = ''
    dto.language = 'python'
    expect(dto.code).toBe('')
    expect(dto.language).toBe('python')
  })

  it('边界: 所有语言类型', () => {
    const langs = ['javascript', 'typescript', 'python', 'java', 'go', 'rust'] as const
    for (const lang of langs) {
      const dto = new ExecuteCodeDto()
      dto.code = 'test'
      dto.language = lang
      expect(dto.language).toBe(lang)
    }
  })
})

// ============================================================
// SandboxResponseDto
// ============================================================
describe('SandboxResponseDto', () => {
  it('正例: 完整响应', () => {
    const dto = new SandboxResponseDto()
    dto.id = 'sb-001'
    dto.appId = 'app-001'
    dto.developerId = 'dev-001'
    dto.status = 'RUNNING'
    dto.language = 'javascript'
    dto.createdAt = '2026-07-01T00:00:00.000Z'
    dto.lastActiveAt = '2026-07-01T01:00:00.000Z'
    dto.resources = { cpu: 1, memory: 512, disk: 1024 }
    expect(dto.id).toBe('sb-001')
    expect(dto.resources.cpu).toBe(1)
    expect(dto.resources.memory).toBe(512)
    expect(dto.resources.disk).toBe(1024)
  })

  it('正例: snapshot 可选', () => {
    const dto = new SandboxResponseDto()
    dto.id = 'sb-002'
    dto.appId = 'app-002'
    dto.developerId = 'dev-002'
    dto.status = 'STOPPED'
    dto.language = 'python'
    dto.createdAt = '2026-07-01T00:00:00.000Z'
    dto.lastActiveAt = '2026-07-01T01:00:00.000Z'
    dto.resources = { cpu: 1, memory: 512, disk: 1024 }
    dto.snapshot = 'snap-v2'
    expect(dto.snapshot).toBe('snap-v2')
  })

  it('边界: 所有状态值', () => {
    const statuses = ['PENDING', 'RUNNING', 'STOPPED', 'ERROR', 'DESTROYED']
    for (const s of statuses) {
      const dto = new SandboxResponseDto()
      dto.id = 'sb-x'
      dto.appId = 'a-x'
      dto.developerId = 'd-x'
      dto.status = s
      dto.language = 'javascript'
      dto.createdAt = ''
      dto.lastActiveAt = ''
      dto.resources = { cpu: 0, memory: 0, disk: 0 }
      expect(dto.status).toBe(s)
    }
  })
})

// ============================================================
// CodeExecutionResponseDto
// ============================================================
describe('CodeExecutionResponseDto', () => {
  it('正例: 成功响应', () => {
    const dto = new CodeExecutionResponseDto()
    dto.success = true
    dto.output = 'hello'
    dto.executionTimeMs = 5
    dto.memoryUsedMB = 10
    expect(dto.success).toBe(true)
    expect(dto.output).toBe('hello')
    expect(dto.executionTimeMs).toBe(5)
  })

  it('正例: 失败响应含 error', () => {
    const dto = new CodeExecutionResponseDto()
    dto.success = false
    dto.output = ''
    dto.error = 'SyntaxError'
    dto.executionTimeMs = 0
    dto.memoryUsedMB = 0
    expect(dto.success).toBe(false)
    expect(dto.error).toBe('SyntaxError')
  })

  it('边界: executionTimeMs/memoryUsedMB 为 0', () => {
    const dto = new CodeExecutionResponseDto()
    dto.success = true
    dto.output = ''
    dto.executionTimeMs = 0
    dto.memoryUsedMB = 0
    expect(dto.executionTimeMs).toBe(0)
    expect(dto.memoryUsedMB).toBe(0)
  })
})

// ============================================================
// PublishAppDto
// ============================================================
describe('PublishAppDto', () => {
  it('正例: 创建完整 DTO', () => {
    const dto = new PublishAppDto()
    dto.name = 'CRM 插件'
    dto.description = '客户管理工具'
    dto.developerId = 'dev-001'
    dto.category = 'CRM'
    dto.version = '1.0.0'
    dto.tags = ['crm']
    dto.screenshots = ['https://cdn.example.com/ss1.png']
    dto.price = 0
    dto.isFree = true
    expect(dto.name).toBe('CRM 插件')
    expect(dto.category).toBe('CRM')
    expect(dto.isFree).toBe(true)
    expect(dto.tags).toContain('crm')
  })

  it('正例: tags/screenshots 缺省', () => {
    const dto = new PublishAppDto()
    dto.name = 'Minimal App'
    dto.description = 'desc'
    dto.developerId = 'dev-001'
    dto.category = 'OTHER'
    dto.version = '1.0.0'
    dto.price = 100
    dto.isFree = false
    expect(dto.name).toBe('Minimal App')
    expect(dto.price).toBe(100)
    expect(dto.isFree).toBe(false)
  })

  it('边界: 所有分类类型', () => {
    const cats: PublishAppDto['category'][] = ['CRM', 'MARKETING', 'ANALYTICS', 'PAYMENT', 'INVENTORY', 'HR', 'OTHER']
    for (const cat of cats) {
      const dto = new PublishAppDto()
      dto.name = 'App'
      dto.description = 'd'
      dto.developerId = 'd1'
      dto.category = cat
      dto.version = '1.0'
      dto.price = 0
      dto.isFree = true
      expect(dto.category).toBe(cat)
    }
  })
})

// ============================================================
// InstallAppDto
// ============================================================
describe('InstallAppDto', () => {
  it('正例: 创建 DTO', () => {
    const dto = new InstallAppDto()
    dto.tenantId = 'tenant-001'
    expect(dto.tenantId).toBe('tenant-001')
  })

  it('边界: 空 tenantId', () => {
    const dto = new InstallAppDto()
    dto.tenantId = ''
    expect(dto.tenantId).toBe('')
  })
})

// ============================================================
// RateAppDto
// ============================================================
describe('RateAppDto', () => {
  it('正例: 有效评分', () => {
    const dto = new RateAppDto()
    dto.rating = 5
    expect(dto.rating).toBe(5)
  })

  it('边界: 最低评分', () => {
    const dto = new RateAppDto()
    dto.rating = 1
    expect(dto.rating).toBe(1)
  })

  it('边界: 评分 0 (无效 but 类型允许)', () => {
    const dto = new RateAppDto()
    dto.rating = 0
    expect(dto.rating).toBe(0)
  })
})

// ============================================================
// AppFilterDto
// ============================================================
describe('AppFilterDto', () => {
  it('正例: 全部可选字段', () => {
    const dto = new AppFilterDto()
    dto.category = 'CRM'
    dto.status = 'PUBLISHED'
    dto.developerId = 'dev-001'
    dto.keyword = 'crm'
    expect(dto.category).toBe('CRM')
    expect(dto.keyword).toBe('crm')
  })

  it('正例: 空过滤 (全部缺省)', () => {
    const dto = new AppFilterDto()
    expect(dto.category).toBeUndefined()
    expect(dto.status).toBeUndefined()
    expect(dto.developerId).toBeUndefined()
    expect(dto.keyword).toBeUndefined()
  })
})

// ============================================================
// AppResponseDto
// ============================================================
describe('AppResponseDto', () => {
  it('正例: 完整响应', () => {
    const dto = new AppResponseDto()
    dto.id = 'app-001'
    dto.name = 'CRM 插件'
    dto.description = '客户管理'
    dto.developerId = 'dev-001'
    dto.category = 'CRM'
    dto.status = 'PUBLISHED'
    dto.version = '1.0.0'
    dto.rating = 4.5
    dto.ratingCount = 10
    dto.installCount = 100
    dto.tags = ['crm']
    dto.screenshots = ['https://cdn.example.com/ss1.png']
    dto.price = 0
    dto.isFree = true
    dto.createdAt = '2026-07-01T00:00:00.000Z'
    dto.updatedAt = '2026-07-01T00:00:00.000Z'
    expect(dto.id).toBe('app-001')
    expect(dto.rating).toBe(4.5)
    expect(dto.installCount).toBe(100)
  })

  it('正例: publishedAt 可选', () => {
    const dto = new AppResponseDto()
    dto.id = 'app-002'
    dto.name = 'Minimal'
    dto.description = 'd'
    dto.developerId = 'd1'
    dto.category = 'OTHER'
    dto.status = 'DRAFT'
    dto.version = '1.0'
    dto.rating = 0
    dto.ratingCount = 0
    dto.installCount = 0
    dto.tags = []
    dto.screenshots = []
    dto.price = 0
    dto.isFree = true
    dto.createdAt = ''
    dto.updatedAt = ''
    expect(dto.publishedAt).toBeUndefined()
  })
})

// ============================================================
// AppInstallResponseDto
// ============================================================
describe('AppInstallResponseDto', () => {
  it('正例: 完整响应', () => {
    const dto = new AppInstallResponseDto()
    dto.id = 'install-001'
    dto.appId = 'app-001'
    dto.tenantId = 'tenant-001'
    dto.installedAt = '2026-07-01T00:00:00.000Z'
    dto.status = 'ACTIVE'
    expect(dto.id).toBe('install-001')
    expect(dto.status).toBe('ACTIVE')
  })
})

// ============================================================
// GenerateSDKDto
// ============================================================
describe('GenerateSDKDto', () => {
  it('正例: 创建 DTO', () => {
    const dto = new GenerateSDKDto()
    dto.language = 'nodejs'
    expect(dto.language).toBe('nodejs')
  })

  it('边界: 所有 SDK 语言', () => {
    const langs: GenerateSDKDto['language'][] = ['nodejs', 'python', 'java', 'go']
    for (const lang of langs) {
      const dto = new GenerateSDKDto()
      dto.language = lang
      expect(dto.language).toBe(lang)
    }
  })
})

// ============================================================
// SDKResponseDto
// ============================================================
describe('SDKResponseDto', () => {
  it('正例: 完整响应', () => {
    const dto = new SDKResponseDto()
    dto.language = 'nodejs'
    dto.version = '1.0.0'
    dto.downloadURL = 'https://cdn.isv.com/sdk/app-001/nodejs/1.0.0.tar.gz'
    dto.size = 102400
    dto.checksum = 'sha256-abc'
    dto.generatedAt = '2026-07-01T00:00:00.000Z'
    expect(dto.language).toBe('nodejs')
    expect(dto.size).toBe(102400)
    expect(dto.downloadURL).toContain('cdn.isv.com')
  })

  it('边界: size 为 0', () => {
    const dto = new SDKResponseDto()
    dto.language = 'go'
    dto.version = '0.0.0'
    dto.downloadURL = ''
    dto.size = 0
    dto.checksum = ''
    dto.generatedAt = ''
    expect(dto.size).toBe(0)
    expect(dto.checksum).toBe('')
  })
})
