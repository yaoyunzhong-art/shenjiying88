/**
 * page.test.tsx — 导购员智能辅助面板 L1 冒烟测试
 * 角色视角: 🛒 导购员
 *
 * 覆盖:
 * - 页面正例渲染（标题/导购信息/绩效统计/AI推荐/顾客队列/快捷话术/提醒/会员跟进/升级面板）
 * - Tab 切换（提醒优先级筛选）
 * - 快捷话术复制功能
 *
 * 依赖:
 * - @testing-library/react + happy-dom（devDependencies）
 * - 使用 .test-setup.cjs 预加载 DOM 环境（node -r 引入）
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageMod from './page';

// 处理 CJS 默认导出嵌套
const GuideWorkbenchPage = (PageMod as any).default ?? PageMod;

/* ── 辅助函数 ── */

function setupTest() {
  cleanup();
  const { container } = render(React.createElement(GuideWorkbenchPage));
  return { container };
}

async function setupWithNoCleanup() {
  cleanup();
  const view = render(React.createElement(GuideWorkbenchPage));
  // 等待 React 18 concurrent 渲染完成
  await new Promise(r => setTimeout(r, 50));
  return view;
}

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('🛒 导购员视角: 页面组件默认导出是函数', () => {
  assert.equal(typeof GuideWorkbenchPage, 'function',
    'GuideWorkbenchPage 应导出函数组件');
});

test('🛒 导购员视角: 页面渲染不抛异常', () => {
  assert.doesNotThrow(() => setupTest());
});

test('🛒 导购员视角: 渲染页面标题', () => {
  const { container } = setupTest();
  const h1s = container.querySelectorAll('h1');
  const found = Array.from(h1s).filter(el => el.textContent?.includes('导购员智能辅助面板'));
  assert.ok(found.length >= 1, '页面应渲染标题包含「导购员智能辅助面板」');
});

test('🛒 导购员视角: 渲染导购姓名', () => {
  const { container } = setupTest();
  const matches = container.textContent?.includes('李婷');
  assert.ok(matches, '页面文本应包含导购姓名「李婷」');
});

test('🛒 导购员视角: 渲染顾客姓名', () => {
  const { container } = setupTest();
  const matches = container.textContent?.includes('林小婉');
  assert.ok(matches, '页面文本应包含顾客姓名「林小婉」');
});

test('🛒 导购员视角: 渲染「今日业绩」版块标题', () => {
  setupTest();
  const el = screen.queryByText('今日业绩');
  assert.ok(el, '应渲染「今日业绩」版块标题');
});

test('🛒 导购员视角: 渲染统计指标', () => {
  const { container } = setupTest();
  const metrics = ['接待顾客', '达成销售额', '转化率', '队列中顾客', '待处理跟进'];
  for (const m of metrics) {
    const found = container.textContent?.includes(m);
    assert.ok(found, `页面文本应包含统计指标「${m}」`);
  }
});

test('🛒 导购员视角: 渲染「顾客排队 & 快捷话术」版块', () => {
  setupTest();
  const el = screen.queryByText('顾客排队 & 快捷话术');
  assert.ok(el, '应渲染「顾客排队 & 快捷话术」版块');
});

test('🛒 导购员视角: 渲染「待接待顾客」列表', () => {
  setupTest();
  const el = screen.queryByText('待接待顾客');
  assert.ok(el, '应渲染「待接待顾客」标题');
});

test('🛒 导购员视角: 渲染队列顾客姓名', () => {
  setupTest();
  const names = ['张子轩', '王雨桐', '陈逸飞', '赵思琪', '刘浩然'];
  for (const name of names) {
    const el = screen.queryByText(name);
    assert.ok(el, `应渲染队列顾客姓名「${name}」`);
  }
});

test('🛒 导购员视角: 渲染快捷话术标题', () => {
  setupTest();
  const el = screen.queryByText('快捷话术');
  assert.ok(el, '应渲染「快捷话术」标题');
});

test('🛒 导购员视角: 渲染快捷话术按钮文本', () => {
  setupTest();
  const labels = ['迎宾语', '推荐话术', '价格说明', '促成交', '升级推荐', '告别语'];
  for (const label of labels) {
    const el = screen.queryByText(label);
    assert.ok(el, `应渲染快捷话术按钮「${label}」`);
  }
});

test('🛒 导购员视角: 渲染 AI 推荐版块', () => {
  setupTest();
  const el = screen.queryByText(/AI 智能推荐/);
  assert.ok(el, '应渲染「AI 智能推荐」版块');
});

