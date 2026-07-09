/**
 * member-recharge/page.test.tsx — 会员充值页冒烟测试
 * 覆盖: 正例·边界·防御
 *
 * 使用 Node.js native test runner 替代 vitest。
 * 每个测试读取 page.tsx 源码进行静态分析，
 * 不依赖 jsdom / @testing-library / 组件渲染。
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('member-recharge — 正例', () => {
  it('应导出一个默认组件 MemberRechargePage', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function MemberRechargePage'),
      '缺少默认导出组件 MemberRechargePage',
    );
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(
      src.includes("'use client'") || src.includes('"use client"'),
      '缺少 use client',
    );
  });

  it('应包含页面标题 "会员充值"', () => {
    const src = readSource();
    assert.ok(src.includes('会员充值'), '缺少页面标题');
  });

  it('应包含页面副标题（为会员卡充值余额）', () => {
    const src = readSource();
    assert.ok(
      src.includes('为会员卡充值余额'),
      '缺少页面副标题',
    );
  });

  it('应包含统计概览 Statistic 组件', () => {
    const src = readSource();
    assert.ok(src.includes('<Statistic'), '缺少 Statistic 组件');
  });

  it('应包含今日充值总额 / 今日充值笔数 / 本月新增充值会员', () => {
    const src = readSource();
    assert.ok(src.includes('今日充值总额'), '缺少 今日充值总额');
    assert.ok(src.includes('今日充值笔数'), '缺少 今日充值笔数');
    assert.ok(src.includes('本月新增充值会员'), '缺少 本月新增充值会员');
  });

  it('应包含三步充值流程标题', () => {
    const src = readSource();
    assert.ok(src.includes('1. 选择会员'), '缺少 选择会员 步骤');
    assert.ok(src.includes('2. 选择充值金额'), '缺少 选择充值金额 步骤');
    assert.ok(src.includes('3. 选择支付方式'), '缺少 选择支付方式 步骤');
  });

  it('应包含充值套餐和自定义金额两种模式', () => {
    const src = readSource();
    assert.ok(src.includes("'package'"), '缺少 package 模式');
    assert.ok(src.includes("'custom'"), '缺少 custom 模式');
    assert.ok(src.includes('充值套餐'), '缺少 充值套餐 按钮');
    assert.ok(src.includes('自定义金额'), '缺少 自定义金额 按钮');
  });

  it('应包含四种支付方式', () => {
    const src = readSource();
    assert.ok(src.includes('cash'), '缺少 cash 支付方式');
    assert.ok(src.includes('wechat'), '缺少 wechat 支付方式');
    assert.ok(src.includes('alipay'), '缺少 alipay 支付方式');
    assert.ok(src.includes('card'), '缺少 card 支付方式');
    assert.ok(src.includes('现金'), '缺少 现金 文案');
    assert.ok(src.includes('微信支付'), '缺少 微信支付 文案');
    assert.ok(src.includes('支付宝'), '缺少 支付宝 文案');
    assert.ok(src.includes('银行卡'), '缺少 银行卡 文案');
  });

  it('应默认选中微信支付（useState 初始值）', () => {
    const src = readSource();
    assert.ok(
      src.includes("useState<PaymentMethod>('wechat')"),
      'miss default payment method state',
    );
  });

  it('应包含套餐数据和赠送金额', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PACKAGES'), '缺少套餐数据');
    assert.ok(src.includes('bonus'), '缺少赠送金额字段');
    assert.ok(src.includes('赠送'), '缺少 赠送 文案');
  });

  it('应包含 "推荐" 和 "超值" 标签', () => {
    const src = readSource();
    assert.ok(src.includes('推荐'), '缺少 推荐 标签');
    assert.ok(src.includes('超值'), '缺少 超值 标签');
  });

  it('应展示充值记录（MOCK_RECORDS）', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_RECORDS'), '缺少充值记录数据');
    assert.ok(src.includes('张三'), '缺少模拟会员 张三');
    assert.ok(src.includes('李四'), '缺少模拟会员 李四');
  });
});

// ---- 边界 ----

describe('member-recharge — 边界', () => {
  it('确认充值按钮应绑定 disabled 逻辑', () => {
    const src = readSource();
    assert.ok(
      src.includes('disabled') &&
        src.includes('!selectedMember') &&
        src.includes('rechargeAmount <= 0'),
      '缺少 disabled 条件（未选中会员或金额为 0）',
    );
  });

  it('会员搜索应包含输入框和查询按钮', () => {
    const src = readSource();
    assert.ok(
      src.includes('输入会员手机号') || src.includes('输入会员手机号 / 卡号 / 姓名'),
      '缺少会员搜索输入框占位符',
    );
    assert.ok(src.includes('查询'), '缺少查询按钮');
  });

  it('自定义金额模式应显示 InputNumber 和占位符', () => {
    const src = readSource();
    assert.ok(src.includes('InputNumber'), '缺少 InputNumber 组件');
    assert.ok(src.includes('输入充值金额'), '缺少金额输入占位符');
  });

  it('自定义金额应支持 1~99999 的 min/max', () => {
    const src = readSource();
    assert.ok(src.includes('min={1}') || src.includes('min: 1'), '缺少 min 限制');
    assert.ok(src.includes('max={99999}') || src.includes('max: 99999'), '缺少 max 限制');
  });

  it('支付方式按钮应包含 aria-pressed 属性', () => {
    const src = readSource();
    assert.ok(src.includes('aria-pressed'), '缺少 aria-pressed');
  });

  it('未选择会员时充值操作应给出错误提示', () => {
    const src = readSource();
    assert.ok(
      src.includes('请先选择充值会员'),
      '缺少未选会员时的错误提示',
    );
  });

  it('充值金额为 0 时应给出错误提示', () => {
    const src = readSource();
    assert.ok(
      src.includes('充值金额必须大于 0'),
      '缺少金额为 0 时的错误提示',
    );
  });
});

// ---- 防御 ----

describe('member-recharge — 防御', () => {
  it('应包含 PaymentMethodSelector 子组件', () => {
    const src = readSource();
    assert.ok(
      src.includes('function PaymentMethodSelector'),
      '缺少 PaymentMethodSelector 组件定义',
    );
  });

  it('应包含 Modal 确认弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('<Modal'), '缺少 Modal 组件');
    assert.ok(src.includes('确认充值'), '缺少确认弹窗标题');
  });

  it('应包含通知提示（notification 状态管理）', () => {
    const src = readSource();
    assert.ok(
      src.includes('notification') &&
        src.includes('setNotification'),
      '缺少 notification 状态管理',
    );
  });

  it('应包含 useCallback 优化的事件处理函数', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
    assert.ok(
      src.includes('handleSearchMember') ||
        src.includes('handleConfirmRecharge') ||
        src.includes('handleSelectPackage'),
      '缺少事件处理函数',
    );
  });

  it('应导入 PageShell / Card / Button / Statistic 等 UI 组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('Card'), '缺少 Card');
    assert.ok(src.includes('Button'), '缺少 Button');
    assert.ok(src.includes('Statistic'), '缺少 Statistic');
  });

  it('应包含 Link 组件跳转到全部充值记录页面', () => {
    const src = readSource();
    assert.ok(
      src.includes('查看全部记录') || src.includes('/member-recharge/records'),
      '缺少全部记录链接',
    );
  });

  it('充值成功后通知应包含 success 消息', () => {
    const src = readSource();
    assert.ok(
      src.includes('充值成功') || src.includes('type: success'),
      '缺少充值成功提示',
    );
  });

  it('应包含 StatusBadge 用于充值记录状态标识', () => {
    const src = readSource();
    assert.ok(
      src.includes('StatusBadge') ||
        src.includes('import {') && src.includes('StatusBadge'),
      '缺少 StatusBadge',
    );
  });
});

// ---- 模块加载 ----

describe('member-recharge — 模块加载', () => {
  it('page 模块可正常导入且 default 为函数组件', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', 'default export should be a function component');
  });
});
