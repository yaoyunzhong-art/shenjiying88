const React = require('react');
const assert = require('node:assert/strict');
const { describe, test, mock } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const {
  AISmartSchedulingPanel,
} = require('./AISmartSchedulingPanel');

// ==================== Helpers ====================

/** 从静态 HTML 提取文本 */
function extractText(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** 检查 HTML 是否包含指定文本 */
function containsText(html, text) {
  return extractText(html).includes(text);
}

/** 转义 HTML 特殊字符 */
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== Mock Data ====================

const mockStaff = [
  { staffId: 's1', staffName: '张三', skills: ['收银', '导购'], availableWeeklyHours: 40, preferredShift: 'morning', avatarColor: '#6366f1' },
  { staffId: 's2', staffName: '李四', skills: ['收银'], availableWeeklyHours: 35, preferredShift: 'afternoon', avatarColor: '#22c55e' },
  { staffId: 's3', staffName: '王五', skills: ['导购', '库存'], availableWeeklyHours: 40, preferredShift: 'night', avatarColor: '#eab308' },
  { staffId: 's4', staffName: '赵六', skills: ['导购'], availableWeeklyHours: 20, preferredShift: 'flexible', avatarColor: '#ec4899' },
];

const mockSlots = [
  { date: '2026-07-06', shiftName: '早班', startTime: '08:00', endTime: '16:00', requiredStaff: 2, assignedStaff: [] },
  { date: '2026-07-06', shiftName: '晚班', startTime: '16:00', endTime: '00:00', requiredStaff: 2, assignedStaff: [] },
  { date: '2026-07-07', shiftName: '早班', startTime: '08:00', endTime: '16:00', requiredStaff: 2, assignedStaff: [] },
];

const mockRecommendations = [
  {
    date: '2026-07-06',
    shiftName: '早班',
    startTime: '08:00',
    endTime: '16:00',
    recommendedStaff: ['s1', 's4'],
    confidenceScore: 0.95,
    rationale: '张三早班偏好匹配, 赵六灵活排班可用',
  },
  {
    date: '2026-07-06',
    shiftName: '晚班',
    startTime: '16:00',
    endTime: '00:00',
    recommendedStaff: ['s2', 's3'],
    confidenceScore: 0.82,
    alternates: ['s1'],
    rationale: '李四午班偏好, 王五晚班偏好',
  },
  {
    date: '2026-07-07',
    shiftName: '早班',
    startTime: '08:00',
    endTime: '16:00',
    recommendedStaff: ['s1', 's4'],
    confidenceScore: 0.91,
    rationale: '张三连续早班可行, 赵六灵活',
  },
];

// ==================== Tests ====================

describe('AISmartSchedulingPanel', () => {
  describe('1. 基础渲染', () => {
    test('渲染标题和基本信息', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, { staff: mockStaff, slots: mockSlots })
      );
      assert.ok(containsText(html, 'AI 智能排班'));
      assert.ok(containsText(html, '4 名员工'));
      assert.ok(containsText(html, '3 个班次待排'));
    });

    test('显示生成按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, { staff: mockStaff, slots: mockSlots })
      );
      assert.ok(containsText(html, '生成排班'));
    });

    test('渲染约束条件标签', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, { staff: mockStaff, slots: mockSlots })
      );
      assert.ok(containsText(html, '周上限工时'));
      assert.ok(containsText(html, '最短休息间隔'));
      assert.ok(containsText(html, '技能匹配'));
      assert.ok(containsText(html, '连续排班上限'));
    });
  });

  describe('2. 空状态与生成中', () => {
    test('无推荐时显示空状态', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, { staff: mockStaff, slots: mockSlots })
      );
      assert.ok(containsText(html, '暂无排班推荐'));
      assert.ok(containsText(html, '点击上方按钮生成'));
    });

    test('生成中显示等待状态', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, { staff: mockStaff, slots: mockSlots, isGenerating: true })
      );
      assert.ok(containsText(html, '正在分析员工可用性'));
      assert.ok(containsText(html, '生成中'));
    });
  });

  describe('3. 推荐列表渲染', () => {
    test('渲染推荐项', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
        })
      );
      assert.ok(containsText(html, '2026-07-06'));
      assert.ok(containsText(html, '2026-07-07'));
      assert.ok(containsText(html, '张三'));
      assert.ok(containsText(html, '李四'));
      assert.ok(containsText(html, '王五'));
      assert.ok(containsText(html, '赵六'));
    });

    test('显示置信度信息', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
        })
      );
      // 高置信度 95% 和 91%, 中置信度 82%
      assert.ok(containsText(html, '95%') || containsText(html, '91%'));
      assert.ok(containsText(html, '82%'));
    });

    test('显示备选人员', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
        })
      );
      assert.ok(containsText(html, '备选'));
    });

    test('显示推荐依据', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
        })
      );
      assert.ok(containsText(html, '张三早班偏好匹配'));
      assert.ok(containsText(html, '李四午班偏好'));
    });

    test('显示应用按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
          onApplyRecommendation: () => {},
        })
      );
      assert.ok(containsText(html, '应用'));
    });

    test('显示全部应用按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
          onApplyAll: () => {},
        })
      );
      assert.ok(containsText(html, '全部应用'));
    });
  });

  describe('4. 统计信息', () => {
    test('显示排班员工数', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, { staff: mockStaff, slots: mockSlots })
      );
      assert.ok(containsText(html, '4'));
    });

    test('显示班次覆盖统计(有推荐时)', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
        })
      );
      // 3/3 或类似覆盖率
      assert.ok(containsText(html, '/3'));
    });

    test('显示员工工时概览(有推荐时)', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          recommendations: mockRecommendations,
        })
      );
      assert.ok(containsText(html, '员工工时概览'));
      // 张三16h/40h, 李四8h/35h
      assert.ok(containsText(html, '/40h'));
      assert.ok(containsText(html, '/35h'));
    });
  });

  describe('5. 自定义配置', () => {
    test('支持自定义标题', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          title: '自定义排班',
        })
      );
      assert.ok(containsText(html, '自定义排班'));
    });

    test('支持自定义 className', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          className: 'my-custom-class',
        })
      );
      assert.ok(html.includes('my-custom-class'));
    });
  });

  describe('6. 边界情况', () => {
    test('空员工空班次', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: [],
          slots: [],
        })
      );
      assert.ok(containsText(html, '0 名员工'));
      assert.ok(containsText(html, '0 个班次待排'));
    });

    test('空推荐无应用按钮', () => {
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: mockStaff,
          slots: mockSlots,
          onApplyAll: () => {},
        })
      );
      assert.ok(!containsText(html, '全部应用'));
    });

    test('人数过多时仍正常渲染', () => {
      const manyStaff = Array.from({ length: 20 }, (_, i) => ({
        staffId: `s${i + 1}`,
        staffName: `员工${i + 1}`,
        skills: ['收银'],
        availableWeeklyHours: 40,
        preferredShift: 'flexible',
        avatarColor: '#6366f1',
      }));
      const html = renderToStaticMarkup(
        React.createElement(AISmartSchedulingPanel, {
          staff: manyStaff,
          slots: mockSlots,
        })
      );
      assert.ok(containsText(html, '20 名员工'));
    });
  });
});
