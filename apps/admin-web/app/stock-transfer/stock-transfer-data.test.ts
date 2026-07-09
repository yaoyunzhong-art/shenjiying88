import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  TYPE_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  URGENCY_LABEL,
  URGENCY_VARIANT,
  STATUS_FLOW,
  TRANSFER_STATUSES,
  TRANSFER_TYPES,
  URGENCY_LEVELS,
  MOCK_TRANSFERS,
} from './stock-transfer-data'

describe('stock-transfer-data', () => {
  describe('TYPE_LABEL', () => {
    it('has labels for all transfer types', () => {
      assert.equal(TYPE_LABEL.supply, '补货调拨')
      assert.equal(TYPE_LABEL.return, '退货调拨')
      assert.equal(TYPE_LABEL.move, '移库调拨')
      assert.equal(TYPE_LABEL.emergency, '紧急调拨')
    })

    it('covers all TRANSFER_TYPES', () => {
      for (const t of TRANSFER_TYPES) {
        assert.ok(TYPE_LABEL[t], `Missing label for type: ${t}`)
      }
    })
  })

  describe('STATUS_LABEL', () => {
    it('has labels for all transfer statuses', () => {
      assert.equal(STATUS_LABEL.pending, '待审核')
      assert.equal(STATUS_LABEL.approved, '已通过')
      assert.equal(STATUS_LABEL.shipped, '已发货')
      assert.equal(STATUS_LABEL.received, '已收货')
      assert.equal(STATUS_LABEL.rejected, '已驳回')
      assert.equal(STATUS_LABEL.cancelled, '已撤销')
    })

    it('covers all TRANSFER_STATUSES', () => {
      for (const s of TRANSFER_STATUSES) {
        assert.ok(STATUS_LABEL[s], `Missing label for status: ${s}`)
      }
    })
  })

  describe('STATUS_STYLE', () => {
    it('maps status to valid variant', () => {
      const valid = new Set(['success', 'neutral', 'warning', 'danger'])
      for (const s of TRANSFER_STATUSES) {
        assert.ok(valid.has(STATUS_STYLE[s]), `Invalid style for ${s}: ${STATUS_STYLE[s]}`)
      }
    })
  })

  describe('URGENCY_LABEL', () => {
    it('has labels for all urgency levels', () => {
      assert.equal(URGENCY_LABEL.normal, '普通')
      assert.equal(URGENCY_LABEL.urgent, '紧急')
      assert.equal(URGENCY_LABEL.critical, '特急')
    })

    it('covers all URGENCY_LEVELS', () => {
      for (const u of URGENCY_LEVELS) {
        assert.ok(URGENCY_LABEL[u], `Missing label for urgency: ${u}`)
      }
    })
  })

  describe('URGENCY_VARIANT', () => {
    it('maps urgency to valid variant', () => {
      const valid = new Set(['success', 'neutral', 'warning', 'danger'])
      for (const u of URGENCY_LEVELS) {
        assert.ok(valid.has(URGENCY_VARIANT[u]), `Invalid variant for ${u}: ${URGENCY_VARIANT[u]}`)
      }
    })
  })

  describe('STATUS_FLOW', () => {
    it('pending transitions are valid', () => {
      assert.deepEqual(STATUS_FLOW.pending, ['approved', 'rejected', 'cancelled'])
    })

    it('received, rejected, cancelled have no outgoing transitions', () => {
      assert.deepEqual(STATUS_FLOW.received, [])
      assert.deepEqual(STATUS_FLOW.rejected, [])
      assert.deepEqual(STATUS_FLOW.cancelled, [])
    })

    it('all transitions are valid statuses', () => {
      for (const [from, toList] of Object.entries(STATUS_FLOW)) {
        for (const to of toList) {
          assert.ok(STATUS_LABEL[to as keyof typeof STATUS_LABEL],
            `Invalid transition target ${to} from ${from}`)
        }
      }
    })
  })

  describe('MOCK_TRANSFERS', () => {
    it('contains all transfer statuses', () => {
      const statuses = new Set(MOCK_TRANSFERS.map(t => t.status))
      for (const s of TRANSFER_STATUSES) {
        assert.ok(statuses.has(s), `Missing mock for status: ${s}`)
      }
    })

    it('each item has required fields', () => {
      for (const t of MOCK_TRANSFERS) {
        assert.ok(t.id, 'Missing id')
        assert.ok(t.transferNo, 'Missing transferNo')
        assert.ok(t.sourceStoreName, 'Missing source store name')
        assert.ok(t.targetStoreName, 'Missing target store name')
        assert.ok(t.quantity > 0, 'Invalid quantity')
        assert.ok(TRANSFER_TYPES.includes(t.type), `Invalid type: ${t.type}`)
        assert.ok(URGENCY_LEVELS.includes(t.urgency), `Invalid urgency: ${t.urgency}`)
      }
    })
  })
})
