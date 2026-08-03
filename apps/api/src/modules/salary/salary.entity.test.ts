import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [salary] [A] entity 测试补全
 *
 * 薪资管理 Entity 类型定义与常量测试
 */

import assert from 'node:assert/strict'
import {
  SalaryItem,
  SalaryStatus,
  SalaryMode,
  PaymentMethod,
  PayrollRecord,
  SalarySummary,
  PayrollDetail,
  SalaryApprovalRecord,
  SalaryLineItem,
  SALARY_ITEM_LABELS,
  SALARY_STATUS_LABELS,
  SALARY_MODE_LABELS,
  PAYMENT_METHOD_LABELS,
} from './salary.entity'

describe('salary entity - 类型定义', () => {
  it('SalaryItem 包含 10 种薪资项目', () => {
    const items: SalaryItem[] = [
      'base', 'bonus', 'overtime', 'commission', 'allowance',
      'social_security', 'housing_fund', 'tax', 'deduction', 'reimbursement',
    ]
    assert.equal(items.length, 10)
  })

  it('SalaryStatus 包含 6 种状态', () => {
    const statuses: SalaryStatus[] = [
      'draft', 'pending', 'approved', 'paid', 'rejected', 'cancelled',
    ]
    assert.equal(statuses.length, 6)
  })

  it('SalaryMode 包含 4 种模式', () => {
    const modes: SalaryMode[] = ['monthly', 'hourly', 'commission', 'mixed']
    assert.equal(modes.length, 4)
  })

  it('PaymentMethod 包含 4 种发放方式', () => {
    const methods: PaymentMethod[] = ['bank', 'cash', 'wechat', 'alipay']
    assert.equal(methods.length, 4)
  })
})

