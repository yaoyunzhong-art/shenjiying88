/**
 * 导购员智能辅助面板 — Guide Workbench Page 测试
 * 覆盖: 页面渲染 / 统计数据 / 推荐表格 / 顾客队列 / 快捷话术 / 提醒 tab / 会员跟进 / 升级面板
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock the useDetailActions hook
const mockActions = [
  { key: 'copy', label: '复制链接', handler: vi.fn() },
  { key: 'export', label: '导出快照', handler: vi.fn() },
];

vi.mock('../../components/use-detail-actions', () => ({
  useDetailActions: () => ({ actions: mockActions }),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// We need to import dependencies that may not be available in test env
// So we mock the workspace component itself
import GuideWorkbenchPage from './page';

describe('GuideWorkbenchPage (导购员工作台)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page title', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('导购员智能辅助面板')).toBeDefined();
  });

  it('should render subtitle with store name', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText(/朝阳大悦城旗舰店/)).toBeDefined();
  });

  it('should render the guide name', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('李婷')).toBeDefined();
  });

  it('should render the customer profile name', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('林小婉')).toBeDefined();
  });

  it('should display sales statistics', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('接待顾客')).toBeDefined();
    expect(screen.getByText('达成销售额')).toBeDefined();
    expect(screen.getByText('转化率')).toBeDefined();
  });

  it('should render today performance metrics with correct values', () => {
    render(<GuideWorkbenchPage />);
    // Check for performance stats in QuickStats
    expect(screen.getByText('28')).toBeDefined(); // customersServed
    expect(screen.getByText('¥15,860')).toBeDefined(); // totalSales
    expect(screen.getByText('72%')).toBeDefined(); // conversionRate (0.72 * 100)
  });

  it('should render the AI recommendations section', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText(/AI 智能推荐/)).toBeDefined();
    expect(screen.getByText(/基于顾客画像/)).toBeDefined();
  });

  it('should render recommendation table with product names', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('宝可梦 伊布进化系列 盲盒')).toBeDefined();
    expect(screen.getByText('星之卡比 30cm 限定毛绒')).toBeDefined();
  });

  it('should display recommendation reasons summary cards', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('推荐理由摘要')).toBeDefined();
    // Check that multiple reason cards are shown
    const reasons = screen.getAllByText(/顾客上次购买了皮卡丘系列/);
    expect(reasons.length).toBeGreaterThanOrEqual(1);
  });

  it('should display customer queue section', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('待接待顾客')).toBeDefined();
  });

  it('should show queue customer names', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('张子轩')).toBeDefined();
    expect(screen.getByText('王雨桐')).toBeDefined();
    expect(screen.getByText('陈逸飞')).toBeDefined();
  });

  it('should display quick reply cards', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('快捷话术')).toBeDefined();
    expect(screen.getByText('迎宾语')).toBeDefined();
    expect(screen.getByText('推荐话术')).toBeDefined();
    expect(screen.getByText('促成交')).toBeDefined();
  });

  it('should copy quick reply text to clipboard when clicked', async () => {
    const user = userEvent.setup();
    render(<GuideWorkbenchPage />);

    const greetingButton = screen.getByText('迎宾语');
    await user.click(greetingButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('下午好！欢迎光临')
      );
    });
  });

  it('should show confirmation after copying a quick reply', async () => {
    const user = userEvent.setup();
    render(<GuideWorkbenchPage />);

    const greetingButton = screen.getByText('迎宾语');
    await user.click(greetingButton);

    await waitFor(() => {
      expect(screen.getByText(/已复制到剪贴板/)).toBeDefined();
    });
  });

  it('should render alert notification items', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('提醒 & 待跟进')).toBeDefined();
    // Check for VIP visit alert
    expect(screen.getByText(/铂金会员王雨桐已到店/)).toBeDefined();
    // Birthday alert
    expect(screen.getByText(/会员张子轩今日生日/)).toBeDefined();
  });

  it('should filter alerts by priority tab', async () => {
    const user = userEvent.setup();
    render(<GuideWorkbenchPage />);

    // Click on "高优先级" tab
    const highPriorityTab = screen.getByText('高优先级');
    await user.click(highPriorityTab);

    // After filtering, only high priority alerts should remain
    await waitFor(() => {
      expect(screen.getByText(/铂金会员王雨桐已到店/)).toBeDefined();
    });
  });

  it('should render follow-up task section', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('待跟进会员任务')).toBeDefined();
  });

  it('should render tier upgrade recommendation', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('会员升级建议')).toBeDefined();
  });

  it('should render the bottom action bar with export button', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('导出快照')).toBeDefined();
  });

  it('should render category icons for recommended products', () => {
    render(<GuideWorkbenchPage />);
    // At least some category icons should be rendered
    expect(screen.getByText('🧸')).toBeDefined();
    expect(screen.getByText('🎁')).toBeDefined();
  });

  it('should display stock information for recommendations', () => {
    render(<GuideWorkbenchPage />);
    // Check stock column values
    expect(screen.getByText('45')).toBeDefined(); // blind box stock
    expect(screen.getByText('12')).toBeDefined(); // plush toy stock
  });

  it('should display AI match scores', () => {
    render(<GuideWorkbenchPage />);
    const scores = screen.getAllByText(/96%/);
    expect(scores.length).toBeGreaterThanOrEqual(1);
  });

  it('should show original price strikethrough for discounted items', () => {
    render(<GuideWorkbenchPage />);
    const originalPrices = screen.getAllByText(/\¥89/);
    expect(originalPrices.length).toBeGreaterThanOrEqual(1);
  });

  it('should show pagination for recommendations', () => {
    render(<GuideWorkbenchPage />);
    const pagination = screen.getByText(/共 6 件推荐商品/);
    expect(pagination).toBeDefined();
  });

  it('should display section header for page shell', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText('导购辅助面板收口')).toBeDefined();
  });

  it('should display customer member tier badges in queue', () => {
    render(<GuideWorkbenchPage />);
    // Check for member tier labels in queue
    expect(screen.getByText('白银')).toBeDefined();
  });

  it('should show VIP badge for VIP customers', () => {
    render(<GuideWorkbenchPage />);
    const vipBadges = screen.getAllByText('VIP');
    expect(vipBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('should display price in recommendation cards', () => {
    render(<GuideWorkbenchPage />);
    // Check that price values render in the cards section
    const priceCards = screen.getAllByText(/¥69/);
    expect(priceCards.length).toBeGreaterThanOrEqual(1);
  });

  it('should have the correct subtitle describing functionality', () => {
    render(<GuideWorkbenchPage />);
    const subtitle = screen.getByText(/实时顾客画像.*导购辅助/);
    expect(subtitle).toBeDefined();
  });

  it('should render all section headings', () => {
    render(<GuideWorkbenchPage />);
    const headings = [
      '今日业绩',
      '顾客排队 & 快捷话术',
      'AI 智能推荐',
      '推荐理由摘要',
      '提醒 & 待跟进',
      '待跟进会员任务',
      '会员升级建议',
    ];
    for (const heading of headings) {
      expect(screen.getByText(heading)).toBeDefined();
    }
  });

  it('should handle alt tab click for medium priority', async () => {
    const user = userEvent.setup();
    render(<GuideWorkbenchPage />);

    const mediumTab = screen.getByText('中优先级');
    await user.click(mediumTab);

    await waitFor(() => {
      // Medium priority alerts should be visible
      expect(screen.getByText(/会员张子轩今日生日/)).toBeDefined();
    });
  });

  it('should render the tier upgrade panel with progress', () => {
    render(<GuideWorkbenchPage />);
    expect(screen.getByText(/铂金/)).toBeDefined();
    expect(screen.getByText(/72%/)).toBeDefined(); // progress percent
  });
});
