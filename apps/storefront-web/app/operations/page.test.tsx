/**
 * operations/page.test.tsx — 运营管理页 L1 冒烟测试
 * 适配实际页面 OperationsPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');

describe('组件配置 — use client', () => {
  it('应包含 use client 指令', () => {
    assert.ok(PAGE_SRC.includes("'use client'"), '缺少 use client 指令');
  });
});

describe('组件导出', () => {
  it('应导出 default function OperationsPage', () => {
    assert.ok(PAGE_SRC.includes('export default function OperationsPage'), '缺少默认导出');
  });
});

describe('页面结构', () => {
  it('应包含页面标题"运营管理"', () => {
    assert.ok(PAGE_SRC.includes('运营管理'), '缺少页面标题');
  });

  it('应包含核心功能入口模块', () => {
    assert.ok(PAGE_SRC.includes('运营日报'), '缺少运营日报');
    assert.ok(PAGE_SRC.includes('目标管理'), '缺少目标管理');
    assert.ok(PAGE_SRC.includes('检查清单'), '缺少检查清单');
    assert.ok(PAGE_SRC.includes('数据洞察'), '缺少数据洞察');
  });

  it('应包含运营日报入口', () => {
    assert.ok(PAGE_SRC.includes('运营日报'), '缺少运营日报');
  });

  it('应包含目标管理入口', () => {
    assert.ok(PAGE_SRC.includes('目标管理'), '缺少目标管理');
  });

  it('应包含检查清单入口', () => {
    assert.ok(PAGE_SRC.includes('检查清单'), '缺少检查清单');
  });

  it('应包含数据洞察入口', () => {
    assert.ok(PAGE_SRC.includes('数据洞察'), '缺少数据洞察');
  });

  it('应包含深色主题背景', () => {
    assert.ok(PAGE_SRC.includes('#0f172a'), '缺少深色背景');
  });
});

describe('防御', () => {
  it('不应包含危险的 innerHTML', () => {
    assert.doesNotMatch(PAGE_SRC, /dangerouslySetInnerHTML/);
  });
});
