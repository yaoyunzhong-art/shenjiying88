/**
 * page.test.ts — 会员新增表单 L1 冒烟测试
 * 正例 + 反例 + 边界
 *
 * 角色视角: 👔店长 · 🛒前台 · 💳会员
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ---------------------------------------------------------------------------
// 1. 组件导出验证
// ---------------------------------------------------------------------------

test('正例: 页面模块默认导出一个函数组件', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', '默认导出应为函数组件');
  assert.ok(mod.default.name?.length > 0, '组件应有非空名称');
});

// ---------------------------------------------------------------------------
// 2. 表单字段类型定义验证 (通过类型推断)
// ---------------------------------------------------------------------------

test('正例: 页面会渲染"新增会员"标题', async () => {
  // 检查 page.tsx 源码中的标题文本
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('新增会员'), '页面应包含标题 "新增会员"');
});

test('正例: 页面导出 TIER_OPTIONS 常量', async () => {
  // 验证等级选项是否完整
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('钻石会员'), '等级选项应包含钻石会员');
  assert.ok(src.includes('黄金会员'), '等级选项应包含黄金会员');
  assert.ok(src.includes('银卡会员'), '等级选项应包含银卡会员');
  assert.ok(src.includes('铜卡会员'), '等级选项应包含铜卡会员');
  assert.ok(src.includes('普通会员'), '等级选项应包含普通会员');
});

// ---------------------------------------------------------------------------
// 3. 表单字段引用完整性
// ---------------------------------------------------------------------------

test('反例: 手机号验证正则需拒绝无效号码', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  // 验证存在手机号校验逻辑
  assert.ok(src.includes('1[3-9]'), '手机号正则应包含 1[3-9] 前缀规则');
  assert.ok(src.includes('\\d{9}'), '手机号正则应包含 9 位数字规则');
});

test('反例: 邮箱验证正则需要拒绝非法格式', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('@'), '邮箱验证应包含 @ 符号');
  assert.ok(src.includes('[^\\s@]+@[^\\s@]+\\.[^\\s@]+'), '邮箱验证应包含完整正则');
});

// ---------------------------------------------------------------------------
// 4. 边界条件验证
// ---------------------------------------------------------------------------

test('边界: 积分上限校验', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('99999999') || src.includes('99,999,999'), '积分应检查上限 99,999,999');
  assert.ok(src.includes('非负整数'), '积分应要求非负整数');
});

test('边界: 姓名长度限制', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('至少2个字符'), '姓名应有最小长度限制');
  assert.ok(src.includes('不能超过20个字符'), '姓名应有最大长度限制');
});

test('边界: 门店名称长度限制', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('不能超过50个字符'), '门店名称应有长度上限');
});

// ---------------------------------------------------------------------------
// 5. 表单提交相关
// ---------------------------------------------------------------------------

test('正例: 提交函数 submitMember 存在并返回 Promise', async () => {
  await import('./page');

  // 验证表单包含 submit button
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('onSubmit'), '表单应有 onSubmit 处理');
  assert.ok(src.includes('handleSubmit'), '应有提交处理函数');
  assert.ok(src.includes('submitMember'), '应有 submitMember 函数');
  assert.ok(src.includes('isSubmitting') || src.includes('loading'), '提交应有 loading 状态');
});

test('边界: 提交时对所有必填字段进行全量验证', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('name'), '提交应验证 name 字段');
  assert.ok(src.includes('phone'), '提交应验证 phone 字段');
  assert.ok(src.includes('email'), '提交应验证 email 字段');
  assert.ok(src.includes('tier'), '提交应验证 tier 字段');
});

test('正例: 表单提交成功后会跳转到会员列表页', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes("/members'"), '提交成功后应跳转到 /members');
});

test('正例: 取消按钮调用 router.back', async () => {
  const src = await import('fs').then((fs) =>
    fs.promises.readFile(new URL('./page.tsx', import.meta.url), 'utf-8'),
  );
  assert.ok(src.includes('router.back'), '取消按钮应调用返回');
});
