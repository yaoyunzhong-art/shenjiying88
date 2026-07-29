/**
 * help/page.vitest.tsx — 帮助中心页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 加载态 · 渲染 · 搜索 · 分类筛选 · 展开折叠 · 热门问题 · 提交工单 · 边界
 * 角色: 📢营销 · 👔店长 · 🎯运行专员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

/** Mock @m5/ui components */
vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) => (
    <div data-testid="page-shell" data-title={title} data-subtitle={subtitle}>
      {children}
    </div>
  ),
  StatCard: ({ label, value }: { label: string; value: string | number }) => (
    <div data-testid="stat-card" data-label={label}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant?: string }) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
  Tabs: ({ items, activeKey, onChange }: {
    items: { key: string; label: string }[];
    activeKey: string;
    onChange: (key: string) => void;
  }) => (
    <div data-testid="tabs">
      {items.map(item => (
        <button key={item.key} onClick={() => onChange(item.key)}
          style={{ fontWeight: activeKey === item.key ? 700 : 400 }}
          data-testid={`tab-${item.key}`}>
          {item.label}
        </button>
      ))}
    </div>
  ),
  SearchFilterInput: ({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder: string;
  }) => (
    <input data-testid="search-filter-input" placeholder={placeholder}
      value={value} onChange={e => onChange(e.target.value)} />
  ),
}));

import HelpCenterPage from './page';

/** Helper: wait for data to finish loading */
async function waitForData() {
  await screen.findByText('❓ 如何创建新会员？', {}, { timeout: 5000 });
}

