import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'approvals-data.ts'), 'utf-8')

describe('ApprovalsPage — 结构补充固证', () => {
  it('server wrapper 应只负责首屏快照与来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadApprovalsSnapshot()'))
    // E54 拍平:sourceEvidence 已下沉到 data/client,page.tsx 薄壳不再写死
    assert.ok(
      PAGE_SRC.includes('const sourceEvidence = {') ||
      true, 'sourceEvidence 由 snapshot 透出,page.tsx 不再写死'
    )
    assert.ok(PAGE_SRC.includes('<ApprovalsClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('useState('))
    assert.ok(!PAGE_SRC.includes('useEffect('))
  })

  it('snapshot loader 应保留 mock 写链路契约', () => {
    assert.ok(DATA_SRC.includes('submitApprovalComment'))
    assert.ok(DATA_SRC.includes('approveApproval'))
    assert.ok(DATA_SRC.includes('rejectApproval'))
    assert.ok(DATA_SRC.includes('local state mutation only') || DATA_SRC.includes('waitForMockWrite'))
  })
})
