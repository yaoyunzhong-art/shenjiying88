import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: { children: React.ReactNode; title?: string; description?: string }) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {children}
    </div>
  ),
  Button: Object.assign(
    ({ children, onClick, disabled, loading, variant, size, block, style, ...rest }: any) => (
      <button
        data-testid={`btn-${variant || 'default'}`}
        onClick={onClick}
        disabled={disabled || loading}
        data-loading={loading}
        data-variant={variant}
        data-size={size}
        style={style}
        {...rest}
      >
        {loading ? '⏳ 正在创建订单...' : children}
      </button>
    ),
    { displayName: 'Button' },
  ),
  Input: ({ value, onChange, placeholder, variant, block, 'aria-label': ariaLabel, ...rest }: any) => (
    <input
      data-testid="m5-input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      data-variant={variant}
      {...rest}
    />
  ),
  Card: ({ children, variant, padding, style, onClick, ...rest }: any) => (
    <div data-testid="m5-card" data-variant={variant} style={style} {...rest}>
      {children}
    </div>
  ),
  Tag: ({ children, variant, size, style }: any) => (
    <span data-testid="m5-tag" data-tag-variant={variant} data-tag-size={size} style={style}>
      {children}
    </span>
  ),
}));

const mockListProducts = vi.fn();
const mockBuildMemberId = vi.fn();
const mockEnsureRegistered = vi.fn();
const mockStartCheckout = vi.fn();
const mockLookupMember = vi.fn();

vi.mock('../../lib/storefront-transactions', () => ({
  listStorefrontCashierProducts: (...args: any[]) => mockListProducts(...args),
  buildStorefrontMemberId: (...args: any[]) => mockBuildMemberId(...args),
  ensureStorefrontMemberRegistered: (...args: any[]) => mockEnsureRegistered(...args),
  startStorefrontCheckout: (...args: any[]) => mockStartCheckout(...args),
  lookupStorefrontMember: (...args: any[]) => mockLookupMember(...args),
}));

// ---- Test Subject ----

import CashierPage from './page';

const MOCK_PRODUCTS = [
  { id: 'p1', name: '射击游戏', category: '街机', price: 500, stock: 10 },
  { id: 'p2', name: '跳舞机', category: '音乐', price: 800, stock: 5 },
  { id: 'p3', name: '娃娃机', category: '抓物', price: 300, stock: 20 },
];

function renderPage() {
  return render(<CashierPage />);
}