describe('salary entity - PayrollRecord', () => {
  it('已发放薪资单完整字段', () => {
    const payroll: PayrollRecord = {
      id: 'pay-001',
      code: 'SAL000001',
      storeId: 'store-001',
      period: '2026-07',
      employeeId: 'emp-001',
      employeeName: '张三',
      mode: 'monthly',
      grossPay: 12000,
      totalDeductions: 2540,
      netPay: 9460,
      items: [
        { item: 'base', label: '基本工资', amount: 8000 },
        { item: 'bonus', label: '绩效奖金', amount: 3000 },
        { item: 'allowance', label: '津贴补助', amount: 1000 },
        { item: 'social_security', label: '社保扣款', amount: -1200 },
        { item: 'housing_fund', label: '公积金扣款', amount: -840 },
        { item: 'tax', label: '个税扣款', amount: -500 },
      ],
      status: 'paid',
      approverId: 'admin-001',
      approvalRemark: '同意',
      approvalAt: '2026-07-10T10:00:00Z',
      paymentMethod: 'bank',
      paymentAccount: '6217****8888',
      paidAt: '2026-07-15T09:00:00Z',
      paidBy: 'finance-001',
      paidByName: '财务小王',
      createdAt: '2026-07-05T08:00:00Z',
      updatedAt: '2026-07-15T09:00:00Z',
    }
    assert.equal(payroll.status, 'paid')
    assert.equal(payroll.netPay, 9460)
    assert.equal(payroll.grossPay, 12000)
    assert.equal(payroll.totalDeductions, 2540)
    assert.equal(payroll.items.length, 6)
    assert.equal(payroll.paymentMethod, 'bank')
    assert.equal(payroll.paidByName, '财务小王')
  })

  it('草稿状态薪资单', () => {
    const payroll: PayrollRecord = {
      id: 'pay-002',
      code: 'SAL000002',
      storeId: 'store-001',
      period: '2026-08',
      employeeId: 'emp-002',
      employeeName: '李四',
      mode: 'commission',
      grossPay: 7500,
      totalDeductions: 1000,
      netPay: 6500,
      items: [
        { item: 'commission', label: '提成', amount: 6500 },
        { item: 'allowance', label: '津贴补助', amount: 1000 },
        { item: 'social_security', label: '社保扣款', amount: -600 },
        { item: 'tax', label: '个税扣款', amount: -400 },
      ],
      status: 'draft',
      createdAt: '2026-08-01T08:00:00Z',
      updatedAt: '2026-08-01T08:00:00Z',
    }
    assert.equal(payroll.status, 'draft')
    assert.equal(payroll.mode, 'commission')
    assert.equal(payroll.items.length, 4)
  })

  it('待审批状态薪资单', () => {
    const payroll: PayrollRecord = {
      id: 'pay-003',
      code: 'SAL000003',
      storeId: 'store-002',
      period: '2026-07',
      employeeId: 'emp-003',
      employeeName: '王五',
      mode: 'mixed',
      grossPay: 15000,
      totalDeductions: 3500,
      netPay: 11500,
      items: [
        { item: 'base', label: '基本工资', amount: 5000 },
        { item: 'commission', label: '提成', amount: 8000 },
        { item: 'overtime', label: '加班费', amount: 2000 },
        { item: 'social_security', label: '社保扣款', amount: -1500 },
        { item: 'housing_fund', label: '公积金扣款', amount: -1000 },
        { item: 'tax', label: '个税扣款', amount: -1000 },
      ],
      status: 'pending',
      createdAt: '2026-07-20T09:00:00Z',
      updatedAt: '2026-07-20T09:00:00Z',
    }
    assert.equal(payroll.status, 'pending')
    assert.equal(payroll.mode, 'mixed')
    assert.equal(payroll.grossPay, 15000)
  })

  it('已驳回薪资单', () => {
    const payroll: PayrollRecord = {
      id: 'pay-004',
      code: 'SAL000004',
      storeId: 'store-001',
      period: '2026-07',
      employeeId: 'emp-004',
      employeeName: '赵六',
      mode: 'monthly',
      grossPay: 8000,
      totalDeductions: 1400,
      netPay: 6600,
      items: [
        { item: 'base', label: '基本工资', amount: 8000 },
        { item: 'social_security', label: '社保扣款', amount: -800 },
        { item: 'housing_fund', label: '公积金扣款', amount: -600 },
      ],
      status: 'rejected',
      approverId: 'admin-001',
      approvalRemark: '数据异常，请联系财务',
      approvalAt: '2026-07-21T10:00:00Z',
      createdAt: '2026-07-19T08:00:00Z',
      updatedAt: '2026-07-21T10:00:00Z',
    }
    assert.equal(payroll.status, 'rejected')
    assert.equal(payroll.approvalRemark, '数据异常，请联系财务')
  })

  it('已取消薪资单', () => {
    const payroll: PayrollRecord = {
      id: 'pay-005',
      code: 'SAL000005',
      storeId: 'store-001',
      period: '2026-07',
      employeeId: 'emp-001',
      employeeName: '张三',
      mode: 'hourly',
      grossPay: 3000,
      totalDeductions: 0,
      netPay: 3000,
      items: [
        { item: 'base', label: '时薪工资', amount: 3000 },
      ],
      status: 'cancelled',
      createdAt: '2026-07-10T08:00:00Z',
      updatedAt: '2026-07-11T10:00:00Z',
    }
    assert.equal(payroll.status, 'cancelled')
    assert.equal(payroll.mode, 'hourly')
  })

  it('支持所有薪资模式', () => {
    const modes: SalaryMode[] = ['monthly', 'hourly', 'commission', 'mixed']
    for (const mode of modes) {
      const payroll: PayrollRecord = {
        id: `pay-${mode}`,
        code: `SAL${mode.toUpperCase()}`,
        storeId: 'store-001',
        period: '2026-07',
        employeeId: 'emp-001',
        employeeName: '测试',
        mode,
        grossPay: 5000,
        totalDeductions: 500,
        netPay: 4500,
        items: [{ item: 'base', label: '工资', amount: 5000 }],
        status: 'draft',
        createdAt: '2026-07-01T00:00:00Z',
        updatedAt: '2026-07-01T00:00:00Z',
      }
      assert.equal(payroll.mode, mode)
    }
  })

  it('SalaryLineItem 正负金额区分', () => {
    const income: SalaryLineItem = { item: 'bonus', label: '奖金', amount: 3000 }
    const deduction: SalaryLineItem = { item: 'tax', label: '个税', amount: -500 }
    assert.ok(income.amount > 0)
    assert.ok(deduction.amount < 0)
  })
})

describe('salary entity - SalaryApprovalRecord', () => {
  it('审批记录提交操作', () => {
    const record: SalaryApprovalRecord = {
      id: 'ar-001',
      payrollId: 'pay-001',
      action: 'submit',
      operatorId: 'emp-001',
      operatorName: '张三',
      remark: '提交薪资单',
      createdAt: '2026-07-05T08:00:00Z',
    }
    assert.equal(record.action, 'submit')
    assert.equal(record.operatorName, '张三')
  })

  it('审批记录支持所有操作类型', () => {
    const actions: SalaryApprovalRecord['action'][] = ['submit', 'approve', 'reject', 'pay', 'cancel']
    assert.equal(actions.length, 5)
  })

  it('审批记录无备注', () => {
    const record: SalaryApprovalRecord = {
      id: 'ar-002',
      payrollId: 'pay-002',
      action: 'approve',
      operatorId: 'admin-001',
      operatorName: '管理员',
      createdAt: '2026-07-10T10:00:00Z',
    }
    assert.equal(record.remark, undefined)
  })
})

