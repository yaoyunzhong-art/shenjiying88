import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();
const mockBuildMemberId = vi.fn();
const mockEnsureRegistered = vi.fn();
const mockStartCheckout = vi.fn();
const mockValidateCoupon = vi.fn();
const mockListProducts = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>{children}</div>
  ),
  FormField: ({ label, children, required, error }: any) => (
    <div data-testid="form-field">
      {label && <label>{label}{required && ' *'}</label>}
      {children}
      {error && <span data-testid="field-error" style={{ color: 'red' }}>{error}</span>}
    </div>
  ),
  Input: ({ value, onChange, placeholder, id, 'data-testid': dt, size, style }: any) => (
    <input
      data-testid={dt || 'm5-input'}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
    />
  ),
  Select: ({ value, onChange, options, placeholder, 'data-testid': dt }: any) => (
    <select data-testid={dt || 'm5-select'} value={value} onChange={(e: any) => onChange(e.target.value)}>
      <option value="" disabled>{placeholder}</option>
      {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  ),
  Checkbox: ({ checked, onChange, label, 'data-testid': dt }: any) => (
    <label data-testid={dt || 'm5-checkbox'}>
      <input type="checkbox" checked={checked} onChange={(e: any) => onChange(e.target.checked)} />
      {label}
    </label>
  ),
  Button: Object.assign(
    ({ children, onClick, variant, size, disabled, style }: any) => (
      <button data-testid={`btn-${variant || 'default'}`} onClick={onClick} disabled={disabled} style={style}>{children}</button>
    ),
    { displayName: 'Button' },
  ),
  SubmitButton: ({ children, onClick, loading, disabled, variant, style, 'data-testid': dt }: any) => (
    <button data-testid={dt || 'btn-submit'} onClick={onClick} disabled={disabled || loading} style={style}>
      {loading ? '正在提交...' : children}
    </button>
  ),
  FormSubmitFeedback: ({ success, error }: any) => (
    success ? <div data-testid="form-success">{success}</div> : error ? <div data-testid="form-error">{error}</div> : null
  ),
  InputNumber: (props: any) => <input data-testid="m5-input-number" {...props} />,
  RadioGroup: (props: any) => <div data-testid="m5-radio-group" />,
  Divider: ({ style }: any) => <hr data-testid="m5-divider" style={style} />,
}));

vi.mock('../../lib/storefront-transactions', () => ({
  buildStorefrontMemberId: (...args: any[]) => mockBuildMemberId(...args),
  ensureStorefrontMemberRegistered: (...args: any[]) => mockEnsureRegistered(...args),
  startStorefrontCheckout: (...args: any[]) => mockStartCheckout(...args),
  validateStorefrontCoupon: (...args: any[]) => mockValidateCoupon(...args),
  listStorefrontCashierProducts: (...args: any[]) => mockListProducts(...args),
}));

// ---- Test Subject ----

import CheckoutPage from './page';

// 模拟 sessionStorage 草稿 — 供购物车加载
const DRAFT_CART = [
  { id: 'p1', name: '基础护肤套装', price: 299, quantity: 1, category: '护肤品' },
  { id: 'p2', name: '深层清洁面膜（5片装）', price: 89, quantity: 2, category: '面膜' },
  { id: 'p3', name: '防晒霜 SPF50+', price: 139, quantity: 1, category: '防晒' },
  { id: 'p4', name: '舒缓保湿喷雾', price: 59, quantity: 1, category: '护肤品' },
];

function seedDraftCart() {
  window.sessionStorage.setItem('storefront.checkout.draft', JSON.stringify(DRAFT_CART));
}

function fillForm() {
  fireEvent.change(screen.getByTestId('input-name'), { target: { value: '张三' } });
  fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '13800138000' } });
  fireEvent.change(screen.getByTestId('input-address'), { target: { value: '深圳市南山区科技园' } });
  fireEvent.change(screen.getByTestId('input-city'), { target: { value: '深圳市' } });
}

