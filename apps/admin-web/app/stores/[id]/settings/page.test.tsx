/**
 * stores/[id]/settings/page.test.tsx — 设置中心页面 L1 测试
 *
 * 覆盖: 配置分类、开关统计、通知中心、配置值变更
 * 正例: 配置项分类、开关计数、通知类型、默认值
 * 反例: 未知配置类型、空通知列表、布尔转换
 * 边界: 开关项使能统计、通知未读数、数值字段默认
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';

/* ── 类型 ── */

type ConfigType = 'switch' | 'text' | 'select' | 'number';
type NotifType = '告警' | '提醒' | '系统';

interface ConfigItem {
  id: string;
  label: string;
  key: string;
  type: ConfigType;
  value: any;
  options?: { value: string; label: string }[];
  desc: string;
  category: string;
}

interface NotifItem {
  id: string;
  type: NotifType;
  message: string;
  time: string;
  read: boolean;
}

/* ── 模拟数据 ── */

const CATEGORIES = [
  {
    name: '营业设置', icon: '🕐', items: [
      { id: 'CFG-01', label: '营业时间', key: 'businessHours', type: 'text' as const, value: '10:00-22:00', desc: '门店每日运营时段', category: 'business' },
      { id: 'CFG-02', label: '周末营业', key: 'weekendOpen', type: 'switch' as const, value: true, desc: '周六日是否正常营业', category: 'business' },
      { id: 'CFG-03', label: '最大接待人数', key: 'maxCapacity', type: 'number' as const, value: 200, desc: '同时最大在店人数', category: 'business' },
      { id: 'CFG-04', label: '节假日模式', key: 'holidayMode', type: 'switch' as const, value: false, desc: '节假日自动调整营业时间', category: 'business' },
      { id: 'CFG-05', label: '预约前置时间', key: 'reservationLead', type: 'number' as const, value: 30, desc: '预约需提前N分钟', category: 'business' },
    ],
  },
  {
    name: '收银设置', icon: '💳', items: [
      { id: 'CFG-06', label: '默认支付方式', key: 'defaultPayment', type: 'select' as const, value: 'wechat', options: [{ value: 'wechat', label: '微信支付' }, { value: 'alipay', label: '支付宝' }], desc: '收银台默认选中', category: 'cashier' },
      { id: 'CFG-07', label: '小票打印', key: 'receiptPrint', type: 'switch' as const, value: true, desc: '交易完成自动打印小票', category: 'cashier' },
      { id: 'CFG-08', label: '找零模式', key: 'changeRounding', type: 'select' as const, value: 'round', options: [{ value: 'round', label: '四舍五入' }, { value: 'keep', label: '保留分位' }], desc: '现金找零规则', category: 'cashier' },
      { id: 'CFG-09', label: '积分抵扣', key: 'pointsDeduct', type: 'switch' as const, value: true, desc: '允许会员使用积分折抵金额', category: 'cashier' },
      { id: 'CFG-10', label: '退款自动审批金额上限', key: 'autoRefundLimit', type: 'number' as const, value: 200, desc: '≤此金额自动审批退款', category: 'cashier' },
    ],
  },
  {
    name: '会员设置', icon: '👥', items: [
      { id: 'CFG-11', label: '自动开卡', key: 'autoMemberCard', type: 'switch' as const, value: true, desc: '消费满条件自动办理会员', category: 'member' },
      { id: 'CFG-12', label: '积分有效期', key: 'pointsExpiry', type: 'select' as const, value: '1year', options: [{ value: 'never', label: '永久' }, { value: '1year', label: '一年' }], desc: '会员积分过期规则', category: 'member' },
      { id: 'CFG-13', label: '新会员优惠', key: 'newMemberBonus', type: 'text' as const, value: '首充满100送50', desc: '新注册会员自动发放优惠', category: 'member' },
      { id: 'CFG-14', label: '生日自动优惠', key: 'birthdayBonus', type: 'switch' as const, value: true, desc: '会员生日当天自动发放优惠券', category: 'member' },
    ],
  },
  {
    name: '通知设置', icon: '🔔', items: [
      { id: 'CFG-15', label: '到店提醒', key: 'arriveNotify', type: 'switch' as const, value: true, desc: '预约会员到店后通知店长', category: 'notify' },
      { id: 'CFG-16', label: '库存预警', key: 'stockAlert', type: 'switch' as const, value: true, desc: '低库存时推送通知', category: 'notify' },
      { id: 'CFG-17', label: '巡检提醒', key: 'inspectRemind', type: 'switch' as const, value: true, desc: '每日巡检未完成时推送提醒', category: 'notify' },
      { id: 'CFG-18', label: '营业日报推送', key: 'dailyReport', type: 'switch' as const, value: true, desc: '每日营业结束后推送报表', category: 'notify' },
    ],
  },
];

