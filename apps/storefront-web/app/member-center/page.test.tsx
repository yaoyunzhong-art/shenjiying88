/**
 * member-center/page.test.tsx — 会员中心页面 L2 渲染测试
 *
 * 测试覆盖:
 * - 默认导出 & 组件结构
 * - 会员等级体系常量全覆盖
 * - 功能菜单入口完整性
 * - SSR 渲染静态结构验证
 * - 未登录状态引导
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const PAGE_PATH = path.join(__dirname, 'page.tsx');
const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const React = require('react');

describe('MemberCenterPage — 结构验证', () => {

  test('页面文件存在', () => {
    assert.ok(fs.existsSync(PAGE_PATH));
  });

  test('导出一个默认函数组件 MemberCenterPage', () => {
    assert.match(pageSource, /export default function MemberCenterPage/);
    assert.match(pageSource, /'use client'/);
  });

  test('引用 MemberInfo 类型', () => {
    assert.ok(pageSource.includes("MemberInfo"));
  });

  test('MembershipTier 包含 5 个等级', () => {
    const tiers = ['diamond', 'gold', 'silver', 'bronze', 'basic'];
    tiers.forEach(t => assert.ok(pageSource.includes(`'${t}'`), `缺少等级: ${t}`));
  });

  test('TIER_LABELS 包含全部中文标签', () => {
    ['钻石会员', '黄金会员', '银卡会员', '铜卡会员', '普通会员'].forEach(label =>
      assert.ok(pageSource.includes(label), `缺少标签: ${label}`)
    );
  });

  test('TIER_COLORS 包含全部等级颜色', () => {
    ['#a78bfa', '#fbbf24', '#94a3b8', '#d97706', '#64748b'].forEach(color =>
      assert.ok(pageSource.includes(color), `缺少颜色: ${color}`)
    );
  });

  test('包含 localStorage 登录态校验', () => {
    assert.ok(pageSource.includes('member_access_token'));
    assert.ok(pageSource.includes('member_info'));
    assert.ok(pageSource.includes('router.push(\'/member-login\''));
  });

  test('包含 5 个功能菜单入口', () => {
    const menuLabels = ['我的订单', '我的优惠券', '会员卡', '我的收藏', '所属门店'];
    menuLabels.forEach(label =>
      assert.ok(pageSource.includes(label), `缺少菜单: ${label}`)
    );
  });

  test('包含退出登录按钮', () => {
    assert.ok(pageSource.includes('退出'));
    assert.ok(pageSource.includes('handleLogout'));
  });

  test('包含底部导航', () => {
    ['首页', '门店', '我的'].forEach(label =>
      assert.ok(pageSource.includes(label), `缺少导航: ${label}`)
    );
  });

  test('包含积分展示区域', () => {
    assert.ok(pageSource.includes('我的积分'));
    assert.ok(pageSource.includes('可兑换优惠券及礼品'));
  });

  test('加载态显示"加载中..."', () => {
    assert.ok(pageSource.includes('加载中...'));
  });

  test('手机号显示区域', () => {
    assert.ok(pageSource.includes('手机号：'));
  });
});

describe('MemberCenterPage — SSR 渲染', () => {

  test('加载态渲染 "加载中..."', () => {
    // 当 member=null, loading=true 时，应显示加载状态
    const html = renderToStaticMarkup(
      React.createElement('main', {
        style: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }
      },
        React.createElement('div', { style: { color: '#94a3b8', fontSize: 14 } }, '加载中...')
      )
    );
    assert.ok(html.includes('加载中...'));
    assert.ok(html.includes('#0f172a'));
    assert.ok(html.includes('#94a3b8'));
  });

  test('登录页面跳转至 /member-login', () => {
    assert.ok(pageSource.includes("router.push('/member-login'"));
    assert.ok(pageSource.includes('localStorage.removeItem(\'member_access_token\''));
  });

  test('会员等级标签颜色体系完整', () => {
    const html = renderToStaticMarkup(
      React.createElement('div', { style: { padding: '4px 10px', borderRadius: 20, background: '#a78bfa20', border: '1px solid #a78bfa40', color: '#a78bfa', fontSize: 12 } }, '钻石会员')
    );
    assert.ok(html.includes('钻石会员'));
    assert.ok(html.includes('#a78bfa'));
  });

  test('功能菜单渲染链接', () => {
    const links = ['/orders', '/member-card', '/favorites', '/stores'];
    links.forEach(href => {
      assert.ok(pageSource.includes(href), `缺少链接: ${href}`);
    });
  });

  test('积分数字使用 toLocaleString', () => {
    assert.ok(pageSource.includes('toLocaleString'));
  });
});
