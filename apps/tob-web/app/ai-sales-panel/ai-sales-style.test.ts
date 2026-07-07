import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getTabButtonStyle,
  getToggleButtonStyle,
  getCardStyle,
  getMatchScoreColor,
  getMatchScoreChipStyle,
  getPriorityColor,
  getPriorityLabel,
  getPriorityBlockStyle,
  getStatusChipStyle,
  getStatusLabel,
  getToneChipStyle,
  getToneLabel,
  getProductNameChipStyle,
  TONE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type Priority,
  type TaskStatus,
  type Tone,
} from './ai-sales-style'

describe('ai-sales-style helpers', () => {
  describe('getTabButtonStyle', () => {
    it('active state: blue tinted bg, blue text, no border', () => {
      const s = getTabButtonStyle(true)
      assert.equal(s.background, 'rgba(59,130,246,0.15)')
      assert.equal(s.color, '#60a5fa')
      assert.equal(s.border, 'none')
      assert.equal(s.cursor, 'pointer')
    })

    it('inactive state: transparent bg, gray text, no border', () => {
      const s = getTabButtonStyle(false)
      assert.equal(s.background, 'transparent')
      assert.equal(s.color, '#94a3b8')
      assert.equal(s.border, 'none')
    })

    it('active and inactive only differ in background and color', () => {
      const a = getTabButtonStyle(true)
      const b = getTabButtonStyle(false)
      assert.deepEqual({ ...a, background: 0, color: 0 }, { ...b, background: 0, color: 0 })
    })
  })

  describe('getToggleButtonStyle', () => {
    it('active state: 1px blue border, light blue bg, blue text', () => {
      const s = getToggleButtonStyle(true)
      assert.equal(s.border, '1px solid rgba(59,130,246,0.5)')
      assert.equal(s.background, 'rgba(59,130,246,0.1)')
      assert.equal(s.color, '#60a5fa')
      assert.equal(s.fontSize, 13)
    })

    it('inactive state: 1px gray border, transparent bg, gray text', () => {
      const s = getToggleButtonStyle(false)
      assert.equal(s.border, '1px solid rgba(148,163,184,0.2)')
      assert.equal(s.background, 'transparent')
      assert.equal(s.color, '#94a3b8')
    })

    it('fontSize is 13 (vs 14 for tab button)', () => {
      const tab = getTabButtonStyle(true)
      const toggle = getToggleButtonStyle(true)
      assert.equal(tab.fontSize, 14)
      assert.equal(toggle.fontSize, 13)
    })
  })

  describe('getCardStyle', () => {
    it('default padding is 16', () => {
      const s = getCardStyle()
      assert.equal(s.padding, 16)
      assert.equal(s.background, 'rgba(30,41,59,0.9)')
      assert.equal(s.border, '1px solid rgba(148,163,184,0.12)')
      assert.equal(s.borderRadius, 12)
    })

    it('accepts padding 16 or 20', () => {
      assert.equal(getCardStyle(16).padding, 16)
      assert.equal(getCardStyle(20).padding, 20)
    })

    it('shell fields identical across padding values', () => {
      const a = getCardStyle(16)
      const b = getCardStyle(20)
      assert.equal(a.background, b.background)
      assert.equal(a.border, b.border)
      assert.equal(a.borderRadius, b.borderRadius)
    })
  })

  describe('getMatchScoreColor', () => {
    it('>85 returns green', () => {
      assert.equal(getMatchScoreColor(86), '#22c55e')
      assert.equal(getMatchScoreColor(100), '#22c55e')
    })

    it('>75 and <=85 returns yellow', () => {
      assert.equal(getMatchScoreColor(76), '#eab308')
      assert.equal(getMatchScoreColor(85), '#eab308')
    })

    it('<=75 returns gray', () => {
      assert.equal(getMatchScoreColor(75), '#64748b')
      assert.equal(getMatchScoreColor(0), '#64748b')
    })
  })

  describe('getMatchScoreChipStyle', () => {
    it('background appends 20 alpha to color', () => {
      const s = getMatchScoreChipStyle(92)
      assert.equal(s.color, '#22c55e')
      assert.equal(s.background, '#22c55e20')
    })

    it('yellow path also gets 20 alpha', () => {
      const s = getMatchScoreChipStyle(80)
      assert.equal(s.color, '#eab308')
      assert.equal(s.background, '#eab30820')
    })

    it('gray path also gets 20 alpha', () => {
      const s = getMatchScoreChipStyle(50)
      assert.equal(s.color, '#64748b')
      assert.equal(s.background, '#64748b20')
    })
  })

  describe('priority helpers', () => {
    it('getPriorityColor returns the right color for each level', () => {
      assert.equal(getPriorityColor('high'), '#ef4444')
      assert.equal(getPriorityColor('medium'), '#eab308')
      assert.equal(getPriorityColor('low'), '#22c55e')
    })

    it('getPriorityLabel returns Chinese label', () => {
      assert.equal(getPriorityLabel('high'), '高')
      assert.equal(getPriorityLabel('medium'), '中')
      assert.equal(getPriorityLabel('low'), '低')
    })

    it('PRIORITY_COLORS map matches getPriorityColor', () => {
      const priorities: Priority[] = ['high', 'medium', 'low']
      for (const p of priorities) {
        assert.equal(PRIORITY_COLORS[p], getPriorityColor(p))
        assert.equal(PRIORITY_LABELS[p], getPriorityLabel(p))
      }
    })

    it('getPriorityBlockStyle uses 48x48 with 20 alpha bg', () => {
      const s = getPriorityBlockStyle('high')
      assert.equal(s.width, 48)
      assert.equal(s.height, 48)
      assert.equal(s.borderRadius, 10)
      assert.equal(s.background, '#ef444420')
      assert.equal(s.color, '#ef4444')
    })
  })

  describe('status helpers', () => {
    it('completed: green chip', () => {
      const s = getStatusChipStyle('completed')
      assert.equal(s.color, '#22c55e')
      assert.equal(s.background, 'rgba(34,197,94,0.15)')
    })

    it('pending: yellow chip', () => {
      const s = getStatusChipStyle('pending')
      assert.equal(s.color, '#eab308')
      assert.equal(s.background, 'rgba(234,179,8,0.15)')
    })

    it('getStatusLabel returns Chinese label', () => {
      assert.equal(getStatusLabel('completed'), '已完成')
      assert.equal(getStatusLabel('pending'), '待处理')
    })

    it('all status share same chip shape', () => {
      const completed = getStatusChipStyle('completed')
      const pending = getStatusChipStyle('pending')
      assert.equal(completed.padding, pending.padding)
      assert.equal(completed.fontSize, pending.fontSize)
      assert.equal(completed.fontWeight, pending.fontWeight)
      assert.equal(completed.borderRadius, pending.borderRadius)
    })
  })

  describe('tone helpers', () => {
    it('urgent: red chip', () => {
      const s = getToneChipStyle('urgent')
      assert.equal(s.color, '#ef4444')
      assert.equal(s.background, 'rgba(239,68,68,0.15)')
    })

    it('friendly and professional: green chip (non-urgent)', () => {
      assert.equal(getToneChipStyle('friendly').color, '#22c55e')
      assert.equal(getToneChipStyle('professional').color, '#22c55e')
    })

    it('getToneLabel returns Chinese label', () => {
      assert.equal(getToneLabel('professional'), '专业')
      assert.equal(getToneLabel('friendly'), '友好')
      assert.equal(getToneLabel('urgent'), '紧迫')
    })

    it('TONE_LABELS map matches getToneLabel', () => {
      const tones: Tone[] = ['professional', 'friendly', 'urgent']
      for (const t of tones) {
        assert.equal(TONE_LABELS[t], getToneLabel(t))
      }
    })
  })

  describe('getProductNameChipStyle', () => {
    it('returns blue chip', () => {
      const s = getProductNameChipStyle()
      assert.equal(s.color, '#60a5fa')
      assert.equal(s.background, 'rgba(59,130,246,0.15)')
    })

    it('is deterministic (same output every call)', () => {
      assert.deepEqual(getProductNameChipStyle(), getProductNameChipStyle())
    })
  })

  describe('priority/status/tone enums have same membership', () => {
    it('priority map and status and tone all have 3 keys each', () => {
      assert.equal(Object.keys(PRIORITY_COLORS).length, 3)
      assert.equal(Object.keys(PRIORITY_LABELS).length, 3)
      assert.equal(Object.keys(TONE_LABELS).length, 3)
    })
  })
})
