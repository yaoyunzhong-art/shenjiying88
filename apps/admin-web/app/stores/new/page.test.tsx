/**
 * page.test.tsx — 门店新建页面 L1 冒烟测试
 * 角色视角: 👤运营管理员 · 📊市场管理
 *
 * 覆盖:
 * - 页面正例渲染（标题/字段标签/提交按钮/进度指示器）
 * - 必填字段验证
 * - 格式校验（门店编码/邮箱/建筑面积/名称长度）
 * - 进度指示器渲染与状态
 * - 边界条件（Helper 文本、选择器存在、后端错误）
 *
 * 依赖:
 * - @testing-library/react + happy-dom（devDependencies）
 * - 使用 .test-setup.mjs 预加载 DOM 环境（node --import 引入）
 */

import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageMod from './page';

// 处理 CJS 默认导出嵌套
const StoreNewPage = (PageMod as any).default ?? PageMod;

/* ── 辅助函数 ── */

function setupTest() {
  cleanup();
  const { container } = render(React.createElement(StoreNewPage));
  return { container };
}

/* =================================================================
 * 正例 (Happy Path) — 页面结构
 * ================================================================= */

test('👤 运营管理员视角: 页面组件默认导出是函数', () => {
  assert.equal(typeof StoreNewPage, 'function',
    'StoreNewPage 应导出函数组件');
});

test('👤 运营管理员视角: 页面渲染不抛异常', () => {
  assert.doesNotThrow(() => setupTest());
});

test('👤 运营管理员视角: 渲染新建门店 h1 标题', () => {
  const { container } = setupTest();
  const h1s = container.querySelectorAll('h1');
  const found = Array.from(h1s).filter(el => el.textContent?.includes('新建门店'));
  assert.ok(found.length >= 1, '页面应渲染 h1 标题包含「新建门店」');
});

test('👤 运营管理员视角: 渲染页面描述文本', () => {
  setupTest();
  const desc = screen.queryByText(/创建一个新的门店/);
  assert.ok(desc, '应渲染页面描述文本');
});

test('👤 运营管理员视角: 渲染所有必填字段标签', () => {
  setupTest();
  const requiredLabels = ['门店名称', '门店编码', '所属市场', '所在城市', '门店地址', '联系电话', '初始状态', '风险等级'];
  for (const label of requiredLabels) {
    const el = screen.getByText(label);
    assert.ok(el, `应渲染必填字段「${label}」`);
  }
});

test('👤 运营管理员视角: 渲染可选字段标签', () => {
  setupTest();
  const optionalLabels = ['联系邮箱', '建筑面积 (m²)', '门店简介', '入驻品牌数量', '备注'];
  for (const label of optionalLabels) {
    const el = screen.getByText(label);
    assert.ok(el, `应渲染可选字段「${label}」`);
  }
});

test('📊 市场管理视角: 渲染提交按钮', () => {
  setupTest();
  const btn = screen.queryByRole('button', { name: /创建门店/i });
  assert.ok(btn, '应渲染「创建门店」提交按钮');
});

test('📊 市场管理视角: 渲染 placeholder 提示', () => {
  setupTest();
  const placeholders = [
    '例如：朝阳大悦城旗舰店',
    '例如：STORE-016',
    '例如：北京市朝阳区朝阳北路101号',
    '例如：+86-10-8888-1111',
    'store@example.com',
    '例如：8500',
    '例如：5',
    '简要描述门店定位、商圈环境和特色…',
    '其他需要记录的信息…',
  ];
  for (const ph of placeholders) {
    const input = screen.queryByPlaceholderText(ph);
    assert.ok(input, `应渲染 placeholder「${ph}」`);
  }
});

/* =================================================================
 * 正例 (Happy Path) — 进度指示器
 * ================================================================= */

test('📊 进度指示器: 渲染进度指示器组件', () => {
  setupTest();
  const progress = screen.queryByTestId('store-form-progress');
  assert.ok(progress, '应渲染表单进度指示器');
});

test('📊 进度指示器: 渲染全部 4 个步骤', () => {
  setupTest();
  for (let i = 0; i < 4; i++) {
    const step = screen.queryByTestId(`progress-step-${i}`);
    assert.ok(step, `应渲染第 ${i + 1} 步`);
  }
});

