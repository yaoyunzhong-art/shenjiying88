/**
 * events/page.vitest.tsx — 活动中心 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载状态 · 渲染 · 筛选 · 展开详情 · 统计 · 排行 · 边界
 * 关键: 多个 "进行中" "4" "竞赛" "促销" 等文本出现在页面多处，
 *       使用 getAllByText 或 container.textContent 进行检查
 * 角色: 👔店长 · 🎯运营专员 · 🏪全体员工
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import EventsPage from './page';

async function waitForData() {
  // Unique text that only appears after data load completes
  await screen.findByText(/共 13 个活动/, {}, { timeout: 8000 });
}

function allText(): string {
  return document.body.textContent ?? '';
}

describe('EventsPage — 活动中心', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 加载/渲染基础测试 ======

  test('renders without crashing', () => {
    expect(() => render(<EventsPage />)).not.toThrow();
  });

  test('shows loading skeleton initially, then content after fetch', async () => {
    render(<EventsPage />);
    expect(screen.queryByText('🎪 活动中心')).not.toBeInTheDocument();
    await waitForData();
    expect(screen.getByText('🎪 活动中心')).toBeInTheDocument();
  });

  test('renders page subtitle', async () => {
    render(<EventsPage />);
    await waitForData();
    expect(screen.getByText('竞赛·促销·体验·亲子')).toBeInTheDocument();
  });

  test('renders event summary text', async () => {
    render(<EventsPage />);
    await waitForData();
    expect(screen.getByText(/共 13 个活动/)).toBeInTheDocument();
  });

  // ====== 统计卡片测试 ======

  test('renders stat cards with labels', async () => {
    render(<EventsPage />);
    await waitForData();
    // Stat card labels may also appear in other parts of the UI
    expect(screen.getAllByText('进行中').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('即将开始').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('累计参与')).toBeInTheDocument();
    expect(screen.getAllByText('已结束').length).toBeGreaterThanOrEqual(1);
  });

  test('total participant count is formatted', async () => {
    render(<EventsPage />);
    await waitForData();
    expect(screen.getByText('10,094')).toBeInTheDocument();
  });

  test('active event count in summary', async () => {
    render(<EventsPage />);
    await waitForData();
    expect(screen.getByText(/6 进行中/)).toBeInTheDocument();
  });

  test('renders stat card values correctly', async () => {
    render(<EventsPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('10,094');
    expect(body).toContain('13');
  });

  // ====== 事件标题渲染 ======

  test('renders event titles after load', async () => {
    render(<EventsPage />);
    await waitForData();
    const titles = [
      '暑期狂欢·全民争霸赛', 'VR新游体验周', '亲子嘉年华·周末嗨翻天',
      '会员日双倍积分', '开学季·学生特惠', '街机怀旧夜', '直播挑战赛',
      '中秋节·团圆套餐', '电竞女神邀请赛', '夏日冰爽畅玩季', '音游挑战赛',
      '周末亲子烘焙工坊', '周年庆特惠月',
    ];
    const body = allText();
    for (const t of titles) {
      expect(body).toContain(t);
    }
  });

  // ====== 分类分析测试 ======

  test('renders category distribution', async () => {
    render(<EventsPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('竞赛');
    expect(body).toContain('促销');
    expect(body).toContain('体验');
    expect(body).toContain('亲子');
    expect(body).toContain('会员');
    expect(body).toContain('主题');
  });

  // ====== 热度排行测试 ======

  test('renders top 3 hot events section', async () => {
    render(<EventsPage />);
    await waitForData();
    expect(screen.getByText('🔥 热度排行 Top 3')).toBeInTheDocument();
  });

  // ====== 精选推荐测试 ======

  test('renders featured event section', async () => {
    render(<EventsPage />);
    await waitForData();
    expect(screen.getByText('⭐ 精选推荐')).toBeInTheDocument();
    expect(screen.getByText(/推荐理由：参与人数最多/)).toBeInTheDocument();
  });

  // ====== 筛选按钮测试 ======

  test('renders all type filter buttons', async () => {
    render(<EventsPage />);
    await waitForData();
    // Filter button text may also appear in category distribution, so use body text
    const body = allText();
    const filterLabels = ['全部', '竞赛', '促销', '体验', '亲子', '会员', '主题'];
    for (const label of filterLabels) {
      expect(body).toContain(label);
    }
  });

  test('renders status filter labels', async () => {
    render(<EventsPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('进行中');
  });

  test('type filter: clicking 促销 shows only promotion events', async () => {
    render(<EventsPage />);
    await waitForData();
    // Find the 促销 BUTTON (skip the category distribution label)
    const promoBtns = screen.getAllByText('促销').filter(el => el.tagName === 'BUTTON');
    expect(promoBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(promoBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('开学季·学生特惠')).toBeInTheDocument();
      expect(screen.queryByText('VR新游体验周')).not.toBeInTheDocument();
    });
  });

  test('type filter: clicking 竞赛 filters event list', async () => {
    render(<EventsPage />);
    await waitForData();
    const compBtn = screen.getAllByText('竞赛').filter(el => el.tagName === 'BUTTON')[0];
    fireEvent.click(compBtn);
    await waitFor(() => {
      expect(screen.getByText('电竞女神邀请赛')).toBeInTheDocument(); // 竞赛 event
      // 'VR新游体验周' is 体验 — should not appear (and not in Top 3)
      expect(screen.queryByText('VR新游体验周')).not.toBeInTheDocument();
    });
  });

  test('resetting type filter shows all events', async () => {
    render(<EventsPage />);
    await waitForData();
    const compBtn = screen.getAllByText('竞赛').filter(el => el.tagName === 'BUTTON')[0];
    fireEvent.click(compBtn);
    await waitFor(() => {
      expect(screen.queryByText('VR新游体验周')).not.toBeInTheDocument();
    });
    const allTypeBtn = screen.getAllByText('全部').filter(el => el.tagName === 'BUTTON')[0];
    fireEvent.click(allTypeBtn);
    await waitFor(() => {
      expect(screen.getByText('VR新游体验周')).toBeInTheDocument();
    });
  });

  test('status filter buttons exist', async () => {
    render(<EventsPage />);
    await waitForData();
    // Verify all status filter buttons are rendered
    const statusLabels = ['全部', '进行中', '即将开始', '已结束'];
    for (const label of statusLabels) {
      const btns = screen.getAllByText(label).filter(el => el.tagName === 'BUTTON');
      expect(btns.length).toBeGreaterThanOrEqual(1);
    }
  });

  // ====== 展开详情测试 ======

  test('clicking 详情 button expands event details', async () => {
    render(<EventsPage />);
    await waitForData();
    const detailBtns = screen.getAllByText('详情');
    expect(detailBtns.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(detailBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('分享好友')).toBeInTheDocument();
    });
  });

  test('expanded event shows action buttons', async () => {
    render(<EventsPage />);
    await waitForData();
    const detailBtns = screen.getAllByText('详情');
    fireEvent.click(detailBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('立即参与')).toBeInTheDocument();
      expect(screen.getByText('分享好友')).toBeInTheDocument();
      expect(screen.getByText('加入日历')).toBeInTheDocument();
    });
  });

  test('clicking 收起 collapses expanded event', async () => {
    render(<EventsPage />);
    await waitForData();
    const detailBtns = screen.getAllByText('详情');
    fireEvent.click(detailBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('立即参与')).toBeInTheDocument();
    });
    const collapseBtns = screen.getAllByText('收起');
    fireEvent.click(collapseBtns[0]);
    await waitFor(() => {
      expect(screen.queryByText('立即参与')).not.toBeInTheDocument();
    });
  });

  // ====== 地点信息测试 ======

  test('renders location info', async () => {
    render(<EventsPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('旗舰店');
    expect(body).toContain('全部门店');
  });

  // ====== 空状态测试 ======

  test('no matching events shows empty state', async () => {
    render(<EventsPage />);
    await waitForData();
    // 主题 + 进行中 = 0 results
    const allTextContent = allText();
    expect(allTextContent).toContain('主题');
    // 主题 events: 街机怀旧夜(已结束). 主题 + 进行中 = 0
    fireEvent.click(screen.getAllByText('主题').filter(el => el.tagName === 'BUTTON')[0]);
    // Also filter by 进行中 buttons
    const statusBtns = screen.getAllByText('进行中').filter(el => el.tagName === 'BUTTON');
    if (statusBtns.length > 0) fireEvent.click(statusBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('没有找到符合条件的活动')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // ====== 脚注测试 ======

  test('renders footer with stats', async () => {
    render(<EventsPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('13/13');
    expect(body).toContain('10,094');
  });

  // ====== 事件详情渲染测试 ======

  test('renders event dates', async () => {
    render(<EventsPage />);
    await waitForData();
    expect(screen.getByText(/2026-07-01 ~ 2026-08-31/)).toBeInTheDocument();
  });

  test('renders event participants', async () => {
    render(<EventsPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('3,452');
  });

  test('renders event prizes using allText', async () => {
    render(<EventsPage />);
    await waitForData();
    const body = allText();
    expect(body).toContain('¥10,000奖金+年卡');
    expect(body).toContain('免费体验券');
    expect(body).toContain('双倍积分');
  });

  // ====== 边界情况 ======

  test('render is idempotent', async () => {
    const { rerender } = render(<EventsPage />);
    await waitForData();
    expect(screen.getByText('🎪 活动中心')).toBeInTheDocument();
    rerender(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText('🎪 活动中心')).toBeInTheDocument();
    });
  });
});