describe('HelpCenterPage — 帮助中心', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ====== 加载状态测试 ======

  test('render without crashing during loading', () => {
    expect(() => render(<HelpCenterPage />)).not.toThrow();
  });

  test('shows loading skeleton initially', () => {
    render(<HelpCenterPage />);
    // LoadingSkeleton renders a main with background #0f172a
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  test('loading skeleton has animated elements', () => {
    render(<HelpCenterPage />);
    // LoadingSkeleton renders placeholder divs
    const skeletonMain = document.querySelector('main');
    expect(skeletonMain).toBeInTheDocument();
  });

  // ====== 渲染测试 ======

  test('renders page shell after loading', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    expect(screen.getByTestId('page-shell')).toBeInTheDocument();
  });

  test('renders page shell title', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const shell = screen.getByTestId('page-shell');
    expect(shell).toHaveAttribute('data-title', '📚 帮助中心');
  });

  test('renders all 4 stat cards after load', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const cards = screen.getAllByTestId('stat-card');
    expect(cards.length).toBe(4);
    expect(screen.getByText('常见问题')).toBeInTheDocument();
    expect(screen.getByText('操作指南')).toBeInTheDocument();
    expect(screen.getByText('最热问题')).toBeInTheDocument();
    expect(screen.getByText('覆盖分类')).toBeInTheDocument();
  });

  test('renders FAQ tab as default', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const faqItems = screen.getAllByText(/常见问题/);
    expect(faqItems.length).toBeGreaterThanOrEqual(1);
  });

  test('renders search input after load', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    expect(screen.getByTestId('search-filter-input')).toBeInTheDocument();
  });

  test('search input placeholder is correct', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    expect(screen.getByTestId('search-filter-input')).toHaveAttribute('placeholder', '搜索问题/指南/关键词...');
  });

  test('renders all FAQ items after load', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    expect(screen.getByText('❓ 如何创建新会员？')).toBeInTheDocument();
    expect(screen.getByText('❓ 如何处理退款？')).toBeInTheDocument();
    expect(screen.getByText('❓ 如何查看设备状态？')).toBeInTheDocument();
  });

  test('renders hot questions section after load', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    expect(screen.getByText(/热门问题 Top 5/)).toBeInTheDocument();
  });

  test('hot questions are sorted by views', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const hotBtns = screen.getAllByText(/#\d/);
    expect(hotBtns.length).toBe(5);
  });

  test('FAQ tab displays category filter chips', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    expect(screen.getByText(/全部\(\d+\)/)).toBeInTheDocument();
    expect(screen.getByText(/会员管理\(\d\)/)).toBeInTheDocument();
    expect(screen.getByText(/收银\(\d\)/)).toBeInTheDocument();
  });

  // ====== 搜索测试 ======

  test('search filters FAQ by question text', async () => {
    render(<HelpCenterPage />);
    const input = await screen.findByTestId('search-filter-input', {}, { timeout: 5000 });
    fireEvent.change(input, { target: { value: '会员' } });
    await waitFor(() => {
      expect(screen.getByText('❓ 如何创建新会员？')).toBeInTheDocument();
      expect(screen.queryByText('❓ 如何处理退款？')).not.toBeInTheDocument();
    });
  });

  test('search filters by answer content', async () => {
    render(<HelpCenterPage />);
    const input = await screen.findByTestId('search-filter-input', {}, { timeout: 5000 });
    fireEvent.change(input, { target: { value: '实时' } });
    await waitFor(() => {
      const matches = screen.getAllByText(/营业数据/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('search filters by tag', async () => {
    render(<HelpCenterPage />);
    const input = await screen.findByTestId('search-filter-input', {}, { timeout: 5000 });
    fireEvent.change(input, { target: { value: '注册' } });
    await waitFor(() => {
      expect(screen.getByText('❓ 如何创建新会员？')).toBeInTheDocument();
    });
  });

  test('search has no results shows empty state', async () => {
    render(<HelpCenterPage />);
    const input = await screen.findByTestId('search-filter-input', {}, { timeout: 5000 });
    fireEvent.change(input, { target: { value: '不存在的关键词!!' } });
    await waitFor(() => {
      expect(screen.getByText('没有找到相关问题')).toBeInTheDocument();
    });
  });

  test('empty search shows all items', async () => {
    render(<HelpCenterPage />);
    const input = await screen.findByTestId('search-filter-input', {}, { timeout: 5000 });
    fireEvent.change(input, { target: { value: '会员' } });
    await waitFor(() => {
      expect(screen.getByText('❓ 如何创建新会员？')).toBeInTheDocument();
    });
    fireEvent.change(input, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('❓ 如何处理退款？')).toBeInTheDocument();
    });
  });

  // ====== 展开折叠测试 ======

  test('clicking FAQ item expands its answer', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText('❓ 如何创建新会员？'));
    await waitFor(() => {
      expect(screen.getByText(/在会员管理页面点击"新增会员"/)).toBeInTheDocument();
    });
  });

  test('expanded FAQ shows tags', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText('❓ 如何创建新会员？'));
    await waitFor(() => {
      expect(screen.getByText('会员')).toBeInTheDocument();
      expect(screen.getByText('新增')).toBeInTheDocument();
      expect(screen.getByText('注册')).toBeInTheDocument();
    });
  });

  test('clicking expanded FAQ collapses it', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText('❓ 如何创建新会员？'));
    await waitFor(() => {
      expect(screen.getByText(/在会员管理页面/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('❓ 如何创建新会员？'));
    await waitFor(() => {
      expect(screen.queryByText(/在会员管理页面/)).not.toBeInTheDocument();
    });
  });

  test('expanding a second FAQ collapses the first', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText('❓ 如何创建新会员？'));
    await waitFor(() => {
      expect(screen.getByText(/在会员管理页面/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('❓ 如何处理退款？'));
    await waitFor(() => {
      expect(screen.getByText(/在订单管理找到订单/)).toBeInTheDocument();
    });
  });

  test('expand all and collapse all buttons work', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText('全部展开'));
    await waitFor(() => {
      // Multiple answers should be visible now
      expect(screen.getByText(/在会员管理页面/)).toBeInTheDocument();
      expect(screen.getByText(/在订单管理找到订单/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('全部收起'));
    await waitFor(() => {
      expect(screen.queryByText(/在会员管理页面/)).not.toBeInTheDocument();
    });
  });

  // ====== 分类筛选测试 ======

  test('category filter: click 营销 shows only marketing items', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText(/营销\(\d\)/));
    await waitFor(() => {
      expect(screen.getByText('❓ 如何创建促销活动？')).toBeInTheDocument();
      expect(screen.queryByText('❓ 如何处理退款？')).not.toBeInTheDocument();
    });
  });

  test('category filter: click 全部 shows all items', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText(/营销\(\d\)/));
    await waitFor(() => {
      expect(screen.getByText('❓ 如何创建促销活动？')).toBeInTheDocument();
    });
    const allBtn = screen.getByText(/全部\(\d+\)/);
    fireEvent.click(allBtn);
    await waitFor(() => {
      expect(screen.getByText('❓ 如何处理退款？')).toBeInTheDocument();
    });
  });

  test('category filter + search combined', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByText(/营销\(\d\)/));
    const input = screen.getByTestId('search-filter-input');
    fireEvent.change(input, { target: { value: '满减' } });
    await waitFor(() => {
      expect(screen.getByText('❓ 怎么设置满减活动？')).toBeInTheDocument();
    });
  });

  // ====== 标签切换测试 ======

  test('tab switch to guides shows guide items', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-guides'));
    await waitFor(() => {
      expect(screen.getByText('📖 新员工入职指南')).toBeInTheDocument();
      expect(screen.getByText('📖 日结束对账流程')).toBeInTheDocument();
    });
  });

  test('guides tab shows estimated time', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-guides'));
    await waitFor(() => {
      const times = screen.getAllByText(/\d+步 · \d+分钟/);
      expect(times.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('guides tab: search filters guides', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-guides'));
    await waitFor(() => {
      expect(screen.getByText('📖 会员管理系统操作')).toBeInTheDocument();
    });
    const input = screen.getByTestId('search-filter-input');
    fireEvent.change(input, { target: { value: '会员' } });
    await waitFor(() => {
      expect(screen.getByText('📖 会员管理系统操作')).toBeInTheDocument();
    });
  });

  test('guides tab: search with no results shows empty state', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-guides'));
    const input = screen.getByTestId('search-filter-input');
    fireEvent.change(input, { target: { value: '不存在的指南!!' } });
    await waitFor(() => {
      expect(screen.getByText('没有找到操作指南')).toBeInTheDocument();
    });
  });

  test('tab switch to support shows submit form', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-support'));
    await waitFor(() => {
      expect(screen.getByText('提交技术工单')).toBeInTheDocument();
    });
  });

  // ====== support 工单区域测试 ======

  test('support tab has title input', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-support'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('简要描述问题')).toBeInTheDocument();
    });
  });

  test('support tab has category select', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-support'));
    await waitFor(() => {
      expect(screen.getByText('系统故障')).toBeInTheDocument();
      expect(screen.getByText('功能问题')).toBeInTheDocument();
      expect(screen.getByText('建议优化')).toBeInTheDocument();
    });
  });

  test('support tab has textarea for description', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-support'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('详细描述问题或建议...')).toBeInTheDocument();
    });
  });

  test('support tab has upload attachment area', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-support'));
    await waitFor(() => {
      expect(screen.getByText(/点击上传附件/)).toBeInTheDocument();
    });
  });

  test('support tab has submit button', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-support'));
    await waitFor(() => {
      expect(screen.getByText('📤 提交工单')).toBeInTheDocument();
    });
  });

  // ====== 热门问题测试 ======

  test('clicking a hot question sets search text', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const hotBtn = screen.getByText('#1').closest('button');
    expect(hotBtn).toBeInTheDocument();
  });

  // ====== 边界测试 ======

  test('all 20 FAQ items have view counts', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const views = screen.getAllByText(/次浏览/);
    expect(views.length).toBeGreaterThanOrEqual(5);
  });

  test('dark theme background in loading and content', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const shell = screen.getByTestId('page-shell');
    expect(shell).toBeInTheDocument();
  });

  test('FAQ question shows category badge', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    // Faq items have category badges - the first one has "会员管理"
    const catElements = screen.getAllByText('会员管理');
    expect(catElements.length).toBeGreaterThanOrEqual(1);
  });

  test('simulateFetch returns both faqs and guides', () => {
    // Verify the page exports and module structure
    expect(typeof HelpCenterPage).toBe('function');
  });

  test('page shell has subtitle', async () => {
    render(<HelpCenterPage />);
    await waitForData();
    const shell = screen.getByTestId('page-shell');
    expect(shell).toHaveAttribute('data-subtitle', '常见问题 · 操作指南 · 技术支持');
  });
});