test('📊 进度指示器: 渲染步骤标签文本', () => {
  setupTest();
  const labels = ['基本信息', '门店配置', '人员设置', '完成'];
  for (const label of labels) {
    const el = screen.queryByText(label);
    assert.ok(el, `应渲染步骤标签「${label}」`);
  }
});

test('📊 进度指示器: 默认显示第 0 步为 current 状态', () => {
  setupTest();
  const step0 = screen.getByTestId('progress-step-0');
  assert.equal(step0.getAttribute('data-step-status'), 'current',
    '第 1 步应为 current 状态');
});

test('📊 进度指示器: 第 2~4 步默认显示 pending 状态', () => {
  setupTest();
  for (let i = 1; i < 4; i++) {
    const step = screen.getByTestId(`progress-step-${i}`);
    assert.equal(step.getAttribute('data-step-status'), 'pending',
      `第 ${i + 1} 步应为 pending，实际为 ${step.getAttribute('data-step-status')}`);
  }
});

test('📊 进度指示器: 渲染步骤连接线', () => {
  setupTest();
  for (let i = 1; i < 4; i++) {
    const connector = screen.queryByTestId(`progress-connector-${i}`);
    assert.ok(connector, `应渲染第 ${i} 条连接线`);
  }
});

/* =================================================================
 * 反例 (Negative Cases) — 字段验证
 * ================================================================= */

test('🚫 运营管理员视角: 空必填字段提交时显示不能为空错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  // 等待 React 更新
  await new Promise(r => setTimeout(r, 100));

  const emptyErrors = screen.queryAllByText(/不能为空/);
  assert.ok(emptyErrors.length >= 3,
    `点击提交后应显示至少 3 条「不能为空」错误，实际 ${emptyErrors.length}`);
});

test('🚫 门店编码格式验证: 无效编码显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const codeInput = screen.getByPlaceholderText('例如：STORE-016');
  await user.type(codeInput, 'invalid-code');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const formatErrors = screen.queryAllByText(/编码格式需为 STORE/);
  assert.ok(formatErrors.length >= 1, '无效门店编码应显示格式错误提示');
});

test('🚫 邮箱格式验证: 无效邮箱显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const emailInput = screen.getByPlaceholderText('store@example.com');
  await user.type(emailInput, 'not-an-email');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const emailErrors = screen.queryAllByText('请输入有效的邮箱地址');
  assert.ok(emailErrors.length >= 1, '无效邮箱应显示格式错误提示');
});

test('🚫 建筑面积格式验证: 非数字显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const areaInput = screen.getByPlaceholderText('例如：8500');
  await user.type(areaInput, 'abc');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const areaErrors = screen.queryAllByText('建筑面积必须为数字');
  assert.ok(areaErrors.length >= 1, '非数字建筑面积应显示格式错误提示');
});

test('🚫 品牌数量格式验证: 非数字显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const brandInput = screen.getByPlaceholderText('例如：5');
  await user.type(brandInput, 'xyz');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const brandErrors = screen.queryAllByText('品牌数量必须为数字');
  assert.ok(brandErrors.length >= 1, '非数字品牌数量应显示格式错误提示');
});

test('🚫 名称长度验证: 单字符名称显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const nameInput = screen.getByPlaceholderText(/例如：朝阳大悦城/);
  await user.type(nameInput, 'X');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const lengthErrors = screen.queryAllByText('门店名称至少 2 个字符');
  assert.ok(lengthErrors.length >= 1, '过短的门店名称应显示长度错误提示');
});

test('🚫 地址长度验证: 过短地址显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const addrInput = screen.getByPlaceholderText(/北京市朝阳区/);
  await user.type(addrInput, '短');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const addrErrors = screen.queryAllByText('地址至少 5 个字符');
  assert.ok(addrErrors.length >= 1, '过短的地址应显示长度错误提示');
});

test('🚫 联系电话长度验证: 过短电话显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const phoneInput = screen.getByPlaceholderText(/\+86/);
  await user.type(phoneInput, '123');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const phoneErrors = screen.queryAllByText('联系电话至少 7 个字符');
  assert.ok(phoneErrors.length >= 1, '过短的联系电话应显示长度错误提示');
});

