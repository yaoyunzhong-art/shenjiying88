/**
 * page.test.tsx — 品牌新建页面 L1 冒烟测试
 * 角色视角: 👤运营管理员 · 📊市场管理
 *
 * 覆盖:
 * - 页面正例渲染（标题/字段标签/提交按钮）
 * - 必填字段验证
 * - 格式校验（品牌编码/邮箱/网址/名称长度）
 *
 * 依赖:
 * - @testing-library/react + happy-dom（devDependencies）
 * - 使用 .test-setup.cjs 预加载 DOM 环境（node -r 引入）
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageMod from './page';

// 处理 CJS 默认导出嵌套
const BrandNewPage = (PageMod as any).default ?? PageMod;

/* ── 辅助函数 ── */

function setupTest() {
  cleanup();
  const { container } = render(React.createElement(BrandNewPage));
  return { container };
}

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👤 运营管理员视角: 页面组件默认导出是函数', () => {
  assert.equal(typeof BrandNewPage, 'function',
    'BrandNewPage 应导出函数组件');
});

test('👤 运营管理员视角: 页面渲染不抛异常', () => {
  assert.doesNotThrow(() => setupTest());
});

test('👤 运营管理员视角: 渲染新建品牌 h1 标题', () => {
  const { container } = setupTest();
  const h1s = container.querySelectorAll('h1');
  const found = Array.from(h1s).filter(el => el.textContent?.includes('新建品牌'));
  assert.ok(found.length >= 1, '页面应渲染 h1 标题包含「新建品牌」');
});

test('👤 运营管理员视角: 渲染所有必填字段标签', () => {
  setupTest();
  const requiredLabels = ['品牌名称', '品牌编码', '所属市场', '品牌等级', '品牌类别'];
  for (const label of requiredLabels) {
    const el = screen.getByText(label);
    assert.ok(el, `应渲染必填字段「${label}」`);
  }
});

test('👤 运营管理员视角: 渲染可选字段标签', () => {
  setupTest();
  const optionalLabels = ['品牌简介', '联系邮箱', '联系电话', '总部省份', '总部城市', '品牌官网', '备注'];
  for (const label of optionalLabels) {
    const el = screen.getByText(label);
    assert.ok(el, `应渲染可选字段「${label}」`);
  }
});

test('📊 市场管理视角: 渲染提交按钮', () => {
  setupTest();
  const btn = screen.queryByRole('button', { name: /创建品牌/i });
  assert.ok(btn, '应渲染「创建品牌」提交按钮');
});

test('📊 市场管理视角: 渲染 placeholder 提示', () => {
  setupTest();
  const placeholders = [
    '例如：M5 Premium 旗舰品牌',
    '例如：BRAND-013',
    'brand@example.com',
    '021-6888-8888',
    'https://brand.example.com',
  ];
  for (const ph of placeholders) {
    const input = screen.queryByPlaceholderText(ph);
    assert.ok(input, `应渲染 placeholder「${ph}」`);
  }
});

/* =================================================================
 * 反例 (Negative Cases)
 * ================================================================= */

test('🚫 运营管理员视角: 空必填字段提交时显示验证错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const submitBtn = screen.getByRole('button', { name: /创建品牌/i });
  await user.click(submitBtn);

  // 等待 React 更新
  await new Promise(r => setTimeout(r, 100));

  const emptyErrors = screen.queryAllByText(/不能为空/);
  assert.ok(emptyErrors.length >= 3,
    `点击提交后应显示至少 3 条「不能为空」错误，实际 ${emptyErrors.length}`);
});

test('🚫 品牌编码格式验证: 无效编码显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const codeInput = screen.getByPlaceholderText('例如：BRAND-013');
  await user.type(codeInput, 'invalid-code');

  const submitBtn = screen.getByRole('button', { name: /创建品牌/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const formatErrors = screen.queryAllByText(/编码格式需为 BRAND/);
  assert.ok(formatErrors.length >= 1, '无效品牌编码应显示格式错误提示');
});

test('🚫 邮箱格式验证: 无效邮箱显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const emailInput = screen.getByPlaceholderText('brand@example.com');
  await user.type(emailInput, 'not-an-email');

  const submitBtn = screen.getByRole('button', { name: /创建品牌/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const emailErrors = screen.queryAllByText('请输入有效的邮箱地址');
  assert.ok(emailErrors.length >= 1, '无效邮箱应显示格式错误提示');
});

test('🚫 网址格式验证: 无效网址显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const websiteInput = screen.getByPlaceholderText('https://brand.example.com');
  await user.type(websiteInput, 'ftp://bad');

  const submitBtn = screen.getByRole('button', { name: /创建品牌/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const urlErrors = screen.queryAllByText(/请输入有效的网址/);
  assert.ok(urlErrors.length >= 1, '无效网址应显示格式错误提示');
});

test('🚫 名称长度验证: 单字符名称显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const nameInput = screen.getByPlaceholderText(/例如：M5/);
  await user.type(nameInput, 'X');

  const submitBtn = screen.getByRole('button', { name: /创建品牌/i });
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const lengthErrors = screen.queryAllByText('品牌名称至少 2 个字符');
  assert.ok(lengthErrors.length >= 1, '过短的品牌名称应显示长度错误提示');
});

/* =================================================================
 * 边界 (Boundary Cases)
 * ================================================================= */

test('🧪 边界: 页面描述文本渲染', () => {
  setupTest();
  const desc = screen.queryByText(/创建一个新的品牌/);
  assert.ok(desc, '应渲染页面描述文本');
});

test('🧪 边界: Helper 文本渲染', () => {
  setupTest();
  const helpers = screen.queryAllByText(/系统唯一标识，创建后不可修改/);
  assert.ok(helpers.length >= 1, '品牌编码字段应显示 helper 文本');
});

test('🧪 边界: 市场选择器存在', () => {
  setupTest();
  const marketSelects = screen.queryAllByText('所属市场');
  assert.ok(marketSelects.length >= 1, '应渲染「所属市场」标签');
});
