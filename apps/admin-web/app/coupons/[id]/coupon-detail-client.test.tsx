import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import CouponDetailClient from './coupon-detail-client';
import { MOCK_COUPONS } from '../../coupons-data';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: 'c-001' }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('CouponDetailClient', () => {
  const activeCoupon = MOCK_COUPONS[0]; // c-001 SUMMER2026 active

  it('renders coupon detail with header info', () => {
    render(<CouponDetailClient couponId="c-001" />);

    // Title
    expect(screen.getByText('夏日冰爽特惠')).toBeTruthy();
    // Code
    expect(screen.getByText('SUMMER2026')).toBeTruthy();
  });

  it('shows stat cards with correct values', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText('10,000')).toBeTruthy(); // totalQuota
    expect(screen.getByText('5,679')).toBeTruthy(); // usedCount
    expect(screen.getByText('4,321')).toBeTruthy(); // remainingQuota
    expect(screen.getByText('56.8%')).toBeTruthy(); // claimRate
  });

  it('shows coupon type with correct label', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText('折扣券')).toBeTruthy();
    expect(screen.getByText('15%')).toBeTruthy();
  });

  it('shows scope badge', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText('全场通用')).toBeTruthy();
  });

  it('shows status badge', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText('进行中')).toBeTruthy();
  });

  it('shows no-threshold label when threshold is 0', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText('无门槛')).toBeTruthy();
  });

  it('shows threshold label when threshold > 0', () => {
    render(<CouponDetailClient couponId="c-002" />);

    expect(screen.getByText(/满¥50/)).toBeTruthy();
  });

  it('shows usage limit', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText(/每人1次/)).toBeTruthy();
  });

  it('shows unlimited usage label when limit is high', () => {
    render(<CouponDetailClient couponId="c-009" />); // BIRTHDAY 99999

    expect(screen.getByText('不限')).toBeTruthy();
  });

  it('shows copy-to-clipboard for coupon code', () => {
    render(<CouponDetailClient couponId="c-001" />);

    // CopyToClipboard renders the code text somewhere
    expect(screen.getByDisplayValue(/SUMMER2026|夏日冰爽特惠/)).toBeTruthy();
  });

  it('shows created by info', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText('运营部-张三')).toBeTruthy();
  });

  it('shows date range', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText(/2026-06-01/)).toBeTruthy();
    expect(screen.getByText(/2026-08-31/)).toBeTruthy();
  });

  it('shows progress bar with claim progress text', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText(/5,679 \/ 10,000/)).toBeTruthy();
  });

  it('shows lifecycle timeline', () => {
    render(<CouponDetailClient couponId="c-001" />);

    expect(screen.getByText('生命周期')).toBeTruthy();
    expect(screen.getByText('创建')).toBeTruthy();
    expect(screen.getByText('生效')).toBeTruthy();
    expect(screen.getByText('截止')).toBeTruthy();
  });

  it('shows editable name field', () => {
    render(<CouponDetailClient couponId="c-001" />);

    const nameInput = screen.getByDisplayValue('夏日冰爽特惠');
    expect(nameInput).toBeTruthy();
    fireEvent.change(nameInput, { target: { value: '修改后的优惠券' } });
    expect((nameInput as HTMLInputElement).value).toBe('修改后的优惠券');
  });

  it('allows editing remaining quota', () => {
    render(<CouponDetailClient couponId="c-001" />);

    const quotaInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    expect(quotaInput).toBeTruthy();
    expect(quotaInput.value).toBe('4321');
    fireEvent.change(quotaInput, { target: { value: '5000' } });
    expect(quotaInput.value).toBe('5000');
  });

  it('renders back link when coupon not found', () => {
    render(<CouponDetailClient couponId="non-existent" />);

    expect(screen.getByText(/未找到该优惠券/)).toBeTruthy();
    expect(screen.getByText('← 返回优惠券列表')).toBeTruthy();
  });

  it('renders for exhausted coupon type', () => {
    render(<CouponDetailClient couponId="c-003" />);

    expect(screen.getByText('新客专享20元')).toBeTruthy();
    expect(screen.getByText('已领完')).toBeTruthy();
  });

  it('renders for paused coupon', () => {
    render(<CouponDetailClient couponId="c-008" />);

    expect(screen.getByText('电器满1000减100')).toBeTruthy();
    expect(screen.getByText('已暂停')).toBeTruthy();
    // paused coupon timeline shows "暂停"
    expect(screen.getByText('暂停')).toBeTruthy();
  });

  it('renders for expired coupon', () => {
    render(<CouponDetailClient couponId="c-006" />);

    expect(screen.getByText('春季焕新促')).toBeTruthy();
    expect(screen.getByText('已过期')).toBeTruthy();
  });

  it('renders for draft coupon with zero usage', () => {
    render(<CouponDetailClient couponId="c-007" />);

    expect(screen.getByText('八月限时特惠（审核中）')).toBeTruthy();
    expect(screen.getByText('草稿')).toBeTruthy();
    // zero usage
    expect(screen.getByText('0.0%')).toBeTruthy();
  });

  it('renders CopyToClipboard with code', () => {
    render(<CouponDetailClient couponId="c-001" />);

    // The CopyToClipboard renders the code text
    expect(screen.getByText('SUMMER2026')).toBeTruthy();
  });

  it('renders shipping type coupon correctly', () => {
    render(<CouponDetailClient couponId="c-004" />);

    expect(screen.getByText('北京门店包邮券')).toBeTruthy();
    expect(screen.getByText('包邮券')).toBeTruthy();
  });
});
