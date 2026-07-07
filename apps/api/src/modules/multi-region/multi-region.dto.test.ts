import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * multi-region.dto.test.ts
 * 用途: 多区域 DTO 验证测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  RegisterEndpointDto,
  RouteQueryDto,
  PinTenantDto,
  SetHealthDto,
  CheckHealthDto,
  FailoverCheckDto,
  ConfigureFailoverDto,
  CanMigrateDto,
} from './multi-region.dto'

describe('MultiRegionDto', () => {

  it('RegisterEndpointDto accepts valid body', () => {
    const dto = new RegisterEndpointDto()
    dto.region = 'cn'
    dto.baseUrl = 'https://api-cn.example.com'
    assert.equal(dto.region, 'cn')
    assert.equal(dto.baseUrl, 'https://api-cn.example.com')
  })

  it('RouteQueryDto accepts valid query', () => {
    const dto = new RouteQueryDto()
    dto.clientIp = '10.0.0.1'
    dto.tenantId = 't-1'
    assert.equal(dto.clientIp, '10.0.0.1')
    assert.equal(dto.tenantId, 't-1')
  })

  it('RouteQueryDto works without optional tenantId', () => {
    const dto = new RouteQueryDto()
    dto.clientIp = '192.168.1.1'
    assert.equal(dto.clientIp, '192.168.1.1')
    assert.equal(dto.tenantId, undefined)
  })

  it('PinTenantDto accepts valid body', () => {
    const dto = new PinTenantDto()
    dto.tenantId = 't-42'
    dto.region = 'eu'
    assert.equal(dto.tenantId, 't-42')
    assert.equal(dto.region, 'eu')
  })

  it('SetHealthDto accepts valid statuses', () => {
    const healthy = new SetHealthDto()
    healthy.region = 'cn'
    healthy.status = 'healthy'
    assert.equal(healthy.status, 'healthy')

    const degraded = new SetHealthDto()
    degraded.region = 'us'
    degraded.status = 'degraded'
    assert.equal(degraded.status, 'degraded')

    const down = new SetHealthDto()
    down.region = 'jp'
    down.status = 'down'
    assert.equal(down.status, 'down')
  })

  it('CheckHealthDto accepts valid region', () => {
    const dto = new CheckHealthDto()
    dto.region = 'eu'
    assert.equal(dto.region, 'eu')
  })

  it('FailoverCheckDto works with optional fields', () => {
    const withRegion = new FailoverCheckDto()
    withRegion.region = 'cn'
    withRegion.forceOk = true
    assert.equal(withRegion.region, 'cn')
    assert.equal(withRegion.forceOk, true)

    const empty = new FailoverCheckDto()
    assert.equal(empty.region, undefined)
    assert.equal(empty.forceOk, undefined)
  })

  it('ConfigureFailoverDto accepts valid config', () => {
    const dto = new ConfigureFailoverDto()
    dto.failureThreshold = 5
    dto.checkIntervalMs = 5000
    assert.equal(dto.failureThreshold, 5)
    assert.equal(dto.checkIntervalMs, 5000)
  })

  it('CanMigrateDto accepts valid fields', () => {
    const dto = new CanMigrateDto()
    dto.tenantId = 't-gdpr'
    dto.targetRegion = 'eu'
    assert.equal(dto.tenantId, 't-gdpr')
    assert.equal(dto.targetRegion, 'eu')
  })
})
