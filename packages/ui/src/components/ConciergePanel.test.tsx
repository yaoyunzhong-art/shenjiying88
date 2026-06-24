import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ConciergePanel } = require('./ConciergePanel');

// ---- 测试数据 ----

const overview = {
  totalServices: 1280,
  newVipCount: 5,
  pendingInquiries: 3,
  satisfactionScore: 96.5,
  satisfactionTrend: 2.1,
};

const txGold = { id: 'tx-1', memberName: '张伟', memberId: 'M001', memberLevel: 'gold' as const, type: 'earn' as const, points: 5000, reason: '消费奖励', operatedBy: '管家小李', operatedAt: '2026-06-23T15:30:00Z' };
const txPlatinum = { id: 'tx-2', memberName: '李娜', memberId: 'M002', memberLevel: 'platinum' as const, type: 'redeem' as const, points: 3000, reason: '兑换礼品', operatedBy: '管家小王', operatedAt: '2026-06-23T14:20:00Z' };
const txSilver = { id: 'tx-3', memberName: '王强', memberId: 'M003', memberLevel: 'silver' as const, type: 'adjust' as const, points: 200, reason: '手动调整', operatedBy: '管理员', operatedAt: '2026-06-23T13:10:00Z' };
const txDiamond = { id: 'tx-4', memberName: '刘芳', memberId: 'M004', memberLevel: 'diamond' as const, type: 'expire' as const, points: 1500, reason: '积分过期', operatedBy: '系统', operatedAt: '2026-06-23T12:00:00Z' };
const txBronze = { id: 'tx-5', memberName: '赵明', memberId: 'M005', memberLevel: 'bronze' as const, type: 'earn' as const, points: 800, reason: '注册奖励', operatedBy: '系统', operatedAt: '2026-06-23T11:30:00Z' };
const allTxs = [txGold, txPlatinum, txSilver, txDiamond, txBronze];

const visit1 = { id: 'v-1', memberName: '张伟', memberId: 'M001', memberLevel: 'gold' as const, visitTime: '2026-06-23T10:00:00Z', purpose: '产品咨询', durationMin: 45, staffName: '管家小李', notes: '对高端系列感兴趣' };
const visit2 = { id: 'v-2', memberName: '李娜', memberId: 'M002', memberLevel: 'platinum' as const, visitTime: '2026-06-23T11:30:00Z', purpose: '积分兑换', durationMin: 20, staffName: '管家小王' };

const rec1 = { id: 'rec-1', memberId: 'M001', memberName: '张伟', productName: '臻享系列护肤套装', productCategory: '护肤', reason: '基于近期浏览行为和消费记录', confidence: 'high' as const, price: 2680 };
const rec2 = { id: 'rec-2', memberId: 'M002', memberName: '李娜', productName: '经典系列精华液', productCategory: '护肤', reason: '基于消费习惯分析', confidence: 'medium' as const, price: 1280 };

const actions = [
  { key: 'checkin', label: '会员签到', primary: true },
  { key: 'profile', label: '会员档案' },
  { key: 'gift', label: '赠礼兑换' },
  { key: 'appointment', label: '预约服务' },
];

function render(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(ConciergePanel, props));
}

// ---- 测试 ----

