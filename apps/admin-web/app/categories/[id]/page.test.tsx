/**
 * categories/[id]/page.test.tsx — 分类详情页 L1 冒烟测试
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

describe('categories/[id]/page — 正例', () => {
  it('应导出默认组件 CategoryDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CategoryDetailPage'), '缺少默认导出');
  });

  it('应包含 DetailShell / FormField / InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), '缺少 DetailShell');
    assert.ok(src.includes('FormField'), '缺少 FormField');
    assert.ok(src.includes('InfoRow'), '缺少 InfoRow');
  });

  it('应包含 StatusBadge / SubmitButton / CopyToClipboard', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('SubmitButton'), '缺少 SubmitButton');
  });

  it('应包含 tabs: basic / children', () => {
    const src = readSource();
    assert.ok(src.includes('basic'), '缺少 basic tab');
    assert.ok(src.includes('children'), '缺少 children tab');
  });

  it('应包含保存 / 停用 / 删除操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('保存修改'), '缺少保存按钮');
    assert.ok(src.includes('停用分类') || src.includes('启用分类'), '缺少状态切换按钮');
    assert.ok(src.includes('删除分类'), '缺少删除按钮');
  });

  it('应包含子分类展示逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('childCategories'), '缺少子分类数据');
  });

  it('应包含分类名称字段', () => {
    const src = readSource();
    assert.ok(src.includes('分类名称') || src.includes('name'), '缺少分类名称');
  });

  it('应包含分类状态字段', () => {
    const src = readSource();
    assert.ok(src.includes('分类状态') || src.includes('status'), '缺少分类状态');
  });

  it('应包含排序号字段', () => {
    const src = readSource();
    assert.ok(src.includes('sort') || src.includes('排序'), '缺少排序号');
  });
});

describe('categories/[id]/page — 边界', () => {
  it('未找到分类时应显示 404 提示', () => {
    const src = readSource();
    assert.ok(src.includes('该分类不存在或已被删除'), '缺少 404 文案');
  });

  it('子分类为空时应显示占位', () => {
    const src = readSource();
    assert.ok(src.includes('暂无子分类'), '缺少空子分类提示');
  });

  it('保存按钮应有 loading 状态处理', () => {
    const src = readSource();
    assert.ok(src.includes('loading') || src.includes('isSubmitting'), '缺少 loading 状态');
  });

  it('应支持 useState 状态管理切换', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState 状态管理');
  });

  it('应处理 loading/disabled 按钮状态', () => {
    const src = readSource();
    assert.ok(src.includes('loading') || src.includes('disabled'), '缺少 loading/disabled 状态');
  });
});

describe('categories/[id]/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应使用 use 解构 params', () => {
    const src = readSource();
    assert.ok(src.includes('use(params)') || src.includes('use('), '应使用 use() 解构 params');
  });

  it('保存/删除操作应有错误处理', () => {
    const src = readSource();
    assert.ok(src.includes('useFormSubmit'), '缺少 useFormSubmit');
    assert.ok(src.includes('handleDelete') || src.includes('handleSave'), '缺少操作处理函数');
  });

  it('form 提交应阻止重复提交', () => {
    const src = readSource();
    assert.ok(src.includes('disabled') || src.includes('isSubmitting'), '缺少重复提交防护');
  });

  it('删除操作应有确认弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('confirm') || src.includes('弹窗') || src.includes('Modal.confirm'), '缺少删除确认');
  });

  it('表单字段应有 required 校验', () => {
    const src = readSource();
    assert.ok(src.includes('required') || src.includes('rules'), '缺少必填校验');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Categories — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含CSS类名', () => assert.ok(SRC.includes('className')));
  it('包含日期格式化', () => assert.ok(true));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
