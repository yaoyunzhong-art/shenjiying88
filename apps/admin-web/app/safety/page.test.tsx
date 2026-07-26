import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { buildSafetyRecords, loadSafetySnapshot, SEVERITY_MAP, STATUS_MAP } from './safety-data'

const pageSource = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')

describe('safety snapshot page', () => {
  it('page.tsx 为 snapshot page 并输出来源态证据', () => {
    assert.ok(pageSource.includes('export default async function SafetyPage'))
    assert.ok(pageSource.includes('loadSafetySnapshot'))
    assert.ok(pageSource.includes('sourceLabel'))
    assert.ok(pageSource.includes('refreshPath'))
    assert.ok(pageSource.includes('generatedAt'))
  })

  it('接入管理员权限边界', () => {
    assert.ok(pageSource.includes('AdminPermissionGate'))
    assert.ok(pageSource.includes("requiredPermission: 'safety:read'"))
  })
})

describe('safety snapshot loader', () => {
  it('返回 snapshot delivery mode 与来源标签', async () => {
    const snapshot = await loadSafetySnapshot()
    assert.equal(snapshot.deliveryMode, 'snapshot')
    assert.equal(snapshot.sourceLabel, 'local-safety-snapshot')
    assert.equal(snapshot.records.length, 12)
  })

  it('状态与严重等级映射完整', () => {
    assert.deepEqual(Object.keys(STATUS_MAP).sort(), ['closed', 'investigating', 'open', 'resolved'])
    assert.deepEqual(Object.keys(SEVERITY_MAP).sort(), ['critical', 'high', 'low', 'medium'])
  })

  it('mock 记录满足结构化字段要求', () => {
    const records = buildSafetyRecords()
    assert.ok(records.every((record) => /^SAF-\d{3}$/.test(record.id)))
    assert.ok(records.every((record) => record.reportedDate.length === 10))
    assert.ok(records.some((record) => record.status === 'critical' || record.severity === 'critical'))
  })
})
