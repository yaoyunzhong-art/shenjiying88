import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * e2e-auto-gen.dto.test.ts - DTO validation tests
 */
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  GenerateRequestDto,
  ExecuteRequestDto,
  CreateConfigRequestDto,
  UpdateConfigRequestDto,
} from './e2e-auto-gen.dto'

describe('GenerateRequestDto', () => {
  it('should validate a valid generate request', async () => {
    const dto = plainToInstance(GenerateRequestDto, {
      spec: '{"openapi":"3.0.0"}',
      outputDir: './tests',
      testFramework: 'vitest',
      enableE2E: true,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject missing spec field', async () => {
    const dto = plainToInstance(GenerateRequestDto, {
      testFramework: 'vitest',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((e) => e.property === 'spec')).toBe(true)
  })

  it('should reject invalid testFramework', async () => {
    const dto = plainToInstance(GenerateRequestDto, {
      spec: '{}',
      testFramework: 'mocha',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept dto with only spec', async () => {
    const dto = plainToInstance(GenerateRequestDto, {
      spec: '{"openapi":"3.0.0"}',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('ExecuteRequestDto', () => {
  it('should validate a valid execute request', async () => {
    const dto = plainToInstance(ExecuteRequestDto, {
      configId: 'cfg-1',
      timeoutMs: 30000,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject missing configId', async () => {
    const dto = plainToInstance(ExecuteRequestDto, { timeoutMs: 10000 })
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'configId')).toBe(true)
  })

  it('should reject too small timeoutMs', async () => {
    const dto = plainToInstance(ExecuteRequestDto, {
      configId: 'cfg-1',
      timeoutMs: 50, // below min 100
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept minimal execute request', async () => {
    const dto = plainToInstance(ExecuteRequestDto, {
      configId: 'cfg-1',
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('CreateConfigRequestDto', () => {
  it('should validate a valid create config request', async () => {
    const dto = plainToInstance(CreateConfigRequestDto, {
      projectName: 'Member API',
      specSource: './openapi.json',
      testFramework: 'vitest',
      enableE2E: true,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should reject missing required fields', async () => {
    const dto = plainToInstance(CreateConfigRequestDto, {})
    const errors = await validate(dto)
    expect(errors.some((e) => e.property === 'projectName')).toBe(true)
    expect(errors.some((e) => e.property === 'specSource')).toBe(true)
  })

  it('should accept with all optional fields', async () => {
    const dto = plainToInstance(CreateConfigRequestDto, {
      projectName: 'Full Config',
      specSource: 'https://api.example.com/openapi.json',
      outputDir: './e2e',
      testFramework: 'playwright',
      enableE2E: true,
      baseUrl: 'http://localhost:4000',
      authToken: 'token-abc',
      extraHeaders: { 'X-Custom': 'value' },
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('UpdateConfigRequestDto', () => {
  it('should validate partial update', async () => {
    const dto = plainToInstance(UpdateConfigRequestDto, {
      enabled: false,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('should accept full update', async () => {
    const dto = plainToInstance(UpdateConfigRequestDto, {
      projectName: 'Updated API',
      specSource: './v2/openapi.json',
      testFramework: 'jest',
      enabled: true,
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})
