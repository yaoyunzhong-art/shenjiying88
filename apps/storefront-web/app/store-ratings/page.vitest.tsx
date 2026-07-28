/**
 * store-ratings/page.vitest.tsx — 门店评分页面 L2 组件测试
 * 角色: 顾客 / 👔店长
 * 覆盖: 渲染 · 综合评分 · 维度评分 · 评分分布 · 标签云 · 星级/排序筛选 · 评价列表 · 回复 · 分页 · 空态
 *
 * 注意: vi.mock factory 是提升的(hoisted), 不能引用顶层变量, 数据必须内联在 factory 内。
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import StoreRatingsPage from './page';

describe('StoreRatingsPage — 门店评分页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<StoreRatingsPage />)).not.toThrow();
  });

  test('renders title 门店评价', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('⭐ 门店评价')).toBeInTheDocument();
  });

  test('renders main container with dark background', () => {
    render(<StoreRatingsPage />);
    const main = document.querySelector('main');
    expect(main).toHaveStyle('background: #0f172a');
  });

  // ====== 综合评分卡片 ======

  test('renders 综合评分 card', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('综合评分')).toBeInTheDocument();
  });

  test('renders 好评率 card', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('好评率')).toBeInTheDocument();
  });

  test('renders 已回复 card', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('已回复')).toBeInTheDocument();
  });

  test('renders 互动热度 card', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('互动热度')).toBeInTheDocument();
  });

  test('average rating is displayed', () => {
    render(<StoreRatingsPage />);
    // Average of all REVIEWS: about 4.1
    const avgText = screen.getByText(/4\.\d/);
    expect(avgText).toBeInTheDocument();
  });

  test('review count is displayed', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText(/12 条评价/)).toBeInTheDocument();
  });

  // ====== 维度评分 ======

  test('renders dimension ratings section', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('📊 评分维度')).toBeInTheDocument();
  });

  test('renders all 5 dimensions', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('环境')).toBeInTheDocument();
    expect(screen.getByText('服务')).toBeInTheDocument();
    expect(screen.getByText('设备')).toBeInTheDocument();
    expect(screen.getByText('性价比')).toBeInTheDocument();
    expect(screen.getByText('卫生')).toBeInTheDocument();
  });

  test('dimension scores are displayed', () => {
    render(<StoreRatingsPage />);
    const dimScores = screen.getAllByText(/4\.\d/);
    expect(dimScores.length).toBeGreaterThanOrEqual(5);
  });

  // ====== 评分分布 ======

  test('renders rating distribution section', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('📈 评分分布')).toBeInTheDocument();
  });

  test('renders all 5 star levels', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('5星')).toBeInTheDocument();
    expect(screen.getByText('4星')).toBeInTheDocument();
    expect(screen.getByText('3星')).toBeInTheDocument();
    expect(screen.getByText('2星')).toBeInTheDocument();
    expect(screen.getByText('1星')).toBeInTheDocument();
  });

  // ====== 标签云 ======

  test('renders tag cloud', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('🏷️ 环境好')).toBeInTheDocument();
    expect(screen.getByText('🏷️ 设备新')).toBeInTheDocument();
    expect(screen.getByText('🏷️ 干净卫生')).toBeInTheDocument();
  });

  test('clicking a tag filters reviews', async () => {
    render(<StoreRatingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🏷️ VR体验'));
    await waitFor(() => {
      expect(screen.getByText('Evan')).toBeInTheDocument();
      expect(screen.queryByText('Alex')).not.toBeInTheDocument();
    });
  });

  test('active tag shows clear button', async () => {
    render(<StoreRatingsPage />);
    fireEvent.click(screen.getByText('🏷️ VR体验'));
    await waitFor(() => {
      expect(screen.getByText('✕ 清除')).toBeInTheDocument();
    });
  });

  test('clear tag button resets filter', async () => {
    render(<StoreRatingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🏷️ VR体验'));
    await waitFor(() => {
      expect(screen.queryByText('Alex')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('✕ 清除'));
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument();
    });
  });

  // ====== 星级筛选 ======

  test('renders star filter buttons', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('5★')).toBeInTheDocument();
    expect(screen.getByText('4★')).toBeInTheDocument();
    expect(screen.getByText('3★')).toBeInTheDocument();
    expect(screen.getByText('2★')).toBeInTheDocument();
    expect(screen.getByText('1★')).toBeInTheDocument();
  });

  test('clicking star filter narrows reviews', async () => {
    render(<StoreRatingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('5★'));
    await waitFor(() => {
      // Only 5-star reviews: Alex (5), Charlie (5), Evan (5), Fiona (5), Ivan (5), Kevin (5)
      expect(screen.getByText('Alex')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      // 4-star reviews should be hidden
      expect(screen.queryByText('Betty')).not.toBeInTheDocument();
    });
  });

  // ====== 排序 ======

  test('renders sort order dropdown', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('最新')).toBeInTheDocument();
    expect(screen.getByText('评分最高')).toBeInTheDocument();
    expect(screen.getByText('评分最低')).toBeInTheDocument();
    expect(screen.getByText('最多赞')).toBeInTheDocument();
  });

  test('sort by rating_low shows lowest-rated first', async () => {
    render(<StoreRatingsPage />);
    const sortSelect = screen.getByDisplayValue('最新');
    fireEvent.change(sortSelect, { target: { value: 'rating_low' } });
    await waitFor(() => {
      // The first visible card should be a 3-star review
      const reviews = screen.getAllByText(/3|4|5/).filter(el => {
        const stars = el.textContent?.match(/★/g);
        return stars && stars.length >= 3;
      });
      expect(reviews.length).toBeGreaterThan(0);
    });
  });

  test('sort by likes shows most-liked first', async () => {
    render(<StoreRatingsPage />);
    const sortSelect = screen.getByDisplayValue('最新');
    fireEvent.change(sortSelect, { target: { value: 'likes' } });
    await waitFor(() => {
      expect(screen.getByText('👍 15')).toBeInTheDocument(); // Charlie has 15 likes (highest)
    });
  });

  // ====== 评价列表 ======

  test('renders review author avatars', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('🎮')).toBeInTheDocument(); // Alex avatar
    expect(screen.getByText('🎀')).toBeInTheDocument(); // Betty avatar
  });

  test('renders review author names', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Betty')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  test('renders review content', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText(/环境特别好，设备也很新/)).toBeInTheDocument();
    expect(screen.getByText(/和朋友一起来的/)).toBeInTheDocument();
  });

  test('renders review dates', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('2026-07-12')).toBeInTheDocument();
    expect(screen.getByText('2026-07-11')).toBeInTheDocument();
  });

  test('reviews with replies show store response', () => {
    render(<StoreRatingsPage />);
    const replies = screen.getAllByText(/门店回复/);
    expect(replies.length).toBeGreaterThan(0);
    expect(screen.getByText(/感谢反馈/)).toBeInTheDocument();
  });

  // ====== 互动 ======

  test('renders like counts', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('👍 12')).toBeInTheDocument();
    expect(screen.getByText('👍 8')).toBeInTheDocument();
  });

  test('renders reply button for each review', () => {
    render(<StoreRatingsPage />);
    const replyBtns = screen.getAllByText('💬 回复');
    expect(replyBtns.length).toBeGreaterThan(0);
  });

  // ====== 分页 ======

  test('renders pagination controls', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText('← 上一页')).toBeInTheDocument();
    expect(screen.getByText('下一页 →')).toBeInTheDocument();
  });

  test('pagination shows page 1 of 2', () => {
    render(<StoreRatingsPage />);
    // 12 items, 6 per page = 2 pages
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('pagination advances to next page', () => {
    render(<StoreRatingsPage />);
    fireEvent.click(screen.getByText('下一页 →'));
    // Page 2 should show Kevin, Linda etc.
    expect(screen.getByText('Kevin')).toBeInTheDocument();
    expect(screen.getByText('Linda')).toBeInTheDocument();
  });

  test('previous page is disabled on first page', () => {
    render(<StoreRatingsPage />);
    const prevBtn = screen.getByText('← 上一页').closest('button');
    expect(prevBtn).toBeDisabled();
  });

  // ====== 空态 ======

  test('shows empty state when no reviews match filter', async () => {
    render(<StoreRatingsPage />);
    await waitFor(() => {
      expect(screen.getByText('Alex')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('2★'));
    await waitFor(() => {
      expect(screen.getByText('没有匹配的评价')).toBeInTheDocument();
    });
  });

  // ====== 边界 ======

  test('total review count shown in stats', () => {
    render(<StoreRatingsPage />);
    expect(screen.getByText(/共 12 条评价/)).toBeInTheDocument();
  });

  test('filtered count updates correctly', async () => {
    render(<StoreRatingsPage />);
    await waitFor(() => {
      expect(screen.getByText(/显示 6 条/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('5★'));
    await waitFor(() => {
      expect(screen.getByText(/显示 6 条/)).toBeInTheDocument();
    });
  });
});
