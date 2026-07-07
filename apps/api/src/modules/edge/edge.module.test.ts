// Mock the pg dependency before any other imports
import { vi } from 'vitest'
vi.mock('pg', () => {
  const Pool = vi.fn(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  }))
  return { Pool, default: { Pool } }
})

import { describe, it, expect } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { EdgeModule } from './edge.module'
import { EdgeController } from './edge.controller'

describe('EdgeModule', () => {
  it('模块应正确创建', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EdgeModule],
    }).compile()

    expect(module).toBeDefined()
  })

  it('控制器应正确提供', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EdgeModule],
    }).compile()

    const controller = module.get(EdgeController)
    expect(controller).toBeDefined()
  })

  it('模块导出应包含所需服务', () => {
    const metadata = Reflect.getMetadata('exports', EdgeModule)
    expect(metadata).toBeDefined()
    expect(Array.isArray(metadata)).toBe(true)
    expect(metadata.length).toBeGreaterThan(0)
  })
})