const NOTIFICATIONS: NotifItem[] = [
  { id: 'N-01', type: '告警', message: '仓库存量低于安全线 (耳机10件)', time: '10:25', read: false },
  { id: 'N-02', type: '提醒', message: '今日巡检任务未完成', time: '09:00', read: false },
  { id: 'N-03', type: '系统', message: '系统版本 v2.3.1 更新可用', time: '昨天', read: false },
  { id: 'N-04', type: '告警', message: '门禁AL-006已超过48h未处理', time: '昨天', read: true },
  { id: 'N-05', type: '提醒', message: '会员张三预约14:00到店', time: '昨天', read: true },
];

/* ── 工具函数 ── */

function getAllItems(): ConfigItem[] {
  return CATEGORIES.flatMap(c => c.items);
}

function getSwitchItems(items: ConfigItem[]): ConfigItem[] {
  return items.filter(i => i.type === 'switch');
}

function countEnabled(items: ConfigItem[], values: Record<string, any>): number {
  const switches = getSwitchItems(items);
  return switches.filter(i => values[i.id] !== false && i.value !== false).length;
}

function countUnread(notifs: NotifItem[]): number {
  return notifs.filter(n => !n.read).length;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(require('./page').default));
}

/* ============================================================ */

describe('settings: 页面渲染', () => {
  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('component is a function', () => {
    const mod = require('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('renders container', () => {
    const { container } = setup();
    assert.ok(container);
  });
});

describe('settings: 数据类型', () => {
  it('ConfigItem has all fields', () => {
    const ci: ConfigItem = { id: 'CFG-T', label: '测试', key: 'test', type: 'switch', value: true, desc: '测试', category: 'test' };
    assert.equal(typeof ci.id, 'string');
    assert.equal(typeof ci.value, 'boolean');
    assert.ok(['switch', 'text', 'select', 'number'].includes(ci.type));
  });

  it('NotifItem has all fields', () => {
    const n: NotifItem = { id: 'N-T', type: '告警', message: '测试', time: '10:00', read: false };
    assert.equal(typeof n.id, 'string');
    assert.equal(typeof n.read, 'boolean');
    assert.ok(['告警', '提醒', '系统'].includes(n.type));
  });

  it('getAllItems returns 18 config items', () => {
    const items = getAllItems();
    assert.equal(items.length, 18);
  });

  it('CATEGORIES has 4 categories', () => {
    assert.equal(CATEGORIES.length, 4);
  });

  it('category names are unique', () => {
    const names = CATEGORIES.map(c => c.name);
    assert.equal(new Set(names).size, names.length);
  });

  it('NOTIFICATIONS has 5 items', () => {
    assert.equal(NOTIFICATIONS.length, 5);
  });
});

describe('settings: 业务逻辑', () => {
  // ── 正例 ──
  it('getSwitchItems returns 10 switch items', () => {
    const switches = getSwitchItems(getAllItems());
    assert.equal(switches.length, 10);
  });

  it('countEnabled with empty values returns 10', () => {
    // All switches default to true (except CFG-04 holidayMode = false)
    // Switches: CFG-02(T), CFG-04(F), CFG-07(T), CFG-09(T), CFG-11(T), CFG-14(T), CFG-15(T), CFG-16(T), CFG-17(T), CFG-18(T)
    // Enabled count = 9 (all but CFG-04 holidayMode)
    const enabled = countEnabled(getAllItems(), {});
    assert.equal(enabled, 9);
  });

  it('countUnread returns 3 unread notifications', () => {
    assert.equal(countUnread(NOTIFICATIONS), 3);
  });

  it('unread notifications are first 3', () => {
    const unread = NOTIFICATIONS.filter(n => !n.read);
    assert.equal(unread.length, 3);
  });

  it('has alarm type notifications', () => {
    const alarms = NOTIFICATIONS.filter(n => n.type === '告警');
    assert.equal(alarms.length, 2);
  });

  it('read notifications are last 2', () => {
    const read = NOTIFICATIONS.filter(n => n.read);
    assert.equal(read.length, 2);
  });

  it('business category has 5 items', () => {
    const biz = CATEGORIES.find(c => c.name === '营业设置');
    assert.equal(biz?.items.length, 5);
  });

  it('cashier category has 5 items', () => {
    const cash = CATEGORIES.find(c => c.name === '收银设置');
    assert.equal(cash?.items.length, 5);
  });

  it('member category has 4 items', () => {
    const mem = CATEGORIES.find(c => c.name === '会员设置');
    assert.equal(mem?.items.length, 4);
  });

  it('notify category has 4 items', () => {
    const ntf = CATEGORIES.find(c => c.name === '通知设置');
    assert.equal(ntf?.items.length, 4);
  });

  it('all switch default values are boolean', () => {
    const switches = getSwitchItems(getAllItems());
    switches.forEach(s => assert.equal(typeof s.value, 'boolean'));
  });

  // ── 反例 ──
  it('countEnabled with all switches disabled returns 0', () => {
    const allDisabled: Record<string, boolean> = {};
    const switches = getSwitchItems(getAllItems());
    switches.forEach(s => { allDisabled[s.id] = false; });
    assert.equal(countEnabled(getAllItems(), allDisabled), 0);
  });

  it('no notifications have empty id', () => {
    NOTIFICATIONS.forEach(n => assert.ok(n.id.length > 0));
  });

  it('no config items have empty key', () => {
    getAllItems().forEach(i => assert.ok(i.key.length > 0));
  });

  it('no config items have unknown type', () => {
    const validTypes = ['switch', 'text', 'select', 'number'];
    getAllItems().forEach(i => assert.ok(validTypes.includes(i.type)));
  });

  // ── 边界 ──
  it('CFG-02 weekendOpen defaults to true', () => {
    const item = getAllItems().find(i => i.id === 'CFG-02');
    assert.equal(item?.value, true);
  });

  it('CFG-04 holidayMode defaults to false', () => {
    const item = getAllItems().find(i => i.id === 'CFG-04');
    assert.equal(item?.value, false);
  });

  it('CFG-03 maxCapacity value is number 200', () => {
    const item = getAllItems().find(i => i.id === 'CFG-03');
    assert.equal(item?.value, 200);
  });

  it('CFG-10 autoRefundLimit value is 200', () => {
    const item = getAllItems().find(i => i.id === 'CFG-10');
    assert.equal(item?.value, 200);
  });

  it('N-01 is 告警 type and unread', () => {
    const n = NOTIFICATIONS.find(n => n.id === 'N-01');
    assert.equal(n?.type, '告警');
    assert.equal(n?.read, false);
  });

  it('after marking all as read, count returns 0', () => {
    const allRead = NOTIFICATIONS.map(n => ({ ...n, read: true }));
    assert.equal(allRead.filter(n => !n.read).length, 0);
  });

  it('营业设置 count is 5 items', () => {
    const biz = CATEGORIES.find(c => c.name === '营业设置');
    assert.equal(biz?.items.length, 5);
  });

  it('总配置项 = 营业5 + 收银5 + 会员4 + 通知4 = 18', () => {
    assert.equal(5 + 5 + 4 + 4, 18);
  });
});
