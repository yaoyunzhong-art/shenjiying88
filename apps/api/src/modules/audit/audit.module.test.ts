/**
 * audit.module.test.ts - 审计日志 Module 测试
 */

import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { AuditModule } from './audit.module'
import { AuditService } from './audit.service'
import { AuditController } from './audit.controller'
import { AuditLogEntity } from './audit.entity'

describe('AuditModule', () => {
  let module: TestingModule

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AuditModule],
    })
      .overrideProvider(getRepositoryToken(AuditLogEntity))
      .useValue({})
      .compile()
  })

  it('✅ 正例: 模块可编译', () => {
    expect(module).toBeDefined()
  })

  it('✅ 正例: AuditService 可注入', () => {
    const service = module.get<AuditService>(AuditService)
    expect(service).toBeDefined()
    expect(service.log).toBeDefined()
  })

  it('✅ 正例: AuditController 可注入', () => {
    const controller = module.get<AuditController>(AuditController)
    expect(controller).toBeDefined()
  })
})
