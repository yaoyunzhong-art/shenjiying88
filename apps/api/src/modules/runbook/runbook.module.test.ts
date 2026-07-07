// runbook.module.test.ts - 运维手册模块测试
import { describe, it, expect } from 'vitest'
import { RunbookModule } from './runbook.module'

describe('RunbookModule', () => {
  it('应正确创建模块', () => {
    const module = new RunbookModule()
    expect(module).toBeDefined()
  })

  it('应导出 RunbookService', () => {
    const module = new RunbookModule()
    // 通过模块元数据验证
    const metadata = Reflect.getMetadata('exports', RunbookModule)
    expect(metadata).toBeDefined()
    const serviceName = metadata.find((m: any) => m?.name === 'RunbookService')
    expect(serviceName).toBeDefined()
  })
})
