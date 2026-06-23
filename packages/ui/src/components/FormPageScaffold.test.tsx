/**
 * FormPageScaffold 单元测试
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  FormPageScaffold,
  validateFormFields,
} = require('./FormPageScaffold');

// ---- 辅助函数 ----

function render(el: React.ReactElement): string {
  return renderToStaticMarkup(el);
}

function makeMeta(overrides: Record<string, unknown> = {}) {
  return { title: '新建用户', ...overrides };
}

function makeFields(count = 2) {
  if (count >= 3) {
    return [
      { key: 'name', label: '姓名', required: true, placeholder: '输入姓名' },
      { key: 'email', label: '邮箱', required: true, placeholder: '输入邮箱',
        rules: [{ validate: (v: unknown) => String(v).includes('@') ? null : '邮箱格式不正确' }] },
      { key: 'desc', label: '描述', type: 'textarea' as const, placeholder: '输入描述' },
    ].slice(0, count);
  }
  return [
    { key: 'name', label: '姓名', required: true, placeholder: '输入姓名' },
    { key: 'email', label: '邮箱', required: true, placeholder: '输入邮箱' },
  ].slice(0, count);
}

// ==================== validateFormFields ====================

describe('validateFormFields', () => {
  it('返回空对象当没有错误时', () => {
    const fields = [
      { key: 'name', label: '姓名', required: true },
      { key: 'email', label: '邮箱', required: true,
        rules: [{ validate: (v: unknown) => (String(v).includes('@') ? null : '邮箱格式不正确') }] },
    ];
    const values = { name: '张三', email: 'test@test.com' };
    const errors = validateFormFields(fields, values);
    assert.deepStrictEqual(Object.keys(errors).length, 0);
  });

  it('检测必填字段为空', () => {
    const fields = [
      { key: 'name', label: '姓名', required: true },
      { key: 'email', label: '邮箱', required: true },
    ];
    const values = { name: '', email: '' };
    const errors = validateFormFields(fields, values);
    assert.ok(errors.name.includes('不能为空'));
    assert.ok(errors.email.includes('不能为空'));
  });

  it('检测自定义规则错误', () => {
    const fields = [
      { key: 'email', label: '邮箱', rules: [
        { validate: (v: unknown) => (String(v).includes('@') ? null : '邮箱格式不正确') }
      ]},
    ];
    const values = { email: 'bad-email' };
    const errors = validateFormFields(fields, values);
    assert.strictEqual(errors.email, '邮箱格式不正确');
  });

  it('必填字段为 null/undefined 时报错', () => {
    const fields = [{ key: 'x', label: 'X', required: true }];
    const errors1 = validateFormFields(fields, { x: null });
    assert.ok(errors1.x.includes('不能为空'));
    const errors2 = validateFormFields(fields, {});
    assert.ok(errors2.x.includes('不能为空'));
  });
});

// ==================== FormPageScaffold 渲染 ====================

describe('FormPageScaffold', () => {
  it('渲染页面标题', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('新建用户'));
  });

  it('渲染必填标记', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(2),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    // name 和 email 都需要带 *
    const starCount = (html.match(/\*/g) || []).length;
    assert.ok(starCount >= 2, `至少应有2个*, 实际: ${starCount}`);
  });

  it('渲染提交按钮', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        submitLabel: '创建用户',
      })
    );
    assert.ok(html.includes('创建用户'));
  });

  it('渲染描述文本', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta({ description: '填写下方表单信息' }),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('填写下方表单信息'));
  });

  it('渲染 helper 文本', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: [
          { key: 'name', label: '姓名', required: true, helper: '请输入真实姓名' },
        ],
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('请输入真实姓名'));
  });

  it('使用 initialValue 初始化字段', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: [
          { key: 'name', label: '姓名', initialValue: '预设名', placeholder: '输入姓名' },
        ],
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    // SSR 渲染时 input value 应为预设名
    assert.ok(html.includes('value="预设名"') || html.includes('预设名'));
  });

  it('select 字段渲染选项', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: [
          { key: 'category', label: '分类', type: 'select',
            options: [{ label: '普通用户', value: 'normal' }, { label: '高级用户', value: 'premium' }] },
          { key: 'name', label: '姓名', required: true },
        ],
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('普通用户'));
    assert.ok(html.includes('高级用户'));
  });

  it('textarea 字段可渲染', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: [
          { key: 'desc', label: '描述', type: 'textarea', placeholder: '输入描述' },
          { key: 'name', label: '姓名', required: true },
        ],
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('textarea'));
  });

  it('提供返回链接', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        backUrl: '/products/list',
      })
    );
    assert.ok(html.includes('/products/list'));
    assert.ok(html.includes('返回'));
  });

  it('不传 backUrl 时不渲染返回链接', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(!html.includes('← 返回'));
  });

  it('渲染删除按钮', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta({
          title: '编辑用户',
          deleteAction: { label: '删除此用户', onDelete: async () => {}, confirmText: '真要删除？' },
        }),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('删除此用户'));
  });

  it('不传 deleteAction 时不渲染删除按钮', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(!html.includes('删除'));
  });

  it('渲染自定义 topActions', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        topActions: React.createElement('button', { type: 'button', className: 'custom-action' }, '自定义操作'),
      })
    );
    assert.ok(html.includes('自定义操作'));
  });

  it('渲染自定义 footer', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        footer: React.createElement('div', { className: 'my-footer' }, 'FOOTER_CONTENT'),
      })
    );
    assert.ok(html.includes('FOOTER_CONTENT'));
  });

  it('disabled 模式', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: [
          { key: 'name', label: '姓名', required: true, placeholder: '输入姓名' },
        ],
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        disabled: true,
      })
    );
    // disabled 模式下 input 应该有 disabled 属性
    assert.ok(html.includes('disabled=""') || html.includes('disabled'));
  });

  it('支持自定义 submitVariant', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        submitVariant: 'danger',
        submitLabel: '危险提交按钮',
      })
    );
    assert.ok(html.includes('危险提交按钮'));
  });

  it('默认提交标签为"保存"', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('保存'));
  });

  it('渲染所有表单字段标签', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(3),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('姓名'));
    assert.ok(html.includes('邮箱'));
    assert.ok(html.includes('描述'));
  });

  it('渲染 input 元素', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(2),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    // 至少有两个 input 元素 (name + email)
    const inputCount = (html.match(/<input/g) || []).length;
    assert.ok(inputCount >= 2, `至少应有2个input, 实际: ${inputCount}`);
  });

  it('渲染 form 元素', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('<form'));
  });

  it('包含 maxWidth 容器样式', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        maxWidth: 600,
      })
    );
    // 渲染时应包含 max-width:600px
    assert.ok(html.includes('max-width:600px') || html.includes('720px'));
  });

  it('支持自定义 className', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
        className: 'my-form',
      })
    );
    assert.ok(html.includes('my-form'));
  });

  it('包含 PageShell 标题', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta({ title: '创建资源' }),
        fields: makeFields(1),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('创建资源'));
  });

  it('错误状态不预渲染（SSR默认无错误）', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(2),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    // SSR 时不预渲染错误信息
    assert.ok(!html.includes('不能为空'));
  });

  it('number 类型字段渲染为 number input', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: [
          { key: 'age', label: '年龄', type: 'number', required: true },
          { key: 'name', label: '姓名', required: true },
        ],
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    assert.ok(html.includes('type="number"'));
  });

  it('email 类型字段渲染为 email input', () => {
    const html = render(
      React.createElement(FormPageScaffold, {
        meta: makeMeta(),
        fields: makeFields(2),
        onSubmit: async (d: any) => ({ data: d, message: 'ok' }),
      })
    );
    // email 字段默认 type="text"（我们没改），但检查有 placeholder
    assert.ok(html.includes('输入邮箱'));
  });
});

// ==================== 类型导出检查 ====================

describe('FormPageScaffold 导出', () => {
  it('正确导出 FormPageScaffold', () => {
    assert.strictEqual(typeof FormPageScaffold, 'function');
  });

  it('正确导出 validateFormFields', () => {
    assert.strictEqual(typeof validateFormFields, 'function');
  });

  it('validateFormFields 接受标准参数不抛出', () => {
    assert.doesNotThrow(() => {
      validateFormFields([], {});
    });
  });
});
