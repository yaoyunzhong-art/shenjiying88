/**
 * store/[slug]/page.vitest.tsx — 门店首页 StoreHomePage L2 组件测试
 * 覆盖: 门店信息渲染 · 服务列表 · 分类筛选 · KPI · 评价 · 近期活动 · Loading态
 * 角色: 🛒前台
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('@m5/ui', () => ({
  Button: vi.fn(({ children, variant, onClick, ...rest }: any) => (
    <button data-testid={`btn-${variant}`} onClick={onClick} {...rest}>{children}</button>
  )),
  Card: vi.fn(({ children, ...rest }: any) => (
    <div data-testid="card" {...rest}>{children}</div>
  )),
  Badge: vi.fn(({ children, variant, ...rest }: any) => (
    <span data-testid={`badge-${variant}`} {...rest}>{children}</span>
  )),
  Tabs: vi.fn(({ items, activeKey, onChange }: any) => (
    <div data-testid="tabs" data-active-key={activeKey}>
      {items.map((item: any) => (
        <div key={item.key} data-testid={`tab-panel-${item.key}`} data-label={item.label}>
          <button data-testid={`tab-btn-${item.key}`} onClick={() => onChange(item.key)}>{item.label}</button>
          {item.key === activeKey && item.children}
        </div>
      ))}
    </div>
  )),
  Tag: vi.fn(({ children, ...rest }: any) => (
    <span data-testid="tag" {...rest}>{children}</span>
  )),
  Rating: vi.fn(({ value, interactive }: any) => (
    <span data-testid="rating" data-value={value} data-interactive={String(interactive)}>★{value}</span>
  )),
  Heading: vi.fn(({ children, level, ...rest }: any) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return <Tag data-testid={`heading-${level}`} {...rest}>{children}</Tag>;
  }),
  Text: vi.fn(({ children, weight, color, ...rest }: any) => (
    <span data-testid="text" data-weight={weight} data-color={color} {...rest}>{children}</span>
  )),
  Paragraph: vi.fn(({ children }: any) => (
    <p data-testid="paragraph">{children}</p>
  )),
  Space: vi.fn(({ children, direction, size, ...rest }: any) => (
    <div data-testid={`space-${direction}`} data-size={size} {...rest}>{children}</div>
  )),
  FormField: vi.fn(({ children, label, ...rest }: any) => (
    <div data-testid="form-field" {...rest}><label>{label}</label>{children}</div>
  )),
  Select: vi.fn(({ options, value, onChange, ...rest }: any) => (
    <select data-testid="select" value={value} onChange={(e: any) => onChange(e.target.value)} {...rest}>
      {(options || []).map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'beijing-chaoyang' }),
}));

vi.mock('./_components/share-cta', () => ({
  default: () => <div data-testid="share-cta">Share</div>,
}));

// ── Test Subject ──

import StoreHomePage from './page';

describe('StoreHomePage — 门店首页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 1. 正例: 门店信息渲染 ======

  test('renders store name after loading', async () => {
    render(<StoreHomePage />);
    // Initially loading
    expect(screen.getByText('加载中…')).toBeInTheDocument();
    // Wait for loading to finish (500ms timeout)
    await waitFor(() => {
      expect(screen.getByText('神机营 · 北京朝阳店')).toBeInTheDocument();
    });
  });

  test('renders store address info in hero section', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      // Badge with hours renders
      const badges = screen.getAllByTestId('badge-default');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  test('renders rating component with correct value', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      const ratings = screen.getAllByTestId('rating');
      expect(ratings.length).toBeGreaterThan(0);
      expect(ratings[0]).toHaveAttribute('data-value', '4.8');
    });
  });

  test('renders all store tags', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      const tags = screen.getAllByTestId('tag');
      const tagTexts = tags.map(t => t.textContent);
      expect(tagTexts).toContain('数字运动');
      expect(tagTexts).toContain('电竞');
      expect(tagTexts).toContain('亲子');
      expect(tagTexts).toContain('团建');
    });
  });

  test('renders review count', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText(/2356/)).toBeInTheDocument();
    });
  });

  test('renders KPI section with 4 metrics', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      // heading level=2 for "服务项目" means KPI already rendered before it
      expect(screen.getByText('日均客流 · 人次')).toBeInTheDocument();
      expect(screen.getByText('好评率 · 满意')).toBeInTheDocument();
      expect(screen.getByText('热门项目 · 个')).toBeInTheDocument();
      expect(screen.getByText('会员数 · 人')).toBeInTheDocument();
    });
  });

  test('renders KPI value 98%', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('98%')).toBeInTheDocument();
    });
  });

  // ====== 2. 正例: 服务列表与Card ======

  test('renders "服务项目" heading', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('服务项目')).toBeInTheDocument();
    });
  });

  test('renders service cards', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  test('renders service name in cards', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      const headings = screen.getAllByTestId('heading-3');
      const headingTexts = headings.map(h => h.textContent);
      expect(headingTexts).toContain('数字篮球挑战赛');
      expect(headingTexts).toContain('VR沉浸式对战');
    });
  });

  test('renders service prices', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('¥89')).toBeInTheDocument();
      expect(screen.getByText('¥128')).toBeInTheDocument();
    });
  });

  test('renders "近期活动" section', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('近期活动')).toBeInTheDocument();
    });
  });

  test('renders all 3 activity items', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('周末篮球擂台赛')).toBeInTheDocument();
      expect(screen.getByText('亲子欢乐周末')).toBeInTheDocument();
      expect(screen.getByText('企业团建开放日')).toBeInTheDocument();
    });
  });

  // ====== 3. 正例: 客户评价 ======

  test('renders "客户评价" heading', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('客户评价')).toBeInTheDocument();
    });
  });

  test('renders customer review content', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('环境超棒，VR对战特别刺激')).toBeInTheDocument();
      expect(screen.getByText('孩子玩疯了，工作人员也很有耐心')).toBeInTheDocument();
    });
  });

  test('renders 3 review cards with user names', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('运动达人小王')).toBeInTheDocument();
      expect(screen.getByText('亲子妈妈团')).toBeInTheDocument();
      expect(screen.getByText('团建组织者')).toBeInTheDocument();
    });
  });

  // ====== 4. 正例: UI按钮 ======

  test('renders 预约按钮', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('📅 预约体验')).toBeInTheDocument();
    });
  });

  test('renders 查看套餐按钮', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('🎫 查看套餐')).toBeInTheDocument();
    });
  });

  test('renders 门店导航按钮', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByText('🗺️ 门店导航')).toBeInTheDocument();
    });
  });

  test('renders ShareCTA component', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.getByTestId('share-cta')).toBeInTheDocument();
    });
  });

  // ====== 5. 边界: Loading态 ======

  test('shows loading state initially', () => {
    render(<StoreHomePage />);
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });

  test('hides loading state after timeout', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      expect(screen.queryByText('加载中…')).not.toBeInTheDocument();
    });
  });

  // ====== 6. 分类过滤: Tab切换 ======

  test('renders category tabs', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toBeInTheDocument();
    });
  });

  test('default active tab is "all"', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-active-key', 'all');
    });
  });

  test('tab click switches active key', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      // Click the VR/AR tab
      fireEvent.click(screen.getByTestId('tab-btn-vr'));
    });
    await waitFor(() => {
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-active-key', 'vr');
    });
  });

  test('shows only VR services when VR tab selected', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-btn-vr'));
    });
    await waitFor(() => {
      const allTexts = screen.getAllByTestId('heading-3').map(h => h.textContent);
      expect(allTexts).toContain('VR沉浸式对战');
      expect(allTexts).not.toContain('数字篮球挑战赛');
    });
  });

  test('category filter reduces visible card count after filtering', async () => {
    render(<StoreHomePage />);
    await waitFor(() => {
      // All 6 services visible initially (only 'all' tab content rendered)
      expect(screen.getAllByTestId('heading-3').length).toBe(6);
    });
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-btn-vr'));
    });
    await waitFor(() => {
      // VR tab shows only 1 item
      expect(screen.getAllByTestId('heading-3').length).toBe(1);
    });
  });

  // ====== 7. Default export ======

  test('has a default export', () => {
    expect(StoreHomePage).toBeDefined();
    expect(typeof StoreHomePage).toBe('function');
  });
});