describe('ConciergePanel', () => {
  // ===== 基础渲染 =====
  test('渲染加载状态', () => {
    const html = render({ loading: true });
    assert.ok(html.includes('加载中...'));
  });

  test('渲染空面板', () => {
    const html = render();
    assert.ok(html.includes('管家工作台'));
  });

  test('渲染自定义管家名称', () => {
    const html = render({ conciergeName: '金牌管家' });
    assert.ok(html.includes('金牌管家工作台'));
  });

  test('显示同步时间', () => {
    const html = render({ lastSyncAt: '2026-06-23T16:00:00Z' });
    assert.ok(html.includes('同步于'));
  });

  test('displayName 正确', () => {
    assert.equal(ConciergePanel.displayName, 'ConciergePanel');
  });

  // ===== 概览统计 =====
  test('渲染服务概览统计 - 服务人次', () => {
    const html = render({ overview });
    assert.ok(html.includes('1,280'));
  });

  test('渲染服务概览统计 - 满意度', () => {
    const html = render({ overview });
    assert.ok(html.includes('96.5%'));
  });

  test('渲染服务概览统计 - 新增VIP', () => {
    const html = render({ overview });
    assert.ok(html.includes('+5'));
  });

  test('无 overview 时不渲染概览', () => {
    const html = render();
    assert.ok(!html.includes('服务人次'));
  });

  test('满意度趋势正数', () => {
    const html = render({ overview: { ...overview, satisfactionTrend: 2.1 } });
    assert.ok(html.includes('+2.1%'));
  });

  test('满意度趋势负数', () => {
    const html = render({ overview: { ...overview, satisfactionTrend: -3.5 } });
    assert.ok(html.includes('-3.5%'));
  });

  // ===== 快速操作 =====
  test('渲染操作按钮', () => {
    const html = render({ actions });
    assert.ok(html.includes('会员签到'));
    assert.ok(html.includes('会员档案'));
    assert.ok(html.includes('赠礼兑换'));
    assert.ok(html.includes('预约服务'));
  });

  test('无操作时不渲染操作栏', () => {
    const html = render();
    assert.ok(!html.includes('会员签到'));
  });

  // ===== 个性化推荐 =====
  test('渲染推荐列表', () => {
    const html = render({ recommendations: [rec1, rec2] });
    assert.ok(html.includes('臻享系列护肤套装'));
    assert.ok(html.includes('经典系列精华液'));
  });

  test('显示高置信标签', () => {
    const html = render({ recommendations: [{ ...rec1, confidence: 'high' as const }] });
    assert.ok(html.includes('高置信'));
  });

  test('显示中置信标签', () => {
    const html = render({ recommendations: [{ ...rec1, confidence: 'medium' as const }] });
    assert.ok(html.includes('中置信'));
  });

  test('显示低置信标签', () => {
    const html = render({ recommendations: [{ ...rec1, confidence: 'low' as const }] });
    assert.ok(html.includes('低置信'));
  });

  test('显示产品价格', () => {
    const html = render({ recommendations: [{ ...rec1, price: 2680 }] });
    assert.ok(html.includes('2,680'));
  });

  test('无推荐时不渲染推荐区块', () => {
    const html = render();
    assert.ok(!html.includes('臻享系列'));
  });

  test('推荐包含推荐理由', () => {
    const html = render({ recommendations: [rec1] });
    assert.ok(html.includes('基于近期浏览行为和消费记录'));
  });

  test('紧凑模式下渲染推荐', () => {
    const html = render({ recommendations: [rec1], compact: true });
    assert.ok(html.includes('臻享系列护肤套装'));
  });

  // ===== 会员搜索 =====
  test('渲染搜索输入框', () => {
    const html = render();
    assert.ok(html.includes('输入会员姓名'));
  });

  // ===== 来访记录 =====
  test('渲染来访记录 - 会员姓名', () => {
    const html = render({ visitRecords: [visit1] });
    assert.ok(html.includes('张伟'));
  });

  test('渲染来访记录 - 到访目的', () => {
    const html = render({ visitRecords: [visit1] });
    assert.ok(html.includes('产品咨询'));
  });

  test('渲染来访记录 - 时长', () => {
    const html = render({ visitRecords: [visit1] });
    assert.ok(html.includes('45分钟'));
  });

  test('渲染来访记录 - 接待人', () => {
    const html = render({ visitRecords: [visit1] });
    assert.ok(html.includes('管家小李'));
  });

  test('渲染来访记录 - 备注', () => {
    const html = render({ visitRecords: [{ ...visit1, notes: 'VIP客户' }] });
    assert.ok(html.includes('VIP客户'));
  });

  test('渲染来访记录 - 无备注显示-', () => {
    const html = render({ visitRecords: [{ ...visit1, notes: undefined }] });
    assert.ok(html.includes('—'));
  });

  test('多条来访记录', () => {
    const html = render({ visitRecords: [visit1, visit2] });
    assert.ok(html.includes('张伟'));
    assert.ok(html.includes('李娜'));
    assert.ok(html.includes('积分兑换'));
  });

  test('空来访记录显示空状态', () => {
    const html = render({ visitRecords: [] });
    assert.ok(html.includes('暂无来访记录'));
  });

  // ===== 积分流水 =====
  test('渲染积分流水 - earn 类型', () => {
    const html = render({ pointsTransactions: [txGold] });
    assert.ok(html.includes('消费奖励'));
  });

  test('渲染积分流水 - 会员名称', () => {
    const html = render({ pointsTransactions: [txGold] });
    assert.ok(html.includes('张伟'));
  });

  test('渲染积分流水 - 会员等级', () => {
    const html = render({ pointsTransactions: [txGold] });
    assert.ok(html.includes('黄金'));
  });

  test('渲染积分流水 - 操作人', () => {
    const html = render({ pointsTransactions: [txGold] });
    assert.ok(html.includes('管家小李'));
  });

  test('渲染积分流水 - redeem 类型', () => {
    const html = render({ pointsTransactions: [txPlatinum] });
    assert.ok(html.includes('兑换礼品'));
  });

  test('渲染积分流水 - adjust 类型', () => {
    const html = render({ pointsTransactions: [txSilver] });
    assert.ok(html.includes('手动调整'));
  });

  test('渲染积分流水 - expire 类型', () => {
    const html = render({ pointsTransactions: [txDiamond] });
    assert.ok(html.includes('积分过期'));
  });

  test('5种会员等级全部渲染', () => {
    const html = render({ pointsTransactions: allTxs });
    assert.ok(html.includes('青铜'));
    assert.ok(html.includes('白银'));
    assert.ok(html.includes('黄金'));
    assert.ok(html.includes('铂金'));
    assert.ok(html.includes('钻石'));
  });

  test('大额积分格式化', () => {
    const html = render({ pointsTransactions: [{ ...txGold, points: 25000 }] });
    assert.ok(html.includes('2.5万'));
  });

  test('积分 earn 带 + 号', () => {
    const html = render({ pointsTransactions: [txGold] });
    assert.ok(html.includes('+5,000'));
  });

  test('空积分流水显示空状态', () => {
    const html = render({ pointsTransactions: [] });
    assert.ok(html.includes('暂无积分变动记录'));
  });

  // ===== 状态标签 =====
  test('earn 类型标签显示获取', () => {
    const html = render({ pointsTransactions: [txGold] });
    assert.ok(html.includes('获取'));
  });

  test('redeem 类型标签显示兑换', () => {
    const html = render({ pointsTransactions: [txPlatinum] });
    assert.ok(html.includes('兑换'));
  });

  test('adjust 类型标签显示调整', () => {
    const html = render({ pointsTransactions: [txSilver] });
    assert.ok(html.includes('调整'));
  });

  test('expire 类型标签显示过期', () => {
    const html = render({ pointsTransactions: [txDiamond] });
    assert.ok(html.includes('过期'));
  });

  // ===== 组合场景 =====
  test('完整面板渲染所有区块', () => {
    const html = render({
      overview,
      actions,
      recommendations: [rec1, rec2],
      visitRecords: [visit1, visit2],
      pointsTransactions: allTxs,
      conciergeName: 'VIP管家',
      lastSyncAt: '2026-06-23T16:00:00Z',
    });
    assert.ok(html.includes('VIP管家工作台'));
    assert.ok(html.includes('会员签到'));
    assert.ok(html.includes('臻享系列护肤套装'));
    assert.ok(html.includes('张伟'));
    assert.ok(html.includes('消费奖励'));
    assert.ok(html.includes('同步于'));
  });

  test('紧凑模式完整渲染', () => {
    const html = render({ overview, recommendations: [rec1], visitRecords: [visit1], compact: true });
    assert.ok(html.includes('管家工作台'));
  });

  test('最小面板无数据', () => {
    const html = render();
    assert.ok(html.includes('管家工作台'));
    assert.ok(html.includes('暂无来访记录'));
    assert.ok(html.includes('暂无积分变动记录'));
  });

  test('loading 时不渲染数据区', () => {
    const html = render({ loading: true });
    assert.ok(html.includes('加载中...'));
    assert.ok(!html.includes('暂无来访记录'));
  });
});
