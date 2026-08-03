/**
 * E2E 补充: 财务模块源码结构验证 (Vitest 版)
 * 验证 service/controller/entity/dto 文件存在且包含关键字段
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MODULE_DIR = path.resolve(__dirname || process.cwd())
const SF = path.join(MODULE_DIR, 'finance.service.ts')
const CF = path.join(MODULE_DIR, 'finance.controller.ts')

describe('P-38 财务 E2E 补充: 源码结构验证', () => {
  it('service 存在', () => {
    expect(fs.existsSync(SF)).toBe(true)
  })
  it('service 有账期', () => {
    const c = fs.readFileSync(SF, 'utf-8')
    expect(c).toContain('period')
  })
  it('service 有结算', () => {
    const c = fs.readFileSync(SF, 'utf-8')
    expect(c.toLowerCase()).toContain('settlement')
  })
  it('service 有发票', () => {
    const c = fs.readFileSync(SF, 'utf-8')
    expect(c.toLowerCase()).toContain('invoice')
  })
  it('service 有租户隔离', () => {
    const c = fs.readFileSync(SF, 'utf-8')
    expect(c.toLowerCase()).toContain('tenant')
  })
  it('service 有退款', () => {
    const c = fs.readFileSync(SF, 'utf-8')
    expect(c).toMatch(/[Rr]efund|REFUND/)
  })
  it('service 无as any', () => {
    const c = fs.readFileSync(SF, 'utf-8')
    expect(c).not.toContain(' as any')
  })
  it('controller 存在', () => {
    expect(fs.existsSync(CF)).toBe(true)
  })
  it('controller 有单例端点', () => {
    const c = fs.readFileSync(CF, 'utf-8')
    expect(c).toMatch(/@(Get|Post|Delete)/)
  })
  it('entity 存在', () => {
    expect(fs.existsSync(path.join(MODULE_DIR, 'finance.entity.ts'))).toBe(true)
  })
  it('entity 有结算状态', () => {
    const c = fs.readFileSync(path.join(MODULE_DIR, 'finance.entity.ts'), 'utf-8')
    expect(c.toLowerCase()).toContain('settlement')
  })
  it('entity 有发票状态', () => {
    const c = fs.readFileSync(path.join(MODULE_DIR, 'finance.entity.ts'), 'utf-8')
    expect(c.toLowerCase()).toContain('invoice')
  })
  it('entity 有租户ID', () => {
    const c = fs.readFileSync(path.join(MODULE_DIR, 'finance.entity.ts'), 'utf-8')
    expect(c).toContain('tenantId')
  })
  it('dto 存在', () => {
    expect(fs.existsSync(path.join(MODULE_DIR, 'finance.dto.ts'))).toBe(true)
  })
  it('dto 有结算dto', () => {
    const c = fs.readFileSync(path.join(MODULE_DIR, 'finance.dto.ts'), 'utf-8')
    expect(c).toContain('Settlement')
  })
})
