/**
 * login/page.test.tsx — 管理后台登录 L2 测试
 * 覆盖: 正例·边界·组件结构·表单校验
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

describe('login — 正例', () => {
  it('应导出一个默认组件 LoginPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function LoginPage'), '缺少默认导出组件');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含登录表单', () => {
    const src = readSource();
    assert.ok(src.includes('type="text"') || src.includes("autoComplete='username'"), '缺少用户名输入');
    assert.ok(src.includes('type="password"'), '缺少密码输入');
  });

  it('应包含 SubmitButton 提交按钮', () => {
    const src = readSource();
    assert.ok(src.includes('SubmitButton'), '缺少 SubmitButton');
  });

  it('应包含 FormSubmitFeedback 反馈', () => {
    const src = readSource();
    assert.ok(src.includes('FormSubmitFeedback'), '缺少 FormSubmitFeedback');
  });

  it('应使用 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 StatusBadge 状态标签', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应包含记住我复选框', () => {
    const src = readSource();
    assert.ok(src.includes('remember-me'), '缺少记住我');
    assert.ok(src.includes('rememberMe'), '缺少 rememberMe');
  });

  it('应包含登录历史面板', () => {
    const src = readSource();
    assert.ok(src.includes('showHistory'), '缺少 showHistory');
    assert.ok(src.includes('MOCK_LOGIN_HISTORY'), '缺少登录历史');
  });

  it('应包含登录历史 DataTable', () => {
    const src = readSource();
    assert.ok(src.includes('historyColumns'), '缺少 historyColumns');
  });

  it('应包含表单字段检验', () => {
    const src = readSource();
    assert.ok(src.includes('fieldErrors'), '缺少 fieldErrors');
    assert.ok(src.includes("errors.username"), '缺少用户名校验');
    assert.ok(src.includes("errors.password"), '缺少密码校验');
  });
});

describe('login — 边界防御', () => {
  it('模拟登录 mockLoginApi 应捕获空用户名', () => {
    const src = readSource();
    assert.ok(src.includes("!username.trim()"), '缺少用户名非空校验');
  });

  it('模拟登录应校验密码长度', () => {
    const src = readSource();
    assert.ok(src.includes('password.length < 6'), '缺少密码长度校验');
  });

  it('应包含忘记密码链接', () => {
    const src = readSource();
    assert.ok(src.includes('忘记密码？'), '缺少忘记密码');
  });

  it('应包含安全问题统计', () => {
    const src = readSource();
    assert.ok(src.includes('recentFail'), '缺少今日异常统计');
    assert.ok(src.includes('成功登录'), '缺少成功登录');
    assert.ok(src.includes('失败尝试'), '缺少失败尝试');
  });

  it('历史记录应有 success 状态渲染', () => {
    const src = readSource();
    assert.ok(src.includes("item.success ? '成功' : '失败'"), '缺少状态渲染');
  });

  it('表单提交应支持 loading 状态', () => {
    const src = readSource();
    assert.ok(src.includes('isSubmitting'), '缺少 isSubmitting');
  });

  it('登录成功应显示提示', () => {
    const src = readSource();
    assert.ok(src.includes('登录成功'), '缺少登录成功提��');
  });

  it('初始表单字段应为空', () => {
    const src = readSource();
    assert.ok(src.includes("useState('')"), '缺少初始空字符串');
  });

  it('应包含登录历史条目类型 LoginHistoryEntry', () => {
    const src = readSource();
    assert.ok(src.includes('LoginHistoryEntry'), '缺少 LoginHistoryEntry');
  });

  it('应包含 DataTable 列定义', () => {
    const src = readSource();
    assert.ok(src.includes("key: 'timestamp'"), '缺少 timestamp 列');
    assert.ok(src.includes("key: 'username'"), '缺少 username 列');
    assert.ok(src.includes("key: 'ip'"), '缺少 IP 列');
    assert.ok(src.includes("key: 'success'"), '缺少 success 列');
  });

  it('应清除字段错误', () => {
    const src = readSource();
    assert.ok(src.includes('clearFieldError'), '缺少 clearFieldError');
  });
});
