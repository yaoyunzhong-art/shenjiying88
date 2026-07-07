/**
 * page.test.tsx — 通知创建页面 L1 冒烟测试
 * 角色视角: 👔平台管理员 · 🔔系统通知 · 🛡️安全审计
 *
 * 覆盖:
 * - 页面正例渲染（标题/面包屑/表单字段/按钮）
 * - 必填字段验证（空标题、空内容）
 * - 字段长度限制验证（标题 100 字、内容 10 字下限）
 * - 取消导航（内容为空时直接跳转）
 * - 提交流程
 *
 * 依赖:
 * - @testing-library/react + happy-dom（devDependencies）
 * - 使用 .test-setup.cjs 预加载 DOM 环境（node -r 引入）
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageMod from './page';

// 处理 CJS 默认导出嵌套 (module.exports = { default: Component })
const NewNotificationPage = (PageMod as any).default ?? PageMod;

/* ── 辅助函数 ── */

function setupTest() {
  cleanup();
  const { container } = render(React.createElement(NewNotificationPage));
  return { container };
}

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👔 平台管理员视角: 页面组件默认导出是函数', () => {
  assert.equal(typeof NewNotificationPage, 'function',
    'NewNotificationPage 应导出函数组件');
});

test('👔 平台管理员视角: 页面渲染不抛异常', () => {
  assert.doesNotThrow(() => setupTest());
});

test('👔 平台管理员视角: 渲染创建通知页面 h1', () => {
  const { container } = setupTest();
  const h1s = container.querySelectorAll('h1');
  const found = Array.from(h1s).filter(el => el.textContent?.includes('创建通知'));
  assert.ok(found.length >= 1, '页面应渲染 h1 标题包含「创建通知」');
});

test('🔔 系统通知视角: 渲染面包屑导航链接', () => {
  setupTest();
  const total = screen.getByText('总览');
  const center = screen.getByText('通知中心');
  // 使用 container querySelector 避免创建通知文字重复匹配
  assert.ok(total, '面包屑包含总览');
  assert.ok(center, '面包屑包含通知中心');
});

test('🔔 系统通知视角: 渲染所有必填字段 label (通过 aria-label / placeholder)', () => {
  setupTest();

  const fields = [
    { name: '通知标题', placeholder: '输入通知标题' },
    { name: '通知类型', text: '通知类型' },
    { name: '优先级', text: '优先级' },
    { name: '作用域', text: '作用域' },
    { name: '目标名称', placeholder: '全平台、华润万象生活' },
    { name: '目标 ID', placeholder: 'platform' },
    { name: '过期时间', placeholder: '选择过期日期' },
  ];

  for (const field of fields) {
    if (field.placeholder) {
      const el = screen.getByPlaceholderText(new RegExp(field.placeholder));
      assert.ok(el, `应渲染「${field.name}」字段 (placeholder)`);
    } else if (field.text) {
      const label = screen.getAllByText(new RegExp(field.text));
      assert.ok(label.length >= 1, `应渲染「${field.name}」字段 label`);
    }
  }

  // 通知内容 textarea
  const ta = screen.getByPlaceholderText(/输入通知详细内容/);
  assert.ok(ta, '应渲染通知内容 textarea');
});

test('🔔 系统通知视角: 渲染创建通知和取消返回按钮', () => {
  setupTest();
  const cancelBtns = screen.getAllByText('取消返回');
  const submitBtns = screen.getAllByText('创建通知');
  assert.ok(cancelBtns.length >= 1, '应渲染取消返回按钮');
  assert.ok(submitBtns.length >= 1, '应渲染创建通知按钮');
});