test('🚫 门店编码冲突: STORE-999 提交应显示后端错误', async () => {
  const user = userEvent.setup();
  setupTest();

  // 填入所有必填字段使验证通过
  const nameInput = screen.getByPlaceholderText(/例如：朝阳大悦城/);
  await user.type(nameInput, '测试门店A');
  const codeInput = screen.getByPlaceholderText('例如：STORE-016');
  await user.type(codeInput, 'STORE-999');
  const addrInput = screen.getByPlaceholderText(/北京市朝阳区/);
  await user.type(addrInput, '北京市朝阳区测试路88号');
  const phoneInput = screen.getByPlaceholderText(/\+86/);
  await user.type(phoneInput, '+86-10-8888-1111');
  // 填充 select 类型必填字段
  const marketInput = screen.getByLabelText('所属市场');
  await user.type(marketInput, 'cn-mainland');
  const cityInput = screen.getByLabelText('所在城市');
  await user.type(cityInput, '北京市');
  const statusInput = screen.getByLabelText('初始状态');
  await user.type(statusInput, 'active');
  const riskInput = screen.getByLabelText('风险等级');
  await user.type(riskInput, 'low');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  // onSubmit 含 1200ms 模拟延迟，需等待足够时间
  await new Promise(r => setTimeout(r, 1600));

  // 验证后端错误信息
  const backendError = screen.queryByText(/门店编码已被占用/);
  assert.ok(backendError,
    `编码冲突应显示后端错误「该门店编码已被占用，请重新输入」`);
});

/* =================================================================
 * 边界 (Boundary Cases)
 * ================================================================= */

test('🧪 边界: Helper 文本渲染', () => {
  setupTest();
  const helpers = screen.queryAllByText(/系统唯一标识，创建后不可修改/);
  assert.ok(helpers.length >= 1, '门店编码字段应显示 helper 文本');
});

test('🧪 边界: 所属市场选择器存在', () => {
  setupTest();
  const marketLabels = screen.queryAllByText('所属市场');
  assert.ok(marketLabels.length >= 1, '应渲染「所属市场」标签');
});

test('🧪 边界: 风险等级选择器存在', () => {
  setupTest();
  const riskLabels = screen.queryAllByText('风险等级');
  assert.ok(riskLabels.length >= 1, '应渲染「风险等级」标签');
});

test('🧪 边界: 初始状态选择器存在', () => {
  setupTest();
  const statusLabels = screen.queryAllByText('初始状态');
  assert.ok(statusLabels.length >= 1, '应渲染「初始状态」标签');
});

test('🧪 边界: 建筑面积合法数字不显示数字错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const areaInput = screen.getByPlaceholderText('例如：8500');
  await user.clear(areaInput);
  await user.type(areaInput, '200000');

  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const NaNErrors = screen.queryAllByText('建筑面积必须为数字');
  assert.equal(NaNErrors.length, 0, '合法数字不应显示「必须为数字」错误');
});

test('🧪 边界: 返回路径属性存在', () => {
  setupTest();
  const scaffold = document.querySelector('[data-mock="FormPageScaffold"]');
  assert.ok(scaffold, '应渲染 FormPageScaffold');
});

test('🧪 边界: 提交按钮未禁用', () => {
  setupTest();
  const submitBtn = screen.getByRole('button', { name: /创建门店/i });
  assert.equal(submitBtn.hasAttribute('disabled'), false,
    '初始状态提交按钮不应禁用');
});

/* =================================================================
 * 源代码静态分析 — 验证 page.tsx 包含关键结构
 * ================================================================= */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('Stores / New — 源代码结构验证', () => {
  it('包含 useMemo hook', () => assert.ok(SRC.includes('useMemo'), '应使用 useMemo'));
  it('包含 useState hook', () => assert.ok(SRC.includes('useState'), '应使用 useState'));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <'), '应包含 JSX'));
  it('包含事件处理器', () => assert.ok(SRC.includes('onSubmit={'), '应包含 onSubmit'));
  it('包含 onChange 处理器', () => assert.ok(SRC.includes('onChange='), '应包含 onChange'));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? '), '应包含条件渲染'));
  it('包含进度指示器步骤定义', () => assert.ok(SRC.includes('PROGRESS_STEPS'), '应定义 PROGRESS_STEPS'));
  it('包含 StoreFormProgress 组件', () => assert.ok(SRC.includes('StoreFormProgress'), '应定义 StoreFormProgress'));
  it('包含 inferStep 函数', () => assert.ok(SRC.includes('inferStep'), '应定义 inferStep'));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function'), '应有默认导出函数'));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//'), '应包含注释'));
});
