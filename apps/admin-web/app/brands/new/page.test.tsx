/**
 * page.test.tsx — 品牌新建页面 L1 冒烟测试 + L2 品牌类型交互测试
 * 角色视角: 👤运营管理员 · 📊市场管理
 *
 * 覆盖:
 * - 页面正例渲染（标题/字段标签/提交按钮/品牌类型标签）
 * - 品牌类型标签交互（自营/联名/代理/其他 → 条件字段）
 * - 必填字段验证
 * - 格式校验（品牌编码/邮箱/网址/名称长度）
 * - 边界场景（长文本/编码冲突/成功提交）
 *
 * 依赖:
 * - @testing-library/react + happy-dom（devDependencies）
 * - .test-setup.mjs 预加载 DOM 环境 + @m5/ui mock
 */

import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';

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

function clickTag(label: string) {
  const tag = screen.getByText(label, { selector: 'button' });
  return tag;
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
  const btn = screen.queryByTestId('submit-btn');
  assert.ok(btn, '应渲染提交按钮');
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
 * 品牌类型标签渲染
 * ================================================================= */

test('🏷️ 品牌类型标签: 渲染所有四个品牌类型按钮', () => {
  setupTest();
  const tagLabels = ['自营', '联名', '代理', '其他'];
  for (const label of tagLabels) {
    const btn = screen.getByText(label, { selector: 'button' });
    assert.ok(btn, `应渲染品牌类型标签「${label}」`);
  }
});

test('🏷️ 品牌类型标签: 默认选中「自营」', () => {
  setupTest();
  const selfOperatedBtn = screen.getByText('自营', { selector: 'button' });
  assert.equal(selfOperatedBtn.getAttribute('data-active'), 'true',
    '默认「自营」标签应为 active 状态');
});

test('🏷️ 品牌类型标签: 默认「自营」下显示运营主体字段', () => {
  setupTest();
  const opsField = screen.getByText('运营主体');
  assert.ok(opsField, '默认自营模式下应显示「运营主体」字段');
});

test('🏷️ 品牌类型标签: 默认「自营」下显示运营主体 placeholder', () => {
  setupTest();
  const phInput = screen.queryByPlaceholderText('例如：M5 集团自营部');
  assert.ok(phInput, '自营模式下应显示运营主体 placeholder');
});

test('🏷️ 品牌类型标签: 点击「联名」后显示联名方字段', async () => {
  const user = userEvent.setup();
  setupTest();

  // 点击联名前，不应存在联名方
  assert.ok(!screen.queryByText('联名方'), '点击前不应渲染「联名方」');

  const coBrandBtn = clickTag('联名');
  await user.click(coBrandBtn);

  // 点击后应为 active
  assert.equal(coBrandBtn.getAttribute('data-active'), 'true',
    '点击「联名」后应 active');

  // 联名方字段应出现
  const partnerField = screen.getByText('联名方');
  assert.ok(partnerField, '点击联名后应显示「联名方」字段');

  // 联名比例字段应出现
  const ratioField = screen.getByText('联名比例');
  assert.ok(ratioField, '点击联名后应显示「联名比例」字段');
});

test('🏷️ 品牌类型标签: 点击「代理」后显示授权方字段', async () => {
  const user = userEvent.setup();
  setupTest();

  const agencyBtn = clickTag('代理');
  await user.click(agencyBtn);

  assert.equal(agencyBtn.getAttribute('data-active'), 'true',
    '点击「代理」后应 active');

  const licensorField = screen.getByText('授权方');
  assert.ok(licensorField, '点击代理后应显示「授权方」字段');

  const periodField = screen.getByText('授权期限');
  assert.ok(periodField, '点击代理后应显示「授权期限」字段');
});

test('🏷️ 品牌类型标签: 点击「其他」后无额外字段', async () => {
  const user = userEvent.setup();
  setupTest();

  // 默认自营下应该有运营主体
  assert.ok(screen.queryByText('运营主体'), '初始应有运营主体');

  const otherBtn = clickTag('其他');
  await user.click(otherBtn);

  assert.equal(otherBtn.getAttribute('data-active'), 'true',
    '点击「其他」后应 active');

  // 运营主体应消失
  assert.ok(!screen.queryByText('运营主体'),
    '切换至其他后应隐藏「运营主体」');
  assert.ok(!screen.queryByText('联名方'),
    '其他模式下不应显示「联名方」');
  assert.ok(!screen.queryByText('授权方'),
    '其他模式下不应显示「授权方」');
});

/* =================================================================
 * 品牌类型切换交互
 * ================================================================= */

test('🔄 品牌类型切换: 自营→联名→自营 隐藏联名字段', async () => {
  const user = userEvent.setup();
  setupTest();

  await user.click(clickTag('联名'));
  assert.ok(screen.queryByText('联名方'), '切换到联名后应显示联名方');

  await user.click(clickTag('自营'));
  assert.ok(!screen.queryByText('联名方'), '切回自营后应隐藏联名方');
  assert.ok(screen.queryByText('运营主体'), '切回自营后应显示运营主体');
});

test('🔄 品牌类型切换: 依次切换四种类型均不抛异常', async () => {
  const user = userEvent.setup();
  setupTest();

  const types = ['联名', '代理', '其他', '自营'];
  for (const t of types) {
    await user.click(clickTag(t));
  }
  // 只要不抛异常就通过
  assert.ok(true, '依次切换四种品牌类型不抛异常');
});

test('🔄 品牌类型切换: 自营提交含运营主体验证', async () => {
  const user = userEvent.setup();
  setupTest();

  const opsInput = screen.getByPlaceholderText('例如：M5 集团自营部');
  await user.type(opsInput, 'X'); // 单字符 — 触发规则

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);
  await new Promise(r => setTimeout(r, 100));

  const opErrors = screen.queryAllByText('运营主体至少 2 个字符');
  assert.ok(opErrors.length >= 1, '过短的运营主体应显示验证错误');
});

