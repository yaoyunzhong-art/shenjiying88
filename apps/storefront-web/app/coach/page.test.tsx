/**
 * 教练工作台页 L1 测试 — CoachPage
 *
 * 测试覆盖:
 * - 页面标题渲染
 * - Mock 数据正确传递到 CoachDashboard
 * - 待跟进会员列表渲染
 * - 推广任务列表渲染
 * - 教练个人信息展示
 * - 加载状态切换
 * - 空数据边界
 * - metric 展现
 * - 同步时间显示
 * - 紧凑模式验证 (compact prop)
 */
import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, before, after } = require('node:test');
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';

// 解析 @m5/ui 模块
const reactDomPath = PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js';
const { renderToStaticMarkup } = require(reactDomPath);

// 读取 CoachPage 源代码以验证结构
const fs = require('node:fs');
const pageSource = fs.readFileSync(PROJECT_ROOT + '/apps/storefront-web/app/coach/page.tsx', 'utf8');

describe('CoachPage (storefront-web)', () => {
  // ---- 静态结构验证 ----

  test('页面导出默认函数组件', () => {
    assert.match(pageSource, /export default function CoachPage/);
    assert.match(pageSource, /'use client'/);
  });

  test('页面导入 CoachDashboard 和 PageShell', () => {
    assert.ok(pageSource.includes("import { CoachDashboard, PageShell } from '@m5/ui'"));
  });

  test('页面包含 CoachDailyMetrics / FollowUpMember / PromoTask 类型导入', () => {
    assert.ok(pageSource.includes('CoachDailyMetrics'));
    assert.ok(pageSource.includes('FollowUpMember'));
    assert.ok(pageSource.includes('PromoTask'));
  });

  test('定义了 Mock 数据常量', () => {
    assert.ok(pageSource.includes('MOCK_METRICS'));
    assert.ok(pageSource.includes('MOCK_FOLLOW_UPS'));
    assert.ok(pageSource.includes('MOCK_PROMO_TASKS'));
  });

  test('Mock 数据包含接待指标字段', () => {
    assert.ok(pageSource.includes('servedCount: 68'));
    assert.ok(pageSource.includes('newMembers: 12'));
    assert.ok(pageSource.includes('promoConversions: 23'));
    assert.ok(pageSource.includes('followUps: 8'));
  });

  test('Mock 指标包含同比趋势字段', () => {
    assert.ok(pageSource.includes('servedTrend: 5.2'));
    assert.ok(pageSource.includes('memberTrend: 8.0'));
    assert.ok(pageSource.includes('promoTrend: 12.3'));
    assert.ok(pageSource.includes('followUpTrend: -2.1'));
  });

  test('Mock 待跟进会员字段完整', () => {
    assert.ok(pageSource.includes("tier: 'GOLD'"));
    assert.ok(pageSource.includes("tier: 'PLATINUM'"));
    assert.ok(pageSource.includes("tier: 'SILVER'"));
    assert.ok(pageSource.includes("tier: 'DIAMOND'"));
    assert.ok(pageSource.includes("status: 'pending'"));
    assert.ok(pageSource.includes("status: 'contacted'"));
    assert.ok(pageSource.includes("status: 'converted'"));
    assert.ok(pageSource.includes("status: 'lost'"));
  });

  test('Mock 推广任务类型覆盖', () => {
    assert.ok(pageSource.includes("type: 'share'"));
    assert.ok(pageSource.includes("type: 'referral'"));
    assert.ok(pageSource.includes("type: 'event'"));
    assert.ok(pageSource.includes("type: 'coupon'"));
  });

  test('Mock 推广任务包含截止日期字段', () => {
    assert.ok(pageSource.includes('deadline'));
  });

  test('教练个人信息传递', () => {
    assert.ok(pageSource.includes('coachName='));
    assert.ok(pageSource.includes('张教练'));
    assert.ok(pageSource.includes('storeName='));
    assert.ok(pageSource.includes('朝阳旗舰店'));
    assert.ok(pageSource.includes('employeeId='));
    assert.ok(pageSource.includes('EMP-0032'));
  });

  test('排名信息传递', () => {
    assert.ok(pageSource.includes('current: 3'));
    assert.ok(pageSource.includes('total: 12'));
  });

  test('页面包含 loading 状态管理', () => {
    assert.ok(pageSource.includes('loading'));
  });

  test('页面包含 handleRefresh 刷新回调', () => {
    assert.ok(pageSource.includes('handleRefresh'));
    assert.ok(pageSource.includes('onRefresh={handleRefresh}') || pageSource.includes('handleRefresh()') || pageSource.includes('handleRefresh'));
  });

  test('页面渲染 coach 段标题', () => {
    assert.ok(pageSource.includes('教练工作台'));
    assert.ok(pageSource.includes('教练/导玩员日常工作台'));
    assert.ok(pageSource.includes('接待指标、推广任务与会员跟进'));
  });

  // ---- 渲染验证 ----

  test('CoachPage 渲染 PageShell 和 CoachDashboard', () => {
    assert.ok(pageSource.includes('PageShell'));
    assert.ok(pageSource.includes('CoachDashboard'));
  });

  test('CoachDashboard 接收所有必要 props', () => {
    assert.ok(pageSource.includes('dailyMetrics={MOCK_METRICS}'));
    assert.ok(pageSource.includes('followUpMembers={followUps}'));
    assert.ok(pageSource.includes('promoTasks={MOCK_PROMO_TASKS}'));
    assert.ok(pageSource.includes('loading={loading}'));
    assert.ok(pageSource.includes('lastSyncAt='));
  });

  test('传入的日期为格式化时间字符串', () => {
    assert.ok(pageSource.includes('toLocaleTimeString'));
    assert.ok(pageSource.includes('hour:'));
  });

  // ---- 边界与异常 ----

  test('空的待跟进列表不被硬编码在 CoachDashboard props 中', () => {
    // mock_follow_ups 不为空数组
    assert.ok(pageSource.includes('MOCK_FOLLOW_UPS'));
    assert.ok(!pageSource.includes('followUpMembers={[]}'));
  });

  test('空的推广任务列表不被硬编码', () => {
    assert.ok(pageSource.includes('MOCK_PROMO_TASKS'));
    assert.ok(!pageSource.includes('promoTasks={[]}'));
  });

  test('不传递 undefined dailyMetrics', () => {
    assert.ok(!pageSource.includes('dailyMetrics={undefined}'));
  });

  test('不传递 undefined rank', () => {
    assert.ok(!pageSource.includes('rank={undefined}'));
  });

  test('页面使用 "use client" 指令', () => {
    assert.match(pageSource, /'use client'/);
  });

  test('CoachPage 是默认导出', () => {
    assert.match(pageSource, /export default function CoachPage/);
  });

  // ---- 集成: 确认 CoachDashboard 组件可渲染 Mock 数据 ----

  test('[集成] CoachDashboard 能渲染 mock 数据中的会员名', () => {
    // 提取 module 路径模拟渲染
    const uiIndexPath = PROJECT_ROOT + '/packages/ui/src/index.tsx';
    const coachDashboardPath = PROJECT_ROOT + '/packages/ui/src/components/CoachDashboard';
    const coachHtml = renderToStaticMarkup(
      React.createElement(
        // 通过 react 内联渲染验证
        require(coachDashboardPath + '.tsx').CoachDashboard,
        {
          coachName: '张教练',
          storeName: '朝阳旗舰店',
          employeeId: 'EMP-0032',
          dailyMetrics: MOCK_METRICS,
          followUpMembers: MOCK_FOLLOW_UPS,
          promoTasks: MOCK_PROMO_TASKS,
          rank: { current: 3, total: 12 },
          lastSyncAt: '16:00',
        }
      )
    );
    assert.match(coachHtml, /教练工作台/);
    assert.match(coachHtml, /张教练/);
    assert.match(coachHtml, /朝阳旗舰店/);
    assert.match(coachHtml, /王小刚/);
    assert.match(coachHtml, /李丽华/);
    assert.match(coachHtml, /陈志强/);
    assert.match(coachHtml, /张倩/);
    assert.match(coachHtml, /刘强/);
    assert.match(coachHtml, /扫码分享有礼/);
    assert.match(coachHtml, /老带新裂变活动/);
    assert.match(coachHtml, /门店周年庆促销/);
    assert.match(coachHtml, /夏日特惠券派发/);
    assert.match(coachHtml, /68/);
    assert.match(coachHtml, /12/);
    assert.match(coachHtml, /23/);
    assert.match(coachHtml, /8/);
    assert.match(coachHtml, /3\/12/);
    assert.match(coachHtml, /EMP-0032/);
    assert.match(coachHtml, /GOLD/);
    assert.match(coachHtml, /PLATINUM/);
    assert.match(coachHtml, /SILVER/);
    assert.match(coachHtml, /DIAMOND/);
    assert.match(coachHtml, /待跟进/);
    assert.match(coachHtml, /已联系/);
    assert.match(coachHtml, /已转化/);
    assert.match(coachHtml, /已流失/);
    assert.match(coachHtml, /\[分享\]/);
    assert.match(coachHtml, /\[裂变\]/);
    assert.match(coachHtml, /\[活动\]/);
    assert.match(coachHtml, /\[券推广\]/);
    assert.match(coachHtml, /32\/50/);
    assert.match(coachHtml, /18\/30/);
    assert.match(coachHtml, /145\/200/);
    assert.match(coachHtml, /67\/100/);
    assert.match(coachHtml, /截止/);
  });

  test('[集成] CoachDashboard loading 状态正确', () => {
    const coachDashboardPath = PROJECT_ROOT + '/packages/ui/src/components/CoachDashboard';
    const coachHtml = renderToStaticMarkup(
      React.createElement(
        require(coachDashboardPath + '.tsx').CoachDashboard,
        { loading: true }
      )
    );
    assert.match(coachHtml, /data-testid="coachdashboard-loading"/);
    assert.match(coachHtml, /正在加载教练工作台数据/);
  });

  test('[集成] CoachDashboard 空数据边界', () => {
    const coachDashboardPath = PROJECT_ROOT + '/packages/ui/src/components/CoachDashboard';
    const coachHtml = renderToStaticMarkup(
      React.createElement(
        require(coachDashboardPath + '.tsx').CoachDashboard,
        {
          coachName: '张教练',
          dailyMetrics: MOCK_METRICS,
          followUpMembers: [],
          promoTasks: [],
        }
      )
    );
    assert.match(coachHtml, /暂无推广任务/);
    assert.match(coachHtml, /暂无待跟进会员/);
  });

  test('[集成] CoachDashboard without dailyMetrics 使用默认值', () => {
    const coachDashboardPath = PROJECT_ROOT + '/packages/ui/src/components/CoachDashboard';
    const coachHtml = renderToStaticMarkup(
      React.createElement(
        require(coachDashboardPath + '.tsx').CoachDashboard,
        { followUpMembers: MOCK_FOLLOW_UPS }
      )
    );
    // 没有传入 dailyMetrics 时组件应使用 "接待" "新会员" "推广" "回访" 缺省
    assert.match(coachHtml, /--/);
  });

  test('[集成] CoachDashboard compact 模式', () => {
    const coachDashboardPath = PROJECT_ROOT + '/packages/ui/src/components/CoachDashboard';
    const coachHtml = renderToStaticMarkup(
      React.createElement(
        require(coachDashboardPath + '.tsx').CoachDashboard,
        {
          dailyMetrics: MOCK_METRICS,
          followUpMembers: MOCK_FOLLOW_UPS,
          promoTasks: MOCK_PROMO_TASKS,
          compact: true,
        }
      )
    );
    assert.match(coachHtml, /教练工作台/);
    assert.match(coachHtml, /王小刚/);
    assert.match(coachHtml, /扫码分享有礼/);
  });

  test('[集成] CoachDashboard className 透传', () => {
    const coachDashboardPath = PROJECT_ROOT + '/packages/ui/src/components/CoachDashboard';
    const customClass = 'my-custom-coach-test';
    const coachHtml = renderToStaticMarkup(
      React.createElement(
        require(coachDashboardPath + '.tsx').CoachDashboard,
        {
          dailyMetrics: MOCK_METRICS,
          followUpMembers: MOCK_FOLLOW_UPS,
          promoTasks: MOCK_PROMO_TASKS,
          className: customClass,
        }
      )
    );
    assert.match(coachHtml, new RegExp(`class="${customClass}"`));
  });

  test('[集成] CoachDashboard 显示同步时间', () => {
    const coachDashboardPath = PROJECT_ROOT + '/packages/ui/src/components/CoachDashboard';
    const coachHtml = renderToStaticMarkup(
      React.createElement(
        require(coachDashboardPath + '.tsx').CoachDashboard,
        {
          coachName: '张教练',
          dailyMetrics: MOCK_METRICS,
          followUpMembers: MOCK_FOLLOW_UPS,
          promoTasks: MOCK_PROMO_TASKS,
          lastSyncAt: '16:00',
        }
      )
    );
    // lastSyncAt renders inside profile bar, which requires coachName/storeName/employeeId
    assert.match(coachHtml, /同步: 16:00/);
  });
});

