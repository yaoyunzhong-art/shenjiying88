import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const DATA_SRC = readFileSync(resolve(DIR, 'health-score-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'health-score-client.tsx'), 'utf-8')

describe('stores/[id]/health-score data/client 结构固证', () => {
  it('snapshot loader 应固化健康评分合同、趋势样本与统计函数', () => {
    assert.ok(DATA_SRC.includes('export interface HealthScoreSnapshot'))
    assert.ok(DATA_SRC.includes('HEALTH_DIMENSIONS'))
    assert.ok(DATA_SRC.includes('HEALTH_HISTORY'))
    assert.ok(DATA_SRC.includes('buildHealthScoreSummary'))
    assert.ok(DATA_SRC.includes('loadHealthScoreSnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-health-score-fallback'"))
  })

  it('client renderer 应承载仪表盘、趋势与 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot.dimensions'))
    assert.ok(CLIENT_SRC.includes('snapshot.history'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('优先改进项'))
    assert.ok(CLIENT_SRC.includes('综合分'))
  })
})
