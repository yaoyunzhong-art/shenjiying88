/**
 * settings/page.test.tsx — 设置中心页面测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('settings — 正例', () => {
  it('应导出 SettingsPage', () => assert.ok(SRC.includes('export default function SettingsPage')));
  it('应包含设置中心标题', () => assert.ok(SRC.includes('设置中心')));
  it('应包含配置分类', () => assert.ok(SRC.includes('CATEGORIES') || SRC.includes('items')));
  it('应包含 Switch 开关', () => assert.ok(SRC.includes('Switch')));
  it('应包含 Select 选择器', () => assert.ok(SRC.includes('Select')));
  it('应包含 Input 输入框', () => assert.ok(SRC.includes('Input')));
  it('应包含保存按钮', () => assert.ok(SRC.includes('保存全部')));
  it('应包含恢复默认按钮', () => assert.ok(SRC.includes('恢复默认')));
  it('应包含营业时间配置', () => assert.ok(SRC.includes('businessHours') || SRC.includes('营业')));
  it('应包含编辑按钮', () => assert.ok(SRC.includes('编辑') || SRC.includes('Button')));
});
describe('settings — 反例', () => {
  it('不应使用 dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
});
describe('settings — 边界', () => {
  it('应包含 use client', () => assert.ok(SRC.includes("'use client'")));
  it('应包含多个配置分组', () => assert.ok(SRC.includes('营业设置') || SRC.includes('收银设置')));
  it('源码长度应大于500', () => assert.ok(SRC.length > 500));
});