test('🛡️ 安全审计视角: 取消按钮可点击且不报错（无内容时直接跳转）', () => {
  setupTest();

  // 无内容时点击取消不应触发 confirm
  let confirmCalled = false;
  const origConfirm = (globalThis as any).confirm;
  (globalThis as any).confirm = () => { confirmCalled = true; return true; };

  const cancelBtns = screen.getAllByText('取消返回');
  const cancelBtn = cancelBtns[0] as HTMLButtonElement;
  assert.doesNotThrow(() => fireEvent.click(cancelBtn));
  assert.equal(confirmCalled, false, '内容为空时不应触发 confirm');

  (globalThis as any).confirm = origConfirm;
});

/* =================================================================
 * 反例 (Defensive)
 * ================================================================= */

test('🔔 系统通知视角: 标题为空时提交显示验证错误', async () => {
  setupTest();

  const submitBtns = screen.getAllByText('创建通知');
  const submitBtn = submitBtns[submitBtns.length - 1] as HTMLButtonElement;
  fireEvent.click(submitBtn);

  await waitFor(() => {
    const errors = screen.queryAllByText('通知标题不能为空');
    assert.ok(errors.length >= 1, '应显示「通知标题不能为空」错误');
  });
});

test('🔔 系统通知视角: 内容为空时提交显示验证错误', async () => {
  setupTest();

  // 填标题但不填内容
  const titleInput = screen.getByPlaceholderText(/输入通知标题/);
  await userEvent.setup().type(titleInput, '测试标题');

  const submitBtns = screen.getAllByText('创建通知');
  const submitBtn = submitBtns[submitBtns.length - 1] as HTMLButtonElement;
  fireEvent.click(submitBtn);

  await waitFor(() => {
    const errors = screen.queryAllByText('通知内容不能为空');
    assert.ok(errors.length >= 1, '应显示「通知内容不能为空」错误');
  });
});

test('🔔 系统通知视角: 标题超出 100 字符显示验证错误', async () => {
  setupTest();

  const titleInput = screen.getByPlaceholderText(/输入通知标题/) as HTMLInputElement;
  // 用 fireEvent.change 代替 userEvent.type 避免延迟
  fireEvent.change(titleInput, { target: { value: '超'.repeat(101) } });

  const submitBtns = screen.getAllByText('创建通知');
  const submitBtn = submitBtns[submitBtns.length - 1] as HTMLButtonElement;
  fireEvent.click(submitBtn);

  await waitFor(() => {
    const errors = screen.queryAllByText('标题不能超过 100 个字符');
    assert.ok(errors.length >= 1, '应显示标题长度超限错误');
  });
});

test('🔔 系统通知视角: 内容不足 10 个字符显示验证错误', async () => {
  setupTest();

  const titleInput = screen.getByPlaceholderText(/输入通知标题/) as HTMLInputElement;
  fireEvent.change(titleInput, { target: { value: '测试通知标题' } });

  const contentInput = screen.getByPlaceholderText(/输入通知详细内容/) as HTMLTextAreaElement;
  fireEvent.change(contentInput, { target: { value: '太短' } });

  const submitBtns = screen.getAllByText('创建通知');
  const submitBtn = submitBtns[submitBtns.length - 1] as HTMLButtonElement;
  fireEvent.click(submitBtn);

  await waitFor(() => {
    const errors = screen.queryAllByText('内容至少 10 个字符');
    assert.ok(errors.length >= 1, '应显示内容太短错误');
  });
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('🛡️ 安全审计视角: 空表单确认按钮可用', () => {
  setupTest();
  const submitBtns = screen.getAllByText('创建通知');
  const submitBtn = submitBtns[submitBtns.length - 1] as HTMLButtonElement;
  assert.equal(submitBtn.disabled, false, '初始状态下提交按钮应可用');
});

test('🛡️ 安全审计视角: 页面渲染包含过期时间日期选择器', () => {
  setupTest();
  const dateInput = screen.getByPlaceholderText(/选择过期日期/) as HTMLInputElement;
  assert.ok(dateInput, '应渲染日期选择器');
  assert.equal(dateInput.getAttribute('type'), 'date', '过期时间应为 date 类型 input');
});