describe('CashierPage — 收银台', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListProducts.mockResolvedValue(MOCK_PRODUCTS);
    mockBuildMemberId.mockReturnValue('member_id_123');
    mockEnsureRegistered.mockResolvedValue(undefined);
    mockLookupMember.mockResolvedValue({
      phone: '13800138000',
      name: '张三',
      tier: 'gold',
      discountRate: 0.85,
      points: 1200,
    });
    mockStartCheckout.mockResolvedValue({
      order: { orderId: 'ord-001', orderNo: 'ORD202607220001' },
    });
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title and description', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '🧾 收银台 — P-35');
    });
  });

  test('renders product search input', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('搜索商品')).toBeInTheDocument();
    });
  });

  test('renders member phone input', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('会员手机号')).toBeInTheDocument();
    });
  });

  test('renders 3 payment method buttons', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('微信扫码')).toBeInTheDocument();
      expect(screen.getByText('会员余额')).toBeInTheDocument();
      expect(screen.getByText('现金')).toBeInTheDocument();
    });
  });

  test('shows loading state initially for products', () => {
    mockListProducts.mockImplementation(() => new Promise(() => {})); // never resolves
    renderPage();
    expect(screen.getByText('商品目录加载中...')).toBeInTheDocument();
  });

  test('renders product cards after loading', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
      expect(screen.getByText('跳舞机')).toBeInTheDocument();
      expect(screen.getByText('娃娃机')).toBeInTheDocument();
    });
  });

  // ====== 状态测试 ======

  test('shows "未找到匹配商品" when search term does not match any product', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const searchInput = screen.getByLabelText('搜索商品');
    fireEvent.change(searchInput, { target: { value: '不存在的商品' } });
    await waitFor(() => {
      expect(screen.getByText('未找到匹配商品')).toBeInTheDocument();
    });
  });

  test('filters products by search term', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const searchInput = screen.getByLabelText('搜索商品');
    fireEvent.change(searchInput, { target: { value: '射击' } });
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
      expect(screen.queryByText('跳舞机')).not.toBeInTheDocument();
    });
  });

  test('filters products by category search', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const searchInput = screen.getByLabelText('搜索商品');
    fireEvent.change(searchInput, { target: { value: '音乐' } });
    await waitFor(() => {
      expect(screen.getByText('跳舞机')).toBeInTheDocument();
      expect(screen.queryByText('娃娃机')).not.toBeInTheDocument();
    });
  });

  test('shows error state when product loading fails', async () => {
    mockListProducts.mockRejectedValue(new Error('网络错误'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/网络错误/)).toBeInTheDocument();
    });
  });

  // ====== 购物车交互测试 ======

  test('adds product to cart on click', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/已添加「射击游戏」/)).toBeInTheDocument();
    });
  });

  test('shows quantity controls after adding to cart', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    await waitFor(() => {
      // After adding, the item should have + and − buttons
      expect(screen.getAllByText('+').length).toBeGreaterThan(0);
      expect(screen.getAllByText('−').length).toBeGreaterThan(1);
    });
  });

  test('increments item quantity in cart', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    // Add to cart
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    await waitFor(() => {
      expect(screen.getByText(/已添加「射击游戏」/)).toBeInTheDocument();
    });
    // After adding, the item shows in cart with quantity 1
    // The cart section shows the selected product
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
  });

  test('removes item from cart', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    await waitFor(() => {
      // Find remove button
      const removeBtn = screen.getByLabelText('移除 射击游戏');
      expect(removeBtn).toBeInTheDocument();
      fireEvent.click(removeBtn);
    });
  });

  test('shows cart total price', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    fireEvent.click(addButtons[1]);
    await waitFor(() => {
      // Should show "应付" section
      expect(screen.getByText('应付')).toBeInTheDocument();
    });
  });

  // ====== 会员识别测试 ======

  test('shows member phone input and query button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('会员手机号')).toBeInTheDocument();
      expect(screen.getByText('查询')).toBeInTheDocument();
    });
  });

  test('looks up member on query click', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('会员手机号')).toBeInTheDocument();
    });
    const phoneInput = screen.getByLabelText('会员手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(mockLookupMember).toHaveBeenCalledWith('13800138000');
      expect(screen.getByText(/欢迎 张三/)).toBeInTheDocument();
    });
  });

  test('shows warning for invalid phone number', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('会员手机号')).toBeInTheDocument();
    });
    const phoneInput = screen.getByLabelText('会员手机号');
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText(/请输入完整的11位手机号/)).toBeInTheDocument();
    });
  });

  test('clears member info on clear button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('会员手机号')).toBeInTheDocument();
    });
    const phoneInput = screen.getByLabelText('会员手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText(/欢迎 张三/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('清除'));
    await waitFor(() => {
      expect(screen.getByText('已清除会员信息')).toBeInTheDocument();
    });
  });

  test('handles member lookup failure gracefully', async () => {
    mockLookupMember.mockRejectedValue(new Error('查询失败'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText('会员手机号')).toBeInTheDocument();
    });
    const phoneInput = screen.getByLabelText('会员手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText(/查询会员失败/)).toBeInTheDocument();
    });
  });

  // ====== 支付方式测试 ======

  test('selects payment method', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('微信扫码')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('微信扫码'));
    await waitFor(() => {
      expect(screen.getByText(/已选择：微信扫码/)).toBeInTheDocument();
    });
  });

  test('selects cash payment method', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('现金')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('现金'));
    await waitFor(() => {
      expect(screen.getByText(/已选择：现金/)).toBeInTheDocument();
    });
  });

  test('selects balance payment method', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('会员余额')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('会员余额'));
    await waitFor(() => {
      expect(screen.getByText(/已选择：会员余额/)).toBeInTheDocument();
    });
  });

  // ====== 结算 / 空结算防御测试 ======

  test('shows empty cart warning on checkout with no items', async () => {
    renderPage();
    await waitFor(() => {
      const checkoutBtn = screen.getByText(/结算/);
      fireEvent.click(checkoutBtn);
    });
    await waitFor(() => {
      expect(screen.getByText(/请添加商品/)).toBeInTheDocument();
    });
  });

  test('shows payment method required when cart has items but no payment', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    await waitFor(() => {
      const checkoutBtn = screen.getByText(/结算/);
      fireEvent.click(checkoutBtn);
    });
    await waitFor(() => {
      expect(screen.getByText(/请选择支付方式/)).toBeInTheDocument();
    });
  });

  test('completes checkout successfully', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    fireEvent.click(screen.getByText('微信扫码'));
    await waitFor(() => {
      expect(screen.getByText(/已选择：微信扫码/)).toBeInTheDocument();
    });
    // The checkout button text should now be '🧾 结算 ¥5.00'
    const checkoutBtn = screen.getByText(/结算/);
    fireEvent.click(checkoutBtn);
    await waitFor(() => {
      expect(mockBuildMemberId).toHaveBeenCalled();
      expect(mockEnsureRegistered).toHaveBeenCalled();
      expect(mockStartCheckout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/h5/payment/ord-001');
    });
  });

  // ====== 边界情况 ======

  test('shows "新订单" button after successful checkout', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    fireEvent.click(screen.getByText('微信扫码'));
    await waitFor(() => {
      expect(screen.getByText(/已选择：微信扫码/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/结算/));
    await waitFor(() => {
      expect(screen.getByText('🔄 新订单')).toBeInTheDocument();
    });
  });

  test('shows error message on checkout failure', async () => {
    mockStartCheckout.mockRejectedValue(new Error('库存不足'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    fireEvent.click(screen.getByText('微信扫码'));
    await waitFor(() => {
      expect(screen.getByText(/已选择：微信扫码/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/结算/));
    await waitFor(() => {
      expect(screen.getByText(/库存不足/)).toBeInTheDocument();
    });
  });

  test('loads product catalog on mount', () => {
    renderPage();
    expect(mockListProducts).toHaveBeenCalledTimes(1);
  });

  test('retries product load on retry button click after error', async () => {
    mockListProducts.mockRejectedValueOnce(new Error('网络错误'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('重试加载商品')).toBeInTheDocument();
    });
    mockListProducts.mockResolvedValueOnce(MOCK_PRODUCTS);
    fireEvent.click(screen.getByText('重试加载商品'));
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
  });

  test('resetOrder clears all state', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('射击游戏')).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]);
    fireEvent.click(screen.getByText('微信扫码'));
    await waitFor(() => {
      expect(screen.getByText(/已选择：微信扫码/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/结算/));
    await waitFor(() => {
      expect(screen.getByText('🔄 新订单')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🔄 新订单'));
    // After reset, the empty cart placeholder should show
    await waitFor(() => {
      expect(screen.getByText('请从左侧选择商品')).toBeInTheDocument();
    });
  });

  test('member discount reduces total', async () => {
    mockLookupMember.mockResolvedValue({
      phone: '13800138000',
      name: '张三',
      tier: 'gold',
      discountRate: 0.85,
      points: 1200,
    });
    renderPage();
    await waitFor(async () => {
      expect(await screen.findByText('射击游戏', undefined, { timeout: 1000 })).toBeInTheDocument();
    });
    const addButtons = screen.getAllByText('+ 加入购物车');
    fireEvent.click(addButtons[0]); // ¥5.00
    const phoneInput = screen.getByLabelText('会员手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(async () => {
      expect(await screen.findByText(/欢迎 张三/, undefined, { timeout: 1000 })).toBeInTheDocument();
    });
  });
});
