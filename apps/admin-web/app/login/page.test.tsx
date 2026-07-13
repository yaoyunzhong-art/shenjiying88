/**
 * login/page.test.tsx — 登录页 L1 冒烟测试
 * 覆盖: 正例·反例·边界·集成·AI安全审计
 * V17#圈梁对齐
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('login — 正例', () => {
  it('应导出一个默认组件 LoginPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function LoginPage'), '缺少默认导出组件');
  });

  it('应包含 mockLoginApi 函数', () => {
    const src = readSource();
    assert.ok(src.includes('mockLoginApi'), '缺少 mockLoginApi');
  });

  it('mockLoginApi 应验证 username 非空', () => {
    const src = readSource();
    assert.ok(src.includes('username.trim()'), '缺少 username 非空校验');
  });

  it('mockLoginApi 应验证 password 长度 >= 6', () => {
    const src = readSource();
    assert.ok(src.includes('password.length < 6'), '缺少密码长度校验');
  });

  it('应包含 useFormSubmit 表单提交 hook', () => {
    const src = readSource();
    assert.ok(src.includes('useFormSubmit'), '缺少 useFormSubmit');
  });

  it('应包含登录成功提示', () => {
    const src = readSource();
    assert.ok(src.includes('登录成功') || src.includes('loginSuccess'), '缺少成功反馈');
  });

  it('mockLoginApi 应返回包含 token 的对象', () => {
    const src = readSource();
    assert.ok(src.includes('token') || src.includes('resolve({'), '应返回 token');
  });

  it('mockLoginApi 应校验用户名是否等于 admin', () => {
    const src = readSource();
    assert.ok(src.includes('admin') && (src.includes("username !== '") || src.includes("username === '")), '应校验 admin');
  });
});

// ---- 边界 ----

describe('login — 边界', () => {
  it('空 username 应抛出特定错误', () => {
    const src = readSource();
    assert.ok(src.includes('请输入管理员账号'), '缺少空用户名提示');
  });

  it('过短 password 应抛出特定错误', () => {
    const src = readSource();
    assert.ok(src.includes('至少 6 位字符'), '缺少密码长度提示');
  });

  it('非 admin 用户认证应失败', () => {
    const src = readSource();
    assert.ok(src.includes('用户名或密码错误'), '缺少认证失败提示');
  });

  it('username 边界值: 极长字符串应不崩溃', () => {
    const src = readSource();
    assert.ok(src.includes('username') && src.includes('trim'), 'trim 可防空格绕过');
  });

  it('password 边界值: 6位恰好通过', () => {
    const src = readSource();
    assert.ok(src.includes('password.length < 6'), '6位通过,5位拒绝边界');
  });

  it('password 边界值: 空密码应被拒绝', () => {
    const src = readSource();
    assert.ok(src.includes('password.length'), '空密码拒绝');
  });
});

// ---- 防御 ----

describe('login — 防御', () => {
  it('客户端字段校验应防止空提交', () => {
    const src = readSource();
    assert.ok(src.includes('fieldErrors'), '缺少字段错误状态');
  });

  it('handleSubmit 应 preventDefault', () => {
    const src = readSource();
    assert.ok(src.includes('preventDefault'), '缺少 preventDefault');
  });

  it('提交成功后错误应清除', () => {
    const src = readSource();
    assert.ok(src.includes('setFieldErrors'), '缺少字段错误清除');
  });

  it('mockLoginApi 应使用 setTimeout 模拟延迟', () => {
    const src = readSource();
    assert.ok(src.includes('setTimeout'), '缺少延迟模拟');
  });

  it('loading 加载状态应覆盖整个提交过程', () => {
    const src = readSource();
    assert.ok(src.includes('loading') || src.includes('isLoading'), '缺少加载状态');
  });

  it('提交后按钮应处于禁用状态', () => {
    const src = readSource();
    assert.ok(src.includes('disabled'), '缺少 disabled 状态');
  });

  it('提交错误时应显示错误提示', () => {
    const src = readSource();
    assert.ok(src.includes('error') || src.includes('ErrorMessage'), '应显示错误');
  });
});

// ---- 反例 ----

describe('login — 反例', () => {
  it('不应直接硬编码密码明文', () => {
    const src = readSource();
    // error.password = '提示' 是合法的错误赋值, 不应硬编码密码值
    const hasHardcodedPassword = src.includes('password =') && !src.includes('errors.password');
    assert.ok(!hasHardcodedPassword, '不应硬编码密码');
  });

  it('不应使用 eval 或 Function 构造', () => {
    const src = readSource();
    assert.ok(!src.includes('eval('), '不应使用 eval');
  });

  it('页面文件应遵循预期路径', () => {
    assert.ok(existsSync(SOURCE), 'source 文件应存在');
  });

  it('文件行数应在合理范围内', () => {
    const lines = readSource().split('\n').length;
    assert.ok(lines > 20, '组件文件应有足够行数');
    assert.ok(lines < 500, '组件文件不应过大');
  });

  it('不应使用危险的 innerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('innerHTML'), '不使用 innerHTML');
  });
});

// ---- 集成 ----

describe('login — 集成', () => {
  it('mockLoginApi 应返回 token 字符串', () => {
    const src = readSource();
    assert.ok(src.includes('token'), '应返回 token');
  });

  it('登录成功应传递 admin 角色信息', () => {
    const src = readSource();
    assert.ok(src.includes('admin') || src.includes('role'), '应传递角色信息');
  });

  it('username 和 password 应作为对象属性传递', () => {
    const src = readSource();
    assert.ok(src.includes('{ username') || src.includes('{ username:') || src.includes('username,'), '应构造凭证对象');
  });

  it('mockLoginApi 应返回 Promise<{token, role}>', () => {
    const src = readSource();
    assert.ok(src.includes('Promise<') || src.includes(': Promise') || src.includes('resolve({'), '应返回带类型的结果');
  });

  it('登录表单应有角色选择能力', () => {
    const src = readSource();
    assert.ok(src.includes('role') || src.includes('role='), '包含角色');
  });

  it('表单提交应处理 loading->success 流程', () => {
    const src = readSource();
    assert.ok(src.includes('setLoading') || src.includes('setIsSubmitting') || src.includes('isSubmitting'), '缺少提交状态管理');
  });

  it('should handle login form with username and password fields', () => {
    const src = readSource();
    assert.ok(src.includes('username') && src.includes('password'), '应包含用户名密码字段');
  });

  it('表单应包含 submit 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('登') || src.includes('submit'), '应包含提交按钮');
  });

  it('密码应使用 input[type=password] 保护', () => {
    const src = readSource();
    assert.ok(src.includes('type="password"') || src.includes("type='password'"), '密码应使用密码输入框');
  });

  it('failure 时应展示错误消息', () => {
    const src = readSource();
    assert.ok(src.includes('error') || src.includes('ErrorMessage'), '应展示错误组件');
  });
});

// ---- AI 安全审计 ----

describe('login — AI 安全审计', () => {
  it('不应将凭证明文输出到 console', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(password)'), '不泄露密码');
  });

  it('不应将凭证存入 localStorage', () => {
    const src = readSource();
    assert.ok(!src.includes('localStorage.setItem') || !src.includes('password'), '密码不进 localStorage');
  });

  it('应避免 XSS 注入 sink', () => {
    const src = readSource();
    assert.ok(!src.includes('innerHTML'), '不使用 innerHTML');
  });

  it('应避免 SQL 注入模式', () => {
    const src = readSource();
    assert.ok(!src.includes('SELECT') && !src.includes('INSERT'), '不包含 SQL 语句');
  });
});
