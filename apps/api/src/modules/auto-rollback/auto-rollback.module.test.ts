import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { AutoRollbackModule } from './auto-rollback.module'
import { AutoRollbackController } from './auto-rollback.controller'
import { AutoRollbackService } from './auto-rollback.service'

describe('AutoRollbackModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [AutoRollbackModule],
    }).compile()

    expect(module).toBeDefined()
    expect(module.get(AutoRollbackController)).toBeInstanceOf(AutoRollbackController)
    expect(module.get(AutoRollbackService)).toBeInstanceOf(AutoRollbackService)
  })

  it('should export AutoRollbackService', async () => {
    const module = await Test.createTestingModule({
      imports: [AutoRollbackModule],
    }).compile()

    const exported = module.get(AutoRollbackService)
    expect(exported.trigger).toBeTypeOf('function')
    expect(exported.confirm).toBeTypeOf('function')
    expect(exported.cancel).toBeTypeOf('function')
  })
})
