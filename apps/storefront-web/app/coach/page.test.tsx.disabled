/**
 * coach/page.vitest.tsx — 教练工作台页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 指标卡片 · 推广任务 · 待跟进会员表格 · 详情弹窗 · 状态更新 · 排名 · 刷新 · 边界
 * 角色: 👨‍🏫教练 · 🎯导玩员
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock @m5/ui
vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell">
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {children}
    </div>
  ),
  StatusBadge: ({ variant, label }: any) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
}));

import CoachPage from './page';

/** Helper: get full body text for multi-match patterns */
function bodyText(): string {
  return document.body.textContent || '';
}

describe('CoachPage — 教练工作台', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<CoachPage />)).not.toThrow();
  });

  test('renders page title 教练工作台', () => {
    render(<CoachPage />);
    expect(screen.getByText('🏋️ 教练工作台')).toBeInTheDocument();
  });

  test('renders coach info line', () => {
    render(<CoachPage />);
    const body = bodyText();
    expect(body).toMatch(/张教练/);
    expect(body).toMatch(/朝阳旗舰店/);
    expect(body).toMatch(/EMP-0032/);
    expect(body).toMatch(/排名/);
  });

  test('renders PageShell description', () => {
    render(<CoachPage />);
    expect(screen.getByText('教练/导玩员日常工作台 — 接待指标、推广任务与会员跟进')).toBeInTheDocument();
  });

  // ====== 指标卡片 ======

  test('renders MetricCard for 接待人次', () => {
    render(<CoachPage />);
    expect(screen.getByText('接待人次')).toBeInTheDocument();
    expect(screen.getByText('68')).toBeInTheDocument();
  });

  test('renders MetricCard for 新增会员', () => {
    render(<CoachPage />);
    expect(screen.getByText('新增会员')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('renders MetricCard for 推广转化', () => {
    render(<CoachPage />);
    expect(screen.getByText('推广转化')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  test('renders MetricCard for 跟进回访', () => {
    render(<CoachPage />);
    expect(screen.getByText('跟进回访')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  test('renders MetricCard for 待处理跟进', () => {
    render(<CoachPage />);
    expect(screen.getByText('待处理跟进')).toBeInTheDocument();
  });

  test('renders trend indicators on metric cards', () => {
    render(<CoachPage />);
    expect(screen.getByText('↑ 5.2%')).toBeInTheDocument();
    expect(screen.getByText('↑ 8.0%')).toBeInTheDocument();
    expect(screen.getByText('↑ 12.3%')).toBeInTheDocument();
    expect(screen.getByText('↓ 2.1%')).toBeInTheDocument();
  });

  test('renders trend labels', () => {
    render(<CoachPage />);
    const vsYesterday = screen.getAllByText('vs 昨日');
    expect(vsYesterday.length).toBeGreaterThanOrEqual(3);
  });

  // ====== 推广任务 ======

  test('renders 推广任务进度 section', () => {
    render(<CoachPage />);
    expect(screen.getByText('📢 推广任务进度')).toBeInTheDocument();
  });

  test('renders all 4 promo task titles', () => {
    render(<CoachPage />);
    expect(screen.getByText('扫码分享有礼')).toBeInTheDocument();
    expect(screen.getByText('老带新裂变活动')).toBeInTheDocument();
    expect(screen.getByText('门店周年庆促销')).toBeInTheDocument();
    expect(screen.getByText('夏日特惠券派发')).toBeInTheDocument();
  });

  test('renders promo task progress numbers (completed/target)', () => {
    render(<CoachPage />);
    expect(screen.getByText('32/50 (64%)')).toBeInTheDocument();
    expect(screen.getByText('18/30 (60%)')).toBeInTheDocument();
    expect(screen.getByText('145/200 (73%)')).toBeInTheDocument();
    expect(screen.getByText('67/100 (67%)')).toBeInTheDocument();
  });

  test('renders total progress bar stats', () => {
    render(<CoachPage />);
    expect(screen.getByText(/总进度/)).toBeInTheDocument();
  });

  // ====== 待跟进会员 ======

  test('renders 待跟进会员 section', () => {
    render(<CoachPage />);
    expect(screen.getByText('📋 待跟进会员')).toBeInTheDocument();
  });

  test('renders member table headers', () => {
    render(<CoachPage />);
    const table = document.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('会员')).toBeInTheDocument();
    expect(screen.getByText('等级')).toBeInTheDocument();
    expect(screen.getByText('手机')).toBeInTheDocument();
    expect(screen.getByText('上次联系')).toBeInTheDocument();
    expect(screen.getByText('状态')).toBeInTheDocument();
    expect(screen.getByText('备注')).toBeInTheDocument();
    expect(screen.getByText('操作')).toBeInTheDocument();
  });

  test('renders all 5 follow-up member names', () => {
    render(<CoachPage />);
    expect(screen.getByText('王小刚')).toBeInTheDocument();
    expect(screen.getByText('李丽华')).toBeInTheDocument();
    expect(screen.getByText('陈志强')).toBeInTheDocument();
    expect(screen.getByText('张倩')).toBeInTheDocument();
    expect(screen.getByText('刘强')).toBeInTheDocument();
  });

  test('renders member tier badges', () => {
    render(<CoachPage />);
    const body = bodyText();
    expect(body).toMatch(/金卡/);
    expect(body).toMatch(/铂金/);
    expect(body).toMatch(/银卡/);
    expect(body).toMatch(/钻石/);
  });

  test('renders status labels for members', () => {
    render(<CoachPage />);
    const body = bodyText();
    expect(body).toMatch(/待跟进/);
    expect(body).toMatch(/已联系/);
    expect(body).toMatch(/已转化/);
    expect(body).toMatch(/已流失/);
  });

  test('renders 跟进 button for each member', () => {
    render(<CoachPage />);
    const followBtns = screen.getAllByText('跟进');
    expect(followBtns.length).toBe(5);
  });

  // ====== 跟进详情弹窗 ======

  test('clicking 跟进 opens detail modal', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getAllByText('跟进')[0]);
    expect(screen.getByText('跟进会员 — 王小刚')).toBeInTheDocument();
  });

  test('detail modal shows member phone', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getAllByText('跟进')[0]);
    const body = bodyText();
    expect(body).toMatch(/138/);
  });

  test('detail modal shows member note', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getAllByText('跟进')[0]);
    const body = bodyText();
    expect(body).toMatch(/对高端体验套餐感兴趣/);
  });

  test('detail modal shows 标记已联系 button for pending status', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getAllByText('跟进')[0]);
    expect(screen.getByText('标记已联系')).toBeInTheDocument();
  });

  test('clicking 标记已联系 updates status', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getAllByText('跟进')[0]);
    expect(screen.getByText('标记已联系')).toBeInTheDocument();
    fireEvent.click(screen.getByText('标记已联系'));
    expect(screen.queryByText('跟进会员 — 王小刚')).not.toBeInTheDocument();
  });

  test('closed detail modal removes overlay', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getAllByText('跟进')[0]);
    expect(screen.getByText('跟进会员 — 王小刚')).toBeInTheDocument();
    fireEvent.click(screen.getByText('关闭'));
    expect(screen.queryByText('跟进会员 — 王小刚')).not.toBeInTheDocument();
  });

  // ====== 排名统计 ======

  test('renders ranking info in footer', () => {
    render(<CoachPage />);
    const body = bodyText();
    expect(body).toMatch(/本月业绩排名/);
    expect(body).toMatch(/第 3 名/);
  });

  test('renders conversion rate stat', () => {
    render(<CoachPage />);
    expect(screen.getByText(/跟进转化率/)).toBeInTheDocument();
  });

  test('renders promo completion rate', () => {
    render(<CoachPage />);
    expect(screen.getByText(/推广完成率/)).toBeInTheDocument();
  });

  // ====== 刷新按钮 ======

  test('renders refresh button', () => {
    render(<CoachPage />);
    expect(screen.getByText('🔄 刷新')).toBeInTheDocument();
  });

  test('refresh button becomes disabled when loading', () => {
    render(<CoachPage />);
    const refreshBtn = screen.getByText('🔄 刷新');
    fireEvent.click(refreshBtn);
    expect(screen.getByText('⏳ 刷新中…')).toBeInTheDocument();
  });

  // ====== 推广任务详情弹窗 ======

  test('renders 查看 → button for each promo task', () => {
    render(<CoachPage />);
    const viewBtns = screen.getAllByText('查看 →');
    expect(viewBtns.length).toBe(4);
  });

  test('clicking 查看 → opens promo task detail', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getAllByText('查看 →')[0]);
    expect(screen.getByText(/类型/)).toBeInTheDocument();
  });

  // ====== 边界 ======

  test('renders sync time text', () => {
    render(<CoachPage />);
    expect(screen.getByText(/上次同步/)).toBeInTheDocument();
  });

  test('all members render without crashing', () => {
    render(<CoachPage />);
    expect(screen.getAllByText('跟进').length).toBe(5);
  });
});
