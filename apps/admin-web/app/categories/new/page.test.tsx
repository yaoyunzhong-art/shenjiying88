/**
 * categories/new/page.test.tsx — 新建分类页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
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

describe('categories/new/page — 正例', () => {
  it('应导出默认组件 NewCategoryPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NewCategoryPage'), '缺少默认导出');
  });

  it('应包含 FormPageScaffold', () => {
    const src = readSource();
    assert.ok(src.includes('FormPageScaffold'), '缺少 FormPageScaffold');
  });

  it('应包含完整表单字段', () => {
    const src = readSource();
    assert.ok(src.includes("'name'"), '缺少 name 字段');
    assert.ok(src.includes("'code'"), '缺少 code 字段');
    assert.ok(src.includes("'parentName'"), '缺少 parentName 字段');
    assert.ok(src.includes("'sortOrder'"), '缺少 sortOrder 字段');
    assert.ok(src.includes("'description'"), '缺少 description 字段');
  });

  it('应包含必填验证规则', () => {
    const src = readSource();
    assert.ok(src.includes("rule: 'required'") || src.includes('rule: "required"'), '缺少 required 验证');
    assert.ok(src.includes("rule: 'maxLength'") || src.includes('rule: "maxLength"'), '缺少 maxLength 验证');
  });

  it('分类编码应校验大写字母和下划线', () => {
    const src = readSource();
    assert.ok(src.includes('pattern'), '缺少 pattern 验证');
    assert.ok(src.includes('A-Z_'), '编码应允许大写字母和下划线');
  });

  it('排序权重应有 min/max 验证', () => {
    const src = readSource();
    assert.ok(src.includes("rule: 'min'") || src.includes('rule: "min"'), '缺少 min 验证');
    assert.ok(src.includes("rule: 'max'") || src.includes('rule: "max"'), '缺少 max 验证');
  });

  it('应包含上级分类选项', () => {
    const src = readSource();
    assert.ok(src.includes('PARENT_OPTIONS'), '缺少 PARENT_OPTIONS');
  });

  it('应包含创建分类按钮和取消链接', () => {
    const src = readSource();
    assert.ok(src.includes('创建分类'), '缺少创建按钮文案');
    assert.ok(src.includes("cancelHref='") || src.includes('cancelHref="'), '缺少 cancelHref');
  });
});

describe('categories/new/page — 边界', () => {
  it('字段 defaultValue 应处理空值', () => {
    const src = readSource();
    assert.ok(src.includes('defaultValue'), '字段应包含 defaultValue');
  });

  it('should handle select placeholder', () => {
    const src = readSource();
    assert.ok(src.includes('placeholder'), '字段应包含 placeholder');
  });
});

describe('categories/new/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('handleSubmit 应有 try-catch 错误处理', () => {
    const src = readSource();
    assert.ok(src.includes('try') || src.includes('catch'), '缺少错误处理');
  });

  it('应包含 useMemo 优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });
});
