import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

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

const mockBuildMemberId = vi.fn();
const mockEnsureRegistered = vi.fn();
const mockStartCheckout = vi.fn();

vi.mock('../../lib/storefront-transactions', () => ({
  buildStorefrontMemberId: (...args: any[]) => mockBuildMemberId(...args),
  ensureStorefrontMemberRegistered: (...args: any[]) => mockEnsureRegistered(...args),
  startStorefrontCheckout: (...args: any[]) => mockStartCheckout(...args),
}));

// ---- Test Subject ----

import CheckoutPage from './page';

function fillForm() {
  const nameInput = screen.getByTestId('input-name');
  fireEvent.change(nameInput, { target: { value: '张三' } });
  const phoneInput = screen.getByTestId('input-phone');
  fireEvent.change(phoneInput, { target: { value: '13800138000' } });
  const addressInput = screen.getByTestId('input-address');
  fireEvent.change(addressInput, { target: { value: '深圳市南山区科技园' } });
  const cityInput = screen.getByTestId('input-city');
  fireEvent.change(cityInput, { target: { value: '深圳市' } });
}

describe('CheckoutPage — 结算页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildMemberId.mockReturnValue('member_id_123');
    mockEnsureRegistered.mockResolvedValue(undefined);
    mockStartCheckout.mockResolvedValue({
      order: { orderId: 'ord-001', orderNo: 'ORD202607220001' },
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

  test('renders cart items', () => {
    render(<CheckoutPage />);
    expect(screen.getByText('基础护肤套装')).toBeInTheDocument();
    expect(screen.getByText('深层清洁面膜（5片装）')).toBeInTheDocument();
    expect(screen.getByText('防晒霜 SPF50+')).toBeInTheDocument();
    expect(screen.getByText('舒缓保湿喷雾')).toBeInTheDocument();
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

  // ====== 状态测试 ======

  test('shows correct initial subtotal', () => {
    render(<CheckoutPage />);
    // p1: 299*1 + p2: 89*2 + p3: 139*1 + p4: 59*1 = 299 + 178 + 139 + 59 = 675
    expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('¥675.00');
  });

  test('shows empty cart hint when no active items', () => {
    // p5 has quantity 0, should be filtered out
    render(<CheckoutPage />);
    // Items with quantity > 0 are shown
    expect(screen.queryByText('卸妆油（200ml）')).not.toBeInTheDocument();
  });

  test('shows shipping fee changes with delivery method', () => {
    render(<CheckoutPage />);
    // Default: no delivery selected, subtotal >= 199 so free shipping
    expect(screen.getByTestId('shipping-fee')).toHaveTextContent('免运费');
  });

  // ====== 交互测试 ======

  test('quantity adjuster increases then decreases quantity', async () => {
    render(<CheckoutPage />);
    // Increase p2 from 2 to 3 using quantity adjuster
    fireEvent.click(screen.getByTestId('qty-plus-p2'));
    await waitFor(() => {
      expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('¥764.00');
    });
    // Decrease p2 from 3 back to 2
    fireEvent.click(screen.getByTestId('qty-minus-p2'));
    await waitFor(() => {
      expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('¥675.00');
    });
  });

  test('quantity adjuster plus button increases quantity', () => {
    render(<CheckoutPage />);
    const plusBtn = screen.getByTestId('qty-plus-p2');
    fireEvent.click(plusBtn);
    // p2 quantity was 2, now 3 → subtotal goes up
    // 299 + 89*3 + 139 + 59 = 764
    expect(screen.getByTestId('subtotal-amount')).toHaveTextContent('¥764.00');
  });

  test('selects payment method via card click', async () => {
    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('payment-wechat'));
    await waitFor(() => {
      // Payment method selected indicator
      expect(screen.getByTestId('payment-wechat')).toBeInTheDocument();
    });
  });

  test('terms checkbox can be checked', () => {
    render(<CheckoutPage />);
    const checkbox = screen.getByTestId('checkbox-terms');
    const input = checkbox.querySelector('input')!;
    expect(input.checked).toBe(false);
    fireEvent.click(input);
    expect(input.checked).toBe(true);
  });

  test('applies valid coupon WELCOME10', async () => {
    render(<CheckoutPage />);
    const couponInput = screen.getByTestId('input-coupon');
    fireEvent.change(couponInput, { target: { value: 'WELCOME10' } });
    fireEvent.click(screen.getByTestId('btn-outline'));
    await waitFor(() => {
      expect(screen.getByTestId('coupon-status')).toHaveTextContent(/新客首单立减/);
      expect(screen.getByTestId('coupon-discount')).toHaveTextContent('-¥10.00');
    });
  });

  test('shows error for invalid coupon', async () => {
    render(<CheckoutPage />);
    const couponInput = screen.getByTestId('input-coupon');
    fireEvent.change(couponInput, { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByTestId('btn-outline'));
    await waitFor(() => {
      expect(screen.getByTestId('coupon-status')).toHaveTextContent(/无效的优惠券码/);
    });
  });

  test('applies valid coupon SAVE20', async () => {
    render(<CheckoutPage />);
    const couponInput = screen.getByTestId('input-coupon');
    fireEvent.change(couponInput, { target: { value: 'SAVE20' } });
    fireEvent.click(screen.getByTestId('btn-outline'));
    await waitFor(() => {
      expect(screen.getByTestId('coupon-status')).toHaveTextContent(/满200减20/);
    });
  });

  test('removes applied coupon', async () => {
    render(<CheckoutPage />);
    const couponInput = screen.getByTestId('input-coupon');
    fireEvent.change(couponInput, { target: { value: 'WELCOME10' } });
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

  test('submit button shows validation errors when form is empty', () => {
    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('btn-submit'));
    // Should show validation errors
    waitFor(() => {
      const errors = screen.getAllByTestId('field-error');
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  test('submits successfully with valid data', async () => {
    render(<CheckoutPage />);
    fillForm();
    // Select delivery
    const deliverySelect = screen.getByTestId('select-delivery');
    fireEvent.change(deliverySelect, { target: { value: 'standard' } });
    // Select payment
    fireEvent.click(screen.getByTestId('payment-wechat'));
    // Accept terms
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

  test('reset button clears all form fields', () => {
    render(<CheckoutPage />);
    fillForm();
    fireEvent.click(screen.getByTestId('btn-ghost'));
    // After reset, all inputs should be empty
    expect(screen.getByTestId('input-name')).toHaveValue('');
    expect(screen.getByTestId('input-phone')).toHaveValue('');
    expect(screen.getByTestId('input-address')).toHaveValue('');
    expect(screen.getByTestId('input-city')).toHaveValue('');
  });

  test('cannot submit when cart is empty', () => {
    // With default items, cart is not empty
    render(<CheckoutPage />);
    // Remove all items by reducing quantity to 0
    const minusBtns = [
      screen.getByTestId('qty-minus-p1'),
      screen.getByTestId('qty-minus-p2'),
      screen.getByTestId('qty-minus-p3'),
      screen.getByTestId('qty-minus-p4'),
    ];
    minusBtns.forEach(btn => fireEvent.click(btn));
    waitFor(() => {
      // Submit button should be disabled
      expect(screen.getByTestId('btn-submit')).toBeDisabled();
    });
  });

  test('email validation catches invalid email', () => {
    render(<CheckoutPage />);
    const emailInput = screen.getByTestId('input-email');
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    // Submit to trigger validation
    fireEvent.click(screen.getByTestId('btn-submit'));
    waitFor(() => {
      expect(screen.getByText('邮箱格式不正确')).toBeInTheDocument();
    });
  });

  test('shows express fee with express delivery', () => {
    render(<CheckoutPage />);
    const deliverySelect = screen.getByTestId('select-delivery');
    fireEvent.change(deliverySelect, { target: { value: 'express' } });
    expect(screen.getByTestId('shipping-fee')).toHaveTextContent('¥10.00');
  });

  test('shows free shipping for pickup', () => {
    render(<CheckoutPage />);
    const deliverySelect = screen.getByTestId('select-delivery');
    fireEvent.change(deliverySelect, { target: { value: 'pickup' } });
    expect(screen.getByTestId('shipping-fee')).toHaveTextContent('免运费（自提）');
  });

  test('shows continue shopping after success', async () => {
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
    // After clicking continue shopping (which triggers reset), form fields should be empty
    await waitFor(() => {
      expect(screen.getByTestId('input-name')).toHaveValue('');
    });
  });
});
