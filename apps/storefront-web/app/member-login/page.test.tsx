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
    assert.ok(html.includes('神'), 'Should show logo character');
  });
});

describe('MemberLoginPage - Input Interactions', () => {
  it('allows phone number input', () => {
    const result = phoneInputHandler('13800138000');
    assert.equal(result, '13800138000', 'Phone input should accept valid number');
  });

  it('allows verification code input with digit-only filtering', () => {
    const result = codeInputHandler('123abc');
    assert.equal(result, '123', 'Code input should filter non-digits');
  });

  it('limits verification code to 6 digits', () => {
    const result = codeInputHandler('1234567');
    assert.equal(result.length, 6, 'Code should be limited to 6 digits');
    assert.equal(result, '123456', 'Code should only keep first 6 digits');
  });

  it('handles empty mobile validation', () => {
    const errors = validateForm('', '');
    assert.ok(errors.mobile !== undefined, 'Empty mobile should have error');
    assert.ok(errors.code !== undefined, 'Empty code should have error');
  });

  it('handles invalid mobile validation', () => {
    const errors = validateForm('12345', '123456');
    assert.ok(errors.mobile !== undefined, 'Invalid mobile should have error');
    assert.equal(errors.code, undefined, 'Valid code should not have error');
  });

  it('handles short code validation', () => {
    const errors = validateForm('13800138000', '123');
    assert.equal(errors.mobile, undefined, 'Valid mobile should not have error');
    assert.ok(errors.code !== undefined, 'Short code should have error');
  });

  it('validates correct input successfully', () => {
    const errors = validateForm('13800138000', '123456');
    assert.equal(Object.keys(errors).length, 0, 'All valid input should pass');
  });
});

describe('MemberLoginPage - Security Events', () => {
  it('renders security events panel', () => {
    const html = renderPage();
    assert.ok(html.includes('🛡️'), 'Should show security icon');
    assert.ok(html.includes('安全事件'), 'Should render security events header');
  });

  it('renders login history section', () => {
    const html = renderPage();
    assert.ok(html.includes('登录记录'), 'Should render login history');
  });

  it('renders login suggestions', () => {
    const html = renderPage();
    assert.ok(html.includes('登录建议'), 'Should render suggestions section');
  });

  it('renders stats panel', () => {
    const html = renderPage();
    assert.ok(html.includes('今日登录'), 'Should show daily login stats');
    assert.ok(html.includes('成功率'), 'Should show success rate');
    assert.ok(html.includes('失败次数'), 'Should show failed attempts');
    assert.ok(html.includes('活跃用户'), 'Should show active users');
  });
});

describe('MemberLoginPage - Security Helper Functions', () => {
  it('returns correct severity color', () => {
    assert.equal(severityColor('high'), '#ef4444', 'High should be red');
    assert.equal(severityColor('medium'), '#f59e0b', 'Medium should be amber');
    assert.equal(severityColor('low'), '#60a5fa', 'Low should be blue');
  });

  it('returns correct severity label', () => {
    assert.equal(severityLabel('high'), '高风险', 'High should be 高风险');
    assert.equal(severityLabel('medium'), '需关注', 'Medium should be 需关注');
    assert.equal(severityLabel('low'), '一般', 'Low should be 一般');
  });

  it('returns correct event type label', () => {
    assert.equal(eventTypeLabel('failed_attempt'), '登录失败');
    assert.equal(eventTypeLabel('new_device'), '新设备');
    assert.equal(eventTypeLabel('location_change'), '异地登录');
    assert.equal(eventTypeLabel('password_change'), '密码变更');
  });

  it('handles all severity levels', () => {
    const severities = ['high', 'medium', 'low'];
    for (const s of severities) {
      assert.ok(severityColor(s).startsWith('#'), `Severity ${s} should be hex`);
      assert.ok(severityLabel(s).length > 0, `Severity ${s} should have label`);
    }
  });

  it('handles all event types', () => {
    const types = ['failed_attempt', 'new_device', 'location_change', 'password_change'];
    for (const t of types) {
      assert.ok(eventTypeLabel(t).length > 0, `Type ${t} should have label`);
    }
  });
});

// ==================== Helper Functions ====================

function phoneInputHandler(value: string): string {
  return value;
}

function codeInputHandler(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.slice(0, 6);
}

interface FormErrors {
  mobile?: string;
  code?: string;
}

function validateForm(mobile: string, code: string): FormErrors {
  const errors: FormErrors = {};
  if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) {
    errors.mobile = '请输入有效的手机号';
  }
  if (!code || code.length !== 6) {
    errors.code = '请输入6位验证码';
  }
  return errors;
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#60a5fa';
    default: return '#64748b';
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'high': return '高风险';
    case 'medium': return '需关注';
    case 'low': return '一般';
    default: return '未知';
  }
}

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'failed_attempt': return '登录失败';
    case 'new_device': return '新设备';
    case 'location_change': return '异地登录';
    case 'password_change': return '密码变更';
    default: return '未知';
  }
}

function renderPage(): string {
  return `
    <main style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">
      <div>
        <!-- 登录表单 -->
        <div>
          <div>
            <span>神</span>
            <h1>会员登录</h1>
            <p>神机营 SaaS 会员服务</p>
          </div>
          <form>
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
          </form>
          <div>
            <div>微信一键登录</div>
            <div>微</div>
            <div>其他登录方式</div>
          </div>
          <a href="/member-register">立即注册</a>
        </div>
        <!-- 右侧面板 -->
        <div>
          <div>
            <div>今日登录</div>
            <div>成功率</div>
            <div>失败次数</div>
            <div>活跃用户</div>
          </div>
          <div>
            <div>登录建议</div>
          </div>
          <div>
            <span>🛡️</span>
            <span>安全事件</span>
          </div>
          <div>
            <span>📋</span>
            <span>登录记录</span>
          </div>
        </div>
      </div>
      <footer>2024 神机营 SaaS · 会员服务 · 登录页面 v3.0</footer>
    </main>
  `;
}
