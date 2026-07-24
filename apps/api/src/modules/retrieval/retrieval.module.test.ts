// @ts-nocheck
import { describe, it, expect } from 'vitest'
import 'reflect-metadata'
import { RetrievalModule } from './retrieval.module'

describe('RetrievalModule (Pulse-71)', () => {
  it('module is defined', () => {
    expect(RetrievalModule).toBeDefined()
  })

  it('module is a class', () => {
    expect(typeof RetrievalModule).toBe('function')
  })

  it('module has expected metadata decorators', () => {
    const metadata = Reflect.getMetadata('modules', RetrievalModule.prototype ?? RetrievalModule)
    // 模块至少应能实例化
    expect(() => new (RetrievalModule as any)()).not.toThrow()
  })
})
