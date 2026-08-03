import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'order-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'order-detail-data.ts'), 'utf-8')

describe('orders/[id] 结构固证补充', () => {
  it('page 不应再直接读取 useParams', () => {
    assert.ok(!PAGE_SRC.includes('useParams'))
    assert.ok(PAGE_SRC.includes('loadOrderDetailSnapshot(id)'))
  })

  it('client 承接原详情渲染逻辑', () => {
    assert.ok(CLIENT_SRC.includes('DescriptionList'))
    assert.ok(CLIENT_SRC.includes('DetailShell'))
    assert.ok(CLIENT_SRC.includes('discountRatio'))
  })

  it('data 层负责快照合同和 not-found 说明', () => {
    assert.ok(DATA_SRC.includes('viewModel: OrderDetailViewModel | null'))
    assert.ok(DATA_SRC.includes('未命中订单样本'))
  })
})
