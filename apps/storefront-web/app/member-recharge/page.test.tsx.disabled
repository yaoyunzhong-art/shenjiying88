/**
 * member-recharge/page.vitest.tsx — 会员充值页面 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 统计概览 · 会员搜索 · 充值套餐 · 自定义金额 · 支付方式 · 确认弹窗 · 充值记录 · 边界
 * 角色: 🏪 店长 / 🧑‍💼 前台操作
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ====== Mock @m5/ui ======
vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
    <div data-testid="page-shell">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
  Card: ({ children, title }: { children: React.ReactNode; title?: string }) => (
    <div data-testid="card" data-title={title}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  ),
  InputNumber: ({ value, onChange, min, max, placeholder, prefix }: {
    value: number; onChange: (v: number | null) => void; min?: number; max?: number;
    placeholder?: string; prefix?: string;
  }) => (
    <div data-testid="input-number">
      {prefix && <span>{prefix}</span>}
      <input
        data-testid="custom-amount-input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    </div>
  ),
  Button: ({ children, onClick, variant, size, disabled, ...props }: {
    children: React.ReactNode; onClick?: () => void; variant?: string; size?: string; disabled?: boolean;
  }) => (
    <button data-testid={`btn-${variant}`} data-size={size} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Statistic: ({ label, value, prefix, suffix }: {
    label: string; value: string; prefix?: string; suffix?: React.ReactNode;
  }) => (
    <div data-testid="statistic">
      <span data-testid="stat-value">{prefix}{value}</span>
      <span>{label}</span>
      {suffix}
    </div>
  ),
  StatTrend: ({ direction, value }: { direction: string; value: string }) => (
    <span data-testid="stat-trend" data-direction={direction}>{value}</span>
  ),
  StatusBadge: ({ label, variant, size }: { label: string; variant: string; size?: string }) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size}>{label}</span>
  ),
  Modal: ({ open, onClose, title, children }: {
    open: boolean; onClose: () => void; title: string; children: React.ReactNode;
  }) => open ? (
    <div data-testid="modal" role="dialog">
      <h3>{title}</h3>
      {children}
      <button data-testid="modal-close" onClick={onClose}>关闭</button>
    </div>
  ) : null,
}));

// ====== Mock next/link ======
vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// ====== Test Subject ======
import MemberRechargePage from './page';

describe('MemberRechargePage — 会员充值', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<MemberRechargePage />)).not.toThrow();
  });

  test('renders PageShell title', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('会员充值')).toBeInTheDocument();
  });

  test('renders PageShell subtitle', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('为会员卡充值余额，支持套餐和自定义金额')).toBeInTheDocument();
  });

  test('renders three stat items', () => {
    render(<MemberRechargePage />);
    const stats = screen.getAllByTestId('statistic');
    expect(stats.length).toBe(3);
  });

  test('renders today recharge total stat', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('今日充值总额')).toBeInTheDocument();
    expect(screen.getByText('¥1,235')).toBeInTheDocument();
  });

  test('renders today recharge count stat', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('今日充值笔数')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  test('renders month new members stat', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('本月新增充值会员')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });

  // ====== 会员搜索 ======

  test('renders member search input', () => {
    render(<MemberRechargePage />);
    expect(screen.getByPlaceholderText('输入会员手机号 / 卡号 / 姓名')).toBeInTheDocument();
  });

  test('renders search button', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('查询')).toBeInTheDocument();
  });

  test('searching member shows member info', async () => {
    render(<MemberRechargePage />);
    const searchInput = screen.getByPlaceholderText('输入会员手机号 / 卡号 / 姓名');
    fireEvent.change(searchInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText('测试会员')).toBeInTheDocument();
      expect(screen.getByText('13800138000')).toBeInTheDocument();
      expect(screen.getByText(/¥268/)).toBeInTheDocument();
    });
  });

  test('cannot search with empty query', async () => {
    render(<MemberRechargePage />);
    const searchInput = screen.getByPlaceholderText('输入会员手机号 / 卡号 / 姓名');
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('查询'));
    // No member info should be shown
    expect(screen.queryByText('测试会员')).not.toBeInTheDocument();
  });

  // ====== 充值套餐 ======

  test('renders all four recharge packages', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('小额充值')).toBeInTheDocument();
    expect(screen.getByText('标准充值')).toBeInTheDocument();
    expect(screen.getByText('畅玩充值')).toBeInTheDocument();
    expect(screen.getByText('尊享充值')).toBeInTheDocument();
  });

  test('renders package amounts', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('¥50')).toBeInTheDocument();
    expect(screen.getByText('¥100')).toBeInTheDocument();
    expect(screen.getByText('¥200')).toBeInTheDocument();
    expect(screen.getByText('¥500')).toBeInTheDocument();
  });

  test('renders package bonus info', () => {
    render(<MemberRechargePage />);
    const bonusTexts = screen.getAllByText(/赠送 ¥/);
    expect(bonusTexts.length).toBe(4);
  });

  test('renders package total values', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('实到 ¥55')).toBeInTheDocument();
    expect(screen.getByText('实到 ¥115')).toBeInTheDocument();
    expect(screen.getByText('实到 ¥240')).toBeInTheDocument();
    expect(screen.getByText('实到 ¥620')).toBeInTheDocument();
  });

  test('renders package labels', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('推荐')).toBeInTheDocument();
    expect(screen.getByText('超值')).toBeInTheDocument();
  });

  test('selecting a package highlights it', async () => {
    render(<MemberRechargePage />);
    const pkgBtn = screen.getByText('¥50').closest('button');
    expect(pkgBtn).toBeInTheDocument();
    if (pkgBtn) fireEvent.click(pkgBtn);
    await waitFor(() => {
      expect(screen.getByText('¥55')).toBeInTheDocument();
    });
  });

  // ====== 自定义金额 ======

  test('switches to custom amount mode', async () => {
    render(<MemberRechargePage />);
    fireEvent.click(screen.getByText('自定义金额'));
    await waitFor(() => {
      expect(screen.getByTestId('custom-amount-input')).toBeInTheDocument();
    });
  });

  test('custom amount input accepts values', async () => {
    render(<MemberRechargePage />);
    fireEvent.click(screen.getByText('自定义金额'));
    const input = screen.getByTestId('custom-amount-input');
    fireEvent.change(input, { target: { value: '300' } });
    expect(input).toHaveValue(300);
  });

  // ====== 支付方式 ======

  test('renders payment method selector', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('现金')).toBeInTheDocument();
    expect(screen.getByText('微信支付')).toBeInTheDocument();
    expect(screen.getByText('支付宝')).toBeInTheDocument();
    expect(screen.getByText('银行卡')).toBeInTheDocument();
  });

  test('微信支付 is selected by default', () => {
    render(<MemberRechargePage />);
    const wechatBtn = screen.getByText('微信支付');
    expect(wechatBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking payment method changes selection', async () => {
    render(<MemberRechargePage />);
    fireEvent.click(screen.getByText('支付宝'));
    await waitFor(() => {
      expect(screen.getByText('支付宝')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('微信支付')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // ====== 确认充值 ======

  test('renders recharge confirm area', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('确认充值')).toBeInTheDocument();
  });

  test('confirm button is disabled when no member selected', () => {
    render(<MemberRechargePage />);
    const confirmBtn = screen.getByText('确认充值');
    expect(confirmBtn).toBeDisabled();
  });

  test('shows modal on confirm click when member selected', async () => {
    render(<MemberRechargePage />);
    const searchInput = screen.getByPlaceholderText('输入会员手机号 / 卡号 / 姓名');
    fireEvent.change(searchInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText('测试会员')).toBeInTheDocument();
    });
    const confirmBtn = screen.getByText('确认充值');
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('确认充值')).toBeInTheDocument();
    });
  });

  test('shows error notification when confirming without member', async () => {
    render(<MemberRechargePage />);
    const confirmBtn = screen.getByText('确认充值');
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(screen.getByText('请先选择充值会员')).toBeInTheDocument();
    });
  });

  // ====== 充值记录 ======

  test('renders recent recharge records section', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('最近充值记录')).toBeInTheDocument();
  });

  test('renders recharge records', () => {
    render(<MemberRechargePage />);
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('王五')).toBeInTheDocument();
    expect(screen.getByText('赵六')).toBeInTheDocument();
    expect(screen.getByText('孙七')).toBeInTheDocument();
  });

  test('renders record amounts', () => {
    render(<MemberRechargePage />);
    const amountTexts = screen.getAllByText(/¥\d+/);
    const rechargeAmounts = amountTexts.filter(el => el.textContent && /^¥\d+$/.test(el.textContent));
    expect(rechargeAmounts.length).toBeGreaterThan(0);
  });

  test('renders status badges on records', () => {
    render(<MemberRechargePage />);
    const badges = screen.getAllByTestId('status-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  test('renders "查看全部记录" link', () => {
    render(<MemberRechargePage />);
    const allRecordsLink = screen.getByText(/查看全部记录/);
    expect(allRecordsLink).toBeInTheDocument();
    expect(allRecordsLink).toHaveAttribute('href', '/member-recharge/records');
  });

  // ====== 边界 ======

  test('modal confirm calls notification', async () => {
    render(<MemberRechargePage />);
    const searchInput = screen.getByPlaceholderText('输入会员手机号 / 卡号 / 姓名');
    fireEvent.change(searchInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText('测试会员')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('确认充值'));
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    const confirmBtn = screen.getAllByText('确认充值')[1];
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(screen.getByText(/充值.*成功/)).toBeInTheDocument();
    });
  });

  test('modal close dismisses dialog', async () => {
    render(<MemberRechargePage />);
    const searchInput = screen.getByPlaceholderText('输入会员手机号 / 卡号 / 姓名');
    fireEvent.change(searchInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText('测试会员')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('确认充值'));
    await waitFor(() => {
      expect(screen.getByTestId('modal-close')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  test('notification dismiss button works', async () => {
    render(<MemberRechargePage />);
    const confirmBtn = screen.getByText('确认充值');
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(screen.getByText('请先选择充值会员')).toBeInTheDocument();
    });
    const dismissBtn = screen.getByText('✕');
    fireEvent.click(dismissBtn);
    expect(screen.queryByText('请先选择充值会员')).not.toBeInTheDocument();
  });
});
