/**
 * inspection/page.test.tsx — 巡检管理页面 L1 冒烟测试
 * 覆盖: 正例·边界·防御·反例·组件完整性·SEO
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

describe('inspection — 正例', () => {
  it('应导出一个默认组件 InspectionPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function InspectionPage'), '缺少默认导出组件');
  });

  it('应包含巡检标题', () => {
    const src = readSource();
    assert.ok(src.includes('巡检管理'), '缺少巡检管理标题');
  });

  it('应包含巡检记录描述', () => {
    const src = readSource();
    assert.ok(src.includes('巡检记录'), '缺少巡检记录说明');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 Card 卡片组件', () => {
    const src = readSource();
    assert.ok(src.includes('Card'), '缺少 Card');
  });

  it('应包含 Button 按钮组件', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), '缺少 Button');
  });

  it('应包含 Space 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('Space'), '缺少 Space');
  });
});

// ---- 反例 ----

describe('inspection — 反例', () => {
  it('不应包含用户直接输入渲染', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  it('不应包含全局事件绑定', () => {
    const src = readSource();
    assert.ok(!src.includes('window.'));
    assert.ok(!src.includes('document.'));
  });

  it('不应直接操作 localStorage', () => {
    const src = readSource();
    assert.ok(!src.includes('localStorage'));
  });
});

// ---- 边界 ----

describe('inspection — 边界', () => {
  it('应包含设备/安全分类', () => {
    const src = readSource();
    assert.ok(src.includes('设备') && (src.includes('安全') || src.includes('卫生')), '缺少分类');
  });

  it('应包含正在施工提示', () => {
    const src = readSource();
    assert.ok(src.includes('施工中') || src.includes('开发中'), '缺少施工提示');
  });

  it('页面应有颜色样式定义', () => {
    const src = readSource();
    assert.ok(src.includes('color'), '缺少颜色样式');
    assert.ok(src.includes('padding') || src.includes('fontSize'), '缺少 padding 或 fontSize');
  });
});

// ---- 防御 ----

describe('inspection — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });

  it('应包含树哥施工彩蛋', () => {
    const src = readSource();
    assert.ok(src.includes('树哥'), '缺少树哥彩蛋');
    assert.ok(src.includes('🐜'), '缺少蚂蚁 emoji');
  });
});

describe('inspection — 组件完整性', () => {
  it('应包含 @m5/ui 的 Table 导入', () => {
    const src = readSource();
    assert.ok(src.includes('Table'), '缺少 Table');
  });

  it('应包含 @m5/ui 的 Tag 导入', () => {
    const src = readSource();
    assert.ok(src.includes('Tag'), '缺少 Tag');
  });

  it('应包含 Statistic 统计组件', () => {
    const src = readSource();
    assert.ok(src.includes('Statistic'), '缺少 Statistic');
  });

  it('源码长度应大于 300 bytes', () => {
    const src = readSource();
    assert.ok(src.length > 300, `源码长度不足, 实际 ${src.length} bytes`);
  });
});
