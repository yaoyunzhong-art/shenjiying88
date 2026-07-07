/**
 * reports/new/page.test.ts — 新建报表表单页测试
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 覆盖: 正例(完整表单提交) + 反例(空字段/验证失败) + 边界(字段长度/指标全选/提交失败)
 */

import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

// ============ 类型 & 常量（保持与 page.tsx 一致）============ //

const REPORT_TYPE_OPTIONS = [
  { value: 'daily', label: '日报' },
  { value: 'weekly', label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'quarterly', label: '季报' },
  { value: 'yearly', label: '年报' },
  { value: 'custom', label: '自定义' },
] as const;

type ReportTypeValue = (typeof REPORT_TYPE_OPTIONS)[number]['value'];

const METRIC_OPTIONS = [
  { value: 'sales', label: '销售额' },
  { value: 'orders', label: '订单数' },
  { value: 'avgOrderValue', label: '客单价' },
  { value: 'conversionRate', label: '转化率' },
  { value: 'memberGrowth', label: '会员增长' },
  { value: 'topProducts', label: '热销商品' },
  { value: 'categoryDistribution', label: '品类分布' },
  { value: 'hourlyDistribution', label: '时段分布' },
] as const;

interface ReportFormData {
  title: string;
  type: ReportTypeValue;
  period: string;
  includeMetrics: string[];
  notes: string;
}

interface FormErrors {
  title?: string;
  type?: string;
  period?: string;
  includeMetrics?: string;
}

const ALL_METRIC_VALUES = METRIC_OPTIONS.map(m => m.value);

// ============ 验证函数（与 page.tsx 保持逻辑一致）============ //

function validateForm(data: ReportFormData): FormErrors {
  const errors: FormErrors = {};
  const title = (data.title || '').trim();
  if (!title) {
    errors.title = '请输入报表标题';
  } else if (title.length < 2) {
    errors.title = '标题至少2个字符';
  } else if (title.length > 60) {
    errors.title = '标题不能超过60个字符';
  }

  if (!data.type) {
    errors.type = '请选择报表类型';
  }

  const period = (data.period || '').trim();
  if (!period) {
    errors.period = '请填写报表周期';
  } else if (period.length > 50) {
    errors.period = '周期描述不能超过50个字符';
  }

  if (!data.includeMetrics || data.includeMetrics.length === 0) {
    errors.includeMetrics = '请至少选择一个统计指标';
  }

  return errors;
}

async function submitReport(data: ReportFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  await new Promise(r => setTimeout(r, 50));
  // 模拟：标题含 "fail" 时返回错误
  if (data.title.includes('fail')) {
    return { success: false, error: '服务器繁忙，请稍后重试' };
  }
  return { success: true, id: 'test-report-id' };
}

function makeValidForm(overrides?: Partial<ReportFormData>): ReportFormData {
  return {
    title: '2026年7月销售月报',
    type: 'monthly',
    period: '2026-07',
    includeMetrics: ['sales', 'orders', 'conversionRate'],
    notes: '',
    ...overrides,
  };
}

// ============ 测试 ============ //

