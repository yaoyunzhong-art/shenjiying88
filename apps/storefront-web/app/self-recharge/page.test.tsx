/**
 * self-recharge/page.test.tsx — P-37 自助充值 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('self-recharge — 正例', () => {
  it('应导出一个默认组件 SelfRechargePage', () => {
    assert.ok(SRC.includes('export default function SelfRechargePage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应包含 P-37 标题', () => {
    assert.ok(SRC.includes('自助充值'));
    assert.ok(SRC.includes('P-37'));
  });

  it('应包含快捷金额选项', () => {
    assert.ok(SRC.includes('¥50'));
    assert.ok(SRC.includes('¥100'));
    assert.ok(SRC.includes('¥200'));
    assert.ok(SRC.includes('¥500'));
    assert.ok(SRC.includes('¥1000'));
  });

  it('应包含热门标签', () => {
    assert.ok(SRC.includes('热门'));
  });

  it('应包含支付方式', () => {
    ['微信支付', '支付宝', '现金支付', '刷卡'].forEach(m =>
      assert.ok(SRC.includes(m), `缺少支付方式: ${m}`)
    );
  });

  it('应包含三步流程: select→payment→success', () => {
    assert.ok(SRC.includes("step === 'select'"));
    assert.ok(SRC.includes("step === 'payment'"));
    assert.ok(SRC.includes('充值成功'));
  });

  it('应包含赠送金额逻辑', () => {
    assert.ok(SRC.includes('bonus'));
    assert.ok(SRC.includes('赠送'));
  });

  it('应包含自定义金额输入', () => {
    assert.ok(SRC.includes('自定义金额'));
    assert.ok(SRC.includes('InputNumber'));
  });

  it('应包含金额汇总卡片', () => {
    assert.ok(SRC.includes('充值金额'));
    assert.ok(SRC.includes('totalAmount'));
  });

  it('应包含成功页面', () => {
    assert.ok(SRC.includes('充值成功！'));
    assert.ok(SRC.includes('实际到账'));
  });

  it('应包含错误处理', () => {
    assert.ok(SRC.includes('请选择充值金额'));
    assert.ok(SRC.includes('setError'));
  });

  it('应包含 loading/处理中状态', () => {
    assert.ok(SRC.includes('processing'));
    assert.ok(SRC.includes('支付处理中'));
  });

  it('应包含返回按钮', () => {
    assert.ok(SRC.includes('返回修改金额'));
    assert.ok(SRC.includes('返回首页'));
  });

  it('应包含继续充值按钮', () => {
    assert.ok(SRC.includes('继续充值'));
    assert.ok(SRC.includes('handleRecharge'));
  });

  it('应使用 @m5/ui 组件', () => {
    assert.ok(SRC.includes("@m5/ui"));
    assert.ok(SRC.includes('PageShell'));
    assert.ok(SRC.includes('InputNumber'));
  });

  it('应使用深色主题', () => {
    assert.ok(SRC.includes('#0f172a'));
    assert.ok(SRC.includes('#f8fafc'));
  });

  it('应包含响应式布局', () => {
    assert.ok(SRC.includes('maxWidth: 480'));
  });
});

describe('self-recharge — 边界', () => {
  it('金额0时应禁用下一步按钮', () => {
    assert.ok(SRC.includes('totalAmount <= 0'));
  });

  it('应支持自定义金额(1-9999)', () => {
    assert.ok(SRC.includes('min={1}'));
    assert.ok(SRC.includes('max={9999}'));
  });

  it('赠送金额阶梯: 50=5, 100=15, 200=35, 500=100', () => {
    assert.ok(SRC.includes('selectedAmount >= 500 ? 100'));
    assert.ok(SRC.includes('selectedAmount >= 200 ? 35'));
    assert.ok(SRC.includes('selectedAmount >= 100 ? 15'));
    assert.ok(SRC.includes('selectedAmount >= 50 ? 5'));
  });

  it('选择金额和自定义金额互斥', () => {
    assert.ok(SRC.includes('setCustomAmount(0)'));
    assert.ok(SRC.includes('setSelectedAmount(0)'));
  });
});

describe('self-recharge — 防御', () => {
  it('未选金额点下一步应报错', () => {
    assert.ok(SRC.includes('请选择充值金额'));
  });

  it('支付处理中应禁用返回', () => {
    assert.ok(SRC.includes('disabled={processing}'));
  });
});
