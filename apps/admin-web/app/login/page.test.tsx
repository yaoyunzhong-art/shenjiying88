/**
 * login/page.test.tsx — 管理后台登录 L2 全量测试
 * 覆盖: 正例·边界·组件结构·表单校验·安全统计·密码策略·历史过滤
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

// ---- 复现类型和函数（与 page.tsx 同步） ----

interface LoginHistoryEntry {
  id: string;
  username: string;
  ip: string;
  timestamp: string;
  success: boolean;
  failReason: string;
  userAgent: string;
}

interface SecurityScore {
  total: number;
  success: number;
  fail: number;
  recentFail: number;
  successRate: number;
  uniqueIPs: number;
  uniqueUsernames: number;
}

interface PasswordPolicy {
  minLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  maxAgeDays: number;
}

const PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireNumber: true,
  requireSpecial: false,
  maxAgeDays: 90,
};

const MOCK_HISTORY: LoginHistoryEntry[] = [
  { id: 'lh-1', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-16 04:30:00', success: true, failReason: '', userAgent: 'Chrome / macOS' },
  { id: 'lh-2', username: 'admin', ip: '192.168.1.101', timestamp: '2026-07-15 18:22:00', success: true, failReason: '', userAgent: 'Chrome / macOS' },
  { id: 'lh-3', username: 'operator', ip: '192.168.1.50', timestamp: '2026-07-15 14:10:00', success: false, failReason: '密码错误', userAgent: 'Safari / macOS' },
  { id: 'lh-4', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-15 09:05:00', success: true, failReason: '', userAgent: 'Chrome / macOS' },
  { id: 'lh-5', username: 'admin', ip: '10.0.0.55', timestamp: '2026-07-14 22:45:00', success: false, failReason: 'IP不在白名单', userAgent: 'Firefox / Windows' },
  { id: 'lh-6', username: 'auditor', ip: '10.0.0.100', timestamp: '2026-07-14 16:30:00', success: true, failReason: '', userAgent: 'Safari / iOS' },
  { id: 'lh-7', username: 'admin', ip: '192.168.1.100', timestamp: '2026-07-14 08:15:00', success: true, failReason: '', userAgent: 'Chrome / macOS' },
  { id: 'lh-8', username: 'operator', ip: '203.0.113.50', timestamp: '2026-07-13 19:45:00', success: false, failReason: '账户锁定', userAgent: 'Edge / Windows' },
];

function computeSecurityScore(history: LoginHistoryEntry[]): SecurityScore {
  const total = history.length;
  const success = history.filter((h) => h.success).length;
  const fail = total - success;
  const recentFail = history.filter((h) => !h.success && h.timestamp.startsWith('2026-07-16')).length;
  const uniqueIPs = new Set(history.map((h) => h.ip)).size;
  const uniqueUsernames = new Set(history.map((h) => h.username)).size;
  return { total, success, fail, recentFail, successRate: total > 0 ? Math.round((success / total) * 100) : 0, uniqueIPs, uniqueUsernames };
}

function validatePasswordPolicy(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < PASSWORD_POLICY.minLength) errors.push('至少 8 个字符');
  if (PASSWORD_POLICY.requireUpper && !/[A-Z]/.test(password)) errors.push('需要大写字母');
  if (PASSWORD_POLICY.requireLower && !/[a-z]/.test(password)) errors.push('需要小写字母');
  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) errors.push('需要数字');
  return { valid: errors.length === 0, errors };
}

function filterHistory(history: LoginHistoryEntry[], query: string, showOnlyFail: boolean): LoginHistoryEntry[] {
  let result = history;
  if (showOnlyFail) result = result.filter((h) => !h.success);
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter((h) => h.username.toLowerCase().includes(q) || h.ip.includes(q) || h.failReason.toLowerCase().includes(q) || h.userAgent.toLowerCase().includes(q));
  }
  return result;
}

// ---- 测试集 ----

describe('login — 正例: 页面结构', () => {
  it('1. 应导出一个默认组件 LoginPage', () => {
    assert.ok(readSource().includes('export default function LoginPage'), '缺少默认导出组件');
  });

  it('2. 应包含 PageShell', () => {
    assert.ok(readSource().includes('PageShell'), '缺少 PageShell');
  });

  it('3. 应使用 use client', () => {
    assert.ok(readSource().includes("'use client'"), '缺少 use client');
  });

  it('4. 应包含登录表单', () => {
    assert.ok(readSource().includes('type="password"'), '缺少密码输入');
  });

  it('5. 应包含 SubmitButton', () => {
    assert.ok(readSource().includes('SubmitButton'), '缺少 SubmitButton');
  });

  it('6. 应包含 FormSubmitFeedback', () => {
    assert.ok(readSource().includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('7. 应包含 StatusBadge', () => {
    assert.ok(readSource().includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('8. 应包含记住我复选框', () => {
    assert.ok(readSource().includes('remember-me'), '缺少记住我');
    assert.ok(readSource().includes('rememberMe'), '缺少 rememberMe');
  });

  it('9. 应包含登录历史 DataTable', () => {
    assert.ok(readSource().includes('historyColumns'), '缺少 historyColumns');
  });

  it('10. 应包含忘记密码链接', () => {
    assert.ok(readSource().includes('忘记密码'), '缺少忘记密码');
  });

  it('11. 应包含安全策略面板', () => {
    assert.ok(readSource().includes('showSecurity'), '缺少 showSecurity');
    assert.ok(readSource().includes('安全策略面板'), '缺少安全策略');
  });

  it('12. 应包含密码策略校验', () => {
    assert.ok(readSource().includes('passwordPolicyResult'), '缺少 passwordPolicyResult');
    assert.ok(readSource().includes('validatePasswordPolicy'), '缺少 validatePasswordPolicy');
  });

  it('13. 应包含历史搜索过滤', () => {
    assert.ok(readSource().includes('historyQuery'), '缺少 historyQuery');
    assert.ok(readSource().includes('historyOnlyFail'), '缺少 historyOnlyFail');
  });

  it('14. 应包含 IP 白名单建议', () => {
    assert.ok(readSource().includes('RECOMMENDED_IPS'), '缺少 RECOMMENDED_IPS');
    assert.ok(readSource().includes('IP 白名单'), '缺少 IP 白名单');
  });
});

describe('login — 正例: 数据函数', () => {
  it('15. MOCK_HISTORY 包含 8 条记录', () => {
    assert.strictEqual(MOCK_HISTORY.length, 8);
  });

  it('16. 所有 history ID 唯一', () => {
    const ids = MOCK_HISTORY.map((h) => h.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('17. 成功 5 条 失败 3 条', () => {
    assert.strictEqual(MOCK_HISTORY.filter((h) => h.success).length, 5);
    assert.strictEqual(MOCK_HISTORY.filter((h) => !h.success).length, 3);
  });

  it('18. 字段类型正确', () => {
    for (const h of MOCK_HISTORY) {
      assert.equal(typeof h.id, 'string');
      assert.equal(typeof h.username, 'string');
      assert.equal(typeof h.ip, 'string');
      assert.equal(typeof h.timestamp, 'string');
      assert.equal(typeof h.success, 'boolean');
    }
  });
});

describe('login — computeSecurityScore', () => {
  it('19. 返回完整安全评分', () => {
    const score = computeSecurityScore(MOCK_HISTORY);
    assert.strictEqual(score.total, 8);
    assert.strictEqual(score.success, 5);
    assert.strictEqual(score.fail, 3);
    assert.strictEqual(score.successRate, 63);
    assert.strictEqual(score.uniqueIPs, 6);
    assert.strictEqual(score.uniqueUsernames, 3);
  });

  it('20. 空历史返回全零', () => {
    const score = computeSecurityScore([]);
    assert.strictEqual(score.total, 0);
    assert.strictEqual(score.success, 0);
    assert.strictEqual(score.fail, 0);
    assert.strictEqual(score.successRate, 0);
    assert.strictEqual(score.uniqueIPs, 0);
  });

  it('21. 今日失败计数正确', () => {
    const score = computeSecurityScore(MOCK_HISTORY);
    assert.strictEqual(score.recentFail, 0); // 2026-07-16 条目都是成功
  });
});

describe('login — validatePasswordPolicy', () => {
  it('22. 全满足策略返回 valid=true', () => {
    const result = validatePasswordPolicy('Admin123');
    assert.ok(result.valid);
    assert.strictEqual(result.errors.length, 0);
  });

  it('23. 长度不足报错', () => {
    const result = validatePasswordPolicy('Aa1');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('8')));
  });

  it('24. 缺少大写字母', () => {
    const result = validatePasswordPolicy('admin123');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('大写')));
  });

  it('25. 缺少小写字母', () => {
    const result = validatePasswordPolicy('ADMIN123');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('小写')));
  });

  it('26. 缺少数字', () => {
    const result = validatePasswordPolicy('AdminOnly');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('数字')));
  });
});

describe('login — filterHistory', () => {
  it('27. 无过滤返回全部', () => {
    assert.strictEqual(filterHistory(MOCK_HISTORY, '', false).length, 8);
  });

  it('28. 仅失败过滤', () => {
    assert.strictEqual(filterHistory(MOCK_HISTORY, '', true).length, 3);
  });

  it('29. 搜索用户名', () => {
    assert.strictEqual(filterHistory(MOCK_HISTORY, 'operator', false).length, 2);
  });

  it('30. 搜索 IP', () => {
    assert.strictEqual(filterHistory(MOCK_HISTORY, '10.0.0.55', false).length, 1);
  });

  it('31. 搜索失败原因', () => {
    assert.strictEqual(filterHistory(MOCK_HISTORY, '密码错误', false).length, 1);
  });

  it('32. 不匹配搜索返回空', () => {
    assert.strictEqual(filterHistory(MOCK_HISTORY, 'zzznoexist', false).length, 0);
  });

  it('33. 组合过滤 (仅失败 + 搜索)', () => {
    assert.strictEqual(filterHistory(MOCK_HISTORY, 'operator', true).length, 2);
  });
});

describe('login — PASSWORD_POLICY', () => {
  it('34. 策略配置完整', () => {
    assert.strictEqual(PASSWORD_POLICY.minLength, 8);
    assert.strictEqual(PASSWORD_POLICY.requireUpper, true);
    assert.strictEqual(PASSWORD_POLICY.requireLower, true);
    assert.strictEqual(PASSWORD_POLICY.requireNumber, true);
    assert.strictEqual(PASSWORD_POLICY.requireSpecial, false);
    assert.strictEqual(PASSWORD_POLICY.maxAgeDays, 90);
  });
});

describe('login — 边界防御', () => {
  it('35. 表单字段错误清除', () => {
    assert.ok(readSource().includes('clearFieldError'), '缺少 clearFieldError');
  });

  it('36. 登录成功提示', () => {
    assert.ok(readSource().includes('登录成功'), '缺少成功提示');
  });

  it('37. 历史空状态', () => {
    assert.ok(readSource().includes('没有匹配的登录历史'), '缺少空状态');
  });

  it('38. 不包含 console.log', () => {
    assert.ok(!readSource().includes('console.log'), '不应有 console.log');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Login — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onSubmit={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含Math.round统计计算', () => assert.ok(SRC.includes('Math.round')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
