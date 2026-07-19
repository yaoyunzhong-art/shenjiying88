/**
 * audit-logs/page.test.ts — 审计日志页面 L2 纯逻辑测试
 *
 * 直接测试 page.tsx 中导出的工具函数:
 *   - computeStats / isToday / filterLogs
 *   - 常量映射完整性
 *   - 默认样本数据校验
 *   - 边界与异常条件
 *   - 快照语义验证
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeStats,
  filterLogs,
  isToday,
  ACTION_TYPE_LABEL,
  RESULT_LABEL,
  RESULT_COLOR,
  RESULT_BG,
  DEFAULT_LOGS,
} from './page'

import type {
  AuditLogEntry,
  AuditActionType,
  AuditResult,
} from './page'

// ──────────────────────────────────────────────
//  工厂函数 — 快速构建测试数据
// ──────────────────────────────────────────────

function makeLog(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: overrides.id ?? 'log-test-1',
    time: overrides.time ?? '2026-07-18 14:32:10',
    operator: overrides.operator ?? 'test@demo.com',
    actionType: overrides.actionType ?? 'login',
    target: overrides.target ?? '管理后台',
    ip: overrides.ip ?? '192.168.1.100',
    result: overrides.result ?? 'success',
    detail: overrides.detail ?? '测试操作',
  }
}

// ──────────────────────────────────────────────
//  常量映射 — 枚举完备性
// ──────────────────────────────────────────────

describe('ACTION_TYPE_LABEL', () => {
  it('为全部 6 种操作类型提供中文标签', () => {
    const expected: Record<AuditActionType, string> = {
      login: '登录',
      logout: '登出',
      data_modify: '数据修改',
      permission_change: '权限变更',
      system_setting: '系统设置',
      export: '导出',
    }
    for (const [k, v] of Object.entries(expected)) {
      assert.strictEqual(ACTION_TYPE_LABEL[k as AuditActionType], v, `标签缺少: ${k}`)
    }
  })

  it('所有标签均非空字符串', () => {
    for (const v of Object.values(ACTION_TYPE_LABEL)) {
      assert.ok(v.length > 0)
    }
  })
})

describe('RESULT_LABEL', () => {
  it('为全部 3 种结果提供中文标签', () => {
    const expected: Record<AuditResult, string> = {
      success: '成功',
      failure: '失败',
      denied: '拒绝',
    }
    for (const [k, v] of Object.entries(expected)) {
      assert.strictEqual(RESULT_LABEL[k as AuditResult], v)
    }
  })
})

describe('RESULT_COLOR', () => {
  it('三个结果的颜色字符串不同', () => {
    const colors = new Set(Object.values(RESULT_COLOR))
    assert.strictEqual(colors.size, 3)
  })

  it('三个颜色均为有效的十六进制色值', () => {
    for (const color of Object.values(RESULT_COLOR)) {
      assert.match(color, /^#[0-9a-f]{6}$/)
    }
  })
})

describe('RESULT_BG', () => {
  it('三个背景色均为 rgba 格式', () => {
    for (const bg of Object.values(RESULT_BG)) {
      assert.match(bg, /^rgba\(/)
    }
  })
})

// ──────────────────────────────────────────────
//  isToday
// ──────────────────────────────────────────────

describe('isToday()', () => {
  it('当天时间戳返回 true', () => {
    assert.ok(isToday('2026-07-18 14:32:10'))
    assert.ok(isToday('2026-07-18 00:00:00'))
    assert.ok(isToday('2026-07-18 23:59:59'))
  })

  it('非当天时间戳返回 false', () => {
    assert.ok(!isToday('2026-07-17 14:32:10'))
    assert.ok(!isToday('2026-07-19 00:00:00'))
    assert.ok(!isToday('2025-01-01 12:00:00'))
  })

  it('异常时间格式不崩溃', () => {
    assert.ok(!isToday(''))
    assert.ok(!isToday('invalid'))
    assert.ok(!isToday('2026-07'))
  })
})

// ──────────────────────────────────────────────
//  computeStats
// ──────────────────────────────────────────────

describe('computeStats()', () => {
  it('统计空日志列表', () => {
    const s = computeStats([])
    assert.strictEqual(s.total, 0)
    assert.strictEqual(s.today, 0)
    assert.strictEqual(s.todayFailures, 0)
  })

  it('正确统计 10 条默认样本', () => {
    const s = computeStats(DEFAULT_LOGS)
    // DEFAULT_LOGS 只有第 1-5 条属于 2026-07-18
    assert.strictEqual(s.total, 10)
    assert.strictEqual(s.today, 5)
    // 第 3 条 (li@) 和第 5 条 (system) 为当天 failure
    assert.strictEqual(s.todayFailures, 2)
  })

  it('todayFailures 仅计数当天失败', () => {
    const logs: AuditLogEntry[] = [
      makeLog({ time: '2026-07-18 10:00:00', result: 'failure' }),
      makeLog({ time: '2026-07-17 10:00:00', result: 'failure' }),
    ]
    const s = computeStats(logs)
    assert.strictEqual(s.today, 1)
    assert.strictEqual(s.todayFailures, 1)
  })

  it('todayFailures 排除当天成功/拒绝', () => {
    const logs: AuditLogEntry[] = [
      makeLog({ time: '2026-07-18 10:00:00', result: 'failure' }),
      makeLog({ time: '2026-07-18 10:01:00', result: 'success' }),
      makeLog({ time: '2026-07-18 10:02:00', result: 'denied' }),
    ]
    const s = computeStats(logs)
    assert.strictEqual(s.todayFailures, 1)
  })

  it('单条日志统计', () => {
    const s = computeStats([makeLog({ time: '2026-07-18 12:00:00' })])
    assert.strictEqual(s.total, 1)
    assert.strictEqual(s.today, 1)
    assert.strictEqual(s.todayFailures, 0)
  })

  it('大量日志不抛出异常', () => {
    const logs: AuditLogEntry[] = Array.from({ length: 10_000 }, (_, i) =>
      makeLog({
        id: `log-bulk-${i}`,
        time: i % 2 === 0 ? '2026-07-18 10:00:00' : '2026-07-17 10:00:00',
        result: i % 3 === 0 ? 'failure' : 'success',
      })
    )
    const s = computeStats(logs)
    assert.strictEqual(s.total, 10_000)
    // today = 5000 (evens), 1/3 of today are failure
    assert.strictEqual(s.today, 5_000)
    // i%3===0 on i=0,2,4,... gives 1667 elements (0-indexed: 0,6,12,... + 2,8,14,...)
    assert.strictEqual(s.todayFailures, 1_667)
  })
})

// ──────────────────────────────────────────────
//  filterLogs
// ──────────────────────────────────────────────

describe('filterLogs() - tab 筛选', () => {
  const logs: AuditLogEntry[] = [
    makeLog({ id: '1', result: 'success' }),
    makeLog({ id: '2', result: 'failure' }),
    makeLog({ id: '3', result: 'denied' }),
    makeLog({ id: '4', result: 'failure' }),
  ]

  it('"all" tab 返回全部日志', () => {
    assert.strictEqual(filterLogs(logs, 'all', '').length, 4)
  })

  it('"failure" tab 仅返回 failure 结果', () => {
    const filtered = filterLogs(logs, 'failure', '')
    assert.strictEqual(filtered.length, 2)
    for (const l of filtered) assert.strictEqual(l.result, 'failure')
  })

  it('"failure" tab 排除 success 和 denied', () => {
    const filtered = filterLogs(logs, 'failure', '')
    const results = filtered.map((l) => l.result)
    assert.ok(!results.includes('success'))
    assert.ok(!results.includes('denied'))
  })
})

describe('filterLogs() - 搜索', () => {
  const logs: AuditLogEntry[] = [
    makeLog({ id: '1', operator: 'admin@demo.com' }),
    makeLog({ id: '2', operator: 'zhang@demo.com' }),
    makeLog({ id: '3', operator: 'system' }),
  ]

  it('按操作人精准匹配', () => {
    const filtered = filterLogs(logs, 'all', 'admin@demo.com')
    assert.strictEqual(filtered.length, 1)
    assert.strictEqual(filtered[0]!.operator, 'admin@demo.com')
  })

  it('按操作人部分匹配', () => {
    assert.strictEqual(filterLogs(logs, 'all', 'demo').length, 2)
    assert.strictEqual(filterLogs(logs, 'all', 'zhang').length, 1)
  })

  it('搜索忽略大小写', () => {
    assert.strictEqual(filterLogs(logs, 'all', 'ADMIN').length, 1)
    assert.strictEqual(filterLogs(logs, 'all', 'DEMO').length, 2)
    assert.strictEqual(filterLogs(logs, 'all', 'System').length, 1)
  })

  it('空搜索字符串返回全部', () => {
    assert.strictEqual(filterLogs(logs, 'all', '').length, 3)
    assert.strictEqual(filterLogs(logs, 'all', '   '.trim()).length, 3)
  })

  it('无匹配时返回空数组', () => {
    assert.strictEqual(filterLogs(logs, 'all', 'nonexistent').length, 0)
  })
})

describe('filterLogs() - tab + 搜索组合', () => {
  const logs: AuditLogEntry[] = [
    makeLog({ id: '1', operator: 'admin@demo.com', result: 'failure' }),
    makeLog({ id: '2', operator: 'admin@demo.com', result: 'success' }),
    makeLog({ id: '3', operator: 'zhang@demo.com', result: 'failure' }),
    makeLog({ id: '4', operator: 'system',         result: 'failure' }),
  ]

  it('组合筛选: failure tab + "admin" 搜索', () => {
    const filtered = filterLogs(logs, 'failure', 'admin')
    assert.strictEqual(filtered.length, 1)
    assert.strictEqual(filtered[0]!.operator, 'admin@demo.com')
    assert.strictEqual(filtered[0]!.result, 'failure')
  })

  it('组合筛选: failure tab + "demo" 搜索', () => {
    const filtered = filterLogs(logs, 'failure', 'demo')
    assert.strictEqual(filtered.length, 2)
    for (const l of filtered) {
      assert.strictEqual(l.result, 'failure')
    }
  })

  it('组合筛选: failure tab + 不匹配搜索返回空', () => {
    assert.strictEqual(filterLogs(logs, 'failure', 'nobody').length, 0)
  })
})

describe('filterLogs() - 边界', () => {
  it('空日志列表', () => {
    assert.strictEqual(filterLogs([], 'all', '').length, 0)
    assert.strictEqual(filterLogs([], 'failure', '').length, 0)
    assert.strictEqual(filterLogs([], 'all', 'anything').length, 0)
  })

  it('特殊字符搜索', () => {
    const logs = [makeLog({ operator: 'admin+test@example.com' })]
    assert.strictEqual(filterLogs(logs, 'all', '+').length, 1)
    assert.strictEqual(filterLogs(logs, 'all', '.').length, 1)
    assert.strictEqual(filterLogs(logs, 'all', '$').length, 0)
    assert.strictEqual(filterLogs(logs, 'all', '[admin]').length, 0)
  })

  it('超长搜索', () => {
    const logs = [makeLog({ operator: 'admin@demo.com' })]
    const longQuery = 'a'.repeat(500)
    assert.strictEqual(filterLogs(logs, 'all', longQuery).length, 0)
  })

  it('全角空格被 trim 视作空查询返回全部', () => {
    const logs = [makeLog({ operator: 'admin@demo.com' })],
          all = filterLogs(logs, 'all', '　')
    // Node.js .trim() 会去除全角空格 (U+3000)，因此被视为空查询
    assert.strictEqual(all.length, 1)
  })
})

// ──────────────────────────────────────────────
//  DEFAULT_LOGS — 样本数据正确性
// ──────────────────────────────────────────────

describe('DEFAULT_LOGS', () => {
  it('包含 10 条记录', () => {
    assert.strictEqual(DEFAULT_LOGS.length, 10)
  })

  it('每条记录包含全部 7 个字段', () => {
    const keys: (keyof AuditLogEntry)[] = ['id', 'time', 'operator', 'actionType', 'target', 'ip', 'result', 'detail']
    for (const log of DEFAULT_LOGS) {
      for (const key of keys) {
        assert.ok(key in log, `record ${log.id} 缺少字段: ${key}`)
      }
    }
  })

  it('所有 id 唯一', () => {
    const ids = DEFAULT_LOGS.map((l) => l.id)
    assert.strictEqual(new Set(ids).size, ids.length)
  })

  it('所有 actionType 为合法值', () => {
    const valid: AuditActionType[] = ['login', 'logout', 'data_modify', 'permission_change', 'system_setting', 'export']
    for (const log of DEFAULT_LOGS) {
      assert.ok(valid.includes(log.actionType), `非法 actionType: ${log.actionType} in ${log.id}`)
    }
  })

  it('所有 result 为合法值', () => {
    const valid: AuditResult[] = ['success', 'failure', 'denied']
    for (const log of DEFAULT_LOGS) {
      assert.ok(valid.includes(log.result), `非法 result: ${log.result} in ${log.id}`)
    }
  })

  it('至少包含 2 条失败记录', () => {
    const failures = DEFAULT_LOGS.filter((l) => l.result === 'failure')
    assert.ok(failures.length >= 2)
  })

  it('至少包含 1 条拒绝记录', () => {
    const denied = DEFAULT_LOGS.filter((l) => l.result === 'denied')
    assert.ok(denied.length >= 1)
  })

  it('所有时间格式为 YYYY-MM-DD HH:mm:ss', () => {
    for (const log of DEFAULT_LOGS) {
      assert.match(log.time, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, `时间格式异常: ${log.time}`)
    }
  })

  it('所有 operator 非空', () => {
    for (const log of DEFAULT_LOGS) {
      assert.ok(log.operator.length > 0, `operator 为空: ${log.id}`)
    }
  })

  it('所有 ip 非空', () => {
    for (const log of DEFAULT_LOGS) {
      assert.ok(log.ip.length > 0, `ip 为空: ${log.id}`)
    }
  })

  it('所有 detail 非空', () => {
    for (const log of DEFAULT_LOGS) {
      assert.ok(log.detail.length > 0, `detail 为空: ${log.id}`)
    }
  })

  it('computeStats(DEFAULT_LOGS) 与预期一致', () => {
    const s = computeStats(DEFAULT_LOGS)
    assert.strictEqual(s.total, 10)
    assert.strictEqual(s.today, 5)
    assert.strictEqual(s.todayFailures, 2)
  })
})

// ──────────────────────────────────────────────
//  filterLogs — 使用默认样本验证语义
// ──────────────────────────────────────────────

describe('filterLogs(DEFAULT_LOGS, ...)', () => {
  it('"all" 返回全部 10 条', () => {
    assert.strictEqual(filterLogs(DEFAULT_LOGS, 'all', '').length, 10)
  })

  it('"failure" 返回 2 条', () => {
    const r = filterLogs(DEFAULT_LOGS, 'failure', '')
    assert.strictEqual(r.length, 2)
    for (const l of r) assert.strictEqual(l.result, 'failure')
  })

  it('搜索 "system" 返回 1 条', () => {
    const r = filterLogs(DEFAULT_LOGS, 'all', 'system')
    assert.strictEqual(r.length, 1)
    assert.strictEqual(r[0]!.operator, 'system')
  })

  it('搜索 "admin" 返回 3 条', () => {
    const r = filterLogs(DEFAULT_LOGS, 'all', 'admin')
    assert.strictEqual(r.length, 3)
    for (const l of r) assert.ok(l.operator.startsWith('admin'))
  })
})

// ──────────────────────────────────────────────
//  类型验证 — 运行时确保类型兼容
// ──────────────────────────────────────────────

describe('类型验证 (运行时)', () => {
  it('AuditActionType 所有值可枚举', () => {
    const allTypes: AuditActionType[] = ['login', 'logout', 'data_modify', 'permission_change', 'system_setting', 'export']
    for (const t of allTypes) {
      assert.ok(typeof t === 'string')
      assert.ok(t.length > 0)
    }
  })

  it('AuditResult 所有值可枚举', () => {
    const allResults: AuditResult[] = ['success', 'failure', 'denied']
    for (const r of allResults) {
      assert.ok(typeof r === 'string')
      assert.ok(r.length > 0)
    }
  })
})
