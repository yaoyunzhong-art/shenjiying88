/**
 * member-center/page.test.ts — 会员中心页面 L1 冒烟测试
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

describe('member-center — 正例', () => {
  it('应导出一个默认组件 MemberCenterPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MemberCenterPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 MemberInfo 类型引用', () => {
    const src = readSource();
    assert.ok(src.includes('MemberInfo'), '缺少 MemberInfo');
  });

  it('应包含 MembershipTier 会员等级体系', () => {
    const src = readSource();
    assert.ok(src.includes('MembershipTier'), '缺少 MembershipTier');
  });

  it('应显示会员等级 (TIER_LABELS)', () => {
    const src = readSource();
    ['钻石会员', '黄金会员', '银卡会员', '铜卡会员', '普通会员'].forEach((t) => {
      assert.ok(src.includes(t), `缺少等级: ${t}`);
    });
  });
});

// ---- 边界 ----

describe('member-center — 边界', () => {
  it('未登录时跳转到 /member-login', () => {
    const src = readSource();
    assert.ok(src.includes('member_access_token') || src.includes('member-login'), '缺少登录校验');
    assert.ok(src.includes('router.push'), '缺少路由跳转');
  });

  it('localStorage 中 member_info 解析失败时返回登录页', () => {
    const src = readSource();
    assert.ok(src.includes('JSON.parse'), '缺少 JSON.parse 解析');
    assert.ok(src.includes('catch'), '缺少 try-catch');
  });

  it('加载中显示 "加载中..."', () => {
    const src = readSource();
    assert.ok(src.includes('加载中'), '缺少加载状态');
  });

  it('member 为 null 时 return null (空渲染)', () => {
    const src = readSource();
    assert.ok(src.includes('!member') && src.includes('return null'), '缺少 null 防御渲染');
  });

  it('头像显示 nickname 首字符或默认 "会"', () => {
    const src = readSource();
    assert.ok(src.includes("member.nickname?.charAt(0)") || src.includes("charAt"), '缺少首字符显示');
  });
});

// ---- 防御 ----

describe('member-center — 防御', () => {
  it('应包含 退出 登录按钮', () => {
    const src = readSource();
    assert.ok(src.includes('handleLogout'), '缺少 handleLogout');
    assert.ok(src.includes('退出') || src.includes('logout'), '缺少退出按钮');
  });

  it('应展示 积分 卡片', () => {
    const src = readSource();
    assert.ok(src.includes('member.points') || src.includes('我的积分'), '缺少积分展示');
  });

  it('功能入口应有 "我的订单"/"我的优惠券"/"会员卡"/"我的收藏"/"所属门店"', () => {
    const src = readSource();
    assert.ok(src.includes('我的订单'), '缺少我的订单');
    assert.ok(src.includes('我的优惠券'), '缺少我的优惠券');
    assert.ok(src.includes('会员卡'), '缺少会员卡');
    assert.ok(src.includes('我的收藏'), '缺少我的收藏');
    assert.ok(src.includes('所属门店'), '缺少所属门店');
  });

  it('应包含底部导航 (首页/门店/我的)', () => {
    const src = readSource();
    assert.ok(src.includes('首页'), '缺少首页');
    assert.ok(src.includes('门店'), '缺少门店');
    assert.ok(src.includes('我的'), '缺少我的');
  });

  it('手机号后 localStorage 清理应包括 token/refresh_token/info', () => {
    const src = readSource();
    assert.ok(src.includes('localStorage.removeItem'), '缺少 localStorage 清理');
    assert.ok(src.includes('member_refresh_token'), '缺少 refresh_token 清理');
    assert.ok(src.includes('member_info'), '缺少 member_info 清理');
  });
});
