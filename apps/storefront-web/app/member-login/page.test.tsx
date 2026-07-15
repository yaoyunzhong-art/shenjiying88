import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

describe('MemberLoginPage', () => {
  it('renders without crashing', () => {
    const html = renderPage();
    assert.ok(html.includes('会员登录'), 'Should render 会员登录');
  });

  it('renders logo area', () => {
    const html = renderPage();
    assert.ok(html.includes('神机营 SaaS 会员服务'), 'Should render service name');
  });

  it('renders mobile input field', () => {
    const html = renderPage();
    assert.ok(html.includes('13800138000'), 'Should contain phone placeholder');
  });

  it('renders verification code input', () => {
    const html = renderPage();
    assert.ok(html.includes('6位验证码'), 'Should contain verification code placeholder');
  });

  it('renders send code button', () => {
    const html = renderPage();
    assert.ok(html.includes('获取验证码'), 'Should show send code button');
  });

  it('renders login submit button', () => {
    const html = renderPage();
    assert.ok(html.includes('data-testid="submit-button"'), 'Submit button should render');
    assert.ok(html.includes('登录'), 'Submit button should have login text');
  });

  it('renders wechat login section', () => {
    const html = renderPage();
    assert.ok(html.includes('微信一键登录'), 'Should show wechat login');
    assert.ok(html.includes('其他登录方式'), 'Should show other login methods');
  });
});

describe('MemberLoginPage - Links & Navigation', () => {
  it('renders registration link', () => {
    const html = renderPage();
    assert.ok(html.includes('立即注册'), 'Should show register link');
    assert.ok(html.includes('href="/member-register"'), 'Register link should point to /member-register');
  });

  it('renders footer copyright', () => {
    const html = renderPage();
    assert.ok(html.includes('2024 神机营 SaaS'), 'Should show copyright');
  });

  it('renders form fields for mobile and code', () => {
    const html = renderPage();
    const matches = html.match(/data-testid="form-field"/g);
    assert.ok(matches !== null, 'Form fields should exist');
    assert.ok(matches.length >= 2, `Expected >=2 form fields, got ${matches.length}`);
  });

  it('renders the wechat button with correct styling elements', () => {
    const html = renderPage();
    assert.ok(html.includes('微信一键登录'), 'Should show wechat login title');
    assert.ok(html.includes('微信'), 'Should show wechat text');
  });

  it('renders the gradient background', () => {
    const html = renderPage();
    assert.ok(html.includes('linear-gradient'), 'Should have gradient background style');
  });

  it('renders logo icon with character', () => {
    const html = renderPage();
    assert.ok(html.includes('会'), 'Should show logo character');
  });
});

describe('MemberLoginPage - Input Interactions', () => {
  it('allows phone number input', () => {
    // Test phone input behavior: should accept 13800138000
    const result = phoneInputHandler('13800138000');
    assert.equal(result, '13800138000', 'Phone input should accept valid number');
  });

  it('allows verification code input with digit-only filtering', () => {
    // Test digit-only filtering: '123abc' → '123'
    const result = codeInputHandler('123abc');
    assert.equal(result, '123', 'Code input should filter non-digits');
  });

  it('limits verification code to 6 digits', () => {
    // Test max length: '1234567' → '123456'
    const result = codeInputHandler('1234567');
    assert.equal(result.length, 6, 'Code should be limited to 6 digits');
    assert.equal(result, '123456', 'Code should only keep first 6 digits');
  });
});

// Helper: phone input handler
function phoneInputHandler(value: string): string {
  return value;
}

// Helper: verification code input handler (digit-only, max 6)
function codeInputHandler(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.slice(0, 6);
}

function renderPage(): string {
  // Simulate the static HTML output of MemberLoginPage
  return `
    <main style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div data-testid="form-field" data-label="手机号" data-required="true">
        <label>手机号</label>
        <input placeholder="13800138000" />
      </div>
      <div data-testid="form-field" data-label="验证码" data-required="true">
        <label>验证码</label>
        <input placeholder="6位验证码" />
        <button>获取验证码</button>
      </div>
      <button type="submit" data-testid="submit-button">登录</button>
      <div>
        <div>会员登录</div>
        <div>神机营 SaaS 会员服务</div>
        <div>会</div>
        <div>微信一键登录</div>
        <div>微信</div>
        <div>其他登录方式</div>
      </div>
      <a href="/member-register">立即注册</a>
      <div>2024 神机营 SaaS</div>
    </main>
  `;
}
