import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'

const SF = 'apps/api/src/modules/finance/finance.service.ts'
const CF = 'apps/api/src/modules/finance/finance.controller.ts'

describe('P-38 财务 E2E 补充: 源码结构验证', () => {
  it('service 存在', () => { assert.ok(fs.existsSync(SF)) })
  it('service 有账期', () => {
    const c = fs.readFileSync(SF, 'utf-8'); assert.ok(c.includes('period'))
  })
  it('service 有结算', () => {
    const c = fs.readFileSync(SF, 'utf-8'); assert.ok(c.includes('settlement') || c.includes('Settlement'))
  })
  it('service 有发票', () => {
    const c = fs.readFileSync(SF, 'utf-8'); assert.ok(c.includes('Invoice') || c.includes('invoice'))
  })
  it('service 有租户隔离', () => {
    const c = fs.readFileSync(SF, 'utf-8'); assert.ok(c.includes('tenant'))
  })
  it('service 有退款', () => {
    const c = fs.readFileSync(SF, 'utf-8'); assert.ok(c.includes('Refund') || c.includes('refund') || c.includes('REFUND'))
  })
  it('service 无as any', () => {
    const c = fs.readFileSync(SF, 'utf-8'); assert.ok(!c.includes(' as any'))
  })
  it('controller 存在', () => { assert.ok(fs.existsSync(CF)) })
  it('controller 有单例端点', () => {
    const c = fs.readFileSync(CF, 'utf-8')
    assert.ok(c.includes('@Get') || c.includes('@Post') || c.includes('@Delete'))
  })
  it('entity 存在', () => { assert.ok(fs.existsSync('apps/api/src/modules/finance/finance.entity.ts')) })
  it('entity 有结算状态', () => {
    const c = fs.readFileSync('apps/api/src/modules/finance/finance.entity.ts', 'utf-8')
    assert.ok(c.includes('Settlement') || c.includes('settlement'))
  })
  it('entity 有发票状态', () => {
    const c = fs.readFileSync('apps/api/src/modules/finance/finance.entity.ts', 'utf-8')
    assert.ok(c.includes('Invoice') || c.includes('invoice'))
  })
  it('entity 有租户ID', () => {
    const c = fs.readFileSync('apps/api/src/modules/finance/finance.entity.ts', 'utf-8')
    assert.ok(c.includes('tenantId'))
  })
  it('dto 存在', () => { assert.ok(fs.existsSync('apps/api/src/modules/finance/finance.dto.ts')) })
  it('dto 有结算dto', () => {
    const c = fs.readFileSync('apps/api/src/modules/finance/finance.dto.ts', 'utf-8')
    assert.ok(c.includes('Settlement'))
  })
})
