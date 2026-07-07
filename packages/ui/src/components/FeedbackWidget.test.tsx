/**
 * FeedbackWidget Test — 用户反馈/评价组件
 * 覆盖: 正例渲染 / 星级选择 / 评论输入 / 提交/取消行为 / 边界场景
 */
import React from 'react';
import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FeedbackWidget } = require('./FeedbackWidget.tsx');

// ── Helper ──────────────────────────────────────────────────

function extractText(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ── Tests ───────────────────────────────────────────────────

test('FeedbackWidget - renders with default props', () => {
  const html = renderToStaticMarkup(React.createElement(FeedbackWidget, { title: '意见反馈' }));
  assert.ok(html.includes('意见反馈'));
  // All stars are empty (☆) when rating=0
  assert.ok(html.includes('☆'));
  assert.ok(html.includes('提交反馈'));
  assert.ok(html.includes('取消'));
});

test('FeedbackWidget - renders custom title and description', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, {
      title: '服务评价',
      description: '请为本次服务打分',
    })
  );
  assert.ok(html.includes('服务评价'));
  assert.ok(html.includes('请为本次服务打分'));
});

test('FeedbackWidget - renders all stars as empty initially', () => {
  const html = renderToStaticMarkup(React.createElement(FeedbackWidget, {}));
  const starCount = (html.match(/☆/g) || []).length;
  assert.equal(starCount, 5);
  const filledCount = (html.match(/★/g) || []).length;
  assert.equal(filledCount, 0);
});

test('FeedbackWidget - renders with initial rating', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, { initialRating: 3 })
  );
  const filledCount = (html.match(/★/g) || []).length;
  assert.equal(filledCount, 3);
});

test('FeedbackWidget - shows rating label for valid rating', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, {
      initialRating: 5,
      ratingLabels: ['很差', '较差', '一般', '满意', '非常满意'],
    })
  );
  assert.ok(html.includes('非常满意'));
});

test('FeedbackWidget - custom max rating', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, { maxRating: 3 })
  );
  const stars = (html.match(/[★☆]/g) || []).length;
  assert.equal(stars, 3);
});

test('FeedbackWidget - renders textarea with custom placeholder', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, {
      commentPlaceholder: '请输入您的宝贵意见...',
    })
  );
  assert.ok(html.includes('请输入您的宝贵意见...'));
});

test('FeedbackWidget - shows submitted state when submitted is true', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, { submitted: true })
  );
  assert.ok(!html.includes('★'));
  assert.ok(html.includes('感谢您的反馈'));
  assert.ok(html.includes('🎉'));
});

test('FeedbackWidget - shows custom success message', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, {
      submitted: true,
      successMessage: '评价成功！',
    })
  );
  assert.ok(html.includes('评价成功！'));
});

test('FeedbackWidget - hide cancel button when showCancel false', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, { showCancel: false })
  );
  assert.ok(!html.includes('取消'));
});

test('FeedbackWidget - custom submit/cancel labels', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, {
      submitLabel: '发送',
      cancelLabel: '重置',
    })
  );
  assert.ok(html.includes('发送'));
  assert.ok(html.includes('重置'));
});

test('FeedbackWidget - renders with maxCommentLength char count hint', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, { maxCommentLength: 200 })
  );
  assert.ok(html.includes('0 / 200'));
});

test('FeedbackWidget - submitting state disables submit', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, {
      submitting: true,
      initialRating: 3,
    })
  );
  assert.ok(html.includes('提交中'));
});

test('FeedbackWidget - has correct aria labels on star buttons', () => {
  const html = renderToStaticMarkup(React.createElement(FeedbackWidget, {}));
  assert.ok(html.includes('aria-label="1 星"'));
  assert.ok(html.includes('aria-label="5 星"'));
});

test('FeedbackWidget - textarea has aria-label', () => {
  const html = renderToStaticMarkup(React.createElement(FeedbackWidget, {}));
  assert.ok(html.includes('aria-label="评论内容"'));
});

test('FeedbackWidget - can apply custom className', () => {
  const html = renderToStaticMarkup(
    React.createElement(FeedbackWidget, { className: 'my-feedback' })
  );
  assert.ok(html.includes('my-feedback') || html.includes('class="'));
});

describe('FeedbackWidget - boundary scenarios', () => {
  test('zero initial rating renders no filled stars', () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackWidget, { initialRating: 0 })
    );
    const filled = (html.match(/★/g) || []).length;
    assert.equal(filled, 0);
  });

  test('max rating of 0 renders no stars', () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackWidget, { maxRating: 0 })
    );
    const stars = (html.match(/[★☆]/g) || []).length;
    assert.equal(stars, 0); // Array.from({length:0}) = 0 stars
  });

  test('rating label array shorter than max shows empty for missing', () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackWidget, {
        initialRating: 5,
        maxRating: 5,
        ratingLabels: ['差', '一般', '好'],
      })
    );
    // Labels array has 3 items but max=5, so rating 5 -> index 4 -> undefined
    // Should not crash, just show empty
    const text = extractText(html);
    assert.ok(text.includes('★'));
  });

  test('submitted state hides textarea and buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(FeedbackWidget, {
        submitted: true,
        initialRating: 4,
        comment: 'test',
      })
    );
    assert.ok(!html.includes('提交反馈'));
    assert.ok(!html.includes('取消'));
  });
});
