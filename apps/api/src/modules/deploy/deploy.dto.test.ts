// deploy.dto.test.ts · 部署模块 DTO 测试
// 🐜 自动: [deploy] [A] dto补全

import { describe, it, expect } from 'vitest'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  GeneratePlanDto,
  DeployPlanDto,
  ServerSpecDto,
  CostQueryDto,
  ResourceQueryDto,
  PlanOptionsDto,
} from './deploy.dto'

// ─── GeneratePlanDto ────────────────────────────────────────────

describe('GeneratePlanDto', () => {
  it('should accept valid generate plan payload', async () => {
    const input = { mode: 'single', size: 'medium' }

    const dto = plainToInstance(GeneratePlanDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.mode).toBe('single')
    expect(dto.size).toBe('medium')
  })

  it('should accept all valid deployment modes', async () => {
    for (const mode of ['single', 'cluster', 'kubernetes'] as const) {
      const dto = plainToInstance(GeneratePlanDto, { mode, size: 'small' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    }
  })

  it('should accept all valid resource sizes', async () => {
    for (const size of ['small', 'medium', 'large', 'xlarge'] as const) {
      const dto = plainToInstance(GeneratePlanDto, { mode: 'single', size })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    }
  })

  it('should reject invalid deployment mode', async () => {
    const input = { mode: 'invalid', size: 'medium' }

    const dto = plainToInstance(GeneratePlanDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it('should reject invalid resource size', async () => {
    const input = { mode: 'single', size: 'tiny' }

    const dto = plainToInstance(GeneratePlanDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it('should reject missing required fields', async () => {
    const input = {}

    const dto = plainToInstance(GeneratePlanDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })

  it('should reject empty strings', async () => {
    const input = { mode: '', size: '' }

    const dto = plainToInstance(GeneratePlanDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })

  it('should accept optional PlanOptions', async () => {
    const input = {
      mode: 'single',
      size: 'large',
      options: { enableSSL: true, enableMonitoring: true },
    }

    const dto = plainToInstance(GeneratePlanDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

// ─── ServerSpecDto ──────────────────────────────────────────────

describe('ServerSpecDto', () => {
  it('should accept valid server spec', async () => {
    const input = {
      cpu: '4 cores',
      memory: '8GB',
      storage: '200GB SSD',
      os: 'Ubuntu 22.04',
    }

    const dto = plainToInstance(ServerSpecDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should accept optional network fields', async () => {
    const input = {
      cpu: '2 cores',
      memory: '4GB',
      storage: '50GB',
      os: 'CentOS 9',
      privateNetwork: false,
      publicIP: true,
    }

    const dto = plainToInstance(ServerSpecDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.publicIP).toBe(true)
  })

  it('should reject missing required fields', async () => {
    const input = { cpu: '4 cores' }

    const dto = plainToInstance(ServerSpecDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(3) // memory, storage, os missing
  })

  it('should reject empty required strings', async () => {
    const input = { cpu: '', memory: '', storage: '', os: '' }

    const dto = plainToInstance(ServerSpecDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(4)
  })
})

// ─── CostQueryDto ───────────────────────────────────────────────

describe('CostQueryDto', () => {
  it('should accept valid cost query', async () => {
    const input = { size: 'large', mode: 'cluster' }

    const dto = plainToInstance(CostQueryDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid mode in cost query', async () => {
    const input = { size: 'medium', mode: 'hybrid' }

    const dto = plainToInstance(CostQueryDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })

  it('should reject missing fields', async () => {
    const input = { size: 'small' }

    const dto = plainToInstance(CostQueryDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── ResourceQueryDto ───────────────────────────────────────────

describe('ResourceQueryDto', () => {
  it('should accept valid resource query', async () => {
    const input = { size: 'xlarge', mode: 'kubernetes' }

    const dto = plainToInstance(ResourceQueryDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject invalid size', async () => {
    const input = { size: 'maxi', mode: 'single' }

    const dto = plainToInstance(ResourceQueryDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── DeployPlanDto ──────────────────────────────────────────────

describe('DeployPlanDto', () => {
  it('should accept valid plan id', async () => {
    const input = { planId: 'plan-abc123' }

    const dto = plainToInstance(DeployPlanDto, input)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty plan id', async () => {
    const input = { planId: '' }

    const dto = plainToInstance(DeployPlanDto, input)
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(1)
  })
})
