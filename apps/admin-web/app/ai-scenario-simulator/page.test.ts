import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const projectRoot = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/ai-scenario-simulator'
const pageSource = fs.readFileSync(`${projectRoot}/page.tsx`, 'utf8')
const dataSource = fs.readFileSync(`${projectRoot}/ai-scenario-simulator-data.ts`, 'utf8')

describe('AiScenarioSimulatorPage 源码固证', () => {
  test('页面文件存在且为服务端 wrapper', () => {
    assert.ok(fs.existsSync(`${projectRoot}/page.tsx`))
    assert.match(pageSource, /export default async function AiScenarioSimulatorPage/)
    assert.match(pageSource, /loadAiScenarioSimulatorSnapshot/)
  })

  test('页面显式输出来源态证据字段', () => {
    assert.match(pageSource, /sourceLabel/)
    assert.match(pageSource, /refreshPath/)
    assert.match(pageSource, /generatedAt/)
  })

  test('数据层保留 3 个场景与关键变量定义', () => {
    assert.match(dataSource, /marketing-budget/)
    assert.match(dataSource, /staff-scheduling/)
    assert.match(dataSource, /pricing-optimization/)
    assert.match(dataSource, /adBudget/)
    assert.match(dataSource, /staffCount/)
    assert.match(dataSource, /basePrice/)
  })
})
