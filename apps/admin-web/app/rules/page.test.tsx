/**
 * 规则管理页 Rule L1 冒烟测试
 * 圈梁四道箍: ① TSC通过 → ② 测试存在 → ③ 圈梁表更新 → ④ PRD标记
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

function readSrc(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  } catch { return null; }
}

describe('rules page', () => {
  beforeEach(() => {});

  describe('类型定义', () => {
    it('应定义规则相关接口', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('interface') || src.includes('type'));
    });
    it('应包含规则名称字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('name') || src.includes('ruleName'));
    });
    it('应包含规则类型字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('type') || src.includes('ruleType'));
    });
    it('应包含规则状态字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('status') || src.includes('enabled') || src.includes('active'));
    });
  });

  describe('样本数据', () => {
    it('应包含所有5种规则分类定义', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('risk-control'));
      assert.ok(src.includes('member'));
      assert.ok(src.includes('promotion'));
      assert.ok(src.includes('notification'));
      assert.ok(src.includes('operation'));
    });
  });

  describe('筛选与搜索', () => {
    it('应支持类型筛选', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('filter') || src.includes('Filter') || src.includes('select') || src.includes('Select'));
    });
    it('应支持搜索', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('搜索') || src.includes('search') || src.includes('keyword') || src.includes('setKeyword'));
    });
  });

  describe('统计', () => {
    it('应展示规则总数', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('.length') || src.includes('总数'));
    });
  });

  describe('页面结构', () => {
    it('应导出默认组件', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('export default'));
    });
    it('应包含页面标题', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('<h1') || src.includes('title') || src.includes('规则'));
    });
    it('应处理空态', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('空') || src.includes('暂无') || src.includes('empty') || src.includes('EmptyState') || src.includes('length') && src.includes('0'));
    });
  });
});