describe('CheckoutPage — 结算页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    mockBuildMemberId.mockReturnValue('member_id_123');
    mockEnsureRegistered.mockResolvedValue(undefined);
    mockStartCheckout.mockResolvedValue({
      order: { orderId: 'ord-001', orderNo: 'ORD202607220001' },
    });
    mockListProducts.mockResolvedValue([]);
    mockValidateCoupon.mockImplementation((code: string) => {
      const validCodes: Record<string, { discount: number; label: string }> = {
        'WELCOME10': { discount: 10, label: '新客首单立减' },
        'SAVE20': { discount: 20, label: '满200减20' },
        'VIP50': { discount: 50, label: 'VIP专属满减' },
      };
      const match = validCodes[code.toUpperCase()];
      if (match) {
        return Promise.resolve({
          valid: true,
          message: `${match.label} -¥${match.discount}`,
          discount: match.discount,
        });
      }
      return Promise.resolve({ valid: false, message: '无效的优惠券码' });
    });
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '收银台');
  });

  test('renders checkout form section', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('checkout-form-section')).toBeInTheDocument();
  });

  test('renders summary section', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('checkout-summary-section')).toBeInTheDocument();
  });

  test('renders form input fields', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-phone')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-address')).toBeInTheDocument();
    expect(screen.getByTestId('input-city')).toBeInTheDocument();
  });

  test('renders delivery method select', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('select-delivery')).toBeInTheDocument();
  });

  test('renders payment methods', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('payment-methods')).toBeInTheDocument();
  });

  test('renders remark textarea', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('textarea-remark')).toBeInTheDocument();
  });

  test('renders terms checkbox', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('checkbox-terms')).toBeInTheDocument();
  });

  test('renders submit button', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('btn-submit')).toBeInTheDocument();
  });

  test('renders reset button', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('btn-ghost')).toBeInTheDocument();
  });

  test('renders coupon section', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('coupon-section')).toBeInTheDocument();
  });

  test('renders price summary', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('price-summary')).toBeInTheDocument();
  });

  test('renders cart item count', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('cart-item-count')).toBeInTheDocument();
  });

  test('renders 4 payment option cards', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('payment-wechat')).toBeInTheDocument();
    expect(screen.getByTestId('payment-alipay')).toBeInTheDocument();
    expect(screen.getByTestId('payment-cash')).toBeInTheDocument();
    expect(screen.getByTestId('payment-member_card')).toBeInTheDocument();
  });

  test('selects payment method via card click', () => {
    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('payment-wechat'));
    expect(screen.getByTestId('payment-wechat')).toBeInTheDocument();
  });

  test('terms checkbox can be checked', () => {
    render(<CheckoutPage />);
    const checkbox = screen.getByTestId('checkbox-terms');
    const input = checkbox.querySelector('input')!;
    expect(input.checked).toBe(false);
    fireEvent.click(input);
    expect(input.checked).toBe(true);
  });

  test('shows express fee with express delivery', async () => {
    render(<CheckoutPage />);
    const deliverySelect = screen.getByTestId('select-delivery');
    fireEvent.change(deliverySelect, { target: { value: 'express' } });
    await waitFor(() => {
      expect(screen.getByTestId('shipping-fee')).toHaveTextContent('¥10.00');
    });
  });

  test('shows free shipping for pickup', async () => {
    render(<CheckoutPage />);
    const deliverySelect = screen.getByTestId('select-delivery');
    fireEvent.change(deliverySelect, { target: { value: 'pickup' } });
    await waitFor(() => {
      expect(screen.getByTestId('shipping-fee')).toHaveTextContent('免运费（自提）');
    });
  });

  // ====== 购物车从草稿加载 ======

  test('renders cart items from sessionStorage draft', () => {
    seedDraftCart();
    render(<CheckoutPage />);
    // 草稿包含 4 个商品
    expect(screen.getByText('基础护肤套装')).toBeInTheDocument();
    expect(screen.getByText('深层清洁面膜（5片装）')).toBeInTheDocument();
    expect(screen.getByText('防晒霜 SPF50+')).toBeInTheDocument();
    expect(screen.getByText('舒缓保湿喷雾')).toBeInTheDocument();
  });

  test('shows correct subtotal from draft', () => {
    seedDraftCart();
    render(<CheckoutPage />);
    // 299*1 + 89*2 + 139*1 + 59*1 = 675
    expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('¥675.00');
  });

  test('shows empty cart hint when no draft', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('cart-empty')).toBeInTheDocument();
  });

  // ====== 交互测试 ======

  test('quantity adjuster increases then decreases quantity', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    // Increase p1 from 1 to 2: 299*2 + 89*2 + 139 + 59 = 974
    fireEvent.click(screen.getByTestId('qty-plus-p1'));
    await waitFor(() => {
      expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('¥974.00');
    });
    // Decrease p1 from 2 back to 1: 675
    fireEvent.click(screen.getByTestId('qty-minus-p1'));
    await waitFor(() => {
      expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('¥675.00');
    });
  });

  test('applies valid coupon via API', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '13800138000' } });

    fireEvent.change(screen.getByTestId('input-coupon'), { target: { value: 'WELCOME10' } });
    fireEvent.click(screen.getByTestId('btn-outline'));
    await waitFor(() => {
      expect(mockValidateCoupon).toHaveBeenCalledWith('WELCOME10', expect.any(String));
      expect(screen.getByTestId('coupon-status')).toHaveTextContent(/新客首单立减/);
      expect(screen.getByTestId('coupon-discount')).toHaveTextContent('-¥10.00');
    });
  });

  test('shows error for invalid coupon via API', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '13800138000' } });

    fireEvent.change(screen.getByTestId('input-coupon'), { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByTestId('btn-outline'));
    await waitFor(() => {
      expect(screen.getByTestId('coupon-status')).toHaveTextContent(/无效的优惠券码/);
    });
  });

  test('removes applied coupon', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fireEvent.change(screen.getByTestId('input-phone'), { target: { value: '13800138000' } });

    fireEvent.change(screen.getByTestId('input-coupon'), { target: { value: 'WELCOME10' } });
    fireEvent.click(screen.getByTestId('btn-outline'));
    await waitFor(() => {
      const ghostBtns = screen.getAllByTestId('btn-ghost');
      const removeBtn = ghostBtns.find(b => b.textContent?.includes('移除'));
      expect(removeBtn).toBeTruthy();
      fireEvent.click(removeBtn!);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('coupon-status')).not.toBeInTheDocument();
    });
  });

  test('submit button shows validation errors when form is empty', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      const errors = screen.getAllByTestId('field-error');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  test('submits successfully with valid data', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fillForm();
    fireEvent.change(screen.getByTestId('select-delivery'), { target: { value: 'standard' } });
    fireEvent.click(screen.getByTestId('payment-wechat'));
    const checkbox = screen.getByTestId('checkbox-terms').querySelector('input')!;
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByTestId('btn-submit'));

    await waitFor(() => {
      expect(mockBuildMemberId).toHaveBeenCalled();
      expect(mockEnsureRegistered).toHaveBeenCalled();
      expect(mockStartCheckout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/h5/payment/ord-001');
    });
  });

  test('shows success message after submit', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fillForm();
    fireEvent.change(screen.getByTestId('select-delivery'), { target: { value: 'standard' } });
    fireEvent.click(screen.getByTestId('payment-wechat'));
    const checkbox = screen.getByTestId('checkbox-terms').querySelector('input')!;
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toBeInTheDocument();
    });
  });

  // ====== 边界情况 ======

  test('shows error on checkout failure', async () => {
    mockStartCheckout.mockRejectedValue(new Error('支付网关超时'));
    seedDraftCart();
    render(<CheckoutPage />);
    fillForm();
    fireEvent.change(screen.getByTestId('select-delivery'), { target: { value: 'standard' } });
    fireEvent.click(screen.getByTestId('payment-wechat'));
    const checkbox = screen.getByTestId('checkbox-terms').querySelector('input')!;
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toHaveTextContent('支付网关超时');
    });
  });

  test('reset button clears all form fields', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fillForm();
    fireEvent.click(screen.getByTestId('btn-ghost'));
    await waitFor(() => {
      expect(screen.getByTestId('input-name')).toHaveValue('');
      expect(screen.getByTestId('input-phone')).toHaveValue('');
      expect(screen.getByTestId('input-address')).toHaveValue('');
      expect(screen.getByTestId('input-city')).toHaveValue('');
    });
  });

  test('cannot submit when cart is empty', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('btn-submit')).toBeDisabled();
  });

  test('email validation catches invalid email', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByText('邮箱格式不正确')).toBeInTheDocument();
    });
  });

  test('shows continue shopping after success', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fillForm();
    fireEvent.change(screen.getByTestId('select-delivery'), { target: { value: 'standard' } });
    fireEvent.click(screen.getByTestId('payment-wechat'));
    const checkbox = screen.getByTestId('checkbox-terms').querySelector('input')!;
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      expect(screen.getByText('继续购物')).toBeInTheDocument();
    });
  });

  test('can continue shopping after success', async () => {
    seedDraftCart();
    render(<CheckoutPage />);
    fillForm();
    fireEvent.change(screen.getByTestId('select-delivery'), { target: { value: 'standard' } });
    fireEvent.click(screen.getByTestId('payment-wechat'));
    const checkbox = screen.getByTestId('checkbox-terms').querySelector('input')!;
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId('btn-submit'));
    await waitFor(() => {
      const continueBtn = screen.getByText('继续购物');
      fireEvent.click(continueBtn);
    });
    await waitFor(() => {
      expect(screen.getByTestId('input-name')).toHaveValue('');
    });
  });
});
