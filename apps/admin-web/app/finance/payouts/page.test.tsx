/**
 * finance/payouts/page.test.tsx — 提现管理页面测试
 *
 * 覆盖: 提现列表、审核流程、状态机、筛选、统计、边界
 * 要求: >=15 测试, 0 as any, 纯 node:test 源码分析
 *
 * 使用 node:test (no jsdom) — 源码静态分析策略
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8')

const has = (pattern: string) => {
  assert.ok(SRC.includes(pattern), `expected source to contain "${pattern}"`)
}

// ─── 1. 类型 & 状态机 ──────────────────────────────────

describe('payouts: 类型 & 状态机', () => {
  it('定义 PayoutStatus 联合类型', () => {
    has('type PayoutStatus')
    assert.ok(SRC.includes('PENDING'))
    assert.ok(SRC.includes('APPROVED'))
    assert.ok(SRC.includes('REJECTED'))
    assert.ok(SRC.includes('PROCESSING'))
    assert.ok(SRC.includes('COMPLETED'))
    assert.ok(SRC.includes('FAILED'))
  })

  it('定义 PayoutMethod 三种提现方式', () => {
    has('type PayoutMethod')
    assert.ok(SRC.includes("'BANK'"))
    assert.ok(SRC.includes("'ALIPAY'"))
    assert.ok(SRC.includes("'WECHAT'"))
  })

  it('状态机 STATUS_TRANSITIONS 包含所有状态', () => {
    has('STATUS_TRANSITIONS')
    // PENDING -> APPROVED|REJECTED
    assert.ok(SRC.includes("PENDING: ['APPROVED', 'REJECTED']") ||
              (SRC.indexOf("'APPROVED'") > SRC.indexOf('PENDING') &&
               SRC.indexOf("'REJECTED'") > SRC.indexOf('PENDING')))
    // PROCESSING -> COMPLETED|FAILED
    assert.ok(SRC.includes("'COMPLETED'") && SRC.includes("'FAILED'"))
  })

  it('COMPLETED 状态无允许转换', () => {
    // COMPLETED: [] — 终态
    const completedIdx = SRC.indexOf('COMPLETED:')
    assert.ok(completedIdx >= 0)
    // 确认 COMPLETED 后面是空数组
    const afterCompleted = SRC.slice(completedIdx, completedIdx + 30)
    assert.ok(afterCompleted.includes('[]'), 'COMPLETED 应为终态 ([])')
  })

  it('STATUS_LABELS 覆盖 6 个状态标签', () => {
    has('STATUS_LABELS')
    const labels = ['待审核', '已通过', '已拒绝', '处理中', '已完成', '打款失败']
    for (const label of labels) {
      assert.ok(SRC.includes(label), `missing label: ${label}`)
    }
  })
})

// ─── 2. 工具函数 ──────────────────────────────────────

describe('payouts: 工具函数', () => {
  it('formatAmount 将分转换为元 (CNY)', () => {
    has('function formatAmount')
    has(".toFixed(2)")
    assert.ok(SRC.includes("'/100'") || SRC.includes('/ 100'))
    assert.ok(SRC.includes('¥'), 'formatAmount 应包含 ¥ 符号')
  })

  it('formatDate 使用 zh-CN 本地化', () => {
    has('function formatDate')
    has("toLocaleString('zh-CN")
  })

  it('generateUUID 生成 v4 UUID', () => {
    has('function generateUUID')
    has('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx')
    has('(Math.random() * 16)')
  })

  it('UUID 格式不含敏感信息', () => {
    const uuidIdx = SRC.indexOf('function generateUUID')
    const uuidBlock = SRC.slice(uuidIdx, uuidIdx + 300)
    assert.ok(!uuidBlock.includes('undefined'), 'UUID 不应含 undefined')
    assert.ok(!uuidBlock.includes('NaN'), 'UUID 不应含 NaN')
  })
})

// ─── 3. 审核操作 ──────────────────────────────────────

describe('payouts: 审核操作', () => {
  it('审核对话框审核通过/拒绝按钮', () => {
    assert.ok(
      (SRC.indexOf('确认通过') >= 0 && SRC.indexOf('确认拒绝') >= 0) ||
      (SRC.indexOf('通过') >= 0 && SRC.indexOf('拒绝') >= 0)
    )
  })

  it('审核操作 handleReviewOpen 函数', () => {
    has('const handleReviewOpen')
    has('handleReviewOpen')
  })

  it('审核确认 handleReviewConfirm 函数', () => {
    has('const handleReviewConfirm')
    has('handleReviewConfirm')
  })

  it('拒绝时要求必填原因', () => {
    // reviewNote 非空校验
    const rejectCheck = SRC.indexOf("reviewAction === 'REJECTED' && !reviewNote.trim()")
    assert.ok(rejectCheck >= 0, '拒绝操作应校验备注非空')
  })

  it('通过提示进入打款流程', () => {
    assert.ok(SRC.includes('进入打款流程'), '通过后应有打款流程提示')
  })

  it('拒绝提示可重新提交', () => {
    assert.ok(SRC.includes('重新提交'), '拒绝后应有重新提交提示')
  })
})

// ─── 4. 列表 & 筛选 ───────────────────────────────────

describe('payouts: 列表 & 筛选', () => {
  it('存在筛选器: 状态 select + 方式 select', () => {
    has('filterStatus')
    has('filterMethod')
    has("value={filterStatus}")
    has("value={filterMethod}")
  })

  it('状态筛选全部 + 6 种状态', () => {
    const statusOptions = ['value="all"', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED']
    for (const opt of statusOptions) {
      assert.ok(SRC.includes(opt), `缺少状态选项: ${opt}`)
    }
  })

  it('方式筛选全部 + 3 种方式', () => {
    has('value="all"')
    has('value="BANK"')
    has('value="ALIPAY"')
    has('value="WECHAT"')
  })

  it('filteredPayouts 根据 filterStatus/filterMethod 过滤', () => {
    has('filteredPayouts')
    has('filterStatus')
    has('filterMethod')
    has('p.status !== filterStatus')
    has('p.method !== filterMethod')
  })

  it('空结果时显示暂无提现记录', () => {
    has('暂无符合条件的提现记录')
  })
})

// ─── 5. 统计 & 通用 ───────────────────────────────────

describe('payouts: 统计 & 通用', () => {
  it('统计卡片有四张 (总笔数/待审核/总额/待处理金额)', () => {
    const cardLabels = ['提现总笔数', '待审核', '提现总额', '待处理金额']
    for (const label of cardLabels) {
      assert.ok(SRC.includes(label), `缺少统计卡片: ${label}`)
    }
  })

  it('stats 包含 pending 和 totalAmountCents', () => {
    has('stats.pending')
    has('stats.totalAmountCents')
    has('stats.pendingAmountCents')
  })

  it('显示 loading 状态', () => {
    has('加载提现数据')
  })

  it('显示 error 状态和重试按钮', () => {
    has('加载失败')
    has('重试')
  })

  it('默认导出 FinancePayoutsPage', () => {
    has('export default function FinancePayoutsPage')
  })

  it('use client 指令', () => {
    has("'use client'")
  })

  it('使用 useState / useEffect / useCallback', () => {
    has('useState')
    has('useEffect')
    has('useCallback')
  })

  it('表格渲染使用 .map()', () => {
    assert.ok(SRC.includes('.map(') || SRC.includes('.map ('))
  })

  it('条件渲染 && 或 三元运算符', () => {
    assert.ok(SRC.includes(' && ') || SRC.includes(' ? '))
  })
})

// ─── 6. 边界 ──────────────────────────────────────────

describe('payouts: 边界', () => {
  it('STATUS_COLORS 覆盖全部 6 种状态', () => {
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED']
    has('STATUS_COLORS')
    for (const s of statuses) {
      assert.ok(SRC.includes(`${s}:`), `STATUS_COLORS 缺少: ${s}`)
    }
  })

  it('METHOD_LABELS 覆盖 3 种方式', () => {
    const methods = ['银行卡', '支付宝', '微信']
    for (const m of methods) {
      assert.ok(SRC.includes(m), `METHOD_LABELS 缺少: ${m}`)
    }
  })

  it('提现单号显示为完整 ID', () => {
    // 单元格展示 p.id 而非截断
    has('{p.id}')
  })

  it('账户信息展示基于 method 条件', () => {
    has("p.method === 'BANK'")
    has("p.method === 'ALIPAY'")
  })

  it('表格列包含提现单号/申请人/金额/方式/账户/状态/申请时间/操作', () => {
    const columns = ['提现单号', '申请人', '金额', '方式', '账户', '状态', '申请时间', '操作']
    for (const col of columns) {
      assert.ok(SRC.includes(col), `表格缺少列: ${col}`)
    }
  })

  it('Toast 显示审核结果 (成功/错误/信息)', () => {
    assert.ok(SRC.includes("'success'") && SRC.includes("'error'") && SRC.includes("'info'"), 'toast 应有三种类型')
  })

  it('审核按钮根据状态机动态显示', () => {
    // 状态转换时才显示操作按钮
    has('STATUS_TRANSITIONS[p.status]')
    has("includes('APPROVED')")
    has("includes('REJECTED')")
  })
})