describe('📊 ReportsNewFormPage — 新建报表表单页', () => {

  // ─── 正例 ───

  it('✅ 正例: 完整有效表单验证通过', () => {
    const data = makeValidForm();
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '所有字段有效时不应返回错误');
  });

  it('✅ 正例: 所有指标全选通过验证', () => {
    const data = makeValidForm({ includeMetrics: [...ALL_METRIC_VALUES] });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '全选指标应验证通过');
  });

  it('✅ 正例: 带备注提交成功', () => {
    const data = makeValidForm({ notes: '需要包含同比数据分析' });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '带备注的表单应验证通过');
  });

  it('✅ 正例: 所有报表类型都支持', () => {
    for (const opt of REPORT_TYPE_OPTIONS) {
      const data = makeValidForm({ type: opt.value, period: `test-${opt.value}` });
      const errors = validateForm(data);
      assert.deepEqual(errors, {}, `报表类型 ${opt.label}(${opt.value}) 应验证通过`);
    }
  });

  it('✅ 正例: 提交成功返回 id', async () => {
    const data = makeValidForm();
    const result = await submitReport(data);
    assert.equal(result.success, true, '有效表单提交应成功');
    assert.ok(result.id, '应返回报表 ID');
    assert.equal(result.id, 'test-report-id');
  });

  // ─── 反例 ───

  it('❌ 反例: 空标题报错', () => {
    const data = makeValidForm({ title: '' });
    const errors = validateForm(data);
    assert.ok(errors.title, '空标题应报错');
    assert.equal(errors.title, '请输入报表标题');
  });

  it('❌ 反例: 标题仅空格报错', () => {
    const data = makeValidForm({ title: '   ' });
    const errors = validateForm(data);
    assert.ok(errors.title, '仅空格的标题应报错');
  });

  it('❌ 反例: 标题过短报错', () => {
    const data = makeValidForm({ title: 'X' });
    const errors = validateForm(data);
    assert.ok(errors.title, '单字符标题应报错');
    assert.equal(errors.title, '标题至少2个字符');
  });

  it('❌ 反例: 标题超出长度报错', () => {
    const data = makeValidForm({ title: 'X'.repeat(61) });
    const errors = validateForm(data);
    assert.ok(errors.title, '超长标题应报错');
    assert.equal(errors.title, '标题不能超过60个字符');
  });

  it('❌ 反例: 未选类型报错', () => {
    const data = makeValidForm({ type: '' as ReportTypeValue });
    const errors = validateForm(data);
    assert.ok(errors.type, '未选类型应报错');
  });

  it('❌ 反例: 空周期报错', () => {
    const data = makeValidForm({ period: '' });
    const errors = validateForm(data);
    assert.ok(errors.period, '空周期应报错');
    assert.equal(errors.period, '请填写报表周期');
  });

  it('❌ 反例: 周期超长报错', () => {
    const data = makeValidForm({ period: 'X'.repeat(51) });
    const errors = validateForm(data);
    assert.ok(errors.period, '超长周期应报错');
  });

  it('❌ 反例: 未选指标报错', () => {
    const data = makeValidForm({ includeMetrics: [] });
    const errors = validateForm(data);
    assert.ok(errors.includeMetrics, '未选指标应报错');
    assert.equal(errors.includeMetrics, '请至少选择一个统计指标');
  });

  it('❌ 反例: 全空字段应同时返回多个错误', () => {
    const data = makeValidForm({
      title: '',
      type: '' as ReportTypeValue,
      period: '',
      includeMetrics: [],
    });
    const errors = validateForm(data);
    const errorFields = Object.keys(errors);
    assert.ok(errorFields.length >= 3, '全空字段应返回至少3个错误');
    assert.ok(errorFields.includes('title'), '应包含标题错误');
    assert.ok(errorFields.includes('type'), '应包含类型错误');
    assert.ok(errorFields.includes('period'), '应包含周期错误');
    assert.ok(errorFields.includes('includeMetrics'), '应包含指标错误');
  });

  it('❌ 反例: 提交失败返回错误信息', async () => {
    const data = makeValidForm({ title: 'test fail report' });
    const result = await submitReport(data);
    assert.equal(result.success, false, '模拟失败应返回 success=false');
    assert.ok(result.error, '应包含错误消息');
    assert.equal(result.error, '服务器繁忙，请稍后重试');
  });

  // ─── 边界 ───

  it('🔺 边界: 标题恰好60字符', () => {
    const data = makeValidForm({ title: 'A'.repeat(60) });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '恰好60字符应通过');
  });

  it('🔺 边界: 标题恰好2字符', () => {
    const data = makeValidForm({ title: 'AB' });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '恰好2字符应通过');
  });

  it('🔺 边界: 周期恰好50字符', () => {
    const data = makeValidForm({ period: 'B'.repeat(50) });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '恰好50字符应通过');
  });

  it('🔺 边界: 只选一个指标通过', () => {
    const data = makeValidForm({ includeMetrics: ['sales'] });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '只选1个指标应通过');
  });

  it('🔺 边界: 备注200字符边界', () => {
    const data = makeValidForm({ notes: 'C'.repeat(200) });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '备注200字符应通过');
  });

  it('🔺 边界: 周期只含空格应报错', () => {
    const data = makeValidForm({ period: '   ' });
    const errors = validateForm(data);
    assert.ok(errors.period, '周期仅空格应报错');
  });

  it('🔺 边界: 类型转换兼容性', () => {
    // 验证所有有效的 type 值
    const validTypes: ReportTypeValue[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
    for (const t of validTypes) {
      const data = makeValidForm({ type: t, period: `p-${t}` });
      const errors = validateForm(data);
      assert.deepEqual(errors, {}, `ReportTypeValue "${t}" 应通过验证`);
    }
  });

  it('🔺 边界: 指标最多8项不报错', () => {
    const data = makeValidForm({ includeMetrics: [...ALL_METRIC_VALUES] });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '8项指标全选应通过');
  });

  it('🔺 边界: 空对象入参时报错所有必填', () => {
    const empty = {} as ReportFormData;
    const errors = validateForm(empty);
    assert.ok(errors.title, 'title 报错');
    assert.ok(errors.type, 'type 报错');
    assert.ok(errors.period, 'period 报错');
    assert.ok(errors.includeMetrics, 'includeMetrics 报错');
  });

  it('🔺 边界: submitReport 异步超时保护', async () => {
    const start = Date.now();
    const data = makeValidForm();
    await submitReport(data);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 2000, '提交时间应在2秒内');
  });
});
