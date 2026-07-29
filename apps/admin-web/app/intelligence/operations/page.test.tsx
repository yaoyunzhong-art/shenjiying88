import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { loadOperationsSnapshot } from './operations-data'

const pageSource = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf8')
const clientSource = fs.readFileSync(path.join(__dirname, 'operations-client.tsx'), 'utf8')
const dataSource = fs.readFileSync(path.join(__dirname, 'operations-data.ts'), 'utf8')

describe('intelligence/operations 结构固证', () => {
  it('page.tsx 为服务端 wrapper，加载 snapshot loader', () => {
    assert.ok(pageSource.includes('export default async function OperationsPage'))
    assert.ok(pageSource.includes('loadOperationsSnapshot'))
    assert.ok(pageSource.includes('OperationsClient'))
  })

  it('page.tsx 显式输出来源态证据', () => {
    assert.ok(pageSource.includes('sourceLabel'))
    assert.ok(pageSource.includes('refreshPath'))
    assert.ok(pageSource.includes('generatedAt'))
    assert.ok(pageSource.includes('Delivery'))
  })

  it('客户端使用 router.refresh 触发服务端刷新', () => {
    assert.ok(clientSource.includes('router.refresh()'))
  })
})

describe('intelligence/operations 来源态数据', () => {
  it('snapshot loader 返回 snapshot delivery mode 与来源标签', async () => {
    const snapshot = await loadOperationsSnapshot()
    assert.equal(snapshot.deliveryMode, 'snapshot')
    assert.equal(snapshot.sourceLabel, 'local-operations-advisor-snapshot')
    assert.ok(snapshot.generatedAt.length > 10)
  })

  it('保留七类运营题目与同城证据', async () => {
    const snapshot = await loadOperationsSnapshot()
    assert.equal(snapshot.questions.length, 7)
    assert.ok(snapshot.questions.every((question) => question.options.length >= 3))
    assert.ok(snapshot.questions.every((question) => question.options.some((option) => option.dataEvidence)))
  })

  it('保留历史案例样本与城市范围', async () => {
    const snapshot = await loadOperationsSnapshot()
    assert.equal(snapshot.historicalCases.length, 5)
    assert.deepEqual(snapshot.cityOptions, ['上海', '北京', '广州', '深圳', '成都', '杭州', '南京'])
  })
})

describe('intelligence/operations 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(!pageSource.includes('AdminPermissionGate'))
    assert.ok(pageSource.includes("requiredPermission: 'foundation.governance.read'"))
  })

  it('数据文件保留结构化题目定义', () => {
    assert.ok(dataSource.includes('interface AdviceQuestion'))
    assert.ok(dataSource.includes('interface HistoricalCase'))
    assert.ok(!dataSource.includes('as any'))
  })
})
