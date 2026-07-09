/**
 * stock-transfer/form/page.test.tsx — 库存调拨表单页 L1 测试
 *
 * 覆盖:
 *   正例 – 页面文件存在、默认导出
 *   正例 – 引用 FormField / SubmitButton / PageShell / FormSubmitFeedback
 *   反例 – 文件完整性检查
 *   边界 – 表单字段名称、验证规则文本检查
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const pagePath = PROJECT_ROOT + '/apps/admin-web/app/stock-transfer/form/page.tsx';

// ─── 源文件存在性 & 导出检查 ───────────────────────────

describe('StockTransferFormPage (page.tsx 源文件)', () => {
  test('页面文件存在', () => {
    assert.ok(fs.existsSync(pagePath));
  });

  test('默认导出 default 函数组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /export default function StockTransferFormPage/);
  });

  test('引用 PageShell 组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /PageShell/);
  });

  test('引用 FormField 组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /FormField/);
  });

  test('引用 SubmitButton 组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /SubmitButton/);
  });

  test('引用 FormSubmitFeedback 组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /FormSubmitFeedback/);
  });

  test('引用 WorkspaceBreadcrumb 组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /WorkspaceBreadcrumb/);
  });

  test('引用 useCallback, useState', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /useState/);
    assert.match(src, /useCallback/);
  });

  test('包含 "新建调拨单" 标题文本', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /新建调拨单/);
  });

  test('包含表单字段：sourceStore, targetStore, productName', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /data-field="sourceStore"/);
    assert.match(src, /data-field="targetStore"/);
    assert.match(src, /data-field="productName"/);
  });

  test('包含调播数量字段', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /data-field="quantity"/);
  });

  test('包含提交按钮文本', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /提交调拨/);
  });

  test('引用 use client 指令', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /'use client'/);
  });
});

// ─── 反例 ─────────────────────────────────────────────

describe('StockTransferFormPage: 反例', () => {
  test('不包含 notFound', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /notFound/);
  });

  test('不包含 return null', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /return null/);
  });
});

// ─── 边界 ─────────────────────────────────────────────

describe('StockTransferFormPage: 边界', () => {
  test('最大宽度 maxWidth: 720 （表单页统一视觉）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /maxWidth: 720/);
  });

  test('包含调拨类型选择（来源数据）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /transferTypes|TRANSFER_TYPES/);
  });

  test('包含紧急程度选择（来源数据）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /URGENCY_LABEL|URGENCY_LEVELS/);
  });

  test('包含门店列表数据（至少8个门店选项）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    // 统计STORE_OPTIONS数组中的门店条目数
    const storeEntries = src.match(/\{ value: '/g);
    assert.ok(storeEntries && storeEntries.length >= 8);
  });
});
