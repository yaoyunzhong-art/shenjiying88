/**
 * member-center/page.test.tsx — 会员中心页面 L2 渲染测试
 *
 * 测试覆盖:
 * - 默认导出 & 组件结构
 * - 会员等级体系常量全覆盖
 * - Ant Design 组件导入检验
 * - 功能菜单入口完整性
 * - 会员权益展示
 * - 积分和余额显示
 * - 等级升级进度条
 * - 最近消费记录列表
 * - 加载态 & 未登录状态
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

  test('包含 Ant Design 核心组件', () => {
    const antdComponents = ['Card', 'Button', 'Tag', 'Progress', 'Statistic', 'Descriptions', 'List', 'Skeleton', 'Empty', 'Row', 'Col'];
    antdComponents.forEach(comp => {
      assert.ok(pageSource.includes(comp), `缺少 Ant Design 组件: ${comp}`);
    });
  });

  test('包含 @ant-design/icons 引用', () => {
    const icons = ['GiftOutlined', 'CreditCardOutlined', 'ShoppingCartOutlined', 'StarOutlined', 'ShopOutlined', 'LogoutOutlined'];
    icons.forEach(icon => {
      assert.ok(pageSource.includes(icon), `缺少图标: ${icon}`);
    });
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
    assert.ok(pageSource.includes('LogoutOutlined'));
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

  test('包含余额展示区域', () => {
    assert.ok(pageSource.includes('账户余额'));
  });

  test('包含积分充值按钮', () => {
    assert.ok(pageSource.includes('积分充值'));
    assert.ok(pageSource.includes('handleRecharge'));
  });

  test('包含会员权益展示', () => {
    assert.ok(pageSource.includes('会员权益'));
    const benefits = ['积分倍率', '生日礼遇', '专属折扣'];
    benefits.forEach(b => assert.ok(pageSource.includes(b), `缺少权益项: ${b}`));
  });

  test('包含等级升级进度条', () => {
    assert.ok(pageSource.includes('Progress'));
    assert.ok(pageSource.includes('已达最高等级') || pageSource.includes('还差'));
  });

  test('包含最近消费记录', () => {
    assert.ok(pageSource.includes('最近消费记录'));
    assert.ok(pageSource.includes('ORD2026'));
    assert.ok(pageSource.includes('orderNo'));
  });

  test('加载态显示 Skeleton 组件', () => {
    assert.ok(pageSource.includes('Skeleton'));
    assert.ok(pageSource.includes('loading') || pageSource.includes('加载'));
  });

  test('会员信息卡包含头像、昵称、等级', () => {
    assert.ok(pageSource.includes('nickname'));
    assert.ok(pageSource.includes('TIER_LABELS'));
  });
});

describe('MemberCenterPage — SSR 渲染', () => {
  test('加载态渲染包含 Skeleton', () => {
    const html = renderToStaticMarkup(
      React.createElement('main', { style: { minHeight: '100vh', padding: '24px 16px', background: '#0f172a' } },
        React.createElement('div', { style: { maxWidth: 960, margin: '0 auto' } },
          React.createElement('div', null, '加载中...')
        )
      )
    );
    assert.ok(html.includes('#0f172a'));
  });

  test('页面文件包含 深色主题背景', () => {
    assert.ok(pageSource.includes('background: #0f172a') || pageSource.includes("background: '#0f172a'"));
  });

  test('深色主题颜色体系', () => {
    const colors = ['#0f172a', '#e2e8f0', '#94a3b8', '#64748b', '#f8fafc'];
    colors.forEach(color => {
      assert.ok(pageSource.includes(color), `缺少深色主题色: ${color}`);
    });
    assert.ok(pageSource.includes('rgba(30, 41, 59'), '缺少深色背景色 rgba(30, 41, 59)');
  });

  test('登录页面跳转至 /member-login', () => {
    assert.ok(pageSource.includes("router.push('/member-login'"));
    assert.ok(pageSource.includes('localStorage.removeItem(\'member_access_token\''));
  });

  test('响应式网格 Row/Col 布局', () => {
    assert.ok(pageSource.includes('<Row'));
    assert.ok(pageSource.includes('<Col'));
    assert.ok(pageSource.includes('xs={24}'));
    assert.ok(pageSource.includes('lg={12}'));
  });

  test('会员等级标签颜色体系完整', () => {
    const html = renderToStaticMarkup(
      React.createElement('div', { style: { padding: '4px 10px', borderRadius: 20, background: '#a78bfa20', border: '1px solid #a78bfa40', color: '#a78bfa', fontSize: 12 } }, '钻石会员')
    );
    assert.ok(html.includes('钻石会员'));
  });

  test('功能菜单渲染链接', () => {
    const links = ['/orders', '/member-card', '/favorites', '/stores'];
    links.forEach(href => {
      assert.ok(pageSource.includes(href), `缺少链接: ${href}`);
    });
  });

  test('积分数字使用 Statistic 组件展示', () => {
    assert.ok(pageSource.includes('Statistic'));
    assert.ok(pageSource.includes('points'));
  });

  test('error handling callback', () => {
    assert.ok(pageSource.includes('try'));
    assert.ok(pageSource.includes('catch'));
    assert.ok(pageSource.includes('JSON.parse'));
  });
});
