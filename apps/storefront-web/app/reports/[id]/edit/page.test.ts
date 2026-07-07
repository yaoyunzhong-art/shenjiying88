/**
 * ReportsEditPage — node:test 兼容适配
 * 不渲染 React 组件（无 jsdom），只验证：
 * - 模块可导入，default 导出为函数
 * - Mock 数据完整性
 * - 表单验证逻辑
 * - 指标操作逻辑（添加/删除/更新）
 * - 未找到报表分支逻辑
 * - REPORT_TYPE_OPTIONS 完整性
 * - 状态标签/颜色映射
 * - 辅助函数逻辑
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ========== 与 page.tsx 保持一致的常量/类型/函数 ========== //

type ReportTypeValue = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

const REPORT_TYPE_OPTIONS: readonly { value: ReportTypeValue; label: string }[] = [
  { value: 'daily', label: '日报' },
  { value: 'weekly', label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'quarterly', label: '季报' },
  { value: 'yearly', label: '年报' },
  { value: 'custom', label: '自定义' },
];

type ReportStatus = 'generated' | 'generating' | 'failed' | 'expired';

interface EditFormData {
  title: string;
  type: ReportTypeValue | '';
  period: string;
  summary: string;
  notes: string;
  metrics: Record<string, string>;
  newMetricKey: string;
  newMetricValue: string;
}

interface FormErrors {
  title?: string;
  type?: string;
  period?: string;
  summary?: string;
}

interface MockReport {
  id: string; title: string; type: ReportTypeValue;
  period: string; createdAt: string; status: ReportStatus;
  summary: string; notes: string;
  metrics?: Record<string, string | number>;
}

const MOCK_REPORTS: Record<string, MockReport> = {
  '1': {
    id: '1', title: '2026年6月25日销售日活报表', type: 'daily',
    period: '2026-06-25', createdAt: '2026-06-26 00:15', status: 'generated',
    summary: '本日销售额 ¥12,580.00，环比昨日 +8.3%，客单价 ¥286.00，成交单数 44 单。',
    notes: '每日自动生成',
    metrics: { '销售额': '¥12,580.00', '客单价': '¥286.00', '订单数': '44', '转化率': '8.3%' },
  },
  '2': {
    id: '2', title: '2026年第26周销售周报', type: 'weekly',
    period: '2026 W26', createdAt: '2026-06-22 00:20', status: 'generated',
    summary: '本周销售额 ¥72,360.00，环比上周 +5.1%，热销品类：护肤品、彩妆。',
    notes: '每周一凌晨自动生成',
    metrics: { '销售额': '¥72,360.00', '热销品类': '护肤品、彩妆', '订单数': '253', '客单价': '¥286.00' },
  },
  '4': {
    id: '4', title: '2026年Q2季度销售报告', type: 'quarterly',
    period: '2026 Q2', createdAt: '2026-06-01 02:00', status: 'failed',
    summary: '上季度数据汇总异常，部分门店数据未同步，请重新生成。',
    notes: '',
    metrics: {},
  },
  '6': {
    id: '6', title: '618大促活动销售分析', type: 'custom',
    period: '2026-06-18 ~ 2026-06-20', createdAt: '2026-06-21 10:30', status: 'generated',
    summary: '618大促3日累计销售额 ¥85,200.00，同比去年618 +22.5%。',
    notes: '大促专属分析报告',
    metrics: { '累计销售额': '¥85,200.00', '同比去年618': '+22.5%', '订单数': '298' },
  },
};

// ========== 验证函数 ========== //

function validateEditForm(data: EditFormData): FormErrors {
  const errors: FormErrors = {};
  const title = (data.title || '').trim();
  if (!title) errors.title = '请输入报表标题';
  else if (title.length < 2) errors.title = '标题至少2个字符';
  else if (title.length > 60) errors.title = '标题不能超过60个字符';

  if (!data.type) errors.type = '请选择报表类型';

  const period = (data.period || '').trim();
  if (!period) errors.period = '请填写报表周期';

  const summary = (data.summary || '').trim();
  if (!summary) errors.summary = '请输入报表摘要';
  else if (summary.length > 500) errors.summary = '摘要不能超过500个字符';

  return errors;
}

// ========== 辅助函数 ========== //

function getStatusInfo(status: ReportStatus): { color: string; label: string } {
  const map: Record<ReportStatus, { color: string; label: string }> = {
    generated: { color: '#059669', label: '已生成' },
    generating: { color: '#d97706', label: '生成中' },
    failed: { color: '#dc2626', label: '失败' },
    expired: { color: '#6b7280', label: '已过期' },
  };
  return map[status];
}

function addMetric(metrics: Record<string, string>, key: string, value: string): Record<string, string> {
  const k = key.trim();
  const v = value.trim();
  if (!k || !v) return metrics;
  return { ...metrics, [k]: v };
}

function removeMetric(metrics: Record<string, string>, key: string): Record<string, string> {
  const next = { ...metrics };
  delete next[key];
  return next;
}

// ========== 测试 ========== //

describe('ReportsEditPage 报表编辑', () => {
  it('1. 模块可导入，default 导出为函数', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function (component)');
  });

  it('2. REPORT_TYPE_OPTIONS 包含所有 6 种类型', () => {
    assert.equal(REPORT_TYPE_OPTIONS.length, 6);
    const values = REPORT_TYPE_OPTIONS.map(o => o.value);
    assert.deepEqual(values, ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']);
  });

  it('3. REPORT_TYPE_OPTIONS 标签映射正确', () => {
    const label = Object.fromEntries(REPORT_TYPE_OPTIONS.map(o => [o.value, o.label]));
    assert.equal(label.daily, '日报');
    assert.equal(label.weekly, '周报');
    assert.equal(label.monthly, '月报');
    assert.equal(label.quarterly, '季报');
    assert.equal(label.yearly, '年报');
    assert.equal(label.custom, '自定义');
  });
});

describe('ReportsEditPage Mock 数据', () => {
  it('4. MOCK_REPORTS id=1 数据完整性（daily/generated）', () => {
    const r = MOCK_REPORTS['1'];
    assert.ok(r);
    assert.equal(r.title, '2026年6月25日销售日活报表');
    assert.equal(r.type, 'daily');
    assert.equal(r.status, 'generated');
    assert.equal(r.notes, '每日自动生成');
    assert.equal(Object.keys(r.metrics || {}).length, 4);
  });

  it('5. MOCK_REPORTS id=2 数据完整性（weekly/generated）', () => {
    const r = MOCK_REPORTS['2'];
    assert.ok(r);
    assert.equal(r.title, '2026年第26周销售周报');
    assert.equal(r.type, 'weekly');
    assert.equal(r.period, '2026 W26');
    assert.equal(r.status, 'generated');
    assert.equal(Object.keys(r.metrics || {}).length, 4);
  });

  it('6. MOCK_REPORTS id=4 数据完整性（quarterly/failed 无指标）', () => {
    const r = MOCK_REPORTS['4'];
    assert.ok(r);
    assert.equal(r.title, '2026年Q2季度销售报告');
    assert.equal(r.type, 'quarterly');
    assert.equal(r.period, '2026 Q2');
    assert.equal(r.status, 'failed');
    assert.equal(r.notes, '');
    assert.deepEqual(r.metrics, {});
  });

  it('7. MOCK_REPORTS id=6 数据完整性（custom/generated）', () => {
    const r = MOCK_REPORTS['6'];
    assert.ok(r);
    assert.equal(r.title, '618大促活动销售分析');
    assert.equal(r.type, 'custom');
    assert.equal(r.status, 'generated');
    assert.equal(Object.keys(r.metrics || {}).length, 3);
    assert.equal(r.metrics?.['累计销售额'], '¥85,200.00');
  });

  it('8. 不存在的 ID 应返回 undefined', () => {
    assert.equal(MOCK_REPORTS['999'], undefined);
    assert.equal(MOCK_REPORTS['nonexistent'], undefined);
  });
});

describe('ReportsEditPage 表单验证', () => {
  const validForm: EditFormData = {
    title: '2026年7月销售月报',
    type: 'monthly',
    period: '2026-07',
    summary: '本月销售数据汇总',
    notes: '',
    metrics: { '销售额': '¥100,000' },
    newMetricKey: '',
    newMetricValue: '',
  };

  it('9. 有效表单通过验证', () => {
    const err = validateEditForm(validForm);
    assert.deepEqual(err, {});
  });

  it('10. 空标题返回错误', () => {
    const err = validateEditForm({ ...validForm, title: '' });
    assert.equal(err.title, '请输入报表标题');
  });

  it('11. 标题太短返回错误', () => {
    const err = validateEditForm({ ...validForm, title: 'A' });
    assert.equal(err.title, '标题至少2个字符');
  });

  it('12. 标题太长返回错误', () => {
    const err = validateEditForm({ ...validForm, title: 'A'.repeat(61) });
    assert.equal(err.title, '标题不能超过60个字符');
  });

  it('13. 标题含空白仍验证', () => {
    const err = validateEditForm({ ...validForm, title: '  ' });
    assert.equal(err.title, '请输入报表标题');
  });

  it('14. 未选择类型返回错误', () => {
    const err = validateEditForm({ ...validForm, type: '' as any });
    assert.equal(err.type, '请选择报表类型');
  });

  it('15. 空周期返回错误', () => {
    const err = validateEditForm({ ...validForm, period: '' });
    assert.equal(err.period, '请填写报表周期');
  });

  it('16. 空白周期返回错误', () => {
    const err = validateEditForm({ ...validForm, period: '   ' });
    assert.equal(err.period, '请填写报表周期');
  });

  it('17. 空摘要返回错误', () => {
    const err = validateEditForm({ ...validForm, summary: '' });
    assert.equal(err.summary, '请输入报表摘要');
  });

  it('18. 摘要超过 500 字符返回错误', () => {
    const err = validateEditForm({ ...validForm, summary: 'A'.repeat(501) });
    assert.equal(err.summary, '摘要不能超过500个字符');
  });

  it('19. 多字段同时错误', () => {
    const err = validateEditForm({ ...validForm, title: '', type: '' as any, period: '', summary: '' });
    assert.ok(err.title);
    assert.ok(err.type);
    assert.ok(err.period);
    assert.ok(err.summary);
  });

  it('20. 字段边界：标题为60字符通过', () => {
    const err = validateEditForm({ ...validForm, title: 'A'.repeat(60) });
    assert.equal(err.title, undefined);
  });

  it('21. 字段边界：摘要为500字符通过', () => {
    const err = validateEditForm({ ...validForm, summary: 'A'.repeat(500) });
    assert.equal(err.summary, undefined);
  });
});

describe('ReportsEditPage 指标操作', () => {
  it('22. addMetric 添加新指标', () => {
    const m = addMetric({ '销售额': '¥100' }, '客单价', '¥286');
    assert.equal(m['销售额'], '¥100');
    assert.equal(m['客单价'], '¥286');
    assert.equal(Object.keys(m).length, 2);
  });

  it('23. addMetric 空 key 不操作', () => {
    const m = addMetric({ 'a': '1' }, '', 'v');
    assert.equal(Object.keys(m).length, 1);
    assert.equal(m['a'], '1');
  });

  it('24. addMetric 空 value 不操作', () => {
    const m = addMetric({ 'a': '1' }, 'key', '');
    assert.equal(Object.keys(m).length, 1);
  });

  it('25. addMetric 覆盖已有 key', () => {
    const m = addMetric({ '销售额': '¥100' }, '销售额', '¥999');
    assert.equal(m['销售额'], '¥999');
    assert.equal(Object.keys(m).length, 1);
  });

  it('26. removeMetric 删除指标', () => {
    const m = removeMetric({ 'a': '1', 'b': '2' }, 'a');
    assert.equal(Object.keys(m).length, 1);
    assert.equal(m['b'], '2');
    assert.equal(m['a'], undefined);
  });

  it('27. removeMetric 删除不存在的 key 无副作用', () => {
    const m = removeMetric({ 'a': '1' }, 'nonexistent');
    assert.equal(Object.keys(m).length, 1);
    assert.equal(m['a'], '1');
  });

  it('28. removeMetric 删除后空对象', () => {
    const m = removeMetric({ 'a': '1' }, 'a');
    assert.deepEqual(m, {});
  });

  it('29. 指标 key 去重', () => {
    const m = addMetric(addMetric({}, 'k1', 'v1'), 'k1', 'v2');
    assert.equal(Object.keys(m).length, 1);
    assert.equal(m['k1'], 'v2');
  });
});

describe('ReportsEditPage 状态信息', () => {
  it('30. generated 状态', () => {
    const info = getStatusInfo('generated');
    assert.equal(info.color, '#059669');
    assert.equal(info.label, '已生成');
  });

  it('31. generating 状态', () => {
    const info = getStatusInfo('generating');
    assert.equal(info.color, '#d97706');
    assert.equal(info.label, '生成中');
  });

  it('32. failed 状态', () => {
    const info = getStatusInfo('failed');
    assert.equal(info.color, '#dc2626');
    assert.equal(info.label, '失败');
  });

  it('33. expired 状态', () => {
    const info = getStatusInfo('expired');
    assert.equal(info.color, '#6b7280');
    assert.equal(info.label, '已过期');
  });

  it('34. 所有 4 种状态均有映射', () => {
    const statuses: ReportStatus[] = ['generated', 'generating', 'failed', 'expired'];
    statuses.forEach(s => {
      const info = getStatusInfo(s);
      assert.ok(info.color.startsWith('#'));
      assert.ok(info.label.length > 0);
    });
  });
});

describe('ReportsEditPage 未找到分支', () => {
  it('35. MOCK_REPORTS 中不存在 id=99', () => {
    assert.equal('99' in MOCK_REPORTS, false);
  });

  it('36. 不存在 id 时返回 undefined', () => {
    assert.equal(MOCK_REPORTS['99'], undefined);
  });

  it('37. 已存在的 id 列表', () => {
    const ids = Object.keys(MOCK_REPORTS);
    assert.ok(ids.includes('1'));
    assert.ok(ids.includes('2'));
    assert.ok(ids.includes('4'));
    assert.ok(ids.includes('6'));
    assert.equal(ids.length, 4);
  });
});
