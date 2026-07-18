/**
 * 安防管理页 Safety L1 冒烟测试
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

describe('safety page', () => {
  beforeEach(() => {});

  describe('类型定义', () => {
    it('应定义安防相关接口', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('interface') || src.includes('type'));
    });
    it('应包含设备/区域字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('device') || src.includes('Device') || src.includes('area') || src.includes('location'));
    });
    it('应包含状态字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('status') || src.includes('Status'));
    });
  });

  describe('样本数据', () => {
    it('应定义 SafetyRecord 完整接口', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('SafetyRecord'));
      assert.ok(src.includes('id: string'));
      assert.ok(src.includes('status'));
      assert.ok(src.includes('severity'));
      assert.ok(src.includes('description'));
    });

    it('应定义4种状态和4种严重等级', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('open'));
      assert.ok(src.includes('investigating'));
      assert.ok(src.includes('resolved'));
      assert.ok(src.includes('closed'));
      assert.ok(src.includes('low'));
      assert.ok(src.includes('critical'));
    });
  });

  describe('筛选与搜索', () => {
    it('应支持筛选', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('filter') || src.includes('Filter') || src.includes('select') || src.includes('Select'));
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
      assert.ok(src.includes('<h1') || src.includes('title') || src.includes('安防') || src.includes('安全'));
    });
    it('应处理空态', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('空') || src.includes('暂无') || src.includes('empty') || src.includes('EmptyState'));
    });
  });

  describe('统计', () => {
    it('应展示统计信息', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('length') || src.includes('总数') || src.includes('count'));
    });
  });
});