test('🛒 导购员视角: 渲染推荐商品名称', () => {
  const { container } = setupTest();
  const products = ['宝可梦 伊布进化系列 盲盒', '星之卡比 30cm 限定毛绒'];
  for (const p of products) {
    const found = container.textContent?.includes(p);
    assert.ok(found, `页面文本应包含推荐商品「${p}」`);
  }
});

test('🛒 导购员视角: 渲染「推荐理由摘要」标题', () => {
  setupTest();
  const el = screen.queryByText('推荐理由摘要');
  assert.ok(el, '应渲染「推荐理由摘要」标题');
});

test('🛒 导购员视角: 渲染「提醒 & 待跟进」版块', () => {
  setupTest();
  const el = screen.queryByText('提醒 & 待跟进');
  assert.ok(el, '应渲染「提醒 & 待跟进」版块');
});

test('🛒 导购员视角: 渲染会员相关的提醒消息', () => {
  const { container } = setupTest();
  const alerts = ['铂金会员王雨桐已到店', '会员张子轩今日生日', '连续 7 天未到店'];
  for (const msg of alerts) {
    const found = container.textContent?.includes(msg);
    assert.ok(found, `页面文本应包含提醒消息「${msg}」`);
  }
});

test('🛒 导购员视角: 渲染「待跟进会员任务」版块', () => {
  setupTest();
  const el = screen.queryByText('待跟进会员任务');
  assert.ok(el, '应渲染「待跟进会员任务」版块');
});

test('🛒 导购员视角: 渲染「会员升级建议」版块', () => {
  setupTest();
  const el = screen.queryByText('会员升级建议');
  assert.ok(el, '应渲染「会员升级建议」版块');
});

test('🛒 导购员视角: 渲染底部操作栏「导购辅助面板收口」', () => {
  setupTest();
  const el = screen.queryByText('导购辅助面板收口');
  assert.ok(el, '应渲染底部操作栏标题「导购辅助面板收口」');
});

test('🛒 导购员视角: 渲染 VIP 标签', () => {
  setupTest();
  const vips = screen.queryAllByText('VIP');
  assert.ok(vips.length >= 1, '应有至少 1 个 VIP 标签');
});

test('🛒 导购员视角: 渲染会员等级标签', () => {
  setupTest();
  const el = screen.queryByText('白银');
  assert.ok(el, '应渲染会员等级「白银」');
});

/* =================================================================
 * 交互 (Interaction)
 * ================================================================= */

test('🛒 导购员视角: 快捷话术点击后显示确认文本', async () => {
  const user = userEvent.setup();
  await setupWithNoCleanup();

  // 模拟 clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: async () => {},
    },
  });

  const greetingBtn = screen.queryByText('迎宾语');
  assert.ok(greetingBtn, '应有「迎宾语」按钮');
  if (greetingBtn) {
    await user.click(greetingBtn);
    await new Promise(r => setTimeout(r, 100));
    const confirm = screen.queryByText(/已复制到剪贴板/);
    assert.ok(confirm, '点击后应显示「已复制到剪贴板」确认文字');
  }
});

test('🛒 导购员视角: 提醒 tab 点击「高优先级」按钮', async () => {
  const user = userEvent.setup();
  const { container } = render(React.createElement(GuideWorkbenchPage));
  await new Promise(r => setTimeout(r, 50));

  // 使用 getAllByText 取第一个可点击元素
  const highTabs = screen.getAllByText('高优先级');
  assert.ok(highTabs.length >= 1, '应有「高优先级」tab 按钮');
  await user.click(highTabs[0]);
  await new Promise(r => setTimeout(r, 100));
  const text = container.textContent || '';
  assert.ok(text.includes('铂金会员王雨桐已到店'), '高优先级 tab 下应显示 VIP 到店提醒');
});

test('🛒 导购员视角: 渲染价格信息', () => {
  setupTest();
  // 至少有一个 ¥ 价格显示
  const priceElements = screen.queryAllByText(/¥69/);
  assert.ok(priceElements.length >= 1, '应渲染包含「¥69」的价格信息');
});

test('🛒 导购员视角: 渲染 AI 匹配度百分比', () => {
  setupTest();
  const matches = screen.queryAllByText(/96%/);
  assert.ok(matches.length >= 1, '应渲染 AI 匹配度「96%」');
});

test('🛒 导购员视角: 渲染分页信息', () => {
  setupTest();
  const el = screen.queryByText(/共 6 件推荐商品/);
  assert.ok(el, '应渲染分页信息「共 6 件推荐商品」');
});

test('🛒 导购员视角: 渲染升级进度百分比', () => {
  setupTest();
  const el = screen.queryByText(/72%/);
  assert.ok(el, '应渲染升级进度「72%」');
});
