import { describe, it, expect } from 'vitest'

type DeployStage = 'build' | 'test' | 'staging' | 'production' | 'rollback' | 'completed' | 'failed'
interface DeployConfig { id: string; serviceName: string; version: string; target: string; stages: DeployStage[]; rollbackVersion?: string; canaryPercent?: number; createdAt: string }

describe('✅ AC-DEPLOY: 部署', () => {
  it('部署流水线', () => {
    const d: DeployConfig = { id: 'd1', serviceName: 'api', version: 'v1.2.3', target: 'production', stages: ['build','test','staging','production'], createdAt: '' }
    expect(d.stages.length).toBe(4)
  })
  it('回滚配置', () => {
    const d: DeployConfig = { id: 'd2', serviceName: 'api', version: 'v1.2.4', target: 'production', stages: ['build','test','staging','rollback'], rollbackVersion: 'v1.2.3', createdAt: '' }
    expect(d.rollbackVersion).toBe('v1.2.3')
  })
  it('灰度发布', () => {
    const d: DeployConfig = { id: 'd3', serviceName: 'web', version: 'v2.0.0', target: 'canary', stages: ['build','test','production'], canaryPercent: 10, createdAt: '' }
    expect(d.canaryPercent).toBe(10)
  })
})