test('🔄 品牌类型切换: 联名模式提交空联名方显示必填错误', async () => {
  const user = userEvent.setup();
  setupTest();

  await user.click(clickTag('联名'));
  assert.ok(screen.queryByText('联名方'), '联名模式应有联名方字段');

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);
  await new Promise(r => setTimeout(r, 100));

  const emptyErrors = screen.queryAllByText(/不能为空/);
  assert.ok(emptyErrors.length >= 3,
    `联名模式空提交应显示至少 3 条错误，实际 ${emptyErrors.length}`);
});

test('🔄 品牌类型切换: 代理模式提交空授权方显示必填错误', async () => {
  const user = userEvent.setup();
  setupTest();

  await user.click(clickTag('代理'));

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);
  await new Promise(r => setTimeout(r, 100));

  const emptyErrors = screen.queryAllByText(/不能为空/);
  assert.ok(emptyErrors.length >= 3,
    `代理模式空提交应显示至少 3 条错误，实际 ${emptyErrors.length}`);
});

/* =================================================================
 * 反例 (Negative Cases)
 * ================================================================= */

test('🚫 运营管理员视角: 空必填字段提交时显示验证错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);

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

  const submitBtn = screen.getByTestId('submit-btn');
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

  const submitBtn = screen.getByTestId('submit-btn');
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

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);

  await new Promise(r => setTimeout(r, 100));

  const urlErrors = screen.queryAllByText(/请输入有效的网址/);
  assert.ok(urlErrors.length >= 1, '无效网址应显示格式错误提示');
});

test('🚫 名称长度验证: 单字符名称显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const nameInput = screen.getByPlaceholderText(/M5 Premium/);
  await user.type(nameInput, 'X');

  const submitBtn = screen.getByTestId('submit-btn');
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

test('🧪 边界: 品牌名称超长（51字符）显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const nameInput = screen.getByPlaceholderText(/M5 Premium/);
  const longName = '长'.repeat(51);
  assert.equal(longName.length, 51, '测试字符串应为 51 字符');
  await user.type(nameInput, longName);

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);
  await new Promise(r => setTimeout(r, 100));

  const nameLenErrors = screen.queryAllByText('品牌名称不超过 50 个字符');
  assert.ok(nameLenErrors.length >= 1, '超长品牌名称应显示长度错误');
});

test('🧪 边界: 品牌简介超长（501字符）显示错误', async () => {
  const user = userEvent.setup();
  setupTest();

  const descInput = screen.getByPlaceholderText(/简要描述品牌/);
  const longDesc = 'A'.repeat(501);
  await user.type(descInput, longDesc);

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);
  await new Promise(r => setTimeout(r, 100));

  const descLenErrors = screen.queryAllByText('简介不超过 500 个字符');
  assert.ok(descLenErrors.length >= 1, '超长品牌简介应显示长度错误');
});

test('🧪 边界: 品牌编码冲突提交抛出错误', async () => {
  const user = userEvent.setup();
  setupTest();

  // 填写所有必填字段
  await user.type(screen.getByPlaceholderText(/M5 Premium/), '测试品牌');
  await user.type(screen.getByPlaceholderText('例如：BRAND-013'), 'BRAND-999');
  await user.type(screen.getByPlaceholderText('例如：M5 集团自营部'), '自营事业部');
  // 对于 select 字段，mock 渲染为 input，type 即可填值
  const marketInput = screen.getByTestId('field-marketCode');
  await user.type(marketInput, 'cn-mainland');
  const tierInput = screen.getByTestId('field-tier');
  await user.type(tierInput, 'premium');
  const categoryInput = screen.getByTestId('field-category');
  await user.type(categoryInput, '综合商业');

  const submitBtn = screen.getByTestId('submit-btn');
  await user.click(submitBtn);

  // 等待 async submit 完成（含 1200ms delay）
  await new Promise(r => setTimeout(r, 1800));

  // BRAND-999 触发后端模拟冲突 — 错误信息在 data-testid="form-errors" 或文本中
  const conflictErrors = screen.queryAllByText(/已被占用/);
  assert.ok(conflictErrors.length >= 1,
    `编码 BRAND-999 提交应显示占用错误，实际找到 ${conflictErrors.length} 个`);
});

test('🧪 边界: 品牌类型标签渲染 wrapper data-testid', () => {
  setupTest();
  const tagWrapper = screen.getByTestId('brand-type-tags');
  assert.ok(tagWrapper, '应渲染品牌类型标签容器');
});

test('🧪 边界: 每个品牌类型标签有对应 data-testid', () => {
  setupTest();
  const selfOperatedTag = screen.getByTestId('brand-type-tag-self-operated');
  assert.ok(selfOperatedTag, '应渲染自营类型标签');

  const coBrandedTag = screen.getByTestId('brand-type-tag-co-branded');
  assert.ok(coBrandedTag, '应渲染联名类型标签');

  const agencyTag = screen.getByTestId('brand-type-tag-agency');
  assert.ok(agencyTag, '应渲染代理类型标签');

  const otherTag = screen.getByTestId('brand-type-tag-other');
  assert.ok(otherTag, '应渲染其他类型标签');
});
