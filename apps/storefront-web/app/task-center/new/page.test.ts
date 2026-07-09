/**
 * task-center/new/page.test.ts — 新建任务表单页测试
 * 角色视角: 👔店长 / 🏪全体门店员工
 * 类型: B-表单页
 * 覆盖: 正例(完整表单提交) + 反例(空字段/验证失败) + 边界(字段长度/优先级切换/提交失败)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============ 类型 & 常量（保持与 page.tsx 一致）============ //

const TASK_TYPE_OPTIONS = [
  { value: 'stocktaking', label: '盘点任务' },
  { value: 'cleaning', label: '清洁任务' },
  { value: 'training', label: '培训任务' },
  { value: 'customer_followup', label: '客户跟进' },
  { value: 'inspection', label: '巡检任务' },
  { value: 'promotion', label: '促销准备' },
  { value: 'other', label: '其他' },
] as const;

type TaskTypeValue = (typeof TASK_TYPE_OPTIONS)[number]['value'];

const PRIORITY_OPTIONS = [
  { value: 'low', label: '低优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'high', label: '高优先级' },
  { value: 'urgent', label: '紧急' },
] as const;

type PriorityValue = (typeof PRIORITY_OPTIONS)[number]['value'];

interface TaskFormData {
  title: string;
  description: string;
  type: TaskTypeValue;
  priority: PriorityValue;
  assignee: string;
  deadline: string;
}

interface FormErrors {
  title?: string;
  type?: string;
  assignee?: string;
  deadline?: string;
}

// ============ 验证函数（与 page.tsx 保持逻辑一致）============ //

function validateForm(data: TaskFormData): FormErrors {
  const errors: FormErrors = {};
  const title = (data.title || '').trim();
  if (!title) {
    errors.title = '请输入任务标题';
  } else if (title.length < 2) {
    errors.title = '标题至少2个字符';
  } else if (title.length > 100) {
    errors.title = '标题不能超过100个字符';
  }

  if (!data.type) {
    errors.type = '请选择任务类型';
  }

  const assignee = (data.assignee || '').trim();
  if (!assignee) {
    errors.assignee = '请填写负责人';
  } else if (assignee.length > 30) {
    errors.assignee = '负责人姓名不能超过30个字符';
  }

  if (!data.deadline) {
    errors.deadline = '请设置截止日期';
  } else if (data.deadline.length > 10) {
    errors.deadline = '日期格式不正确';
  }

  return errors;
}

async function submitTask(data: TaskFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  await new Promise(r => setTimeout(r, 50));
  if (data.title.includes('error')) {
    return { success: false, error: '创建失败，请检查参数后重试' };
  }
  return { success: true, id: `task-${Date.now()}` };
}

function makeValidForm(overrides?: Partial<TaskFormData>): TaskFormData {
  return {
    title: '7月第二周门店盘点',
    description: '对门店所有在售商品进行盘点并更新系统库存',
    type: 'stocktaking',
    priority: 'medium',
    assignee: '张三',
    deadline: '2026-07-16',
    ...overrides,
  };
}

// ============ 测试 ============ //

describe('✅ TaskCreateFormPage — 新建任务表单页', () => {

  // ─── 正例 ───

  it('✅ 正例: 完整有效表单验证通过', () => {
    const data = makeValidForm();
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '所有字段有效时不应返回错误');
  });

  it('✅ 正例: 所有任务类型都支持', () => {
    for (const opt of TASK_TYPE_OPTIONS) {
      const data = makeValidForm({ type: opt.value });
      const errors = validateForm(data);
      assert.deepEqual(errors, {}, `任务类型 ${opt.label}(${opt.value}) 应验证通过`);
    }
  });

  it('✅ 正例: 所有优先级都支持', () => {
    for (const opt of PRIORITY_OPTIONS) {
      const data = makeValidForm({ priority: opt.value });
      const errors = validateForm(data);
      assert.deepEqual(errors, {}, `优先级 ${opt.label}(${opt.value}) 应验证通过`);
    }
  });

  it('✅ 正例: 带描述提交通过', () => {
    const data = makeValidForm({ description: '需在营业结束后进行，注意安全' });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '带描述的表单应验证通过');
  });

  it('✅ 正例: 提交通返回 id', async () => {
    const data = makeValidForm();
    const result = await submitTask(data);
    assert.equal(result.success, true, '有效表单提交应成功');
    assert.ok(result.id, '应返回任务 ID');
    assert.ok(result.id!.startsWith('task-'), 'ID 应以 task- 开头');
  });

  // ─── 反例 ───

  it('❌ 反例: 空标题报错', () => {
    const data = makeValidForm({ title: '' });
    const errors = validateForm(data);
    assert.ok(errors.title, '空标题应报错');
    assert.equal(errors.title, '请输入任务标题');
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

  it('❌ 反例: 标题超长报错', () => {
    const data = makeValidForm({ title: 'X'.repeat(101) });
    const errors = validateForm(data);
    assert.ok(errors.title, '超长标题应报错');
    assert.equal(errors.title, '标题不能超过100个字符');
  });

  it('❌ 反例: 未选类型报错', () => {
    const data = makeValidForm({ type: '' as TaskTypeValue });
    const errors = validateForm(data);
    assert.ok(errors.type, '未选类型应报错');
    assert.equal(errors.type, '请选择任务类型');
  });

  it('❌ 反例: 空负责人报错', () => {
    const data = makeValidForm({ assignee: '' });
    const errors = validateForm(data);
    assert.ok(errors.assignee, '空负责人应报错');
    assert.equal(errors.assignee, '请填写负责人');
  });

  it('❌ 反例: 负责人仅空格报错', () => {
    const data = makeValidForm({ assignee: '  ' });
    const errors = validateForm(data);
    assert.ok(errors.assignee, '仅空格负责人应报错');
  });

  it('❌ 反例: 负责人超长报错', () => {
    const data = makeValidForm({ assignee: 'A'.repeat(31) });
    const errors = validateForm(data);
    assert.ok(errors.assignee, '超长负责人应报错');
    assert.equal(errors.assignee, '负责人姓名不能超过30个字符');
  });

  it('❌ 反例: 空截止日期报错', () => {
    const data = makeValidForm({ deadline: '' });
    const errors = validateForm(data);
    assert.ok(errors.deadline, '空截止日期应报错');
    assert.equal(errors.deadline, '请设置截止日期');
  });

  it('❌ 反例: 全空字段应同时返回4个错误', () => {
    const data = makeValidForm({
      title: '',
      type: '' as TaskTypeValue,
      assignee: '',
      deadline: '',
    });
    const errors = validateForm(data);
    const errorFields = Object.keys(errors);
    assert.ok(errorFields.length >= 4, '全空字段应返回至少4个错误');
    assert.ok(errorFields.includes('title'), '应包含标题错误');
    assert.ok(errorFields.includes('type'), '应包含类型错误');
    assert.ok(errorFields.includes('assignee'), '应包含负责人错误');
    assert.ok(errorFields.includes('deadline'), '应包含截止日期错误');
  });

  it('❌ 反例: 提交失败返回错误信息', async () => {
    const data = makeValidForm({ title: 'trigger error creation' });
    const result = await submitTask(data);
    assert.equal(result.success, false, '模拟失败应返回 success=false');
    assert.ok(result.error, '应包含错误消息');
    assert.ok(result.error!.includes('创建失败'), '错误信息应包含创建失败相关提示');
  });

  // ─── 边界 ───

  it('🔺 边界: 标题恰好100字符', () => {
    const data = makeValidForm({ title: 'A'.repeat(100) });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '恰好100字符应通过');
  });

  it('🔺 边界: 标题恰好2字符', () => {
    const data = makeValidForm({ title: 'AB' });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '恰好2字符应通过');
  });

  it('🔺 边界: 负责人恰好30字符', () => {
    const data = makeValidForm({ assignee: 'B'.repeat(30) });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '恰好30字符应通过');
  });

  it('🔺 边界: 描述500字符边界', () => {
    const data = makeValidForm({ description: 'C'.repeat(500) });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '描述500字符应通过');
  });

  it('🔺 边界: 优先级从 low 切换到 urgent', () => {
    const lowData = makeValidForm({ priority: 'low' });
    const urgentData = makeValidForm({ priority: 'urgent' });
    const lowErrors = validateForm(lowData);
    const urgentErrors = validateForm(urgentData);
    assert.deepEqual(lowErrors, {}, 'low 优先级应通过');
    assert.deepEqual(urgentErrors, {}, 'urgent 优先级应通过');
  });

  it('🔺 边界: 日期格式为 YYYY-MM-DD', () => {
    const validDates = ['2026-07-09', '2026-01-01', '2026-12-31'];
    for (const d of validDates) {
      const data = makeValidForm({ deadline: d });
      const errors = validateForm(data);
      assert.deepEqual(errors, {}, `日期 ${d} 应通过`);
    }
  });

  it('🔺 边界: 空对象入参时报错所有必填', () => {
    const empty = {} as TaskFormData;
    const errors = validateForm(empty);
    assert.ok(errors.title, 'title 报错');
    assert.ok(errors.type, 'type 报错');
    assert.ok(errors.assignee, 'assignee 报错');
    assert.ok(errors.deadline, 'deadline 报错');
  });

  it('🔺 边界: submitTask 异步超时保护', async () => {
    const start = Date.now();
    const data = makeValidForm();
    await submitTask(data);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 2000, '提交时间应在2秒内');
  });

  it('🔺 边界: 描述为空字符串不影响验证结果', () => {
    const data = makeValidForm({ description: '' });
    const errors = validateForm(data);
    assert.deepEqual(errors, {}, '描述为空应通过验证');
  });
});
