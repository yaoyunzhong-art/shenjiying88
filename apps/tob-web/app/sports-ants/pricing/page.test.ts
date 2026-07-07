/**
 * sports-ants/pricing/page.test.ts — 定价套餐页 L1 冒烟测试
 * 覆盖: 正例·边界·数据完整性
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('sports-ants/pricing — 正例', () => {
  it('应导出一个默认组件（函数或对象）', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', '默认导出应为 React 组件函数');
  });

  it('页面源码应包含定价方案关键词', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
      require('path').resolve(__dirname, 'page.tsx'),
      'utf-8',
    );
    assert.ok(
      source.includes('Pricing') ||
        source.includes('pricing') ||
        source.includes('定价') ||
        source.includes('plan'),
      '页面应包含定价相关关键词',
    );
  });

  it('页面源码应包含 Header/Footer 引用', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
      require('path').resolve(__dirname, 'page.tsx'),
      'utf-8',
    );
    assert.ok(
      source.includes('Header') && source.includes('Footer'),
      '页面应引用 Header 和 Footer 组件',
    );
  });

  it('页面源码应包含 SEOMeta 组件', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
      require('path').resolve(__dirname, 'page.tsx'),
      'utf-8',
    );
    assert.ok(source.includes('SEOMeta'), '页面应包含 SEO 元标签');
  });
});

describe('sports-ants/pricing — 边界', () => {
  it('页面文件应存在且非空', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
      require('path').resolve(__dirname, 'page.tsx'),
      'utf-8',
    );
    assert.ok(source.length > 200, 'page.tsx 不应过短');
  });

  it('页面应使用 use client 指令', () => {
    const fs = require('node:fs');
    const source = fs.readFileSync(
      require('path').resolve(__dirname, 'page.tsx'),
      'utf-8',
    );
    assert.ok(
      source.includes("'use client'") || source.includes('"use client"'),
      '客户端组件应声明 use client',
    );
  });
});
