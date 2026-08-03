/*!
 * task-center/new/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for TaskCreateFormPage
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

describe('TaskCreateFormPage - 正例', () => {
  it('exports default TaskCreateFormPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function TaskCreateFormPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('defines TaskFormData interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface TaskFormData') || src.includes('type TaskFormData'), 'missing TaskFormData');
  });
  it('defines FormErrors interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface FormErrors') || src.includes('type FormErrors'), 'missing FormErrors');
  });
  it('has onSubmit handler', () => {
    const src = readSource();
    assert.ok(src.includes('onSubmit'), 'missing onSubmit');
  });
});

describe('TaskCreateFormPage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('TaskCreateFormPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('TaskCreateFormPage - 数据完整性', () => {
  it('includes context "⏳ 创建中......"', () => {
    const src = readSource();
    assert.ok(src.includes('⏳ 创建中...'), 'missing ⏳ 创建中...');
  });
  it('includes context "✅ 创建任务..."', () => {
    const src = readSource();
    assert.ok(src.includes('✅ 创建任务'), 'missing ✅ 创建任务');
  });
  it('includes context "中优先级..."', () => {
    const src = readSource();
    assert.ok(src.includes('中优先级'), 'missing 中优先级');
  });
  it('includes context "低优先级..."', () => {
    const src = readSource();
    assert.ok(src.includes('低优先级'), 'missing 低优先级');
  });
  it('includes context "例：7月第二周门店盘点..."', () => {
    const src = readSource();
    assert.ok(src.includes('例：7月第二周门店盘点'), 'missing 例：7月第二周门店盘点');
  });
  it('includes context "促销准备..."', () => {
    const src = readSource();
    assert.ok(src.includes('促销准备'), 'missing 促销准备');
  });
  it('includes context "其他..."', () => {
    const src = readSource();
    assert.ok(src.includes('其他'), 'missing 其他');
  });
  it('includes context "创建失败，请检查参数后重..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建失败，请检查参数后重试'), 'missing 创建失败，请检查参数后重');
  });
  it('includes context "创建失败，请重试..."', () => {
    const src = readSource();
    assert.ok(src.includes('创建失败，请重试'), 'missing 创建失败，请重试');
  });
  it('includes context "可选：填写任务的具体要求..."', () => {
    const src = readSource();
    assert.ok(src.includes('可选：填写任务的具体要求、注意事项等...'), 'missing 可选：填写任务的具体要求');
  });
  it('has constant TASK_TYPE_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('TASK_TYPE_OPTIONS'), 'missing TASK_TYPE_OPTIONS');
  });
  it('has constant PRIORITY_OPTIONS', () => {
    const src = readSource();
    assert.ok(src.includes('PRIORITY_OPTIONS'), 'missing PRIORITY_OPTIONS');
  });
  it('has constant title', () => {
    const src = readSource();
    assert.ok(src.includes('title'), 'missing title');
  });
  it('has constant assignee', () => {
    const src = readSource();
    assert.ok(src.includes('assignee'), 'missing assignee');
  });
  it('has constant router', () => {
    const src = readSource();
    assert.ok(src.includes('router'), 'missing router');
  });
});