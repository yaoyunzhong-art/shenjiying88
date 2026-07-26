import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const DATA_SRC = readFileSync(resolve(DIR, 'training-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'training-client.tsx'), 'utf-8')

describe('stores/[id]/training data/client 结构固证', () => {
  it('snapshot loader 应固化 mock 来源态、诊断与刷新合同', () => {
    assert.ok(DATA_SRC.includes('export interface TrainingSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-training-mock'"))
    assert.ok(DATA_SRC.includes('diagnostics: TrainingDiagnostic[]'))
    assert.ok(DATA_SRC.includes('controlPlaneSource: string'))
    assert.ok(DATA_SRC.includes('refreshPath: string'))
    assert.ok(DATA_SRC.includes('loadTrainingSnapshot'))
  })

  it('snapshot loader 应保留培训样本与纯计算函数', () => {
    assert.ok(DATA_SRC.includes('TRAINING_COURSES'))
    assert.ok(DATA_SRC.includes('buildTrainingSummary'))
    assert.ok(DATA_SRC.includes('buildTrainingDistribution'))
    assert.ok(DATA_SRC.includes('buildTrainingDiagnostics'))
  })

  it('client renderer 应承载交互、诊断与 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
    assert.ok(CLIENT_SRC.includes('snapshot.diagnostics'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("message.info('当前为 mock 快照"))
    assert.ok(CLIENT_SRC.includes("label: '诊断面板'"))
  })
})
