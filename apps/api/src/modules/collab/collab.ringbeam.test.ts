import { describe, it, assert } from 'vitest'
import 'reflect-metadata'
import fs from 'node:fs'
import path from 'node:path'

const moduleDir = path.resolve(__dirname)

describe('Collab 圈梁检查', () => {
  it('① entity 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'collab.entity.ts')))
  })
  it('② dto 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'collab.dto.ts')))
  })
  it('③ contract 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'collab.contract.ts')))
  })
  it('④ service 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'collab.service.ts')))
  })
  it('⑤ controller 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'collab.controller.ts')))
  })
  it('⑥ module 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'collab.module.ts')))
  })
  it('⑦ controller test 文件存在', () => {
    assert.ok(fs.existsSync(path.join(moduleDir, 'collab.controller.test.ts')))
  })
  it('⑧ PRD 文件存在', () => {
    const prdPath = path.resolve(__dirname, '../../../../../docs/knowledge/prd/v23/v23-prd-collab-management.md')
    assert.ok(fs.existsSync(prdPath))
  })
  it('⑨ Controller 有 @UseGuards(TenantGuard)', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'collab.controller.ts'), 'utf-8')
    assert.ok(content.includes('UseGuards(TenantGuard)'))
  })
  it('⑩ Controller 有 POST /', () => {
    // 使用 route metadata 检查（通过 import 代替 require 以支持 ESM）
    const content = fs.readFileSync(path.join(moduleDir, 'collab.controller.ts'), 'utf-8')
    assert.ok(content.includes('@Post()'), 'has @Post() decorator')
  })
  it('⑪ Controller 有 GET /', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'collab.controller.ts'), 'utf-8')
    assert.ok(content.includes('@Get()'), 'has @Get() on findAll')
  })
  it('⑫ Controller 有 DELETE /:projectId', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'collab.controller.ts'), 'utf-8')
    assert.ok(content.includes('@Delete(\':projectId\')') || content.includes('@Delete(":projectId")'), 'has @Delete() route')
  })
  it('⑬ 测试文件 ≥ 15 it blocks', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'collab.controller.test.ts'), 'utf-8')
    const itBlocks = content.match(/\bit\(['"`]/g)
    assert.ok(itBlocks && itBlocks.length >= 15, `Found ${itBlocks?.length ?? 0} it blocks, expected ≥ 15`)
  })
  it('⑭ Entity 包含 CollabProject 接口', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'collab.entity.ts'), 'utf-8')
    assert.ok(content.includes('export interface CollabProject'))
  })
  it('⑮ Entity 包含 CollabStatus 枚举', () => {
    const content = fs.readFileSync(path.join(moduleDir, 'collab.entity.ts'), 'utf-8')
    assert.ok(content.includes('export enum CollabStatus'))
  })
})
