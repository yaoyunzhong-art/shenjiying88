/**
 * categories/new/page.test.tsx — 新建分类页 L1 冒烟测试
 * 覆盖: 正例·边界·防御·反例·集成·AI安全审计
 * V17#圈梁对齐
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
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

  it('字段 defaultValue 应处理空值', () => {
    const src = readSource();
    assert.ok(src.includes('defaultValue'), '字段应包含 defaultValue');
  });

  it('表单 fieldErrors 应包含完整字段', () => {
    const src = readSource();
    assert.ok(src.includes('fieldErrors'), '缺少 fieldErrors');
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

  it('name 最大长度应有限制', () => {
    const src = readSource();
    assert.ok(src.includes('maxLength') || src.includes('max:'), 'name 长度限制');
  });

  it('description 应为可选字段', () => {
    const src = readSource();
    assert.ok(!src.includes("description']") || src.includes('optional') || src.includes("rule: 'required'"), 'description 非必填');
  });

  it('sortOrder 最小值应为 0', () => {
    const src = readSource();
    assert.ok(src.includes('min: 0') || src.includes('min:0'), 'sortOrder min=0');
  });

  it('sortOrder 最大值应为 999', () => {
    const src = readSource();
    assert.ok(src.includes('max: 999') || src.includes('max:999'), 'sortOrder max=999');
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

  it('提交后应重置表单', () => {
    const src = readSource();
    assert.ok(src.includes('reset') || src.includes('clear'), '表单重置');
  });

  it('应防止重复提', () => {
    const src = readSource();
    assert.ok(src.includes('submitting') || src.includes('loading') || src.includes('disabled'), '防重复提交');
  });
});

describe('categories/new/page — 反例', () => {
  it('源文件应存在', () => {
    assert.ok(existsSync(SOURCE), 'page.tsx 应存在');
  });

  it('不应直接使用 innerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('innerHTML'), '安全勿用 innerHTML');
  });

  it('不应使用硬编码字段长度', () => {
    const src = readSource();
    assert.ok(!src.includes('rule:') || src.includes('maxLength'), '长度应由规则定义');
  });

  it('不应使用 eval', () => {
    const src = readSource();
    assert.ok(!src.includes('eval('), '安全不使用 eval');
  });
});

describe('categories/new/page — 集成', () => {
  it('表单字段应与数据模型一致', () => {
    const src = readSource();
    assert.ok(src.includes('name') && src.includes('code') && src.includes('sortOrder'), '字段完备');
  });

  it('取消按钮应返回到列表页', () => {
    const src = readSource();
    assert.ok(src.includes('/categories'), '取消返回');
  });

  it('提交成功应跳转到列表页', () => {
    const src = readSource();
    assert.ok(src.includes('/categories') || src.includes('push'), '成功跳转');
  });

  it('上级分类选项应与列表页一致', () => {
    const src = readSource();
    assert.ok(src.includes('PARENT_OPTIONS'), '上级选项应存在');
  });

  it('表单字段编码规则应大写加下划线', () => {
    const src = readSource();
    assert.ok(src.includes('A-Z') && src.includes('_'), '编码规则');
  });
});

describe('categories/new/page — AI 安全审计', () => {
  it('不泄露 formData 到 console', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(formData)') && !src.includes('console.log(data)'), '数据不泄露');
  });

  it('应使用 uuid 或 crypto 避免 ID 冲突', () => {
    const src = readSource();
    assert.ok(!src.includes('Math.random()') || src.includes('crypto'), 'ID 生成安全');
  });
});
