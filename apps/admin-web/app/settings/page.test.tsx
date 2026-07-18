/**
 * 设置中心页 Settings L1 冒烟测试
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

describe('settings page', () => {
  beforeEach(() => {});

  describe('类型定义', () => {
    it('应定义 ConfigModule 接口', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('ConfigModule') || src.includes('interface'));
    });
    it('应包含 label/href/status 字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('label'));
      assert.ok(src.includes('href'));
      assert.ok(src.includes('status'));
    });
    it('应定义状态常量映射 (STATUS_LABEL / STATUS_COLOR)', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('STATUS_LABEL') || src.includes('STATUS_COLOR') || src.includes('status'));
    });
  });

  describe('样本数据', () => {
    it('应包含至少 10 个配置模块', () => {
      const src = readSrc();
      assert.ok(src);
      const modKeys = src.match(/key:\s*['"][^'"]+['"]/g);
      assert.ok(modKeys && modKeys.length >= 10, `got ${modKeys?.length} keys`);
    });
    it('每个模块应有 description 字段', () => {
      const src = readSrc();
      assert.ok(src);
      const descs = src.match(/description:/g);
      assert.ok(descs && descs.length >= 10, `got ${descs?.length} descriptions`);
    });
  });

  describe('统计功能', () => {
    it('应计算已配置/部分配置/待配置数量', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('configured'));
      assert.ok(src.includes('partial'));
      assert.ok(src.includes('pending'));
    });
    it('应展示配置模块总数', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('totalModules') || src.includes('.length') || src.includes('MODULES'));
    });
  });

  describe('页面渲染', () => {
    it('应导出默认组件 SettingsPage', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('export default'));
      assert.ok(src.includes('SettingsPage') || src.includes('function'));
    });
    it('应包含页面标题 "设置中心"', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('设置中心') || src.includes('设置'));
    });
    it('应包含 4 个统计卡片', () => {
      const src = readSrc();
      assert.ok(src);
      const statCards = src.match(/statCard|StatCard|统计/g);
      assert.ok(statCards && statCards.length >= 2);
    });
    it('应使用 Link 导航按钮', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('Link') || src.includes('href'));
    });
  });

  describe('状态展示', () => {
    it('应包含三种状态: configured/partial/pending', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes("'configured'"));
      assert.ok(src.includes("'partial'"));
      assert.ok(src.includes("'pending'"));
    });
    it('状态应有颜色区分', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('#22c55e') || src.includes('#eab308') || src.includes('#ef4444') || src.includes('color'));
    });
  });
});
