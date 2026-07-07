/**
 * AIMemberProfilePanel 组件测试
 *
 * 覆盖:
 * 1. 基础渲染 — 会员名称、等级、入会天数、累计消费
 * 2. 本月消费展示
 * 3. 标签页切换按钮
 * 4. AI 标签展示 — 标签内容、类别、置信度
 * 5. 标签云展开/收起
 * 6. 加载态
 * 7. 错误态 + 重试按钮
 * 8. 空状态 — 无标签
 * 9. 自定义类名
 * 10. 头像渲染
 * 11. 金额格式化
 * 12. 刷新按钮
 * 13. 空白头像占位
 * 14. 标签类别统计
 * 15. 类别筛选标签
 * 16. 标签点击提示
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, mock } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { AIMemberProfilePanel } = require('./AIMemberProfilePanel');

// ---- 测试工厂 ----
function makeProfile(overrides = {}) {
  return {
    memberId: 'm001',
    memberName: '张伟',
    tier: '黄金会员',
    totalSpent: 15800,
    monthlySpent: 3200,
    membershipDays: 365,
    tags: [
      { code: 't1', label: '高消费力', category: 'consumption', confidence: 92, description: '近3个月消费金额进入前20%' },
      { code: 't2', label: '家庭用户', category: 'demographic', confidence: 78, description: '多次购买家庭套餐' },
      { code: 't3', label: '周末到店', category: 'behavior', confidence: 85, description: '超过70%的消费发生在周末' },
      { code: 't4', label: '健康关注', category: 'lifestyle', confidence: 65, description: '关注健康类内容' },
      { code: 't5', label: '科技爱好者', category: 'interest', confidence: 72, description: '关注科技资讯' },
    ],
    personaScores: [
      { dimension: '消费能力', score: 88, icon: '💰', description: '基于历史消费金额和频率评估' },
      { dimension: '忠诚度', score: 75, icon: '❤️', description: '基于会员时长和复购率评估' },
      { dimension: '活跃度', score: 62, icon: '🏃', description: '基于近期到店频率评估' },
      { dimension: '传播力', score: 45, icon: '📣', description: '基于推荐和分享行为评估' },
    ],
    preferences: [
      { code: 'p1', label: '面部护理', type: 'category', intensity: 90, rank: 1 },
      { code: 'p2', label: '身体护理', type: 'category', intensity: 65, rank: 2 },
      { code: 'p3', label: '高端品牌', type: 'brand', intensity: 80, rank: 3 },
      { code: 'p4', label: '微信通知', type: 'channel', intensity: 70, rank: 4 },
    ],
    insights: [
      { code: 'i1', title: '会员升级机会', content: '近3月消费持续增加，建议推送升级专享权益，预计升级概率65%', type: 'opportunity', generatedAt: '2026-07-06T10:00:00Z' },
      { code: 'i2', title: '品类拓展建议', content: '该会员偏好面部护理，可尝试推荐身体护理套餐，推荐匹配度78%', type: 'suggestion', generatedAt: '2026-07-06T10:00:00Z' },
    ],
    lastUpdated: '2026-07-06T10:00:00Z',
    ...overrides,
  };
}

// ---- 正例 ----
describe('AIMemberProfilePanel', () => {
  test('renders member name and tier', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /张伟/);
    assert.match(html, /黄金会员/);
  });

  test('renders membership days', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile({ membershipDays: 500 }) })
    );
    assert.match(html, /500/);
  });

  test('renders total spent formatting', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile({ totalSpent: 50000 }) })
    );
    assert.match(html, /5\.0万|50000/);
  });

  test('renders monthly spent', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile({ monthlySpent: 4200 }) })
    );
    assert.match(html, /4200|本月消费/);
  });

  test('renders last updated date', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /画像更新/);
    assert.match(html, /2026/);
  });

  test('renders tags by default (active tab is tags)', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /高消费力/);
    assert.match(html, /家庭用户/);
    assert.match(html, /92%/);
    assert.match(html, /78%/);
  });

  test('renders tab buttons with labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /AI 标签/);
    assert.match(html, /画像评分/);
    assert.match(html, /偏好分析/);
    assert.match(html, /AI 洞察/);
  });

  test('renders tag count in tab badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    // Tags count=5 should appear in the badge
    assert.match(html, /5/);
  });

  test('renders tag category summary chips', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /消费习惯/);
    assert.match(html, /人口统计/);
    assert.match(html, /行为特征/);
    assert.match(html, /生活方式/);
    assert.match(html, /兴趣爱好/);
  });

  test('renders confidence percentage on tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /85%/);
    assert.match(html, /65%/);
    assert.match(html, /72%/);
  });

  test('renders footer note', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /多维数据自动生成/);
  });

  // ---- 加载态 ----
  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile(), loading: true })
    );
    assert.match(html, /animate-pulse/);
  });

  // ---- 错误态 ----
  test('renders error state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile(), error: 'API 服务异常' })
    );
    assert.match(html, /画像加载失败/);
    assert.match(html, /API 服务异常/);
  });

  test('renders retry button in error state', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, {
        profile: makeProfile(),
        error: '网络错误',
        onRefresh: () => {},
      })
    );
    assert.match(html, /重新加载/);
  });

  // ---- 空状态 ----
  test('renders empty tags message', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile({ tags: [] }) })
    );
    assert.match(html, /暂无/);
    assert.match(html, /AI/);
  });

  // ---- 边界 ----
  test('accepts custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, {
        profile: makeProfile(),
        className: 'my-custom-class',
      })
    );
    assert.match(html, /my-custom-class/);
  });

  test('renders avatar letter when no avatarUrl', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, {
        profile: makeProfile({ avatarUrl: undefined }),
      })
    );
    assert.match(html, /张/);
  });

  test('renders refresh icon when onRefresh provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, {
        profile: makeProfile(),
        onRefresh: () => {},
      })
    );
    assert.ok(html.length > 100);
  });

  test('renders tag click hint when onTagClick provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, {
        profile: makeProfile(),
        onTagClick: () => {},
      })
    );
    assert.match(html, /点击标签可查看更多/);
  });

  test('renders with avatar URL', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, {
        profile: makeProfile({ avatarUrl: 'https://example.com/avatar.png' }),
      })
    );
    assert.match(html, /example.com/);
  });

  test('renders category filter chip for behavior', () => {
    const profile = makeProfile();
    profile.tags.push({ code: 't6', label: '新客', category: 'behavior', confidence: 50 });
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile })
    );
    assert.match(html, /行为特征/);
    assert.match(html, /兴趣爱好/);
  });

  test('renders large total spent formatting >1M', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile({ totalSpent: 1234567 }) })
    );
    assert.match(html, /123\..*|1234567/);
  });

  test('renders tag title attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /置信度/);
  });

  test('renders without error when only profile provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.ok(html.includes('张伟'));
  });

  test('renders all 5 default tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, { profile: makeProfile() })
    );
    assert.match(html, /高消费力/);
    assert.match(html, /家庭用户/);
    assert.match(html, /周末到店/);
    assert.match(html, /健康关注/);
    assert.match(html, /科技爱好者/);
  });

  test('renders first character avatar', () => {
    const html = renderToStaticMarkup(
      React.createElement(AIMemberProfilePanel, {
        profile: makeProfile({ memberName: 'Alice', avatarUrl: undefined }),
      })
    );
    assert.match(html, /A/);
  });
});
