import { describe, it, assert } from 'vitest'
import 'reflect-metadata'
import fs from 'node:fs'
import path from 'node:path'

const moduleDir = path.resolve(__dirname)

describe('Royalty 圈梁检查', () => {
  it('① entity 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'royalty.entity.ts')))
  })
  it('② dto 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'dto/royalty.dto.ts')))
  })
  it('③ contract 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'royalty.contract.ts')))
  })
  it('④ service 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'royalty.service.ts')))
  })
  it('⑤ controller 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'royalty.controller.ts')))
  })
  it('⑥ module 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'royalty.module.ts')))
  })
  it('⑦ service test 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'royalty.service.test.ts')))
  })
  it('⑧ controller test 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'royalty.controller.test.ts')))
  })
  it('⑨ PRD 文件存在', () => {
    const prdPath = path.resolve(__dirname, '../../../../../docs/knowledge/prd/v23/royalty.md')
    assert.ok(fs.existsSync(prdPath))
  })
  it('⑩ Controller 有 @UseGuards(TenantGuard)', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.controller.ts'), 'utf-8')
    assert.ok(content.includes('UseGuards(TenantGuard)'))
  })
  it('⑪ Controller 有 POST rules/', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.controller.ts'), 'utf-8')
    assert.ok(content.includes("@Post('rules')") || content.includes('@Post("rules")'), 'has @Post() for rules')
  })
  it('⑫ Controller 有 GET rules/', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.controller.ts'), 'utf-8')
    assert.ok(content.includes("@Get('rules')") || content.includes('@Get("rules")'), 'has @Get() on findAllRules')
  })
  it('⑬ Controller 有 POST calculate/', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.controller.ts'), 'utf-8')
    assert.ok(content.includes("@Post('calculate')") || content.includes('@Post("calculate")'), 'has @Post() for calculate')
  })
  it('⑭ Service 有 calculate 方法', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.service.ts'), 'utf-8')
    assert.ok(content.includes('calculate('), 'has calculate method')
  })
  it('⑮ Entity 包含 RoyaltyRule 接口', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.entity.ts'), 'utf-8')
    assert.ok(content.includes('export interface RoyaltyRule'))
  })
  it('⑯ Entity 包含 RoyaltyType 枚举', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.entity.ts'), 'utf-8')
    assert.ok(content.includes('export enum RoyaltyType'))
  })
  it('⑰ Entity 包含 RoyaltyCalculation 实体', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.entity.ts'), 'utf-8')
    assert.ok(content.includes('export interface RoyaltyCalculation'))
  })
  it('⑱ Service 测试 ≥ 15 it blocks', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'royalty.service.test.ts'), 'utf-8')
    const itBlocks = content.match(/\bit\(['"`]/g)
    assert.ok(itBlocks && itBlocks.length >= 15, `Found ${itBlocks?.length ?? 0} it blocks, expected ≥ 15`)
  })
})
