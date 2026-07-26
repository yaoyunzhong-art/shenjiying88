import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { loadAiScenarioSimulatorSnapshot } from './ai-scenario-simulator-data'

const pageSource = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')
const clientSource = fs.readFileSync(path.join(__dirname, 'ai-scenario-simulator-client.tsx'), 'utf8')

describe('ai-scenario-simulator 结构固证', () => {
  it('page.tsx 为 server wrapper 并显式输出来源态证据', () => {
    assert.ok(pageSource.includes('export default async function AiScenarioSimulatorPage'))
    assert.ok(pageSource.includes('loadAiScenarioSimulatorSnapshot'))
    assert.ok(pageSource.includes('sourceLabel'))
    assert.ok(pageSource.includes('refreshPath'))
    assert.ok(pageSource.includes('generatedAt'))
  })

  it('client renderer 持有交互与刷新逻辑', () => {
    assert.ok(clientSource.includes("'use client'"))
    assert.ok(clientSource.includes('router.refresh()'))
    assert.ok(clientSource.includes('AIScenarioSimulator'))
    assert.ok(clientSource.includes('DataTable'))
  })
})

describe('ai-scenario-simulator snapshot loader', () => {
  it('返回 snapshot delivery 与来源标签', async () => {
    const snapshot = await loadAiScenarioSimulatorSnapshot()
    assert.equal(snapshot.deliveryMode, 'snapshot')
    assert.equal(snapshot.sourceLabel, 'local-ai-scenario-simulator-snapshot')
    assert.ok(snapshot.generatedAt.length > 10)
  })

  it('保留 3 个预设场景和 12 个变量', async () => {
    const snapshot = await loadAiScenarioSimulatorSnapshot()
    assert.equal(snapshot.presets.length, 3)
    assert.equal(snapshot.presetStats.totalVariables, 12)
    assert.equal(snapshot.presetStats.totalCategories, 3)
  })

  it('每个场景均可产出结构化模拟结果', async () => {
    const snapshot = await loadAiScenarioSimulatorSnapshot()
    for (const preset of snapshot.presets) {
      const values = Object.fromEntries(preset.variables.map((variable) => [variable.id, variable.defaultValue]))
      const results = await preset.simulate(values)
      assert.ok(results.length >= 3)
      assert.ok(results.every((result) => typeof result.variable === 'string'))
      assert.ok(results.every((result) => result.direction === 'up' || result.direction === 'down'))
    }
  })
})

describe('ai-scenario-simulator 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(pageSource.includes('AdminPermissionGate'))
    assert.ok(pageSource.includes("requiredPermission: 'ai-scenario-simulator:read'"))
  })
})