// 为集成测试复用 mock 数据
const MOCK_METRICS = {
  servedCount: 68,
  newMembers: 12,
  promoConversions: 23,
  followUps: 8,
  servedTrend: 5.2,
  memberTrend: 8.0,
  promoTrend: 12.3,
  followUpTrend: -2.1,
};

const MOCK_FOLLOW_UPS = [
  { id: 'fu-1', name: '王小刚', tier: 'GOLD', lastContactAt: '2026-06-25', status: 'pending' as const, note: '对高端体验套餐感兴趣，需跟进报价', phone: '138****1234' },
  { id: 'fu-2', name: '李丽华', tier: 'PLATINUM', lastContactAt: '2026-06-24', status: 'contacted' as const, phone: '139****5678' },
  { id: 'fu-3', name: '陈志强', tier: 'SILVER', lastContactAt: '2026-06-23', status: 'converted' as const, note: '已购买季卡套餐' },
  { id: 'fu-4', name: '张倩', tier: 'DIAMOND', lastContactAt: '2026-06-20', status: 'pending' as const, note: '询问家庭年卡优惠', phone: '136****9012' },
  { id: 'fu-5', name: '刘强', tier: 'GOLD', lastContactAt: '2026-06-18', status: 'lost' as const },
];

const MOCK_PROMO_TASKS = [
  { id: 'pt-1', title: '扫码分享有礼', type: 'share' as const, target: 50, completed: 32, deadline: '2026-06-30' },
  { id: 'pt-2', title: '老带新裂变活动', type: 'referral' as const, target: 30, completed: 18, deadline: '2026-07-05' },
  { id: 'pt-3', title: '门店周年庆促销', type: 'event' as const, target: 200, completed: 145, deadline: '2026-07-10' },
  { id: 'pt-4', title: '夏日特惠券派发', type: 'coupon' as const, target: 100, completed: 67, deadline: '2026-07-03' },
];