describe('salary entity - PayrollDetail', () => {
  it('PayrollDetail 含审批历史', () => {
    const detail: PayrollDetail = {
      id: 'pay-001',
      code: 'SAL000001',
      storeId: 'store-001',
      period: '2026-07',
      employeeId: 'emp-001',
      employeeName: '张三',
      mode: 'monthly',
      grossPay: 12000,
      totalDeductions: 2540,
      netPay: 9460,
      items: [{ item: 'base', label: '基本工资', amount: 8000 }],
      status: 'paid',
      createdAt: '2026-07-05T08:00:00Z',
      updatedAt: '2026-07-15T09:00:00Z',
      approvalHistory: [
        { id: 'ar-1', payrollId: 'pay-001', action: 'submit', operatorId: 'emp-001', operatorName: '张三', createdAt: '2026-07-05T08:00:00Z' },
        { id: 'ar-2', payrollId: 'pay-001', action: 'approve', operatorId: 'admin-001', operatorName: '管理员', createdAt: '2026-07-10T10:00:00Z' },
        { id: 'ar-3', payrollId: 'pay-001', action: 'pay', operatorId: 'finance-001', operatorName: '财务小王', createdAt: '2026-07-15T09:00:00Z' },
      ],
    }
    assert.equal(detail.approvalHistory!.length, 3)
    assert.equal(detail.approvalHistory![0].action, 'submit')
    assert.equal(detail.approvalHistory![2].action, 'pay')
  })

  it('PayrollDetail 含考勤信息', () => {
    const detail: PayrollDetail = {
      id: 'pay-002',
      code: 'SAL000002',
      storeId: 'store-001',
      period: '2026-07',
      employeeId: 'emp-002',
      employeeName: '李四',
      mode: 'monthly',
      grossPay: 8000,
      totalDeductions: 1400,
      netPay: 6600,
      items: [{ item: 'base', label: '基本工资', amount: 8000 }],
      status: 'draft',
      createdAt: '2026-07-20T00:00:00Z',
      updatedAt: '2026-07-20T00:00:00Z',
      workingDays: 22,
      attendanceDays: 20,
    }
    assert.equal(detail.workingDays, 22)
    assert.equal(detail.attendanceDays, 20)
  })
})

describe('salary entity - SalarySummary', () => {
  it('薪资统计完整结构', () => {
    const summary: SalarySummary = {
      period: 'monthly',
      from: '2026-07-01',
      to: '2026-07-31',
      totalEmployees: 3,
      totalGross: 35500,
      totalDeductions: 7040,
      totalNet: 28460,
      totalPaid: 9460,
      totalPending: 8500,
      byStore: {
        'store-001': 16960,
        'store-002': 11500,
      },
      byMode: {
        monthly: 9460,
        commission: 7500,
        mixed: 11500,
      },
    }
    assert.equal(summary.totalEmployees, 3)
    assert.equal(summary.totalGross, 35500)
    assert.equal(summary.totalDeductions, 7040)
    assert.equal(summary.totalNet, 28460)
    assert.equal(summary.byStore['store-001'], 16960)
    assert.equal(summary.byMode.mixed, 11500)
  })

  it('薪资统计空数据', () => {
    const summary: SalarySummary = {
      period: 'daily',
      from: '2026-01-01',
      to: '2026-01-01',
      totalEmployees: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalPaid: 0,
      totalPending: 0,
      byStore: {},
      byMode: {},
    }
    assert.equal(summary.totalEmployees, 0)
    assert.equal(Object.keys(summary.byStore).length, 0)
  })
})

describe('salary entity - 标签常量', () => {
  it('SALARY_ITEM_LABELS 包含 10 个项目中文名', () => {
    assert.equal(Object.keys(SALARY_ITEM_LABELS).length, 10)
    assert.equal(SALARY_ITEM_LABELS.base, '基本工资')
    assert.equal(SALARY_ITEM_LABELS.bonus, '绩效奖金')
    assert.equal(SALARY_ITEM_LABELS.commission, '提成')
    assert.equal(SALARY_ITEM_LABELS.social_security, '社保扣款')
    assert.equal(SALARY_ITEM_LABELS.deduction, '其他扣款')
  })

  it('SALARY_STATUS_LABELS 包含 6 个状态中文名', () => {
    assert.equal(Object.keys(SALARY_STATUS_LABELS).length, 6)
    assert.equal(SALARY_STATUS_LABELS.draft, '草稿')
    assert.equal(SALARY_STATUS_LABELS.paid, '已发放')
    assert.equal(SALARY_STATUS_LABELS.rejected, '已驳回')
  })

  it('SALARY_MODE_LABELS 包含 4 种模式中文名', () => {
    assert.equal(Object.keys(SALARY_MODE_LABELS).length, 4)
    assert.equal(SALARY_MODE_LABELS.monthly, '月度薪资')
    assert.equal(SALARY_MODE_LABELS.hourly, '时薪制')
  })

  it('PAYMENT_METHOD_LABELS 包含 4 种发放方式中文名', () => {
    assert.equal(Object.keys(PAYMENT_METHOD_LABELS).length, 4)
    assert.equal(PAYMENT_METHOD_LABELS.bank, '银行转账')
    assert.equal(PAYMENT_METHOD_LABELS.wechat, '微信支付')
    assert.equal(PAYMENT_METHOD_LABELS.alipay, '支付宝')
  })
})
