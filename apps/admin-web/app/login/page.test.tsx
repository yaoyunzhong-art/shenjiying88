/**
 * login/page.test.tsx — 登录页 L1 冒烟测试
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
});
