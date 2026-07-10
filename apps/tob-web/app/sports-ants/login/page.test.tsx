/**
 * 运动蚂蚁管理员登录页面测试
 * SportsAnts Admin Login Page Tests
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function readSource(): string {
  const src = resolve(__dirname, 'page.tsx');
  return readFileSync(src, 'utf-8');
}

describe('SportsAnts LoginPage', () => {
  it('renders login title', () => {
    const src = readSource();
    assert.ok(src.includes('管理员登录'), 'missing login title');
  });

  it('has phone input field', () => {
    const src = readSource();
    assert.ok(src.includes('手机号'), 'missing phone label');
    assert.ok(src.includes('name="phone"'), 'missing phone input name');
    assert.ok(src.includes('maxLength={11}'), 'missing phone maxLength');
  });

  it('has password input field', () => {
    const src = readSource();
    assert.ok(src.includes('密码'), 'missing password label');
    assert.ok(src.includes('type="password"'), 'missing password type');
    assert.ok(src.includes('name="password"'), 'missing password name');
  });

  it('has remember me checkbox', () => {
    const src = readSource();
    assert.ok(src.includes('记住我'), 'missing remember me label');
    assert.ok(src.includes('name="rememberMe"'), 'missing rememberMe name');
    assert.ok(src.includes('type="checkbox"'), 'missing checkbox type');
  });

  it('has login submit button', () => {
    const src = readSource();
    assert.ok(src.includes('type="submit"'), 'missing submit type');
    assert.ok(src.includes('登录'), 'missing submit text');
    assert.ok(src.includes('登录中...'), 'missing loading text');
  });

  it('has form validation for empty fields', () => {
    const src = readSource();
    assert.ok(src.includes('请输入手机号'), 'missing phone validation message');
    assert.ok(src.includes('请输入密码'), 'missing password validation message');
  });

  it('has navigation links', () => {
    const src = readSource();
    assert.ok(src.includes('立即注册'), 'missing register link');
    assert.ok(src.includes('忘记密码？'), 'missing forgot password link');
    assert.ok(src.includes('服务条款'), 'missing terms link');
    assert.ok(src.includes('隐私政策'), 'missing privacy link');
  })

  it('has SEO meta tags', () => {
    const src = readSource();
    assert.ok(src.includes('SEOMeta'), 'missing SEOMeta component');
    assert.ok(src.includes('管理员登录 - 运动蚂蚁'), 'missing page title meta');
    assert.ok(src.includes('运动蚂蚁企业管理员登录'), 'missing page description meta');
  });

  it('has layout components', () => {
    const src = readSource();
    assert.ok(src.includes('Header'), 'missing Header');
    assert.ok(src.includes('Footer'), 'missing Footer');
    assert.ok(src.includes('FloatingContact'), 'missing FloatingContact');
  });

  it('uses BigAnts design tokens', () => {
    const src = readSource();
    assert.ok(src.includes('BigAntsColors'), 'missing BigAntsColors');
    assert.ok(src.includes('BigAntsRadius'), 'missing BigAntsRadius');
    assert.ok(src.includes('BigAntsSpacing'), 'missing BigAntsSpacing');
    assert.ok(src.includes('BigAntsFonts'), 'missing BigAntsFonts');
  });

  it('has error state handling', () => {
    const src = readSource();
    assert.ok(src.includes('setError'), 'missing error state setter');
    assert.ok(src.includes('isSubmitting'), 'missing submitting state');
    assert.ok(src.includes('disabled={isSubmitting}'), 'missing disabled state on submit');
    assert.ok(src.includes('登录失败'), 'missing login failure message');
  });

  it('has form data state management', () => {
    const src = readSource();
    assert.ok(src.includes('formData'), 'missing formData state');
    assert.ok(src.includes('useState'), 'missing useState');
    assert.ok(src.includes('handleSubmit'), 'missing handleSubmit');
    assert.ok(src.includes('handleChange'), 'missing handleChange');
  });

  it('redirects to console on success', () => {
    const src = readSource();
    assert.ok(src.includes('/sports-ants/console'), 'missing console redirect route');
    assert.ok(src.includes('router.push'), 'missing router push');
  });
});
