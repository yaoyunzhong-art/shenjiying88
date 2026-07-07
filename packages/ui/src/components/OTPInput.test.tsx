const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const React = require('react');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT +
    '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);

const { OTPInput } = require('./OTPInput');

describe('OTPInput', () => {
  describe('基础渲染', () => {
    it('渲染默认6格输入框', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {} }),
      );
      const inputs = html.match(/<input/g);
      assert.strictEqual(inputs.length, 6);
    });

    it('自定义 length', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, length: 4 }),
      );
      const inputs = html.match(/<input/g);
      assert.strictEqual(inputs.length, 4);
    });

    it('每个 input maxLength=1', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {} }),
      );
      const matches = html.match(/maxlength="1"/gi);
      assert.strictEqual(matches?.length, 6);
    });

    it('渲染 role="group" 容器', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {} }),
      );
      assert.ok(html.includes('role="group"'));
    });

    it('inputMode="numeric"', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, inputMode: 'numeric' }),
      );
      // React 18 renderToStaticMarkup 输出 inputmode 属性
      assert.ok(html.includes('inputMode'));
    });
  });

  describe('值展示', () => {
    it('展示已有值', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '456', onChange: () => {} }),
      );
      assert.ok(html.match(/value="4"/));
      assert.ok(html.match(/value="5"/));
      assert.ok(html.match(/value="6"/));
    });

    it('缺失的格为空', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '1', onChange: () => {} }),
      );
      // value 长度 1，有 6 个 input，后 5 个 value=""
      const values = html.match(/value=""/g);
      assert.strictEqual(values?.length, 5);
    });
  });

  describe('无障碍', () => {
    it('每个 input 有 aria-label', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {} }),
      );
      for (let i = 1; i <= 6; i++) {
        assert.ok(html.includes(`aria-label="第 ${i} 位验证码"`));
      }
    });

    it('group 有 aria-label', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, label: '验证码输入框' }),
      );
      assert.ok(html.includes('aria-label="验证码输入框"'));
    });

    it('有 data-testid', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {} }),
      );
      assert.ok(html.includes('data-testid="otp-input-0"'));
    });
  });

  describe('状态属性', () => {
    it('disabled 属性', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, disabled: true }),
      );
      const disabledCount = (html.match(/disabled=""/g) || []).length;
      assert.strictEqual(disabledCount, 6);
    });

    it('readOnly 属性', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, readOnly: true }),
      );
      const readonlyCount = (html.match(/readonly=""/gi) || []).length;
      assert.strictEqual(readonlyCount, 6);
    });

    it('error 样式（通过 borderColor 不得为默认值）', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, error: true }),
      );
      assert.ok(html.includes('border-color') || html.includes('ef4444'));
    });

    it('placeholder', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, placeholder: '·' }),
      );
      assert.ok(html.includes('placeholder'));
    });
  });

  describe('尺寸和变体', () => {
    it('size="lg" 大字', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, size: 'lg' }),
      );
      assert.ok(html.includes('font-size: 22px') || html.includes('font-size:22px'));
    });

    it('size="sm" 小字', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, size: 'sm' }),
      );
      assert.ok(html.includes('font-size: 14px') || html.includes('font-size:14px'));
    });

    it('variant="filled" 渲染背景', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, variant: 'filled' }),
      );
      assert.ok(html.includes('background') || html.includes('f3f4f6'));
    });

    it('variant="underlined"', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, variant: 'underlined' }),
      );
      assert.ok(html.includes('border-bottom') || html.includes('borderBottom'));
    });
  });

  describe('onComplete in value flow', () => {
    it('输入6位时 value 正确', () => {
      // renderToStaticMarkup 中 onChange 是 noop，仅验证 value 传递
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, {
          value: '654321',
          onChange: () => {},
          length: 6,
          onComplete: () => {},
        }),
      );
      assert.ok(html.includes('value="6"'));
      assert.ok(html.includes('value="5"'));
      assert.ok(html.includes('value="4"'));
      assert.ok(html.includes('value="3"'));
      assert.ok(html.includes('value="2"'));
      assert.ok(html.includes('value="1"'));
    });
  });

  describe('autoFocus', () => {
    it('autoFocus 在第一个 input 上', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, autoFocus: true }),
      );
      // 检查第一个 input 有 autofocus
      const parts = html.split('</div>')[0]; // group 容器内的第一个分组
      assert.ok(html.match(/autofocus=""/));
    });
  });

  describe('type 属性', () => {
    it('inputMode="tel" 渲染 type="tel"', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {}, inputMode: 'tel' }),
      );
      assert.ok(html.includes('type="tel"'));
    });

    it('默认 type="text"', () => {
      const html = renderToStaticMarkup(
        React.createElement(OTPInput, { value: '', onChange: () => {} }),
      );
      assert.ok(html.includes('type="text"'));
    });
  });
});
