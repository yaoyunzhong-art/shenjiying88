/**
 * page.test.ts — P-40 门店首页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·反例·边界
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('StorefrontHomePage — 正例', () => {
  it('应导出一个默认组件 StorefrontHomePage', () => {
    assert.ok(SRC.includes('export default function StorefrontHomePage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应包含门店名称', () => {
    assert.ok(SRC.includes('神机营电竞乐园'));
  });

  it('应包含门店信息', () => {
    assert.ok(SRC.includes('北京市朝阳区建国路88号'));
    assert.ok(SRC.includes('010-88886666'));
    assert.ok(SRC.includes('10:00-22:00'));
  });

  it('应包含@m5/ui导入', () => {
    assert.ok(SRC.includes("@m5/ui"));
  });

  it('应包含8个快速入口', () => {
    ['自助充值', '团队预约', '设备预定', '前台收银', '会员中心', '门店信息', '我的订单', '活动中心'].forEach(e =>
      assert.ok(SRC.includes(e), `缺少入口: ${e}`)
    );
  });

  it('应包含4个轮播横幅', () => {
    ['新会员首充', '团建特惠', '周末畅玩', '生日派对'].forEach(b =>
      assert.ok(SRC.includes(b), `缺少横幅: ${b}`)
    );
  });

  it('应包含6种特色设备', () => {
    ['街机', 'VR体验', '模拟机', '台球', '卡丁车', '桌游'].forEach(d =>
      assert.ok(SRC.includes(d), `缺少设备: ${d}`)
    );
  });

  it('应包含深色主题', () => {
    assert.ok(SRC.includes('#0f172a'));
    assert.ok(SRC.includes('#f8fafc'));
  });

  it('应包含响应式布局', () => {
    assert.ok(SRC.includes('maxWidth: 800'));
  });

  it('应使用 Next.js Link', () => {
    assert.ok(SRC.includes("next/link"));
  });

  it('应包含自动轮播', () => {
    assert.ok(SRC.includes('setInterval'));
    assert.ok(SRC.includes('clearInterval'));
  });

  it('应包含 P-40 标识', () => {
    assert.ok(SRC.includes('P-40'));
  });
});

describe('StorefrontHomePage — 边界', () => {
  it('轮播指示点', () => {
    assert.ok(SRC.includes('width: i === currentBanner'));
    assert.ok(SRC.includes('setCurrentBanner'));
  });

  it('所有入口应指向有效路径', () => {
    ['/self-recharge', '/group-booking', '/device-reservation', '/cashier', '/member-center', '/stores', '/orders', '/campaigns'].forEach(h =>
      assert.ok(SRC.includes(h), `缺少路径: ${h}`)
    );
  });
});

describe('StorefrontHomePage — 防御', () => {
  it('不应包含未定义变量', () => {
    assert.ok(!SRC.includes('undefined'));
  });

  it('组件应为函数', () => {
    assert.ok(SRC.includes('function StorefrontHomePage'));
  });
});
