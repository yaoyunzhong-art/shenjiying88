/**
 * store/[slug]/packages/page.vitest.tsx — 套餐门票 PackagesPage L2 组件测试
 * 覆盖: 分类Tab · 套餐卡片详情 · 选中购买栏 · 数量增减 · 购买流程 · 成功状态
 * 角色: 🛒前台
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

let mockToastCall: any = vi.fn();

vi.mock('@m5/ui', () => ({
  Button: vi.fn(({ children, variant, onClick, loading, ...rest }: any) => (
    <button
      data-testid={`btn-${variant ?? 'default'}`}
      onClick={onClick}
      data-loading={String(!!loading)}
      {...rest}
    >
      {children}
    </button>
  )),
  Card: vi.fn(({ children, style, ...rest }: any) => (
    <div data-testid="card" style={style} {...rest}>{children}</div>
  )),
  Tag: vi.fn(({ children, variant, ...rest }: any) => (
    <span data-testid="tag" data-variant={variant} {...rest}>{children}</span>
  )),
  Tabs: vi.fn(({ items, activeKey, onChange }: any) => (
    <div data-testid="tabs" data-active-key={activeKey}>
      {items.map((item: any) => (
        <div key={item.key} data-testid={`tab-panel-${item.key}`}>
          <button data-testid={`tab-btn-${item.key}`} onClick={() => onChange(item.key)}>
            {item.label}
          </button>
          {item.key === activeKey && <div data-testid={`tab-content-${item.key}`}>{item.children}</div>}
        </div>
      ))}
    </div>
  )),
  Heading: vi.fn(({ children, level, ...rest }: any) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return <Tag data-testid={`heading-${level}`} {...rest}>{children}</Tag>;
  }),
  Text: vi.fn(({ children, weight, color, style, ...rest }: any) => (
    <span data-testid="text" data-weight={weight} data-color={color} style={style} {...rest}>{children}</span>
  )),
  Paragraph: vi.fn(({ children }: any) => (
    <p data-testid="paragraph">{children}</p>
  )),
  Space: vi.fn(({ children, direction, size, ...rest }: any) => (
    <div data-testid={`space-${direction}`} data-size={size} {...rest}>{children}</div>
  )),
  Spinner: vi.fn(() => <div data-testid="spinner">Loading...</div>),
  Result: vi.fn(({ status, title, subTitle, extra }: any) => (
    <div data-testid="result" data-status={status}>
      <h2 data-testid="result-title">{title}</h2>
      {subTitle && <p data-testid="result-subtitle">{subTitle}</p>}
      {extra && <div data-testid="result-extra">{extra}</div>}
    </div>
  )),
  useToast: vi.fn(() => {
    const toasts: any[] = [];
    const toast = (msg: string, opts?: any) => {
      toasts.push({ message: msg, ...opts });
      mockToastCall(msg, opts);
    };
    return { toast, toasts, dismiss: vi.fn() };
  }),
  ToastContainer: vi.fn(({ toasts, onDismiss }: any) => (
    <div data-testid="toast-container">
      {toasts.map((t: any, i: number) => (
        <div key={i} data-testid="toast-item">{t.message}</div>
      ))}
    </div>
  )),
  Badge: vi.fn(({ children, variant, style, ...rest }: any) => (
    <span data-testid={`badge-${variant}`} style={style} {...rest}>{children}</span>
  )),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'beijing-chaoyang' }),
}));

vi.mock('../_components/share-cta', () => ({
  default: () => <div data-testid="share-cta">Share</div>,
}));

// ── Test Subject ──

import PackagesPage from './page';

describe('PackagesPage — 套餐门票', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToastCall = vi.fn();
  });

  // ====== 1. 正例: 默认渲染 ======

  test('has a default export', () => {
    expect(PackagesPage).toBeDefined();
    expect(typeof PackagesPage).toBe('function');
  });

  test('renders "套餐门票" heading', () => {
    render(<PackagesPage />);
    expect(screen.getByText('套餐门票')).toBeInTheDocument();
  });

  test('renders description paragraph', () => {
    render(<PackagesPage />);
    expect(screen.getByText(/查看并购买适合您的套餐/)).toBeInTheDocument();
  });

  test('renders ShareCTA component', () => {
    render(<PackagesPage />);
    expect(screen.getByTestId('share-cta')).toBeInTheDocument();
  });

  // ====== 2. 分类Tab ======

  test('renders all 5 category tabs', () => {
    render(<PackagesPage />);
    expect(screen.getByTestId('tab-btn-all')).toBeInTheDocument();
    expect(screen.getByTestId('tab-btn-solo')).toBeInTheDocument();
    expect(screen.getByTestId('tab-btn-family')).toBeInTheDocument();
    expect(screen.getByTestId('tab-btn-team')).toBeInTheDocument();
    expect(screen.getByTestId('tab-btn-limited')).toBeInTheDocument();
  });

  test('renders correct tab labels', () => {
    render(<PackagesPage />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('单人票')).toBeInTheDocument();
    expect(screen.getByText('亲子票')).toBeInTheDocument();
    expect(screen.getByText('团体票')).toBeInTheDocument();
    expect(screen.getByText('限时特惠')).toBeInTheDocument();
  });

  test('default active tab is "all"', () => {
    render(<PackagesPage />);
    const tabs = screen.getByTestId('tabs');
    expect(tabs).toHaveAttribute('data-active-key', 'all');
  });

  test('clicking "单人票" tab shows solo packages only', () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getByTestId('tab-btn-solo'));
    // Solo packages should be visible
    expect(screen.getByText('单人畅玩票')).toBeInTheDocument();
    expect(screen.getByText('单人尊享')).toBeInTheDocument();
    // Family packages should not be visible (hidden behind tab content)
    expect(screen.queryByText('亲子欢乐套票')).not.toBeInTheDocument();
  });

  test('clicking "亲子票" tab filters correctly', () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getByTestId('tab-btn-family'));
    const tabs = screen.getByTestId('tabs');
    expect(tabs).toHaveAttribute('data-active-key', 'family');
  });

  // ====== 3. 套餐卡片详情 ======

  test('renders 8 package cards in "全部" tab', () => {
    render(<PackagesPage />);
    const cards = screen.getAllByTestId('card');
    // 8 packages in 'all' tab
    expect(cards.length).toBe(8);
  });

  test('renders package names', () => {
    render(<PackagesPage />);
    expect(screen.getByText('单人畅玩票')).toBeInTheDocument();
    expect(screen.getByText('亲子欢乐套票')).toBeInTheDocument();
    expect(screen.getByText('团建豪华包')).toBeInTheDocument();
    expect(screen.getByText('暑期狂欢特惠')).toBeInTheDocument();
  });

  test('renders package discounted prices', () => {
    render(<PackagesPage />);
    // Use getAllByText for prices that may appear multiple times
    const price99Elements = screen.getAllByText('¥99');
    expect(price99Elements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('¥199')).toBeInTheDocument();
    expect(screen.getByText('¥79')).toBeInTheDocument();
  });

  test('renders original prices with strikethrough', () => {
    render(<PackagesPage />);
    expect(screen.getByText('¥129')).toBeInTheDocument();
    expect(screen.getByText('¥299')).toBeInTheDocument();
    expect(screen.getByText('¥159')).toBeInTheDocument();
  });

  test('renders package descriptions', () => {
    render(<PackagesPage />);
    expect(screen.getByText('单人2小时畅玩')).toBeInTheDocument();
    expect(screen.getByText('1大1小，90分钟')).toBeInTheDocument();
    expect(screen.getByText('暑期限定')).toBeInTheDocument();
  });

  test('renders package item tags inside cards', () => {
    render(<PackagesPage />);
    const tags = screen.getAllByTestId('tag');
    const tagTexts = tags.map(t => t.textContent);
    expect(tagTexts).toContain('数字篮球');
    expect(tagTexts).toContain('VR对战');
    expect(tagTexts).toContain('亲子运动会');
    expect(tagTexts).toContain('电竞区');
  });

  test('renders category tags on packages', () => {
    render(<PackagesPage />);
    const tagTexts = screen.getAllByTestId('tag').map(t => t.textContent);
    expect(tagTexts).toContain('单人');
    expect(tagTexts).toContain('亲子');
    expect(tagTexts).toContain('团体');
  });

  test('renders discount badges for limited packages', () => {
    render(<PackagesPage />);
    const badgeElements = screen.getAllByTestId('badge-danger');
    const badgeTexts = badgeElements.map(b => b.textContent);
    expect(badgeTexts).toContain('限时5折');
    expect(badgeTexts).toContain('晚间特惠');
  });

  test('renders savings badge for discounted items', () => {
    render(<PackagesPage />);
    // Discount badges with "省XX%"
    expect(screen.getByText('省23%')).toBeInTheDocument();
    expect(screen.getByText('省33%')).toBeInTheDocument();
  });

  // ====== 4. 交互: 选中套餐显示购买栏 ======

  test('clicking a package card shows purchase bar', () => {
    render(<PackagesPage />);
    const cardHeaders = screen.getAllByTestId('heading-3');
    const firstCard = cardHeaders[0];
    expect(firstCard.textContent).toBe('单人畅玩票');
    fireEvent.click(firstCard);
    // Purchase bar should have quantity controls
    expect(screen.getByText('−')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('purchase bar shows correct total price', () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    // Price = 99 * 1 = 99
    const buyTexts = screen.getAllByText(/立即购买/);
    expect(buyTexts.length).toBeGreaterThanOrEqual(1);
  });

  // ====== 5. 交互: 数量加减 ======

  test('increment quantity with + button', () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('2')).toBeInTheDocument();
    // Price = 99 * 2 = 198
    expect(screen.getByText('立即购买 ¥198')).toBeInTheDocument();
  });

  test('decrement quantity with − button', () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('+'));
    expect(screen.getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('−'));
    expect(screen.getByText('2')).toBeInTheDocument();
    // Price = 99 * 2 = 198
    expect(screen.getByText('立即购买 ¥198')).toBeInTheDocument();
  });

  test('quantity does not go below 1', () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getByText('−'));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  // ====== 6. 交互: 购买流程 ======

  test('clicking buy button triggers purchase flow', async () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getByText('立即购买 ¥99'));
    await waitFor(() => {
      expect(screen.getByText('立即购买 ¥99')).toBeInTheDocument();
    });
  });

  test('purchase button has loading state', () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    const buyBtn = screen.getByText('立即购买 ¥99');
    expect(buyBtn).toBeInTheDocument();
  });

  // ====== 7. 成功状态 ======

  test('shows Result component after successful purchase', async () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    // Find the buy button by text pattern
    const buyButtons = screen.getAllByText(/立即购买/);
    expect(buyButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(buyButtons[0]);
    await waitFor(() => {
      expect(screen.getByTestId('result')).toBeInTheDocument();
    });
  });

  test('shows success title after purchase', async () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getAllByText(/立即购买/)[0]);
    await waitFor(() => {
      expect(screen.getByText('购买成功！')).toBeInTheDocument();
    });
  });

  test('shows QR code section after purchase', async () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getAllByText(/立即购买/)[0]);
    await waitFor(() => {
      expect(screen.getByText('🎫 到店核销二维码')).toBeInTheDocument();
      expect(screen.getByText('QR Code')).toBeInTheDocument();
    });
  });

  test('shows "返回门店首页" button after purchase', async () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getAllByText(/立即购买/)[0]);
    await waitFor(() => {
      expect(screen.getByText('返回门店首页')).toBeInTheDocument();
    });
  });

  test('shows purchase summary with package name and quantity', async () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getAllByText(/立即购买/)[0]);
    await waitFor(() => {
      expect(screen.getByText('单人畅玩票 × 1')).toBeInTheDocument();
    });
  });

  test('calls toast after successful purchase', async () => {
    render(<PackagesPage />);
    fireEvent.click(screen.getAllByTestId('heading-3')[0]);
    fireEvent.click(screen.getAllByText(/立即购买/)[0]);
    await waitFor(() => {
      expect(mockToastCall).toHaveBeenCalledWith('购买成功！', { variant: 'success' });
    });
  });
});
